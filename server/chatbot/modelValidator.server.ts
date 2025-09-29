/**
 * Validador de Modelos AI según Plan de Usuario
 * Asegura que el usuario solo use modelos permitidos por su plan
 */

import { Plans } from "@prisma/client";
import { PLAN_LIMITS } from "./planLimits.server";
import { getDefaultModelForPlan } from "~/utils/aiModels";

interface ModelValidationResult {
  isValid: boolean;
  correctedModel?: string;
  reason?: string;
  userMessage?: string;
}

/**
 * Valida si un usuario puede usar un modelo específico según su plan
 */
export function validateModelForPlan(
  userPlan: Plans,
  requestedModel: string,
  chatbotId: string
): ModelValidationResult {
  const planLimits = PLAN_LIMITS[userPlan];
  const availableModels = planLimits.availableModels;

  // Caso especial: usuarios FREE no tienen acceso a modelos
  if (userPlan === Plans.FREE) {
    return {
      isValid: false,
      reason: "free_plan_no_access",
      userMessage: "Tu plan gratuito no incluye acceso a modelos AI. Actualiza tu plan para usar chatbots."
    };
  }

  // Verificar si el modelo está en la lista de modelos permitidos
  if (availableModels.includes(requestedModel)) {
    return {
      isValid: true
    };
  }

  // Modelo no permitido - sugerir el modelo por defecto del plan
  const defaultModel = getDefaultModelForPlan(userPlan);

  return {
    isValid: false,
    correctedModel: defaultModel,
    reason: "model_not_allowed_for_plan",
    userMessage: `El modelo "${requestedModel}" no está disponible en tu plan ${userPlan}. Se usará "${defaultModel}" en su lugar.`
  };
}

/**
 * Aplica correcciones automáticas al modelo según el plan
 */
export function applyModelCorrection(
  userPlan: Plans,
  requestedModel: string,
  autoCorrect: boolean = true
): {
  finalModel: string;
  wascorrected: boolean;
  warning?: string;
} {
  const validation = validateModelForPlan(userPlan, requestedModel, "validation");

  if (validation.isValid) {
    return {
      finalModel: requestedModel,
      wasCorreected: false
    };
  }

  if (autoCorrect && validation.correctedModel) {
    return {
      finalModel: validation.correctedModel,
      wasCorreected: true,
      warning: validation.userMessage
    };
  }

  // Si no hay corrección disponible, usar el modelo por defecto
  const defaultModel = getDefaultModelForPlan(userPlan);
  return {
    finalModel: defaultModel,
    wasCorreected: true,
    warning: `Modelo no disponible para tu plan. Usando modelo por defecto: ${defaultModel}`
  };
}

/**
 * Valida configuraciones de chatbot completas según el plan
 */
export function validateChatbotConfig(
  userPlan: Plans,
  config: {
    aiModel: string;
    temperature?: number;
    maxTokens?: number;
    contextSizeKB?: number;
  }
): {
  isValid: boolean;
  corrections: {
    aiModel?: string;
    temperature?: number;
    maxTokens?: number;
  };
  warnings: string[];
} {
  const warnings: string[] = [];
  const corrections: any = {};
  let isValid = true;

  // Validar modelo
  const modelValidation = validateModelForPlan(userPlan, config.aiModel, "config");
  if (!modelValidation.isValid) {
    isValid = false;
    corrections.aiModel = modelValidation.correctedModel || getDefaultModelForPlan(userPlan);
    if (modelValidation.userMessage) {
      warnings.push(modelValidation.userMessage);
    }
  }

  // Validar temperatura según modelo
  if (config.temperature !== undefined) {
    const correctedModel = corrections.aiModel || config.aiModel;

    if (correctedModel === "gpt-5-nano" && config.temperature !== 1) {
      corrections.temperature = 1;
      warnings.push("GPT-5 Nano solo soporta temperature=1. Corregido automáticamente.");
      isValid = false;
    } else if (correctedModel !== "gpt-5-nano" && (config.temperature < 0 || config.temperature > 2)) {
      corrections.temperature = Math.max(0, Math.min(2, config.temperature));
      warnings.push("Temperature debe estar entre 0 y 2. Corregido automáticamente.");
      isValid = false;
    }
  }

  // Validar tokens según plan
  const planLimits = PLAN_LIMITS[userPlan];
  if (config.maxTokens && config.maxTokens > planLimits.maxTokensPerQuery) {
    corrections.maxTokens = planLimits.maxTokensPerQuery;
    warnings.push(`Máximo ${planLimits.maxTokensPerQuery} tokens por consulta en tu plan ${userPlan}.`);
    isValid = false;
  }

  // Validar tamaño de contexto
  if (config.contextSizeKB && config.contextSizeKB > planLimits.maxContextSizeKB) {
    warnings.push(`Tamaño de contexto limitado a ${planLimits.maxContextSizeKB}KB en tu plan ${userPlan}.`);
    // Nota: No corregimos aquí porque afecta los contextos, solo advertimos
  }

  return {
    isValid,
    corrections,
    warnings
  };
}

/**
 * Obtiene los modelos disponibles para un plan específico
 */
export function getAvailableModelsForPlan(userPlan: Plans): {
  models: string[];
  defaultModel: string;
  restrictions: string[];
} {
  const planLimits = PLAN_LIMITS[userPlan];
  const restrictions: string[] = [];

  if (userPlan === Plans.FREE) {
    restrictions.push("Plan gratuito no incluye acceso a modelos AI");
  }

  if (userPlan === Plans.STARTER) {
    restrictions.push("Plan Starter limitado a modelos básicos");
  }

  return {
    models: planLimits.availableModels,
    defaultModel: getDefaultModelForPlan(userPlan),
    restrictions
  };
}

/**
 * Middleware para validar automáticamente configuraciones de chatbot
 */
export function createModelValidationMiddleware() {
  return (userPlan: Plans, chatbotConfig: any) => {
    // Aplicar validaciones y correcciones automáticas
    const validation = validateChatbotConfig(userPlan, {
      aiModel: chatbotConfig.aiModel,
      temperature: chatbotConfig.temperature,
      maxTokens: chatbotConfig.maxTokens,
      contextSizeKB: chatbotConfig.contextSizeKB
    });

    // Aplicar correcciones
    const correctedConfig = {
      ...chatbotConfig,
      ...validation.corrections
    };

    return {
      config: correctedConfig,
      isValid: validation.isValid,
      warnings: validation.warnings
    };
  };
}