/**
 * Config Resolver para Chatbot
 * Centraliza la resolución de configuración separando business logic de agent logic
 */

import type { Chatbot, User } from "@prisma/client";
import { validateChatbotConfig, applyModelCorrection } from "./modelValidator.server";
import { PLAN_LIMITS } from "./planLimits.server";
import { getDefaultModelForPlan } from "~/utils/aiModels";

export interface ResolvedChatbotConfig {
  // Core config
  id: string;
  name: string;
  slug: string;

  // AI Configuration
  aiModel: string;
  temperature: number;
  maxTokens: number;

  // Prompts and personality
  instructions: string;
  customInstructions: string;
  personality: string;

  // UI Configuration
  primaryColor: string;
  avatarUrl: string;
  welcomeMessage: string;
  goodbyeMessage: string;

  // Context and training data
  contexts: any[];

  // Business logic metadata
  validationWarnings: string[];
  modelCorrected: boolean;
  originalModel?: string;
  planLimits: {
    maxTokensPerQuery: number;
    maxContextSizeKB: number;
    availableModels: string[];
  };
}

export interface AgentExecutionContext {
  userId: string;
  userPlan: string;
  chatbotId: string;
  message: string;
  integrations: Record<string, any>;
  sessionId?: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

/**
 * Resuelve la configuración completa del chatbot aplicando business rules
 */
export function resolveChatbotConfig(
  chatbot: Chatbot,
  user: User,
  context: Partial<AgentExecutionContext> = {}
): ResolvedChatbotConfig {
  const planLimits = PLAN_LIMITS[user.plan];
  const validationWarnings: string[] = [];

  // 1. Resolver modelo AI con validaciones
  const modelCorrection = applyModelCorrection(user.plan, chatbot.aiModel, true);
  const finalModel = modelCorrection.finalModel;

  if (modelCorrection.wasCorreected) {
    validationWarnings.push(modelCorrection.warning || "Modelo corregido por restricciones del plan");
  }

  // 2. Resolver temperatura según modelo
  let finalTemperature = chatbot.temperature || 1;
  if (finalModel === "gpt-5-nano") {
    finalTemperature = 1; // GPT-5 nano solo soporta temperature=1
    if (chatbot.temperature && chatbot.temperature !== 1) {
      validationWarnings.push("Temperature ajustada a 1 (requerido por GPT-5 nano)");
    }
  }

  // 3. Resolver límites de tokens
  const requestedMaxTokens = chatbot.maxTokens || planLimits.maxTokensPerQuery;
  const finalMaxTokens = Math.min(requestedMaxTokens, planLimits.maxTokensPerQuery);

  if (requestedMaxTokens > planLimits.maxTokensPerQuery) {
    validationWarnings.push(`Tokens limitados a ${planLimits.maxTokensPerQuery} por tu plan ${user.plan}`);
  }

  // 4. Resolver contextos aplicando límites de tamaño
  // ⚡ OPTIMIZACIÓN: contextos no se cargan por defecto para mejorar performance
  let finalContexts: any[] = [];

  // Solo procesar contextos si están disponibles (no lazy load por ahora)
  if (chatbot.contexts && Array.isArray(chatbot.contexts)) {
    finalContexts = chatbot.contexts;

    if (finalContexts.length > 0) {
      const totalContextSizeKB = finalContexts.reduce((acc, ctx) => acc + (ctx.sizeKB || 0), 0);

      if (totalContextSizeKB > planLimits.maxContextSizeKB) {
        // Truncar contextos si exceden el límite
        let currentSizeKB = 0;
        finalContexts = finalContexts.filter(ctx => {
          currentSizeKB += ctx.sizeKB || 0;
          return currentSizeKB <= planLimits.maxContextSizeKB;
        });

        validationWarnings.push(`Contextos truncados a ${planLimits.maxContextSizeKB}KB (límite del plan ${user.plan})`);
      }
    }
  }

  // 5. Resolver prompts con fallbacks seguros
  const finalInstructions = chatbot.instructions ||
    "Eres un asistente virtual útil y profesional. Responde de manera clara y concisa.";

  const finalCustomInstructions = chatbot.customInstructions || "";

  const finalPersonality = chatbot.personality || "customer_support";

  // 6. Resolver configuración de UI con fallbacks
  const finalWelcomeMessage = chatbot.welcomeMessage ||
    "¡Hola! ¿Cómo puedo ayudarte hoy?";

  const finalGoodbyeMessage = chatbot.goodbyeMessage ||
    "¡Gracias por usar nuestro servicio! Si necesitas más ayuda, no dudes en escribir.";

  return {
    // Core
    id: chatbot.id,
    name: chatbot.name,
    slug: chatbot.slug,

    // AI Config
    aiModel: finalModel,
    temperature: finalTemperature,
    maxTokens: finalMaxTokens,

    // Prompts
    instructions: finalInstructions,
    customInstructions: finalCustomInstructions,
    personality: finalPersonality,

    // UI
    primaryColor: chatbot.primaryColor || "#63CFDE",
    avatarUrl: chatbot.avatarUrl || "",
    welcomeMessage: finalWelcomeMessage,
    goodbyeMessage: finalGoodbyeMessage,

    // Context
    contexts: finalContexts,

    // Metadata
    validationWarnings,
    modelCorrected: modelCorrection.wasCorreected,
    originalModel: modelCorrection.wasCorreected ? chatbot.aiModel : undefined,
    planLimits: {
      maxTokensPerQuery: planLimits.maxTokensPerQuery,
      maxContextSizeKB: planLimits.maxContextSizeKB,
      availableModels: planLimits.availableModels
    }
  };
}

/**
 * Crea el contexto de ejecución para el agente
 */
export function createAgentExecutionContext(
  user: User,
  chatbotId: string,
  message: string,
  options: {
    sessionId?: string;
    conversationHistory?: Array<{ role: string; content: string }>;
    integrations?: Record<string, any>;
  } = {}
): AgentExecutionContext {
  return {
    userId: user.id,
    userPlan: user.plan,
    chatbotId,
    message,
    integrations: options.integrations || {},
    sessionId: options.sessionId,
    conversationHistory: options.conversationHistory || []
  };
}

/**
 * Valida que el usuario tenga acceso a las funcionalidades solicitadas
 */
export function validateUserAccess(
  user: User,
  requestedFeatures: {
    useTools?: boolean;
    useStreaming?: boolean;
    useAdvancedModels?: boolean;
  }
): {
  allowed: boolean;
  deniedFeatures: string[];
  reason?: string;
} {
  const planLimits = PLAN_LIMITS[user.plan];
  const deniedFeatures: string[] = [];

  // Usuarios FREE no tienen acceso a funcionalidades de chatbot
  if (user.plan === "FREE") {
    return {
      allowed: false,
      deniedFeatures: ["chatbots"],
      reason: "Plan gratuito no incluye acceso a chatbots"
    };
  }

  // Validar tools
  if (requestedFeatures.useTools && !["PRO", "ENTERPRISE", "TRIAL"].includes(user.plan)) {
    deniedFeatures.push("tools");
  }

  // Validar modelos avanzados
  if (requestedFeatures.useAdvancedModels) {
    const hasAdvancedModels = planLimits.availableModels.some(model =>
      model.includes("gpt-5") || model.includes("claude-3.5")
    );

    if (!hasAdvancedModels) {
      deniedFeatures.push("advanced_models");
    }
  }

  return {
    allowed: deniedFeatures.length === 0,
    deniedFeatures
  };
}

/**
 * Genera configuración para logging y monitoring
 */
export function generateConfigMetadata(
  resolvedConfig: ResolvedChatbotConfig,
  context: AgentExecutionContext
): {
  logData: Record<string, any>;
  metricsData: Record<string, any>;
} {
  return {
    logData: {
      chatbotId: resolvedConfig.id,
      userId: context.userId,
      userPlan: context.userPlan,
      model: resolvedConfig.aiModel,
      modelCorrected: resolvedConfig.modelCorrected,
      originalModel: resolvedConfig.originalModel,
      temperature: resolvedConfig.temperature,
      maxTokens: resolvedConfig.maxTokens,
      contextsCount: resolvedConfig.contexts.length,
      warningsCount: resolvedConfig.validationWarnings.length,
      sessionId: context.sessionId
    },
    metricsData: {
      plan: context.userPlan,
      model: resolvedConfig.aiModel,
      has_contexts: resolvedConfig.contexts.length > 0,
      has_tools: ["PRO", "ENTERPRISE", "TRIAL"].includes(context.userPlan),
      config_corrected: resolvedConfig.validationWarnings.length > 0
    }
  };
}