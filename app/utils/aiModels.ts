// Modelos populares para chatbots centralizados (todos gratuitos)
export const AI_MODELS = [
  {
    value: "mistralai/mistral-small-3.2-24b-instruct:free",
    label: "Mistral Small 3.2 (Mistral AI)",
    category: "Free",
  },
  {
    value: "mistralai/mistral-small-3.2-24b-instruct",
    label: "Mistral Small 3.2 (Mistral AI)",
    category: "Paid",
  },
  {
    value: "meta-llama/llama-3.3-70b-instruct",
    label: "Llama 3.3 70B (Meta)",
    category: "Paid",
  },
  {
    value: "qwen/qwen-2.5-7b-instruct",
    label: "Qwen 2.5 7B (Qwen)",
    category: "Paid",
  },
  {
    value: "moonshotai/kimi-k2",
    label: "Kimi K2 (Moonshot AI)",
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
    value: "deepseek/deepseek-chat",
    label: "DeepSeek V3 (DeepSeek)",
    category: "Paid",
  },
];

export const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.value, m.label])
);

export const DEFAULT_AI_MODEL = "mistralai/mistral-small-3.2-24b-instruct:free";

// Sistema de rotación de modelos gratuitos para evitar rate limits
export const FREE_MODEL_ROTATION = [
  "mistralai/mistral-small-3.2-24b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "deepseek/deepseek-chat:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free",
  "google/gemini-2.0-flash-exp:free",
  "moonshotai/kimi-k2:free",
];

// Modelos de fallback para rate limits (rotación circular)
export const FALLBACK_MODELS = {
  "mistralai/mistral-small-3.2-24b-instruct:free":
    "mistralai/mistral-small-3.1-24b-instruct:free",
  "mistralai/mistral-small-3.1-24b-instruct:free":
    "deepseek/deepseek-chat:free",
  "deepseek/deepseek-chat:free": "meta-llama/llama-3.3-70b-instruct:free",
  "meta-llama/llama-3.3-70b-instruct:free": "qwen/qwen-2.5-72b-instruct:free",
  "qwen/qwen-2.5-72b-instruct:free": "google/gemini-2.0-flash-exp:free",
  "google/gemini-2.0-flash-exp:free": "moonshotai/kimi-k2:free",
  "moonshotai/kimi-k2:free": "mistralai/mistral-small-3.2-24b-instruct:free",
};

export const PLAN_MODELS = {
  FREE: AI_MODELS.filter((m) => m.category === "Free").map((m) => m.value),
  PRO: AI_MODELS.map((m) => m.value), // PRO incluye todos los modelos (Free + Paid)
};
