# OpenAI Token Consumption & Tracking Documentation

## Overview
Este documento detalla los patrones especiales de consumo de tokens de OpenAI y cómo se realiza el tracking en la plataforma Formmy.

## Arquitectura de Token Tracking

### Proveedores Soportados
1. **OpenAI Direct** (`gpt-5-nano`, `gpt-5-mini`, `gpt-5`)
2. **Anthropic Direct** (`claude-3-haiku`, `claude-3.5-haiku`)  
3. **OpenRouter** (`google/gemini-2.5-flash`, etc.)

### Diferencias en Property Names
Cada proveedor utiliza diferentes nombres de propiedades para tokens:

```typescript
// OpenAI API Response
{
  usage: {
    prompt_tokens: 150,
    completion_tokens: 85,
    total_tokens: 235
  }
}

// Anthropic API Response  
{
  usage: {
    input_tokens: 150,
    output_tokens: 85
  }
}

// OpenRouter API Response (variable según modelo)
{
  usage: {
    prompt_tokens: 150,    // o input_tokens
    completion_tokens: 85,  // o output_tokens
    total_tokens: 235
  }
}
```

### Normalización de Propiedades
**Estándar interno:** Todos los proveedores normalizan a:
```typescript
{
  usage: {
    inputTokens: number,   // tokens de entrada
    outputTokens: number,  // tokens de salida 
    totalTokens: number    // suma total
  }
}
```

## GPT-5 Family: Características Especiales

### GPT-5 Nano
- **Modelo principal**: Más económico ($0.05/$0.40 por 1M tokens)
- **Context Window**: 32K tokens
- **Parámetros especiales**:
  ```typescript
  {
    max_completion_tokens: tokens, // NO max_tokens
    reasoning_effort: "minimal",   // Sin reasoning tokens
    verbosity: "low"              // Respuestas concisas
  }
  ```

### Temperature Restrictions
```typescript
// GPT-5 models NO soportan temperature
const requestBody = {
  model: 'gpt-5-nano',
  // temperature: 0.7  // ❌ PROHIBIDO
  // Otros parámetros...
}

// GPT-4 y anteriores SÍ soportan
const requestBody = {
  model: 'gpt-4o-mini', 
  temperature: 0.7  // ✅ PERMITIDO
}
```

## Streaming vs Non-Streaming Token Tracking

### Non-Streaming
```typescript
// Tokens disponibles inmediatamente en la respuesta
const result = await provider.chatCompletion(request);
const tokens = {
  inputTokens: result.usage.inputTokens,
  outputTokens: result.usage.outputTokens,
  totalTokens: result.usage.totalTokens
}
```

### Streaming 
```typescript
// Tokens solo disponibles en el chunk final
const stream = await provider.chatCompletionStream(request);

for await (const chunk of stream) {
  if (chunk.finishReason && chunk.usage) {
    // Solo aquí tenemos los tokens finales
    const tokens = chunk.usage;
  }
}
```

**Problema identificado**: OpenAI streaming no retornaba tokens en chunks finales.

## Implementación de Tracking en BD

### Schema de Mensaje
```typescript
// Prisma Message Model
{
  tokens: number,        // Total tokens (legacy)
  inputTokens: number,   // Input tokens específicos  
  outputTokens: number,  // Output tokens específicos
  totalCost: number,     // Costo calculado en USD
  provider: string,      // 'openai', 'anthropic', 'openrouter'
  aiModel: string       // Modelo específico usado
}
```

### Cálculo de Costos
```typescript
function calculateCost(provider: string, model: string, usage: TokenUsage) {
  const pricing = {
    'gpt-5-nano': { 
      input: 0.05,        // Input tokens regular
      cachedInput: 0.005, // Cached input tokens (90% descuento!)
      output: 0.40 
    },
    'gpt-5-mini': { input: 0.25, output: 2.00 },
    'claude-3-haiku': { input: 0.25, output: 1.25 }
  };
  
  const modelPricing = pricing[model];
  
  // Para GPT-5-nano, separar cached vs regular input tokens
  if (model === 'gpt-5-nano' && usage.cachedTokens) {
    const regularInputTokens = usage.inputTokens - usage.cachedTokens;
    const inputCost = (regularInputTokens / 1000000) * modelPricing.input;
    const cachedCost = (usage.cachedTokens / 1000000) * modelPricing.cachedInput;
    const outputCost = (usage.outputTokens / 1000000) * modelPricing.output;
    
    return {
      totalCost: inputCost + cachedCost + outputCost,
      breakdown: {
        inputCost,
        cachedCost,
        outputCost,
        savingsFromCache: (usage.cachedTokens / 1000000) * (modelPricing.input - modelPricing.cachedInput)
      },
      provider: normalizeProviderName(provider)
    };
  }
  
  // Fallback para otros modelos
  const inputCost = (usage.inputTokens / 1000000) * modelPricing.input;
  const outputCost = (usage.outputTokens / 1000000) * modelPricing.output;
  
  return {
    totalCost: inputCost + outputCost,
    provider: normalizeProviderName(provider)
  };
}
```

## Issues Conocidos & Soluciones

### ❌ Issue: Tokens = 0 en Admin Dashboard
**Causa**: Property name mismatch en OpenAI provider
```typescript
// ❌ ANTES - Incorrecto
return {
  usage: {
    promptTokens: result.usage?.prompt_tokens || 0,     // ❌
    completionTokens: result.usage?.completion_tokens || 0  // ❌
  }
}

// ✅ DESPUÉS - Correcto
return {
  usage: {
    inputTokens: result.usage?.prompt_tokens || 0,      // ✅
    outputTokens: result.usage?.completion_tokens || 0  // ✅
  }
}
```

### ❌ Issue: Streaming Sin Token Tracking
**Causa**: OpenAI streaming no implementaba usage tracking
**Solución**: Implementar tracking en chunk final

### ❌ Issue: GPT-5 Empty Responses
**Causa**: `max_tokens` no compatible con GPT-5
**Solución**: Usar `max_completion_tokens` para GPT-5 family

## Monitoring & Debugging

### Console Logs
```typescript
// Token tracking logs
console.log(`💾 Mensajes guardados - Tokens: ${totalTokens} | Costo: $${totalCost.toFixed(6)} (${provider})`);

// Provider-specific logs  
console.log(`🔍 [OpenAI Request] Model: ${model}, Tokens: ${smartMaxTokens}`);
```

### Admin Dashboard Queries
```sql
-- Top modelos por costo (últimos 30 días)
SELECT aiModel, provider, 
       SUM(inputTokens) as total_input,
       SUM(outputTokens) as total_output,
       SUM(totalCost) as total_cost
FROM Message 
WHERE createdAt >= NOW() - INTERVAL 30 DAY
GROUP BY aiModel, provider
ORDER BY total_cost DESC;
```

### Métricas de Performance
- **Input/Output Ratio**: Detectar queries con contexto excesivo
- **Cost per Conversation**: Optimizar modelos por conversación 
- **Token Efficiency**: Comparar tokens vs calidad de respuesta

## Best Practices

### 1. Smart Token Calculation
```typescript
// Calcular tokens según contexto para evitar waste
function calculateSmartTokens(messages: ChatMessage[], model: string): number {
  const lastMessage = messages[messages.length - 1]?.content || '';
  const isShortQuery = lastMessage.length < 50;
  
  // Adjustar según tipo de consulta
  if (isShortQuery) return 200;
  if (isExplanationRequest) return 500; 
  return 350; // Default
}
```

### 2. Context Window Management  
```typescript
// GPT-5 tiene 32K context, aprovechar eficientemente
const maxContextWindow = model.startsWith('gpt-5') ? 32000 : 4096;
const availableTokens = maxContextWindow - totalContextTokens - 200;
```

### 3. Provider Fallback Strategy
```typescript
// Fallback automático si provider falla
try {
  return await openaiProvider.chatCompletion(request);
} catch (error) {
  console.warn('OpenAI failed, falling back to Anthropic');
  return await anthropicProvider.chatCompletion(request);
}
```

## Cache Optimization Strategy

### GPT-5-nano Cached Input Tokens
**Ahorro masivo**: Cached input tokens cuestan $0.005 vs $0.05 (90% descuento)

```typescript
interface TokenUsage {
  inputTokens: number;      // Regular input tokens
  cachedTokens?: number;    // Cached input tokens (GPT-5-nano)
  outputTokens: number;
  totalTokens: number;
}
```

### Estrategias para Maximizar Cache Hits
1. **Conversaciones largas**: Mantener contexto para aprovechar cache
2. **System prompts consistentes**: Reusar mismo prompt base
3. **Context window inteligente**: No truncar conversaciones prematuramente
4. **Session continuity**: Mantener sessionId para cache persistence

### Potential Savings Calculator
```typescript
// Ejemplo: 1000 tokens cached en lugar de regular
const regularCost = (1000 / 1000000) * 0.05;   // $0.00005
const cachedCost = (1000 / 1000000) * 0.005;   // $0.000005
const savings = regularCost - cachedCost;       // $0.000045 (90% ahorro)

// En escala: 1M tokens/mes
const monthlySavings = savings * 1000;          // $45/mes por cada 1M tokens cached
```

### Cache Hit Rate Monitoring
```typescript
// Tracking recomendado para optimización
interface CacheMetrics {
  totalInputTokens: number;
  cachedInputTokens: number;
  cacheHitRate: number;     // cachedTokens / totalInputTokens
  monthlySavings: number;   // Dinero ahorrado por cache
}
```

## ROI Impact

### Cost Optimization Results
- **GPT-5 Nano adoption**: Ahorro ~$36K USD/año
- **Smart token calculation**: 15-30% reducción en waste
- **Provider consolidation**: 90% reducción en markup costs

### Business Metrics
```typescript
// Profit margins por modelo
const profitMargins = {
  'gpt-5-nano': '99%',      // Modelo principal
  'claude-3-haiku': '97%',  // Premium tier
  'gemini-2.5-flash': '95%' // Futuro directo
};
```

Esta arquitectura permite escalabilidad horizontal agregando nuevos proveedores sin romper el tracking de tokens existente.