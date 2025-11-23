# Tracking de Tokens y Costos con Vercel AI SDK

## Resumen

Se implementó tracking completo de tokens, costos y métricas en los endpoints que usan Vercel AI SDK (`/chat.vercel.public.tsx` y `/chat.vercel.tsx`).

## Cambios Implementados

### 1. Helper `getModelInfo()` (`server/config/vercel.model.providers.ts`)

Función que retorna provider y model string para tracking, usando la misma fuente de verdad que `mapModel()`:

```typescript
export const getModelInfo = (modelName: string): { provider: string; model: string } => {
  switch (modelName) {
    case "claude-sonnet-4-5":
      return { provider: "anthropic", model: "claude-sonnet-4-5-20250929" };
    case "claude-haiku-4-5":
      return { provider: "anthropic", model: "claude-haiku-4-5-20251001" };
    case "gemini-3-pro":
      return { provider: "google", model: "gemini-2.5-flash-lite" };
    case "gpt-5-nano":
      return { provider: "openai", model: "gpt-4o-mini" };
    default:
      return { provider: "openai", model: "gpt-4.1-mini" };
  }
};
```

### 2. Endpoint Público - `/chat.vercel.public.tsx`

**Tracking implementado en `onFinish` callback de `streamText()`**:

```typescript
const result = streamText({
  model: mapModel(chatbot.aiModel),
  messages: convertToModelMessages(allMessages),
  system: systemPrompt,
  tools: { ... },
  stopWhen: stepCountIs(5),
  // ✅ TRACKING
  onFinish: async ({ text, totalUsage, finishReason }) => {
    const inputTokens = totalUsage?.promptTokens || 0;
    const outputTokens = totalUsage?.completionTokens || 0;
    const totalTokens = totalUsage?.totalTokens || 0;

    const { provider, model } = getModelInfo(chatbot.aiModel);
    const costResult = calculateCost(provider, model, {
      inputTokens,
      outputTokens,
      cachedTokens: 0,
    });

    const responseTime = Date.now() - startTime;

    await addAssistantMessage(
      conversation.id,
      text,
      totalTokens,
      responseTime,
      undefined, // firstTokenLatency
      model,
      "web",
      undefined, // externalMessageId
      inputTokens,
      outputTokens,
      costResult.totalCost,
      provider,
      0 // cachedTokens
    );

    console.log(
      `[Chat Public] ✅ Message tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)} (${provider}/${model})`
    );
  },
});

return result.toUIMessageStreamResponse({
  originalMessages: allMessages,
});
```

**Métricas guardadas**:
- ✅ `inputTokens` - Tokens de entrada
- ✅ `outputTokens` - Tokens de salida
- ✅ `totalTokens` - Total (legacy)
- ✅ `totalCost` - Costo en USD
- ✅ `provider` - "openai", "anthropic", "google"
- ✅ `aiModel` - Modelo específico
- ✅ `responseTime` - Tiempo de respuesta en ms
- ⚠️ `cachedTokens` - No disponible en Vercel AI SDK aún
- ⚠️ `firstTokenLatency` - No disponible en Vercel AI SDK aún

### 3. Endpoint Ghosty - `/chat.vercel.tsx`

**Tracking implementado** (solo logs, no persiste en DB):

```typescript
const result = streamText({
  model: openai("gpt-4.1-mini-2025-04-14"),
  messages: convertToModelMessages(messages),
  system: `...`,
  tools: { ... },
  stopWhen: stepCountIs(5),
  // ✅ TRACKING
  onFinish: async ({ text, totalUsage, finishReason }) => {
    const inputTokens = totalUsage?.promptTokens || 0;
    const outputTokens = totalUsage?.completionTokens || 0;
    const totalTokens = totalUsage?.totalTokens || 0;

    const provider = "openai";
    const model = "gpt-4.1-mini-2025-04-14";

    const costResult = calculateCost(provider, model, {
      inputTokens,
      outputTokens,
      cachedTokens: 0,
    });

    const responseTime = Date.now() - startTime;

    console.log(
      `[Ghosty] ✅ Response tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)} (${provider}/${model}), ${responseTime}ms`
    );
  },
});

return result.toUIMessageStreamResponse();
```

**Nota**: Ghosty NO guarda conversaciones en DB, solo logs para debugging.

## Callbacks Disponibles en Vercel AI SDK

### `streamText()` - onFinish callback

```typescript
onFinish?: StreamTextOnFinishCallback<TOOLS>;

type StreamTextOnFinishCallback<TOOLS> = (event: StepResult<TOOLS> & {
  readonly steps: StepResult<TOOLS>[];
  readonly totalUsage: LanguageModelUsage;
}) => PromiseLike<void> | void;

// ✅ Recibe totalUsage con:
// - promptTokens
// - completionTokens
// - totalTokens
```

### `toUIMessageStreamResponse()` - onFinish callback

```typescript
onFinish?: UIMessageStreamOnFinishCallback<UI_MESSAGE>;

type UIMessageStreamOnFinishCallback<UI_MESSAGE> = (event: {
  messages: UI_MESSAGE[];
  isContinuation: boolean;
  isAborted: boolean;
  responseMessage: any; // El mensaje enviado al cliente
}) => void;

// ❌ NO recibe usage ni finishReason
```

**IMPORTANTE**: Para tracking de tokens, usar el callback `onFinish` de `streamText()`, NO el de `toUIMessageStreamResponse()`.

## Servicios Utilizados

### 1. `getModelInfo()` - Detección de provider y modelo

```typescript
import { getModelInfo } from "@/server/config/vercel.model.providers";

const { provider, model } = getModelInfo(chatbot.aiModel);
// provider: "openai" | "anthropic" | "google"
// model: "gpt-4o-mini" | "claude-sonnet-4-5-20250929" | "gemini-2.5-flash-lite"
```

### 2. `calculateCost()` - Cálculo de costos

```typescript
import { calculateCost } from "@/server/chatbot/pricing.server";

const costResult = calculateCost(provider, model, {
  inputTokens,
  outputTokens,
  cachedTokens,
});
// costResult.inputCost, costResult.outputCost, costResult.totalCost
```

### 3. `addAssistantMessage()` - Persistencia

```typescript
import { addAssistantMessage } from "@/server/chatbot/messageModel.server";

await addAssistantMessage(
  conversationId,
  textContent,
  totalTokens,
  responseTime,
  firstTokenLatency,
  aiModel,
  channel,
  externalMessageId,
  inputTokens,
  outputTokens,
  totalCost,
  provider,
  cachedTokens
);
```

## Testing

### Script de prueba

```bash
npx tsx scripts/test-tracking.ts
```

Verifica:
- ✅ Schema de Message con campos de tracking
- ✅ getModelInfo() funcionando
- ✅ calculateCost() funcionando
- ✅ Mensajes recientes con tracking completo
- ✅ Estadísticas agregadas por chatbot
- ✅ Breakdown por provider

### Probar en producción

1. **Crear conversación de prueba** en widget embebido
2. **Verificar logs** en consola:
   ```
   [Chat Public] ✅ Message tracked: 150 tokens, $0.000068 (openai/gpt-4o-mini)
   ```

3. **Verificar en DB**:
   ```bash
   # Mensajes recientes con tracking
   db.message.find({
     conversationId: "...",
     role: "ASSISTANT",
     inputTokens: { $ne: null }
   }).sort({ createdAt: -1 }).limit(5)
   ```

4. **Verificar en Admin Panel**:
   - `/dashboard/api-keys?tab=observability`
   - Ver métricas de tokens y costos

## Admin Panel

### Observability Panel

**URL**: `/dashboard/api-keys?tab=observability`

**Datos mostrados**:
- Lista de traces recientes
- Métricas agregadas (últimos 7 días):
  - Latencia promedio
  - Tokens totales
  - Costos totales
  - Error rate
- Filtros por chatbot
- Expansión de traces individuales con spans

### Cost Metrics API

**Endpoint**: `POST /api/v1/cost-metrics`

```json
{
  "chatbotId": "...",
  "startDate": "2025-11-01",
  "endDate": "2025-11-23",
  "scope": "chatbot"
}
```

**Response**:
```json
{
  "totalCost": 2.45,
  "totalTokens": 150000,
  "totalInputTokens": 100000,
  "totalOutputTokens": 50000,
  "costByProvider": [
    { "provider": "openai", "totalCost": 1.20, "totalTokens": 80000 },
    { "provider": "anthropic", "totalCost": 1.25, "totalTokens": 70000 }
  ],
  "costByModel": [...],
  "dailyCosts": [...]
}
```

## Comparación: Sistema Legacy vs Vercel AI SDK

| Feature | WhatsApp (Legacy) | Vercel AI SDK |
|---------|-------------------|---------------|
| Tracking tokens | ✅ Completo | ✅ **Implementado** |
| Cálculo costos | ✅ Automático | ✅ **Implementado** |
| Observability (Traces) | ✅ Completo | ⚠️ Solo logs |
| Cached tokens | ✅ GPT-5-nano | ❌ No disponible |
| First token latency | ✅ Medido | ❌ No disponible |
| Provider metadata | ✅ Guardado | ✅ **Implementado** |

## Limitaciones Conocidas

### 1. Cached Tokens

Vercel AI SDK **no expone** `cachedTokens` en el callback `onFinish`.

**Impacto**: No se puede calcular el descuento de 90% en cached tokens de GPT-5-nano.

**Workaround**: Por ahora se guarda `cachedTokens: 0`.

### 2. First Token Latency

Vercel AI SDK **no expone** el tiempo hasta el primer token.

**Impacto**: No se puede medir la latencia percibida por el usuario.

**Workaround**: Por ahora se guarda `undefined`.

### 3. Pricing de Modelos Nuevos

Si un modelo no está en `pricing.server.ts`, el costo será `$0.00`.

**Solución**: Agregar pricing manualmente cuando se agreguen nuevos modelos.

**Ejemplo visto**:
```
⚠️ Pricing no encontrado para modelo: gpt-4.1-mini-2025-04-14 en proveedor openai
```

Agregar en `server/chatbot/pricing.server.ts`:
```typescript
'gpt-4.1-mini-2025-04-14': {
  input: 0.05,  // por 1M tokens
  output: 0.20
}
```

## Próximos Pasos

### Opcional: Implementar Traces para Observabilidad

Descomentar código en `/chat.vercel.public.tsx`:

```typescript
// Dentro del onFinish callback
await createTrace({
  userId: chatbot.userId,
  chatbotId: chatbot.id,
  input: allMessages[allMessages.length - 1].content,
  model,
  totalTokens,
  totalCost: costResult.totalCost,
});
```

### Opcional: Tool Call Tracking

Implementar instrumentación de tool calls individuales usando `onStepFinish` callback.

## Referencias

- **Vercel AI SDK Docs**: https://sdk.vercel.ai/docs
- **Pricing Service**: `/server/chatbot/pricing.server.ts`
- **Model Providers**: `/server/config/vercel.model.providers.ts`
- **Message Model**: `/server/chatbot/messageModel.server.ts`
- **Cost Analytics**: `/server/chatbot/cost-analytics.server.ts`
