// Modelos disponibles - priorizando calidad y estabilidad
export const AI_MODELS = [
  // Modelos pagos - mayor calidad y estabilidad
  {
    value: "openai/gpt-oss-20b",
    label: "GPT-OSS 20B (OpenAI)",
    category: "Paid",
  },
  {
    value: "openai/gpt-3.5-turbo",
    label: "GPT-3.5 Turbo (OpenAI)",
    category: "Paid",
  },
  {
    value: "anthropic/claude-3.5-haiku",
    label: "Claude 3.5 Haiku (Anthropic)",
    category: "Paid",
  },
  {
    value: "anthropic/claude-3-haiku",
    label: "Claude 3 Haiku (Anthropic)",
    category: "Paid",
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini (OpenAI)",
    category: "Paid",
  },
  {
    value: "google/gemini-flash-1.5",
    label: "Gemini Flash 1.5 (Google)",
    category: "Paid",
  },
  
  // Modelos gratuitos - verificados por calidad
  {
    value: "meta-llama/llama-3.1-8b-instruct:free",
    label: "Llama 3.1 8B (Meta)",
    category: "Free",
  },
  {
    value: "mistralai/mistral-7b-instruct:free",
    label: "Mistral 7B (Mistral AI)",
    category: "Free",
  },
  {
    value: "google/gemini-2.0-flash-exp:free",
    label: "Gemini 2.0 Flash Exp (Google)",
    category: "Free",
  },
  {
    value: "rekaai/reka-flash-3:free",
    label: "Reka Flash 3 (Reka AI)",
    category: "Free",
  },
  {
    value: "google/gemma-3-4b-it:free",
    label: "Gemma 3 4B IT (Google)",
    category: "Free",
  },
  
  // Nota: Llama 3.3 70B y Nemotron Ultra 253B removidos por generar respuestas problemáticas
];

export const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.value, m.label])
);

export const DEFAULT_AI_MODEL = "openai/gpt-oss-20b";

// Sistema de rotación de modelos gratuitos para evitar rate limits - Nemotron removido
export const FREE_MODEL_ROTATION = [
  "meta-llama/llama-3.1-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "rekaai/reka-flash-3:free",
  "google/gemma-3-4b-it:free",
];

// Modelos de fallback para rate limits (rotación circular) - Nemotron removido por problemas
export const FALLBACK_MODELS = {
  "meta-llama/llama-3.1-8b-instruct:free": "mistralai/mistral-7b-instruct:free",
  "mistralai/mistral-7b-instruct:free": "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-flash-exp:free": "rekaai/reka-flash-3:free",
  "rekaai/reka-flash-3:free": "google/gemma-3-4b-it:free",
  "google/gemma-3-4b-it:free": "meta-llama/llama-3.1-8b-instruct:free", // Volver al más estable
};

export const PLAN_MODELS = {
  FREE: AI_MODELS.filter((m) => m.category === "Free").map((m) => m.value),
  PRO: AI_MODELS.map((m) => m.value), // PRO incluye todos los modelos (Free + Paid)
};

/**
 * Genera la lista de modelos fallback priorizando calidad y estabilidad
 * Se usa en endpoints para recuperación automática ante fallos
 */
export function generateFallbackModels(currentModel?: string): string[] {
  const paidModels = AI_MODELS.filter(m => m.category === "Paid").map(m => m.value);
  const freeModels = AI_MODELS.filter(m => m.category === "Free").map(m => m.value);
  
  const fallbacks = [
    currentModel, // Modelo actual del chatbot
    ...paidModels,  // Modelos pagos primero (mejor calidad)
    ...freeModels   // Modelos gratuitos como último recurso
  ].filter(Boolean) // Eliminar valores null/undefined
   .filter((model, index, arr) => arr.indexOf(model) === index); // Eliminar duplicados
  
  return fallbacks;
}
