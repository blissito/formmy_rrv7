# Formmy Observability - Cheatsheet Enterprise

**Última actualización**: 2025-12-27
**Status**: Sistema construido, instrumentación parcial
**Demo Ready**: En progreso

---

## 1. ARQUITECTURA DE TRAZABILIDAD

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FORMMY OBSERVABILITY                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌──────────────┐    ┌─────────────────────┐    │
│  │ Widget Chat │───▶│ /chat/vercel │───▶│ TraceContext        │    │
│  │ (Frontend)  │    │ /public      │    │ - startTrace()      │    │
│  └─────────────┘    └──────────────┘    │ - startSpan()       │    │
│                                         │ - endSpan()         │    │
│  ┌─────────────┐    ┌──────────────┐    │ - endTrace()        │    │
│  │ WhatsApp    │───▶│ Webhook API  │───▶│                     │    │
│  │ (Meta API)  │    │              │    └──────────┬──────────┘    │
│  └─────────────┘    └──────────────┘               │               │
│                                                    ▼               │
│                     ┌──────────────────────────────────────────┐   │
│                     │              MongoDB                      │   │
│                     │  ┌─────────┐ ┌───────┐ ┌────────────┐    │   │
│                     │  │  Trace  │ │ Span  │ │ TraceEvent │    │   │
│                     │  └─────────┘ └───────┘ └────────────┘    │   │
│                     └──────────────────────────────────────────┘   │
│                                        │                           │
│                                        ▼                           │
│                     ┌──────────────────────────────────────────┐   │
│                     │         Dashboard Observability          │   │
│                     │  /dashboard/api-keys?tab=observability   │   │
│                     │  ┌─────────┐ ┌────────────┐ ┌─────────┐  │   │
│                     │  │ Metrics │ │ Trace List │ │Waterfall│  │   │
│                     │  └─────────┘ └────────────┘ └─────────┘  │   │
│                     └──────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. MODELOS DE DATOS

### Trace (Conversación completa)
```typescript
{
  id: ObjectId,
  chatbotId: ObjectId,
  conversationId: ObjectId,
  userId: ObjectId,

  input: string,      // Mensaje del usuario
  output: string,     // Respuesta final del bot

  status: "RUNNING" | "COMPLETED" | "ERROR",
  startTime: DateTime,
  endTime: DateTime,
  durationMs: number,

  model: string,      // "gpt-4o-mini", "claude-3-5-haiku"
  totalTokens: number,
  totalCost: number,  // USD
  creditsUsed: number,

  metadata: JSON,     // Tags, environment, etc.
}
```

### Span (Operación individual)
```typescript
{
  id: ObjectId,
  traceId: ObjectId,
  parentSpanId?: ObjectId,  // Para spans anidados

  type: "LLM_CALL" | "TOOL_CALL" | "RAG_SEARCH" | "EMBEDDING",
  name: string,       // "gpt-4o-mini", "search_context", etc.

  startTime: DateTime,
  endTime: DateTime,
  durationMs: number,

  input: JSON,
  output: JSON,

  tokens?: number,
  cost?: number,
  credits?: number,

  status: "RUNNING" | "COMPLETED" | "ERROR",
  error?: string,
}
```

### TraceEvent (Eventos discretos)
```typescript
{
  id: ObjectId,
  traceId: ObjectId,

  type: "TOOL_START" | "TOOL_END" | "WIDGET_DETECTED" | "SOURCE_FOUND" | "ERROR",
  name: string,
  data: JSON,
  timestamp: DateTime,
}
```

---

## 3. API DE INSTRUMENTACIÓN

### Ciclo de Vida Completo

```typescript
import { startTrace, endTrace, startSpan, endSpan, recordEvent } from "@/server/tracing/instrumentation";

// 1. INICIAR TRACE
const ctx = await startTrace({
  userId: user.id,
  chatbotId: chatbot.id,
  conversationId: conversation.id,
  input: userMessage,
  model: "gpt-4o-mini",
});

try {
  // 2. SPAN: Búsqueda RAG
  const ragSpanId = await startSpan(ctx, {
    type: "RAG_SEARCH",
    name: "search_context",
    input: { query: userMessage },
  });

  const ragResults = await searchContext(userMessage);

  await endSpan(ctx, ragSpanId, {
    output: { resultsCount: ragResults.length },
    credits: 2,
  });

  // 3. EVENTO: Widget detectado
  await recordEvent(ctx, {
    type: "WIDGET_DETECTED",
    name: "product-card",
    data: { productName: "Widget Pro" },
  });

  // 4. SPAN: LLM Call
  const llmSpanId = await startSpan(ctx, {
    type: "LLM_CALL",
    name: "gpt-4o-mini",
    input: { messages: allMessages },
  });

  const response = await streamText({ ... });

  await endSpan(ctx, llmSpanId, {
    output: { text: response },
    tokens: usage.totalTokens,
    cost: estimateCost("gpt-4o-mini", usage.totalTokens),
  });

  // 5. FINALIZAR TRACE
  await endTrace(ctx, {
    output: response,
    totalTokens: usage.totalTokens,
    totalCost: totalCost,
    creditsUsed: creditsUsed,
  });

} catch (error) {
  // Error handling
  await failTrace(ctx, error.message);
}
```

### Helpers de Alto Nivel

```typescript
// instrumentLLMCall - Wrapper conveniente
const llm = await instrumentLLMCall(ctx, {
  model: "gpt-4o-mini",
  temperature: 0.7,
});
// ... hacer llamada LLM ...
await llm.complete({
  output: response,
  tokens: usage.totalTokens,
});

// instrumentToolCall - Para tools
const tool = await instrumentToolCall(ctx, {
  toolName: "search_context",
  input: { query },
});
// ... ejecutar tool ...
await tool.complete({
  result: results,
  credits: 2,
});

// instrumentRAGSearch - Para búsquedas
const rag = await instrumentRAGSearch(ctx, { query });
// ... buscar ...
await rag.complete({
  sources_count: results.length,
  credits: 2,
});
```

---

## 4. ESTÁNDARES SEGUIDOS

### OpenTelemetry (Parcial)

| Aspecto | Status | Notas |
|---------|--------|-------|
| Context Propagation | ✅ | `TraceContext` class |
| Span Lifecycle | ✅ | start/end pattern |
| Semantic Conventions GenAI | ✅ | Referencias en código |
| OTEL Libraries | ❌ | Implementación custom |
| OTEL Collector Export | ❌ | TODO |

**Atributos Semánticos Capturados**:
- `gen_ai.system` (openai, anthropic)
- `gen_ai.request.model`
- `gen_ai.request.temperature`
- `gen_ai.usage.input_tokens`
- `gen_ai.usage.output_tokens`

### Langfuse / LangSmith

| Servicio | Status | Notas |
|----------|--------|-------|
| Langfuse | 🔶 | Tipos compatibles, exporter listo |
| LangSmith | ❌ | No integrado |
| Exporters | 🔶 | JSON + Langfuse format |

---

## 5. API ENDPOINTS

### Listar Traces
```bash
GET /api/v1/traces?intent=list&chatbotId=XXX&limit=50&offset=0

Response:
{
  "success": true,
  "traces": [
    {
      "id": "...",
      "input": "Cuánto cuesta el producto X?",
      "output": "El producto X cuesta $299...",
      "status": "COMPLETED",
      "durationMs": 1234,
      "totalTokens": 500,
      "model": "gpt-4o-mini",
      "spans": [...]
    }
  ],
  "total": 150
}
```

### Obtener Trace Detallado
```bash
GET /api/v1/traces?intent=get&traceId=XXX

Response:
{
  "success": true,
  "trace": {
    "id": "...",
    "spans": [
      {
        "type": "RAG_SEARCH",
        "name": "search_context",
        "durationMs": 234,
        "input": { "query": "..." },
        "output": { "resultsCount": 3 }
      },
      {
        "type": "LLM_CALL",
        "name": "gpt-4o-mini",
        "durationMs": 890,
        "tokens": 450
      }
    ],
    "events": [...]
  }
}
```

### Estadísticas
```bash
GET /api/v1/traces?intent=stats&chatbotId=XXX&period=7

Response:
{
  "success": true,
  "stats": {
    "total": 450,
    "completed": 420,
    "errors": 30,
    "errorRate": 6.67,
    "avgLatency": 1245,
    "totalTokens": 225000,
    "totalCost": 0.0337
  }
}
```

### Exportar
```bash
GET /api/v1/traces?intent=export&traceId=XXX&format=json

# format=otel → TODO (OpenTelemetry format)
```

---

## 6. UI DASHBOARD

**URL**: `/dashboard/api-keys?tab=observability`

### Métricas (Cards)
- Total Traces
- Avg Latency (ms)
- Total Tokens
- Error Rate (%)

### Filtros
- Selector de Chatbot
- Búsqueda por input/output

### Tabla de Traces
| Timestamp | Chatbot | Input | Status | Duration | Tokens | Model |
|-----------|---------|-------|--------|----------|--------|-------|
| Click para expandir y ver TraceWaterfall |

### TraceWaterfall (Expandido)
```
Timeline visual:
├── RAG_SEARCH (234ms) ✅
│   └── search_context: 3 resultados
├── LLM_CALL (890ms) ✅
│   └── gpt-4o-mini: 450 tokens
└── Total: 1124ms
```

---

## 7. PRICING INTERNO (Estimados)

```typescript
// server/tracing/instrumentation.ts

const MODEL_COSTS = {
  "gpt-4o-mini": 0.00015,    // $0.15/1M tokens
  "gpt-4o": 0.0025,          // $2.50/1M tokens
  "claude-3-5-haiku": 0.0008, // $0.80/1M tokens
  "claude-3-5-sonnet": 0.003, // $3.00/1M tokens
};

function estimateCost(model: string, tokens: number): number {
  const costPerToken = MODEL_COSTS[model] || 0.00015;
  return tokens * costPerToken;
}
```

---

## 8. STATUS DE INSTRUMENTACIÓN

### Endpoints Instrumentados
| Endpoint | Status | Prioridad |
|----------|--------|-----------|
| `/dashboard/api-keys` (lectura) | ✅ | - |
| `/api/v1/traces` | ✅ | - |

### Endpoints Instrumentados (Producción)
| Endpoint | Status | Notas |
|----------|--------|-------|
| `/chat/vercel/public` | ✅ | Widget embebido |
| WhatsApp Webhook | ✅ | Mensajes de texto |
| `/chat/vercel` (Ghosty) | ❌ TODO | Media prioridad |

---

## 9. CHECKLIST PARA DEMO ENTERPRISE

### Mínimo Viable
- [x] Instrumentar `/chat/vercel/public`
- [x] Instrumentar WhatsApp webhook
- [x] Link a conversación desde traces
- [ ] Verificar que traces aparecen en dashboard
- [ ] Verificar waterfall visualization
- [ ] Probar con producto + galería artifacts

### Nice to Have
- [x] Exportar JSON funcional
- [ ] Agregar eventos de artifacts (`WIDGET_DETECTED`)
- [ ] Métricas por período (7d, 30d)

### Langfuse Ready
- [x] Tipos compatibles con Langfuse
- [x] Exporter base implementado
- [x] Modelo Score para evaluaciones
- [ ] Conexión real a Langfuse API
- [ ] LLM-as-judge automático

### Futuro
- [ ] Export OpenTelemetry formato
- [ ] Alertas de errores
- [ ] Comparación A/B de prompts
- [ ] Sessions (conversaciones agrupadas)

---

## 10. ARGUMENTOS DE VENTA (Internal Only)

### Lo que ya tenemos vs competencia

| Feature | Formmy | Chatbase | Botpress |
|---------|--------|----------|----------|
| Trace completo | ✅ | Básico | ❌ |
| Spans detallados | ✅ | ❌ | ❌ |
| Cost tracking | ✅ | ❌ | ❌ |
| Waterfall viz | ✅ | ❌ | ❌ |
| OpenTelemetry compat | 🔶 | ❌ | ❌ |

### Diferenciadores
1. **Visibilidad completa**: No solo "qué respondió" sino "cómo llegó a esa respuesta"
2. **Cost attribution**: Saber exactamente cuánto cuesta cada conversación
3. **Debug de artifacts**: Ver si el widget se mostró y con qué datos
4. **Evals ready**: Estructura para hacer evaluaciones automáticas

### Limitaciones honestas (no mencionar a cliente)
1. No integra con Langfuse/LangSmith todavía
2. Export OTEL no implementado
3. Alertas no implementadas
4. Sin A/B testing de prompts

---

## 11. QUICK REFERENCE

### Archivos Clave
```
server/tracing/
├── trace.service.ts      # CRUD operations (431 líneas)
├── instrumentation.ts    # API de instrumentación (361 líneas)

app/routes/
├── api.v1.traces.ts      # API endpoints
├── dashboard.api-keys_.tsx  # UI con tab Observability

app/components/
├── ObservabilityPanel.tsx  # Panel principal (336 líneas)
├── TraceWaterfall.tsx      # Visualización spans (244 líneas)

prisma/schema.prisma        # Modelos Trace, Span, TraceEvent (líneas 697-860)
```

### Imports Rápidos
```typescript
// Instrumentación
import { startTrace, endTrace, startSpan, endSpan, recordEvent } from "@/server/tracing/instrumentation";

// Service (CRUD directo)
import { createTrace, completeTrace, listTraces, getTraceStats } from "@/server/tracing/trace.service";
```

---

## 12. INTEGRACIÓN LANGFUSE (Preparado)

### Archivos Creados

```
server/tracing/
├── langfuse-types.ts     # Tipos compatibles + conversión
```

```
prisma/schema.prisma
├── Score                 # Evaluaciones (Langfuse-compatible)
├── ScoreConfig           # Configuración de evaluadores
├── ScoreSource (enum)    # MANUAL, API, EVAL, FEEDBACK
├── ScoreDataType (enum)  # NUMERIC, CATEGORICAL, BOOLEAN
```

### Tipos Compatibles

```typescript
// server/tracing/langfuse-types.ts

interface LangfuseTrace {
  id: string;
  name?: string;
  userId?: string;
  sessionId?: string;  // Agrupa conversaciones
  input?: unknown;
  output?: unknown;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

interface LangfuseScore {
  traceId: string;
  name: string;        // "faithfulness", "relevancy", etc.
  value: number;       // 0-1 normalized
  source?: "API" | "ANNOTATION" | "EVAL";
  comment?: string;
}
```

### Conversión Formmy → Langfuse

```typescript
import { toLangfuseTrace, toFullLangfuseExport } from "@/server/tracing/langfuse-types";

// Convertir trace individual
const langfuseTrace = toLangfuseTrace(formmyTrace);

// Exportar trace completo con spans y scores
const fullExport = toFullLangfuseExport(traceWithSpans, scores);
```

### Para Activar Integración Real

1. Instalar SDK: `npm install langfuse`
2. Configurar keys en `.env`:
   ```
   LANGFUSE_PUBLIC_KEY=pk-xxx
   LANGFUSE_SECRET_KEY=sk-xxx
   LANGFUSE_HOST=https://cloud.langfuse.com
   ```
3. Descomentar código en `LangfuseExporter.exportTrace()`
4. Llamar exporter en `onFinish` de endpoints

### Modelo Score (Prisma)

```prisma
model Score {
  id            String        @id
  traceId       String        @db.ObjectId
  spanId        String?       @db.ObjectId

  name          String        // "faithfulness", "relevancy"
  value         Float         // 0-1 para normalized
  stringValue   String?       // Para categorical
  comment       String?       // Anotación humana

  source        ScoreSource   // MANUAL, EVAL, FEEDBACK
  dataType      ScoreDataType // NUMERIC, CATEGORICAL, BOOLEAN

  evaluatorModel  String?     // Para LLM-as-judge
  evaluatorPrompt String?
}
```

### Flujo de Evaluación (Futuro)

```
1. Trace completado
   ↓
2. ScoreConfig detecta evaluador automático
   ↓
3. LLM-as-judge evalúa (faithfulness, relevancy)
   ↓
4. Score guardado en DB
   ↓
5. Opcional: Exportar a Langfuse
```

---

**Documento interno - No compartir con cliente**
