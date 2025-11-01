import {
  MODEL_REGISTRY,
  getDefaultModelForPlan as _getDefaultModelForPlan,
  getModelsForPlan as _getModelsForPlan,
  getModelProvider as _getModelProvider,
} from './model-registry';

// Tipos para los modelos (compatible con código existente)
export type AIModel = {
  value: string;
  label: string;
  category: string;
  provider: string;
  tier: string;
  recommended?: boolean;
  badge?: string;
};

/**
 * Lista de modelos disponibles
 * IMPORTADO DESDE model-registry.ts - ÚNICA FUENTE DE VERDAD
 */
export const AI_MODELS: AIModel[] = MODEL_REGISTRY.map(model => ({
  value: model.id,
  label: model.label,
  category: model.category,
  provider: model.provider,
  tier: model.tier,
  recommended: model.recommended,
  badge: model.badge,
}));

export const MODEL_LABELS: Record<string, string> = Object.fromEntries(
  AI_MODELS.map((m) => [m.value, m.label])
);

export const DEFAULT_AI_MODEL = "gpt-5-nano";

/**
 * Obtiene el modelo por defecto según el plan del usuario
 * IMPORTADO DESDE model-registry.ts
 */
export function getDefaultModelForPlan(plan: string): string {
  return _getDefaultModelForPlan(plan);
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
  "gemini-2.0-flash-lite", // Gemini reemplaza a GPT-3.5 Turbo
  "claude-3-haiku-20240307",
  "gpt-5-nano",
];

export const FALLBACK_MODELS: Record<string, string> = {
  "claude-3-5-sonnet-20241022": "claude-3-5-haiku-20241022",
  "claude-3-5-haiku-20241022": "claude-3-haiku-20240307",
  "claude-3-haiku-20240307": "gemini-2.0-flash",
  "gemini-2.0-flash": "gemini-2.0-flash-lite",
  "gemini-2.0-flash-lite": "gpt-5-nano",
  "gpt-5-nano": "gpt-5-mini",
  "gpt-5-mini": "claude-3-haiku-20240307",
  // Legacy
  "gpt-3.5-turbo": "gemini-2.0-flash-lite",
};

/**
 * Genera la lista de modelos fallback priorizando calidad y estabilidad
 * Se usa en endpoints para recuperación automática ante fallos
 */
export function getModelProvider(modelValue: string): "anthropic-direct" | "google-direct" | "openrouter" | "openai-direct" {
  return _getModelProvider(modelValue) as any;
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
 * IMPORTADO DESDE model-registry.ts
 */
export function getModelsForPlan(plan: string): string[] {
  return _getModelsForPlan(plan).map(m => m.id);
}

/**
 * Obtiene los modelos con categoría específica
 */
export function getModelsByCategory(category: string): typeof AI_MODELS {
  return AI_MODELS.filter(m => m.category === category);
}
