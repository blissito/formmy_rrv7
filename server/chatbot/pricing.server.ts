/**
 * Cálculo de costos por proveedor y modelo
 * Precios actualizados según documentación oficial (agosto 2025)
 */

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export interface CostCalculation {
  inputCost: number;
  outputCost: number;
  totalCost: number;
  provider: string;
  model: string;
}

// Precios por proveedor y modelo (en USD por 1M tokens)
const PRICING_TABLE = {
  openai: {
    'gpt-5-nano': {
      input: 0.05,   // $0.05 per 1M input tokens
      output: 0.40   // $0.40 per 1M output tokens
    },
    'gpt-5-mini': {
      input: 0.30,   // $0.30 per 1M input tokens
      output: 1.20   // $1.20 per 1M output tokens
    },
    'gpt-4o-mini': {
      input: 0.15,   // $0.15 per 1M input tokens
      output: 0.60   // $0.60 per 1M output tokens
    }
  },
  anthropic: {
    'claude-3-haiku': {
      input: 0.80,   // $0.80 per 1M input tokens
      output: 4.00   // $4.00 per 1M output tokens
    },
    'claude-3.5-haiku': {
      input: 1.00,   // $1.00 per 1M input tokens
      output: 5.00   // $5.00 per 1M output tokens
    }
  },
  openrouter: {
    // OpenRouter tiene markup, precios aproximados
    'google/gemini-2.5-flash': {
      input: 0.054,  // Con markup de OpenRouter
      output: 0.216
    },
    'mistralai/mistral-small': {
      input: 1.00,
      output: 3.00
    }
  }
} as const;

/**
 * Calcula el costo de una conversación basado en tokens usados
 */
export function calculateCost(
  provider: string,
  model: string,
  usage: TokenUsage
): CostCalculation {
  // Normalizar nombres de proveedor
  const normalizedProvider = provider.toLowerCase();
  
  // Obtener pricing para el proveedor
  const providerPricing = PRICING_TABLE[normalizedProvider as keyof typeof PRICING_TABLE];
  
  if (!providerPricing) {
    console.warn(`⚠️ Pricing no encontrado para proveedor: ${provider}`);
    return {
      inputCost: 0,
      outputCost: 0,
      totalCost: 0,
      provider,
      model
    };
  }

  // Buscar el modelo específico o usar el más cercano
  let modelPricing = providerPricing[model as keyof typeof providerPricing];
  
  // Fallback para modelos no encontrados
  if (!modelPricing) {
    // Buscar modelo por prefijo
    const modelKeys = Object.keys(providerPricing);
    const matchingModel = modelKeys.find(key => 
      model.includes(key.replace('claude-', '').replace('gpt-', ''))
    );
    
    if (matchingModel) {
      modelPricing = providerPricing[matchingModel as keyof typeof providerPricing];
      console.log(`📊 Usando pricing de ${matchingModel} para modelo ${model}`);
    } else {
      console.warn(`⚠️ Pricing no encontrado para modelo: ${model} en proveedor ${provider}`);
      return {
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        provider,
        model
      };
    }
  }

  // Calcular costos (convertir de "por 1M tokens" a costo real)
  const inputCost = (usage.inputTokens / 1_000_000) * modelPricing.input;
  const outputCost = (usage.outputTokens / 1_000_000) * modelPricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    provider: normalizedProvider,
    model
  };
}

/**
 * Obtiene el pricing para un modelo específico
 */
export function getModelPricing(provider: string, model: string) {
  const normalizedProvider = provider.toLowerCase();
  const providerPricing = PRICING_TABLE[normalizedProvider as keyof typeof PRICING_TABLE];
  
  if (!providerPricing) return null;
  
  return providerPricing[model as keyof typeof providerPricing] || null;
}

/**
 * Lista todos los modelos disponibles con pricing
 */
export function getAvailableModels() {
  const models: Array<{provider: string, model: string, pricing: any}> = [];
  
  for (const [provider, providerModels] of Object.entries(PRICING_TABLE)) {
    for (const [model, pricing] of Object.entries(providerModels)) {
      models.push({ provider, model, pricing });
    }
  }
  
  return models;
}