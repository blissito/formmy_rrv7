/**
 * Temperatures óptimas por modelo AI
 * Centraliza configuración de temperature para evitar inconsistencias
 *
 * Fuente: Testing interno + CLAUDE.md
 */

export const OPTIMAL_TEMPERATURES: Record<string, number> = {
  // OpenAI models
  'gpt-5-nano': 1,           // Óptimo según testing (Sept 29, 2025)
  'gpt-4o-mini': 1,          // Óptimo según testing
  'gpt-5-mini': 0.3,         // Más preciso para tareas complejas
  'gpt-5': 0.3,              // Modelo avanzado, temperature baja
  'gpt-3.5-turbo': 0.7,      // Balance entre creatividad y precisión

  // Anthropic models
  'claude-3-haiku-20240307': 0.7,        // Claude 3 Haiku
  'claude-3-5-haiku-20241022': 0.5,      // Claude 3.5 Haiku (más preciso)
  'claude-3-sonnet-20240229': 0.7,       // Sonnet clásico
  'claude-3-5-sonnet-20241022': 0.7,     // Sonnet 3.5
  'claude-3-opus-20240229': 0.5,         // Opus requiere más precisión

  // Gemini models (via OpenRouter)
  'gemini-2.0-flash': 0.7,
  'gemini-1.5-pro': 0.7,
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
