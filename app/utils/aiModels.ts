// Modelos disponibles - priorizando calidad y estabilidad
export const AI_MODELS = [
  // Modelos Enterprise - solo Sonnet
  {
    value: "claude-3-5-sonnet-20241022",
    label: "Claude 3.5 Sonnet (Anthropic)",
    category: "ENTERPRISE",
    provider: "anthropic-direct",
    tier: "enterprise",
  },
  
  // Modelos Pro - Anthropic models 
  {
    value: "claude-3-5-haiku-20241022", 
    label: "Claude 3.5 Haiku (Anthropic)",
    category: "PRO",
    provider: "anthropic-direct",
    tier: "pro",
  },
  {
    value: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku (Anthropic)",
    category: "PRO", 
    provider: "anthropic-direct",
    tier: "pro",
  },
  
  // Modelos Starter - más económicos
  {
    value: "gpt-3.5-turbo",
    label: "GPT-3.5 Turbo (OpenAI)",
    category: "STARTER",
    provider: "openai-direct",
    tier: "starter",
  },
  {
    value: "google/gemini-flash-1.5",
    label: "Gemini Flash 1.5 (Google)",
    category: "STARTER",
    provider: "openrouter",
    tier: "starter",
  },
  {
    value: "mistralai/mistral-small",
    label: "Mistral Small (Mistral AI)",
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
