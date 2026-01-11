/**
 * Registro central de modelos AI - ÚNICA FUENTE DE VERDAD
 *
 * Este archivo es la definición canónica de:
 * - Modelos disponibles
 * - Temperaturas óptimas
 * - Providers
 * - Configuración por tier
 *
 * Importado por:
 * - Frontend: aiModels.ts
 * - Backend: model-temperatures.ts
 */

export type ModelProvider = "openai-direct" | "anthropic-direct" | "google-direct" | "openrouter";

export type ModelTier = "starter" | "pro" | "enterprise";

export interface ModelDefinition {
  // Identificador único del modelo
  id: string;

  // Nombre para mostrar en UI
  label: string;

  // Provider que maneja el modelo
  provider: ModelProvider;

  // Tier mínimo requerido
  tier: ModelTier;

  // Temperatura óptima (0-1.5)
  temperature: number;

  // Si la temperatura está fija (no se puede cambiar en UI)
  fixedTemperature?: boolean;

  // Categoría para agrupar en UI
  category: "STARTER" | "PRO" | "ENTERPRISE";

  // Si es el modelo recomendado en su tier
  recommended?: boolean;

  // Badge opcional para mostrar (ej: "Mejor precio", "73% SWE-bench")
  badge?: string;
}

/**
 * Registro completo de modelos AI
 *
 * ORDEN IMPORTA: Los modelos aparecen en el UI en este orden
 */
export const MODEL_REGISTRY: ModelDefinition[] = [
  // ========== ENTERPRISE ==========
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    provider: "google-direct",
    tier: "enterprise",
    temperature: 0.7,
    category: "ENTERPRISE",
    recommended: true,
    badge: "Thinking mode",
  },

  // ========== PRO ==========
  {
    id: "gpt-5-nano",
    label: "GPT-5 Nano",
    provider: "openai-direct",
    tier: "pro",
    temperature: 1.0,
    fixedTemperature: true,
    category: "PRO",
    recommended: true,
    badge: "Mejor elección",
  },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    provider: "openai-direct",
    tier: "pro",
    temperature: 1.0,
    fixedTemperature: true,
    category: "PRO",
    badge: "Mejor para herramientas",
  },
  {
    id: "claude-haiku-4-5",
    label: "Claude Haiku 4.5",
    provider: "anthropic-direct",
    tier: "pro",
    temperature: 0.8,
    fixedTemperature: true,
    category: "PRO",
    badge: "73% SWE-bench",
  },

  // ========== STARTER ==========
  {
    id: "gemini-3-flash",
    label: "Gemini 3 Flash",
    provider: "google-direct",
    tier: "starter",
    temperature: 0.7,
    category: "STARTER",
    recommended: true,
    badge: "Último modelo",
  },
];

/**
 * Modelos adicionales soportados (legacy o sin UI)
 * Estos tienen temperatura pero no aparecen en el selector de UI
 */
export const LEGACY_MODELS: Record<string, { temperature: number; fixedTemperature?: boolean }> = {
  "gpt-4o-mini": { temperature: 1.0, fixedTemperature: true },
  "gpt-4o": { temperature: 1.0, fixedTemperature: true },
  "gpt-5": { temperature: 0.7 },
  "gpt-3.5-turbo": { temperature: 0.7 }, // Legacy - reemplazado por Gemini 2.0 Flash Lite
  "claude-3-sonnet-20240229": { temperature: 0.7 },
  "claude-3-opus-20240229": { temperature: 0.7 },
  "gemini-2.5-flash-lite": { temperature: 0.7 },
  "gemini-1.5-pro": { temperature: 0.7 },
  "gemini-3-flash-preview-11-2025": { temperature: 0.7 }, // Alias específico de versión
};

// ========== UTILIDADES ==========

/**
 * Obtiene un modelo por ID
 */
export function getModelById(id: string): ModelDefinition | undefined {
  return MODEL_REGISTRY.find(m => m.id === id);
}

/**
 * Obtiene todos los modelos de un tier específico
 */
export function getModelsByTier(tier: ModelTier): ModelDefinition[] {
  return MODEL_REGISTRY.filter(m => m.tier === tier);
}

/**
 * Obtiene todos los modelos disponibles para un plan
 */
export function getModelsForPlan(plan: string): ModelDefinition[] {
  switch (plan.toUpperCase()) {
    case "FREE":
      return []; // Sin acceso después del trial
    case "TRIAL":
      // Trial tiene acceso a starter + pro (igual que PRO)
      return MODEL_REGISTRY.filter(m => m.tier === "starter" || m.tier === "pro");
    case "STARTER":
      return MODEL_REGISTRY.filter(m => m.tier === "starter");
    case "PRO":
      return MODEL_REGISTRY.filter(m => m.tier === "starter" || m.tier === "pro");
    case "ENTERPRISE":
      return MODEL_REGISTRY; // Acceso completo
    default:
      return [];
  }
}

/**
 * Obtiene la temperatura óptima de un modelo
 */
export function getModelTemperature(modelId: string, fallback: number = 0.7): number {
  const model = getModelById(modelId);
  if (model) return model.temperature;

  // Buscar en legacy
  const legacy = LEGACY_MODELS[modelId];
  if (legacy) return legacy.temperature;

  return fallback;
}

/**
 * Verifica si la temperatura de un modelo está fija
 */
export function isTemperatureFixed(modelId: string): boolean {
  const model = getModelById(modelId);
  if (model) return model.fixedTemperature ?? false;

  const legacy = LEGACY_MODELS[modelId];
  if (legacy) return legacy.fixedTemperature ?? false;

  return false;
}

/**
 * Obtiene el provider de un modelo
 */
export function getModelProvider(modelId: string): ModelProvider {
  const model = getModelById(modelId);
  return model?.provider ?? "openrouter";
}

/**
 * Modelo por defecto según el plan
 */
export function getDefaultModelForPlan(plan: string): string {
  switch (plan.toUpperCase()) {
    case "FREE":
      return "gemini-3-flash"; // FREE después del trial
    case "TRIAL":
      return "gpt-5-nano"; // Trial tiene acceso a PRO models
    case "STARTER":
      return "gemini-3-flash"; // Gemini 3 Pro para STARTER
    case "PRO":
      return "gpt-5-nano"; // GPT-5 Nano (4o-mini) para PRO
    case "ENTERPRISE":
      return "gemini-2.5-pro"; // Gemini 2.5 Pro para ENTERPRISE
    default:
      return "gpt-5-nano";
  }
}
