// Modelos disponibles - priorizando calidad y estabilidad
export const AI_MODELS = [
  // Modelos pagos - mayor calidad y estabilidad
  // Anthropic Direct (más confiables)
  {
    value: "claude-3-5-sonnet-20241022",
    label: "Claude 3.5 Sonnet (Anthropic)",
    category: "Paid",
    provider: "anthropic-direct",
  },
  {
    value: "claude-3-5-haiku-20241022", 
    label: "Claude 3.5 Haiku (Anthropic)",
    category: "Paid",
    provider: "anthropic-direct",
  },
  {
    value: "claude-3-haiku-20240307",
    label: "Claude 3 Haiku (Anthropic)",
    category: "Paid", 
    provider: "anthropic-direct",
  },
  
  // OpenRouter Models
  {
    value: "openai/gpt-3.5-turbo",
    label: "GPT-3.5 Turbo (OpenAI)",
    category: "Paid",
    provider: "openrouter",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini (OpenAI)",
    category: "Paid",
    provider: "openrouter",
  },
  {
    value: "google/gemini-flash-1.5",
    label: "Gemini Flash 1.5 (Google)",
    category: "Paid",
    provider: "openrouter",
  },
  
  {
    value: "gpt-4o-mini",
    label: "GPT-4o Mini (OpenAI Direct)",
    category: "Free",
    provider: "openai-direct",
  },
  
  // Nota: Llama 3.3 70B y Nemotron Ultra 253B removidos por generar respuestas problemáticas
];

export const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.value, m.label])
);

export const DEFAULT_AI_MODEL = "claude-3-5-haiku-20241022";

export const FREE_MODEL_ROTATION = [
  "gpt-4o-mini",
];

export const FALLBACK_MODELS = {
  "gpt-4o-mini": "gpt-4o-mini",
};

export const PLAN_MODELS = {
  FREE: AI_MODELS.filter((m) => m.category === "Free").map((m) => m.value),
  PRO: AI_MODELS.map((m) => m.value),
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
  if (!currentModel) return [];
  
  const modelInfo = AI_MODELS.find(m => m.value === currentModel);
  
  if (modelInfo?.category === "Free") {
    return FREE_MODEL_ROTATION;
  } else {
    return [currentModel];
  }
}
