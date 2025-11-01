/**
 * Temperatures óptimas por modelo AI
 * Centraliza configuración de temperature para evitar inconsistencias
 *
 * Fuente: Testing interno + CLAUDE.md
 */

export const OPTIMAL_TEMPERATURES: Record<string, number> = {
  // OpenAI models
  'gpt-5-nano': 1,           // Maps to gpt-4o-mini - Óptimo según testing (Sept 29, 2025)
  'gpt-4o-mini': 1,          // Óptimo para agentes conversacionales con tools
  'gpt-5-mini': 1,           // Maps to gpt-4o - FIJO en 1.0 para evitar alucinaciones
  'gpt-4o': 1,               // FIJO en 1.0 para evitar alucinaciones
  'gpt-5': 0.7,              // Modelo avanzado - conversacional
  'gpt-3.5-turbo': 0.7,      // Balance entre creatividad y precisión

  // Anthropic models
  'claude-3-haiku-20240307': 0.8,        // Claude 3 Haiku - punto medio (evita alucinaciones de temp muy baja)
  'claude-3-5-haiku-20241022': 0.8,      // Claude 3.5 Haiku - punto medio
  'claude-3-sonnet-20240229': 0.7,       // Sonnet clásico
  'claude-3-5-sonnet-20241022': 0.7,     // Sonnet 3.5
  'claude-3-opus-20240229': 0.7,         // Opus - conversacional

  // Gemini models (directo desde Google API - FREE TIER disponible!)
  'gemini-2.0-flash': 0.7,               // $0.10/$0.40 (vs $0.125/$0.50 en OpenRouter)
  'gemini-2.0-flash-lite': 0.7,          // $0.075/$0.30 - óptimo para trial/starter
  'gemini-2.5-flash': 0.7,               // Nueva generación
  'gemini-2.5-flash-lite': 0.7,          // Lite de nueva generación
  'gemini-1.5-pro': 0.7,                 // Legacy pero aún soportado

  // Claude 4.x models
  'claude-haiku-4-5': 0.8,               // Haiku 4.5 - 73.3% SWE-bench, mejor coding model (Oct 2025)
};

/**
 * Obtiene la temperature óptima para un modelo
 * @param model - ID del modelo AI
 * @param fallback - Temperature de fallback si el modelo no está en la lista
 * @returns Temperature óptima para el modelo
 */
export function getOptimalTemperature(model: string, fallback: number = 0.7): number {
  return OPTIMAL_TEMPERATURES[model] ?? fallback;
}

/**
 * Valida que una temperature esté dentro de rangos seguros
 * @param temperature - Temperature a validar
 * @returns Temperature sanitizada (máximo 1.5 para evitar alucinaciones)
 */
export function sanitizeTemperature(temperature: number): number {
  // NUNCA permitir > 1.5 (causa alucinaciones severas)
  if (temperature > 1.5) {
    console.warn(`⚠️ Temperature ${temperature} DEMASIADO ALTA - reducida a 1.0`);
    return 1.0;
  }

  // Mínimo razonable
  if (temperature < 0) {
    return 0;
  }

  return temperature;
}

/**
 * Configuración de rangos de temperatura para el frontend
 * Define min, max, óptimo y step por modelo para el input range
 */
export interface TemperatureRange {
  min: number;
  max: number;
  optimal: number;
  step: number;
  fixed?: boolean; // Si es true, no se puede modificar
}

export const MODEL_TEMPERATURE_RANGES: Record<string, TemperatureRange> = {
  // OpenAI models
  'gpt-5-nano': { min: 1, max: 1, optimal: 1, step: 0, fixed: true }, // Fijo en 1.0
  'gpt-4o-mini': { min: 1, max: 1, optimal: 1, step: 0, fixed: true }, // Fijo en 1.0
  'gpt-5-mini': { min: 1, max: 1, optimal: 1, step: 0, fixed: true }, // Fijo en 1.0
  'gpt-4o': { min: 1, max: 1, optimal: 1, step: 0, fixed: true }, // Fijo en 1.0
  'gpt-5': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'gpt-3.5-turbo': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },

  // Anthropic models
  'claude-3-haiku-20240307': { min: 0.8, max: 0.8, optimal: 0.8, step: 0, fixed: true },
  'claude-3-5-haiku-20241022': { min: 0.8, max: 0.8, optimal: 0.8, step: 0, fixed: true },
  'claude-3-sonnet-20240229': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'claude-3-5-sonnet-20241022': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'claude-3-opus-20240229': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },

  // Gemini models
  'gemini-2.0-flash': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'gemini-2.0-flash-lite': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'gemini-2.5-flash': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'gemini-2.5-flash-lite': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },
  'gemini-1.5-pro': { min: 0, max: 1.5, optimal: 0.7, step: 0.1 },

  // Claude 4.x models
  'claude-haiku-4-5': { min: 0.8, max: 0.8, optimal: 0.8, step: 0, fixed: true },
};

/**
 * Obtiene el rango de temperatura para un modelo específico
 * @param model - ID del modelo AI
 * @returns TemperatureRange para el modelo (o default si no está configurado)
 */
export function getTemperatureRange(model: string): TemperatureRange {
  return MODEL_TEMPERATURE_RANGES[model] ?? {
    min: 0,
    max: 1.5,
    optimal: 0.7,
    step: 0.1,
  };
}

/**
 * Resuelve la temperature final para un chatbot
 * Prioridad:
 * 1. Temperature configurada por usuario (si es válida)
 * 2. Temperature óptima del modelo
 *
 * @param model - Modelo AI a usar
 * @param userTemperature - Temperature configurada por usuario (opcional)
 * @returns Temperature final sanitizada
 */
export function resolveTemperature(
  model: string,
  userTemperature?: number
): {
  temperature: number;
  wasOverridden: boolean;
  reason?: string;
} {
  const optimalTemp = getOptimalTemperature(model);
  const range = MODEL_TEMPERATURE_RANGES[model];

  // ✅ CRÍTICO: Si el modelo tiene temperatura FIJA, SIEMPRE usar esa (ej: gpt-5-mini solo soporta 1.0)
  if (range?.fixed) {
    const wasOverridden = userTemperature !== undefined && userTemperature !== null && userTemperature !== optimalTemp;
    return {
      temperature: optimalTemp,
      wasOverridden,
      reason: wasOverridden ? `Modelo ${model} requiere temperature fija de ${optimalTemp}` : undefined
    };
  }

  // Si usuario NO especificó temperature, usar óptima del modelo
  if (userTemperature === undefined || userTemperature === null) {
    return {
      temperature: optimalTemp,
      wasOverridden: false
    };
  }

  // Sanitizar temperature del usuario
  const sanitized = sanitizeTemperature(userTemperature);

  // Si se sanitizó, notificar
  if (sanitized !== userTemperature) {
    return {
      temperature: sanitized,
      wasOverridden: true,
      reason: `Temperature original ${userTemperature} era insegura, reducida a ${sanitized}`
    };
  }

  // Usar temperature del usuario si es válida
  return {
    temperature: sanitized,
    wasOverridden: false
  };
}
