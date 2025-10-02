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
 * Resuelve la configuración para usuarios ANÓNIMOS (sin validaciones de plan)
 * Usa la configuración del chatbot directamente sin restricciones
 *
 * 🛡️ IMPORTANTE: Aunque son anónimos, SIEMPRE validar temperature para evitar alucinaciones
 */
export function resolveAnonymousChatbotConfig(chatbot: Chatbot): ResolvedChatbotConfig {
  const validationWarnings: string[] = [];

  // 🛡️ VALIDACIÓN CRÍTICA: Temperature segura
  let safeTemperature = chatbot.temperature || 1;

  // NUNCA permitir temperature > 1.5 (causa alucinaciones multilenguaje)
  if (safeTemperature > 1.5) {
    console.warn(`⚠️ Temperature ${safeTemperature} DEMASIADO ALTA para chatbot ${chatbot.id}. Forzando a 1.0`);
    safeTemperature = 1.0;
    validationWarnings.push(`Temperature reducida de ${chatbot.temperature} a 1.0 por seguridad`);
  }

  // Para GPT-5 nano y gpt-4o-mini, forzar temperature=1 (óptimo)
  const model = chatbot.aiModel;
  if (model === 'gpt-5-nano' || model === 'gpt-4o-mini') {
    if (safeTemperature !== 1) {
      console.log(`🔧 Ajustando temperature a 1 para ${model} (requerido/óptimo)`);
      safeTemperature = 1;
    }
  }

  // 🛡️ Límite de tokens razonable (evitar loops infinitos)
  const safeMaxTokens = Math.min(chatbot.maxTokens || 800, 1000);

  return {
    // Core
    id: chatbot.id,
    name: chatbot.name,
    slug: chatbot.slug,

    // AI Config - CON validaciones de seguridad
    aiModel: chatbot.aiModel,
    temperature: safeTemperature,
    maxTokens: safeMaxTokens,

    // Prompts
    instructions: chatbot.instructions || "Eres un asistente virtual útil y profesional.",
    customInstructions: chatbot.customInstructions || "",
    personality: chatbot.personality || "customer_support",

    // UI
    primaryColor: chatbot.primaryColor || "#9A99EA",
    avatarUrl: chatbot.avatarUrl || "",
    welcomeMessage: chatbot.welcomeMessage || "¡Hola! ¿Cómo puedo ayudarte hoy?",
    goodbyeMessage: chatbot.goodbyeMessage || "¡Gracias por usar nuestro servicio!",

    // Context - usar todos los contextos del chatbot
    contexts: (chatbot.contexts && Array.isArray(chatbot.contexts)) ? chatbot.contexts : [],

    // Metadata
    validationWarnings,
    modelCorrected: false,
    originalModel: chatbot.temperature !== safeTemperature ? `temp=${chatbot.temperature}` : undefined,
    planLimits: {
      maxTokensPerQuery: safeMaxTokens,
      maxContextSizeKB: 10000, // Sin límite efectivo para públicos
      availableModels: [chatbot.aiModel]
    }
  };
}

/**
 * Resuelve la configuración completa del chatbot aplicando business rules
 */
export function resolveChatbotConfig(
  chatbot: Chatbot,
  user: User | { id: string; plan: string },
  context: Partial<AgentExecutionContext> = {}
): ResolvedChatbotConfig {
  // 👤 Usuarios anónimos: usar configuración simple sin validaciones
  if (user.plan === 'ANONYMOUS') {
    return resolveAnonymousChatbotConfig(chatbot);
  }

  const planLimits = PLAN_LIMITS[user.plan];

  // Si el plan no existe, usar configuración anónima
  if (!planLimits) {
    console.warn(`⚠️ Plan desconocido: ${user.plan}, usando configuración anónima`);
    return resolveAnonymousChatbotConfig(chatbot);
  }

  const validationWarnings: string[] = [];

  // 1. Resolver modelo AI con validaciones
  const modelCorrection = applyModelCorrection(user.plan, chatbot.aiModel, true);
  const finalModel = modelCorrection.finalModel;

  if (modelCorrection.wasCorreected) {
    validationWarnings.push(modelCorrection.warning || "Modelo corregido por restricciones del plan");
  }

  // 2. Resolver temperatura según modelo
  let finalTemperature = chatbot.temperature || 0.7;

  // 🛡️ PROTECCIÓN CRÍTICA: Temperature > 1.5 causa alucinaciones severas
  if (finalTemperature > 1.5) {
    console.warn(`⚠️ Temperature ${finalTemperature} DEMASIADO ALTA - causó alucinaciones multilenguaje. Reducida a 1.0`);
    validationWarnings.push(`⚠️ Temperature ${finalTemperature} es DEMASIADO ALTA (causa basura). Reducida a 1.0`);
    finalTemperature = 1.0;
  }

  // Para GPT-5 nano y gpt-4o-mini, FORZAR temperature=1 (óptimo/requerido)
  if (finalModel === "gpt-5-nano" || finalModel === "gpt-4o-mini") {
    if (finalTemperature !== 1) {
      console.log(`🔧 Ajustando temperature a 1 para ${finalModel} (óptimo)`);
      validationWarnings.push(`Temperature ajustada a 1 para ${finalModel}`);
      finalTemperature = 1;
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
    primaryColor: chatbot.primaryColor || "#9A99EA",
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
  user: User | { id: string; plan: string },
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