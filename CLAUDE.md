# Formmy - Context Esencial

**Stack**: React Router v7, Tailwind, Fly.io, Prisma, MongoDB, OpenRouter, Stripe
**URL**: https://formmy.app

## ⚠️ REGLAS CRÍTICAS

### 1. LlamaIndex Agent Workflows
```typescript
import { agent, runStream } from "@llamaindex/workflow";
const agentInstance = agent({ llm, tools, systemPrompt, memory });
```
❌ NO custom routing | ✅ Modelo decide tools

### 2. Memory - Historial
```typescript
import { createMemory, staticBlock } from "llamaindex";
const memory = createMemory({
  memoryBlocks: [staticBlock({ content: `Historial:\n\n${historyText}` })]
});
```
⚠️ **NUNCA `memory.add()`**

### 3. Streaming
✅ 100% streaming | ✅ Archivos: Buffer → Redis → `/api/ghosty/download/{id}`
❌ Filesystem (Fly.io efímero)

## Arquitectura

**Motor**: `/server/agent-engine-v0/simple-engine.ts`
**Agentes**: `/server/agents/` (ghosty, sales, content, data)
**Tools**: `/server/tools/` - Registry en `index.ts`

### Tool Credits
**Ubicación**: `/server/llamaparse/credits.service.ts`
- Sistema dual: Mensuales (reset mes) + Comprados (permanentes)
- Parser: COST_EFFECTIVE(1), AGENTIC(3), AGENTIC_PLUS(6) créditos/página

### RAG (Retrieval-Augmented Generation)
**Servicio**: `/server/context/unified-processor.server.ts`
**Index**: `vector_index_2` MongoDB | **Embeddings**: text-embedding-3-small
**Chunk**: 2000 chars, 100 overlap (5%)

**Tool**: `search_context` - Búsqueda semántica en knowledge base
**Handler**: `/server/tools/handlers/context-search.ts`
**Query Expansion**: `/server/vector/query-expansion.service.ts`

⚠️ **CRÍTICO - Tool Result Usage**:
LlamaIndex inyecta automáticamente los resultados de tools al contexto, PERO los modelos (especialmente gpt-4o-mini) pueden ignorarlos sin instrucciones explícitas en el system prompt.

**System Prompt Requirements** (`/server/agents/agent-workflow.server.ts:136-173`):
```typescript
// ✅ CORRECTO: Prompt imperativo que fuerza uso de resultados
CRITICAL - TOOL RESULTS ARE YOUR ANSWER:
When search_context() returns results, those results ARE the answer.
✅ COPY and PARAPHRASE the information from the tool output
✅ If tool says "Encontré X resultados" - READ THEM and answer based on them
❌ NEVER respond "I don't have information" if the tool returned results
```

**Flujo**:
1. Usuario pregunta → Agent llama `search_context()`
2. Tool ejecuta → Retorna "Encontré X resultados: [CONTENIDO]"
3. LlamaIndex inyecta resultados al contexto automáticamente
4. Modelo genera respuesta usando los resultados

❌ **ERROR COMÚN**: Prompt débil → Modelo ignora resultados del tool
✅ **SOLUCIÓN**: Prompt imperativo que ordena usar los resultados como fuente única de verdad

### Modelos
**Config**: `/server/config/model-temperatures.ts`
- GPT-4o-mini: 1.0 | GPT-5: 0.7 | Claude Haiku: 0.8

## Pricing

| Plan | $ | Bots | Conv | Credits | Voice |
|------|---|------|------|---------|-------|
| Starter | 149 | 1 | 50 | 200 | 50min |
| Pro | 499 | 10 | 250 | 1000 | 200min |
| Enterprise | 2490 | ∞ | 2500 | 5000 | 1000min |

## Integraciones

### WhatsApp
**Service**: `/server/integrations/whatsapp/WhatsAppSDKService.ts`
**Flow**: Meta Embedded Signup → tokens → Integration model
⚠️ Composio WhatsApp DEPRECADO

### Gmail (Composio)
**Config**: `/server/integrations/composio-config.ts`
**Entity**: `chatbot_${chatbotId}`
**Tools**: `send_gmail`, `read_gmail`

## Observabilidad ✅

**UI**: `/dashboard/api-keys?tab=observability`
**API**: `/api/v1/traces`
**Instrumentación**: `/server/agents/agent-workflow.server.ts`
**Service**: `/server/tracing/trace.service.ts`

Modelos `Trace`, `TraceSpan` - Tracking automático de LLM calls, tools, costos

## Email Campaigns & Notifications ✉️

**Worker**: `/server/jobs/workers/weekly-emails-worker.ts`
**Agenda**: Cron job - Lunes 9:00 AM (TZ: America/Mexico_City)
**Notifiers**: `/server/notifyers/` (12 templates)

### Email Transaccionales (Event-triggered)
- `welcome.ts` - Registro nuevo
- `pro.ts` - Upgrade de plan
- `planCancellation.ts` - Cancelación
- `notifyOwner.ts` - Nuevo mensaje formmy
- `reminder.ts` - Recordatorios programados
- `creditsPurchase.ts` - Compra de créditos
- `conversationsPurchase.ts` - Compra de conversaciones

### Email Automatizados (Weekly Cron)

#### 1. Free Trial Expiry (`freeTrial.ts`)
**Target**: Usuarios TRIAL sin chatbots creados (5-7 días inactivos)
**Límite**: ❌ Sin límite (basado en fecha de creación)

#### 2. No Usage (`noUsage.ts`) ⭐ **ACTUALIZADO**
**Target**: Usuarios Trial/Pro/Enterprise SIN chatbots creados
**Límite**: ✅ Máximo 3 emails por usuario
**Cooldown**: 7 días entre emails
**Tracking**: User model - `noUsageEmailsSent`, `lastNoUsageEmailAt`, `hasCreatedChatbot`

**Lógica** (`chatbotModel.server.ts:115-119`):
```typescript
// Al crear primer chatbot → marca permanente
await db.user.update({
  where: { id: userId },
  data: { hasCreatedChatbot: true } // ✅ NUNCA más recibirá email noUsage
});
```

**Comportamiento**:
- Usuario sin chatbots: Email semana 1 → 2 → 3 (máx 3)
- Usuario crea chatbot: ❌ Bloqueado permanente (incluso si elimina chatbot)
- Query filters: `hasCreatedChatbot: false`, `noUsageEmailsSent < 3`, cooldown 7 días

#### 3. Weekly Summary (`weekSummary.ts`)
**Target**: Usuarios con conversaciones en últimos 7 días
**Límite**: ❌ Sin límite (solo envía si hay actividad)

### Trial to FREE Conversion
**Worker**: `convertExpiredTrials()` - Ejecuta cada lunes
**Lógica**: Trial > 365 días → Convierte a FREE + Aplica restricciones

## ⚠️ TODOs Pendientes - MongoDB

### Error E11000 DuplicateKey - Indices Únicos Comentados

Durante migración Prisma (2025-01-11) se encontraron **datos duplicados** que impidieron crear índices únicos:

#### 1. Message Model (línea 423-424)
```typescript
// TODO: Resolver mensajes duplicados con externalMessageId null antes de habilitar
// @@unique([conversationId, externalMessageId])
```
**Problema**: Múltiples mensajes con `externalMessageId: null` en misma conversación
**Causa probable**: Mensajes internos sin ID externo de WhatsApp/Messenger

#### 2. DebouncedMessage Model (línea 943-944)
```typescript
// TODO: Limpiar duplicados antes de habilitar este constraint
// @@unique([messageId, phoneNumberId, type])
```
**Problema**: Mensaje WhatsApp duplicado detectado:
```
messageId: "wamid.HBgNNTIxNTU2NzA2MjYyORUCABIYFDNCMDREQzk1Njg3OEMzQzE4RDM4AA=="
phoneNumberId: "845237608662425"
type: "message"
```

**Causa probable**: Race condition en webhooks de WhatsApp (Meta envía duplicados simultáneos)

### Acciones Recomendadas

**Opción 1: Limpiar duplicados manualmente**
```javascript
// MongoDB shell - Encontrar duplicados en DebouncedMessage
db.DebouncedMessage.aggregate([
  {
    $group: {
      _id: { messageId: "$messageId", phoneNumberId: "$phoneNumberId", type: "$type" },
      count: { $sum: 1 },
      ids: { $push: "$_id" }
    }
  },
  { $match: { count: { $gt: 1 } } }
])

// Eliminar duplicados (mantener solo el más reciente)
```

**Opción 2: Vaciar tabla temporal** (DebouncedMessage)
```javascript
// Seguro - Los mensajes solo duran 1 minuto (TTL)
db.DebouncedMessage.deleteMany({})
```

**Opción 3: Configurar TTL Index** en MongoDB Atlas
- Crear índice TTL en `DebouncedMessage.expiresAt`
- `expireAfterSeconds: 0` → Auto-elimina cuando `expiresAt < now()`
- Previene acumulación de duplicados

**Luego**: Re-habilitar constraints únicos en `schema.prisma` y ejecutar `npx prisma db push`

## APIs Públicas

### RAG API v1
**Endpoint**: `/api/v1/rag`
**SDK**: `/sdk/formmy-rag.ts`
**Intents**: `list` (gratis), `upload` (3 créditos), `query` (2 créditos)

### Parser API v1
**Endpoint**: `/api/parser/v1`
**SDK**: `formmy-sdk` (npm)
**Modos**: DEFAULT (gratis), COST_EFFECTIVE (1cr/pág), AGENTIC (3cr/pág), AGENTIC_PLUS (6cr/pág)
⚠️ **PDF Library**: `unpdf` - NUNCA cambiar

## Voice AI (LiveKit + ElevenLabs)

**API**: `/api/voice/v1`
**Service**: `/server/voice/livekit-voice.service.ts`
**Handler**: `/server/voice/voice-agent-handler.ts`

⚠️ **CRÍTICO**:
- Plugin ElevenLabs (`@livekit/agents-plugin-elevenlabs`) - NO LiveKit Inference
- API Key: `ELEVEN_API_KEY` (NO `ELEVENLABS_API_KEY`)
- Voice ID: `3l9iCMrNSRR0w51JvFB0` (Leo Moreno - única voz nativa mexicana)
- Language: ISO-639-1 (`"es"`, NO `"es-MX"`)
- Worker OBLIGATORIO: `npm run voice:dev` - sin worker = sin audio

**Intents**: `create_session`, `status`, `end_session`, `list`, `credits`
**Costo**: 5 créditos/minuto

**Problemas Conocidos**:
1. ⚠️ Alucinaciones (falta integración tools en worker)
2. ⚠️ Conversaciones NO se guardan en DB
3. ⚠️ Tracking de créditos incompleto

## Convenciones

- TypeScript estricto
- NO utilidades en rutas → `.server.tsx`
- Imports: `server/...` sin prefijo
- Deploy: `npm run deploy` (Fly.io)
