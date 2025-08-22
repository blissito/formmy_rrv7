// Tipos para los modelos
export type AIModel = {
  value: string;
  label: string;
  category: string;
  provider: string;
  tier: string;
  recommended?: boolean;
  badge?: string;
};

// Modelos disponibles - priorizando calidad y estabilidad
export const AI_MODELS: AIModel[] = [
  // Modelos Enterprise - GPT-5 Mini y Claude 3.5 Haiku
  {
    value: "gpt-5-mini",
    label: "GPT-5 Mini",
    category: "ENTERPRISE",
    provider: "openai-direct",
    tier: "enterprise",
    badge: "Enterprise default",
  },
  
  {
    value: "claude-3-5-haiku-20241022", 
    label: "Claude 3.5 Haiku",
    category: "ENTERPRISE",
    provider: "anthropic-direct",
    tier: "enterprise",
  },
  
  // Modelos Pro/Starter - Ultra económicos con herramientas
  {
    value: "gpt-5-nano",
    label: "GPT-5 Nano",
    category: "STARTER",
    provider: "openai-direct",
    tier: "starter",
    recommended: true,
    badge: "Mejor elección",
  },
  
  {
    value: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku",
    category: "PRO", 
    provider: "anthropic-direct",
    tier: "pro",
  },
  {
    value: "google/gemini-2.5-flash-lite",
    label: "Gemini 2.5 Flash-Lite",
    category: "STARTER",
    provider: "openrouter",
    tier: "starter",
  },
  
  // Nota: Llama 3.3 70B y Nemotron Ultra 253B removidos por generar respuestas problemáticas
];

export const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.value, m.label])
);

export const DEFAULT_AI_MODEL = "claude-3-5-haiku-20241022";

/**
 * Obtiene el modelo por defecto según el plan del usuario
 * Cada plan tiene un modelo optimizado para su nivel de valor
 */
export function getDefaultModelForPlan(plan: string): string {
  switch (plan) {
    case "FREE":
    case "TRIAL":
    case "STARTER":
      return "gpt-5-nano"; // Nano: mejor balance velocidad/costo para planes básicos
    case "PRO":
      return "gpt-5-nano"; // Nano como default, con smart routing para integraciones
    case "ENTERPRISE":
      return "gpt-5-mini"; // Mini: máximo rendimiento para Enterprise
    default:
      return "gpt-5-nano";
  }
}

// Alias para compatibilidad
export const getModelForPlan = getDefaultModelForPlan;

/**
 * Determina el modelo óptimo para PRO según el contexto
 * Routing inteligente: Nano para chat básico, Haiku para integraciones
 */
export function getSmartModelForPro(hasActiveIntegrations: boolean, isComplexQuery: boolean = false): string {
  if (hasActiveIntegrations || isComplexQuery) {
    return "claude-3-haiku-20240307"; // Calidad para integraciones críticas
  }
  return "gpt-5-nano"; // Velocidad y costo para chat normal
}

// Todos los modelos requieren PRO o trial activo
export const ALL_MODELS = AI_MODELS.map((m) => m.value);

export const DEFAULT_MODEL_ROTATION = [
  "claude-3-haiku-20240307", // Más económico como predeterminado
  "claude-3-5-haiku-20241022",
  "gpt-3.5-turbo",
];

export const FALLBACK_MODELS = {
  "claude-3-5-sonnet-20241022": "claude-3-5-haiku-20241022",
  "claude-3-5-haiku-20241022": "claude-3-haiku-20240307", 
  "claude-3-haiku-20240307": "gpt-3.5-turbo",
  "gpt-3.5-turbo": "claude-3-haiku-20240307",
  "gpt-5-nano": "gpt-5-mini", // Fallback a GPT-5-mini de la misma familia
  "gpt-5-mini": "claude-3-haiku-20240307", // Luego a Claude si falla
  "google/gemini-flash-1.5": "claude-3-haiku-20240307",
  "mistralai/mistral-small": "claude-3-haiku-20240307",
};

/**
 * Genera la lista de modelos fallback priorizando calidad y estabilidad
 * Se usa en endpoints para recuperación automática ante fallos
 */
export function getModelProvider(modelValue: string): "anthropic-direct" | "openrouter" | "openai-direct" {
  const model = AI_MODELS.find(m => m.value === modelValue);
  return model?.provider as "anthropic-direct" | "openrouter" | "openai-direct" || "openrouter";
}

export function isAnthropicDirectModel(modelValue: string): boolean {
  return getModelProvider(modelValue) === "anthropic-direct";
}

export function generateFallbackModels(currentModel?: string): string[] {
  if (!currentModel) return DEFAULT_MODEL_ROTATION;
  
  // Obtener el modelo de fallback específico o usar rotación por defecto
  const fallbackModel = FALLBACK_MODELS[currentModel];
  
  return fallbackModel ? [fallbackModel] : DEFAULT_MODEL_ROTATION;
}

/**
 * Obtiene los modelos disponibles para un plan específico
 */
export function getModelsForPlan(plan: string): string[] {
  switch (plan) {
    case "FREE":
      return []; // Sin acceso después del trial
    case "TRIAL":
      return AI_MODELS.filter(m => m.tier === "starter" || m.tier === "pro").map(m => m.value); // Mismos modelos que PRO
    case "STARTER":
      return AI_MODELS.filter(m => m.tier === "starter").map(m => m.value);
    case "PRO":
      return AI_MODELS.filter(m => m.tier === "starter" || m.tier === "pro").map(m => m.value);
    case "ENTERPRISE":
      return AI_MODELS.map(m => m.value); // Acceso a todos
    default:
      return [];
  }
}

/**
 * Obtiene los modelos con categoría específica
 */
export function getModelsByCategory(category: string): typeof AI_MODELS {
  return AI_MODELS.filter(m => m.category === category);
}
