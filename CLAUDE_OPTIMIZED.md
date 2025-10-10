# Formmy - Project Context

**SaaS de formularios y chatbots AI** | **URL**: https://formmy-v2.fly.dev
**Stack**: React Router v7, Tailwind, Fly.io, Prisma, MongoDB, OpenRouter, Stripe, AWS SES

## ⚠️ REGLAS CRÍTICAS

### 1. LlamaIndex Agent Workflows (OBLIGATORIO)
**Docs**: https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/

**Pattern 100% nativo**:
```typescript
import { agent, runStream, agentStreamEvent, agentToolCallEvent } from "@llamaindex/workflow";

const agentInstance = agent({ llm, tools, systemPrompt, memory });
const events = agentInstance.runStream(message);
```

❌ **NO** lógica custom de routing | **SÍ** dejar que el modelo decida tools

### 2. Streaming y Generación de Archivos
**REGLA ABSOLUTA**: 100% streaming en respuestas de agentes

✅ **Archivos**: Generar EN MEMORIA (Buffer) → Redis/memoria con TTL 5min → endpoint `/api/ghosty/download/{id}`
❌ **NUNCA**: Escribir al filesystem (Fly.io efímero), S3, o retornar binarios en stream

**Pattern**:
```typescript
// Tool genera PDF/Excel/CSV en memoria
const buffer = await generatePDF(data);
await redis.setex(`report:${id}`, 300, buffer); // TTL 5min
return { downloadUrl: `/api/ghosty/download/${id}`, expiresIn: "5m" };
```

### 3. LlamaIndex Memory - Historial Conversacional
⚠️ **REGLA FUNDAMENTAL**: `staticBlock` para historial, NUNCA `memory.add()`

```typescript
import { createMemory, staticBlock } from "llamaindex";

const historyText = conversationHistory.map(msg =>
  `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`
).join('\n\n');

const memory = createMemory({
  tokenLimit: 8000,
  memoryBlocks: [staticBlock({ content: `Historial:\n\n${historyText}` })]
});

const agentConfig = { llm, tools, systemPrompt, memory };
```

**Por qué**: `staticBlock` → contexto directo al LLM ✅ | `memory.add()` → solo para info durante ejecución ❌

### 4. Tool Grounding - Honestidad de Capacidades
**Ubicación**: `/server/agents/agent-workflow.server.ts:144-180`

```
🚫 NUNCA prometas acciones sin herramientas:
❌ "Te enviaré email" sin tool de email
❌ "Generé el PDF" sin tool de PDF

✅ SÉ HONESTO:
"Puedo guardar tu email para que el equipo te contacte"
"No puedo enviar emails, pero puedo [alternativa]"
```

**Beneficio**: Previene >90% alucinaciones sobre capacidades

### 5. Anti-Patterns Prohibidos
- ❌ Keyword matching para tool selection → usar `getToolsForPlan()`
- ❌ Dual-agent systems → un agente con todas las tools
- ❌ Intent classification custom → dejar que AI decida
- ❌ `memory.add()` para historial → usar `staticBlock`

### 6. Documentación Externa
**SIEMPRE** hacer `WebFetch` de docs oficiales ANTES de implementar librerías - NO improvises APIs

---

## Arquitectura (Producción)

**Motor**: AgentEngine_v0 (`/server/agent-engine-v0/simple-engine.ts`) - Multi-proveedor
**Agentes**: `/server/agents/` → ghosty, sales, content, data
**Legacy eliminado**: llamaindex-engine-v2, ghosty-llamaindex

### Ghosty AgentV0
**Endpoint**: `/api/ghosty/v0` | **Motor**: LlamaIndex 100% nativo
**Performance**: 981ms latencia (GPT-4o-mini), 62% menos código (176 líneas)
**Features**: Streaming SSE, 6 tools, error handling robusto, profit margin 90%+

**Optimizaciones críticas**:
- GPT-5 nano → GPT-4o-mini mapping transparente (85% mejora latencia)
- Temperature validation `<= 1.5` (sanitizar SIEMPRE, NUNCA confiar en BD sin validar)
- Streaming con timeout 45s, max 1000 chunks, detección contenido corrupto

**TODOs Prioritarios**:
1. Tool Credits System (tracking, deduction, monitoring, upgrade prompts)
2. CRUD: create/update/delete/clone chatbots, toggle status
3. Contextos: add/remove/update/optimize (archivos, URLs, texto)
4. Forms: query/create/update/delete, get_form_responses
5. Analytics: insights, metrics, reports, forecasts

---

## Sistema de Herramientas

**Ubicación**: `/server/tools/` - Registry en `index.ts`, handlers en `/handlers/[nombre].ts`

### Acceso por Plan
- **FREE**: Sin tools
- **STARTER**: `save_contact`, `get_datetime`, `web_search`
- **PRO/ENTERPRISE**: + `create_payment_link` (si Stripe)
- **TRIAL**: Acceso completo temporal
- **ANONYMOUS** (chatbots públicos): Igual que STARTER
- **Ghosty privado**: + `schedule_reminder`, `list_reminders`, `query_chatbots`, `get_chatbot_stats`

### Crear Nueva Herramienta
```typescript
// 1. Handler: /server/tools/handlers/ejemplo.ts
export async function handleEjemplo(input: z.infer<typeof schema>, context: ToolContext): Promise<ToolResponse> {
  return { success: true, message: "OK", data: {...} };
}

// 2. Registrar: /server/tools/index.ts
const exampleTool = FunctionTool.from({
  name: "example_tool",
  description: "...",
  parameters: exampleSchema,
  async call(input: any, context: ToolContext): Promise<ToolResponse> {
    const handler = await import("./handlers/ejemplo");
    return handler.handleEjemplo(input, context);
  }
});

// 3. Asignar a planes en getToolsForPlan()
```

**Tool Credits** (según CLAUDE.md pricing):
- Básicas: 1 crédito (save_contact, get_datetime)
- Intermedias: 2-3 (schedule_reminder, web_search, search_context)
- Avanzadas: 4-6 (create_payment_link, get_chatbot_stats)

---

## RAG Agéntico (Producción ✅)

**Status**: Operativo Oct 4, 2025 | **Index**: `vector_index_2` MongoDB Atlas
**Embeddings**: text-embedding-3-small (768 dims) | **Chunking**: 2000 chars, overlap 200

### System Prompt RAG (Ubicación crítica: ANTES de custom instructions)
**Actualizado**: Oct 6, v3 - Instrucciones de búsqueda van PRIMERO

```
⚠️ PROTOCOLO DE BÚSQUEDA EN CASCADA:
1. PASO 1: search_context (mínimo 2 intentos con queries reformuladas)
2. PASO 2: web_search_google (fallback si PASO 1 falla)
3. PASO 3: "Busqué en [lugares] pero no encontré..."

❌ PROHIBIDO: Responder sin buscar, decir "no sé" sin AGOTAR tools

📏 REGLA DE CONCISIÓN:
- Responde SOLO lo preguntado
- Si preguntan por UN servicio, NO enumeres TODOS
```

**Chain-of-thought examples** en prompt mejoran comportamiento agéntico

### Acceso RAG
- **FREE/STARTER**: ❌ Sin RAG
- **PRO**: ✅ RAG ilimitado, max 50MB contexto
- **ENTERPRISE**: ✅ RAG ilimitado, contexto ilimitado
- **TRIAL**: ✅ Acceso completo

### Bugs Resueltos
1. **Oct 4**: Ghosty no usaba web_search → `businessDomain = 'Formmy'` si `config.name === 'Ghosty'`
2. **Oct 6**: Agentes ignoraban search_context → mover instrucciones ANTES de custom instructions
3. **Oct 6**: Verbosidad → migrar temperatures + agregar "REGLAS DE CONCISIÓN"

---

## Modelos AI y Temperatures

**Proveedores**: OpenAI (tools ✅), Anthropic (tools ✅), OpenRouter Gemini (tools ❌)
**Centralizado**: `/server/config/model-temperatures.ts`

### Temperatures Óptimas (Fixed)
**OpenAI** (Oct 6 - Opción Conservadora):
- `gpt-5-nano` → `gpt-4o-mini`: **1.0** (mapeo transparente)
- `gpt-4o-mini`: **1.0** (previene alucinaciones)
- `gpt-4o`: **1.0** (antes 0.7)
- `gpt-5`: **0.7**
- `gpt-3.5-turbo`: **0.7**

**Anthropic**:
- `claude-3-haiku`: **0.8** (punto medio, antes 0.7)
- `claude-3.5-haiku`: **0.8**
- `claude-3-sonnet`: **0.7**
- `claude-3.5-sonnet`: **0.7**

**Gemini**: **0.7** (ambos 2.0-flash y 1.5-pro)

⚠️ **Validación**: Temperature > 1.5 → auto-sanitizar a 1.0

### Plan → Model Mapping
- **STARTER/PRO**: GPT-4o-mini ($149/$499 MXN)
- **ENTERPRISE**: GPT-5 Mini + Claude 3.5 Haiku ($1,499 MXN)
- **FREE**: Sin acceso post-trial

---

## Pricing y Monetización

### Planes (MXN/mes)
| Plan | Precio | Chatbots | Conv/mes | Credits | Price ID |
|------|--------|----------|----------|---------|----------|
| **Free** | $0 | 0 | 0 | 0 | - |
| **Starter** | $149 | 2 | 50 | 200 | `price_1S5AqXDtYmGT70YtepLAzwk4` |
| **Pro** | $499 | 10 | 250 | 1000 | `price_1S5CqADtYmGT70YtTZUtJOiS` |
| **Enterprise** | $1,499 | ∞ | 1000 | 5000 | Custom `price_data` |

**Revenue Extra**: WhatsApp ($99), Setup ($1.5K), White Label ($299), API ($199)
**Proyección Año 1** (150 clientes): $640K MXN → $610K profit

### Web Search Security & Rate Limiting
**Problema**: Chatbots públicos ANONYMOUS pueden abusar de Google Search

**Soluciones**:
1. ✅ Scoped search via system prompt (restricciones en `buildSystemPrompt()`)
2. ✅ Rate limiting per conversation (búsquedas diarias por plan en `google-search.ts`)
3. ⏳ Behavioral analytics (futuro)

**Rate Limits**:
- ANONYMOUS: 2/día | STARTER: 10/día | PRO: 25/día | ENTERPRISE: 100/día
- Costo Search: $5 USD/1,000 queries
- Profit margins: 44-62% (incluyendo IA + Search)

---

## Integraciones

### WhatsApp (Sept 18) ✅
**Features**: Embedded Signup, Meta SDK, webhook interno, filtrado echo
**Status**: ⏳ Pendiente Meta App Review para Advanced Access (1-2 semanas)

### Respuestas Manuales ✅
**Features**: Toggle manual/auto, WhatsApp Business API, BD persistente
**Pendiente**: Email/SMS fallback, audit trail, notificaciones equipo

### SSE Real-time para Web (Oct 9) ✅
**Endpoint**: `/api/v1/conversations/:conversationId/stream`
**Pattern**: Polling interno 1s → detecta mensajes ASSISTANT nuevos → push SSE <1s
**Beneficio**: Web widget recibe respuestas manuales en tiempo real (vs 3s polling client-side)

---

## Features Recientes

### Sistema de Contactos (Oct 7) ✅
**UI**: Optimistic updates con `useFetcher()`, cambio de estatus instantáneo
**CSV Export**: Client-side, sin roundtrip servidor
**Validación**: Email O teléfono obligatorio (nivel tool)
**Ownership**: Validación robusta en API handler

**7 Estados (ContactStatus)**:
NEW → CONTACTED → SCHEDULED → NEGOTIATING → ON_HOLD → CLOSED_WON/LOST

### Sistema de Favoritos (Oct 9) ✅
**Backend**: `/api/v1/conversations` intent `toggle_favorite`
**Frontend**: Update optimista, revert si falla, tab "Favoritos" filtra en vivo

### Paginación Conversaciones (Oct 8) ✅
**Pattern**: Botón "Cargar más" (50 por request) vs scroll infinito
**Endpoint**: `/api/v1/conversations/load-more` con `skip` y `take`

---

## API v1 Chatbot - Modular (Sept 16)

**Estructura**: `/app/routes/api.v1.chatbot.ts` delega a handlers modulares

- **Context**: `/server/chatbot/context-handler.server.ts` (CRUD PDF/DOCX/XLSX/URLs)
- **Management**: `/server/chatbot/management-handler.server.ts` (CRUD chatbots)
- **Integration**: `/server/chatbot/integration-handler.server.ts` (integraciones)

---

## Personalidades de Agentes (AgentType)

**Ubicación**: `/app/utils/agents/agentPrompts.ts`
**LFPDPPP Compliance**: Todos incluyen disclaimers de uso de datos personales

**6 Agentes activos** (Oct 6, 2025):
1. `sales` - Ventas consultivas B2B/B2C (verde #10B981)
2. `customer_support` - Resolución consultas (azul #3B82F6)
3. `data_analyst` - Análisis KPIs (ámbar #F59E0B)
4. `coach` - Coaching vida/negocios (violeta #8B5CF6)
5. `medical_receptionist` - Gestión citas médicas (cian #06B6D4)
6. `educational_assistant` - Aprendizaje personalizado (rojo #EF4444)

**Disclaimer estándar**:
```
📋 AL PEDIR DATOS, DI:
"[Pregunta]? Tu información solo se usará para [propósito]
y puedes solicitar su eliminación cuando quieras."
```

---

## Convenciones de Código

- **TypeScript estricto**, imports dinámicos en endpoints
- **NO utilidades en rutas** - crear `.server.tsx` separado
- **Arquitectura modular**, delegar a handlers
- **Prisma ORM**, Tailwind CSS
- **Imports `/server`**: usar `server/...` sin prefijo
- **Rutas nuevas**: agregar a `routes.ts`
- **NO usar `json`**, usar `{}` directo en responses

---

## Deploy & Comandos

**Producción**: fly.io | **Deploy**: 2-4min (Dockerfile multi-stage optimizado)

```bash
npm run build       # Build producción
npm run dev         # Dev local
npm run deploy      # Deploy a Fly.io
npm run deploy:force # Force deploy
npm run typecheck   # Validar TypeScript
```

**Imports**: usar `server/...` directo sin prefijo `/`

---

## Roadmap Prioritario

1. **Sistema Tool Credits** ⭐⭐⭐ - Tracking, deduction, monitoring, upgrade prompts, refill
2. **Context compression** - Optimizar prompts del sistema
3. **Completar herramientas CRUD Ghosty** - Ver lista en sección Ghosty AgentV0
4. **Gemini Direct API** - Reducción 90% costo vs OpenRouter
5. **RAG ChromaDB** - Embeddings para contexto 50MB+

---

## Email & GitHub

**AWS SES** (`/app/utils/notifyers/`): welcome, noUsage, freeTrial, pro, planCancellation, weekSummary
**Remitente**: `Formmy <notificaciones@formmy.app>`
**GitHub Action**: Claude Code responde `@claude` en issues/PRs (`.github/workflows/claude-code.yml`)

---

## Bugs Conocidos & Fixes

### Oct 6, 2025 - RAG Priority
**Problema**: Agentes NO usaban search_context con custom instructions fuertes
**Causa**: Custom instructions sobrescribían instrucciones de búsqueda
**Fix**: Instrucciones búsqueda PRIMERO en system prompt (línea 88-124)

### Oct 6, 2025 - Verbosidad
**Problema**: Respuestas muy largas y exhaustivas
**Causa**: Temperature = 0 en chatbots antiguos + sin instrucciones de concisión
**Fix**: Migración temperatures óptimas + "REGLAS DE CONCISIÓN" en prompt

### Oct 4, 2025 - Ghosty Web Search
**Problema**: Ghosty no usaba web_search como fallback
**Causa**: `businessDomain = config.name` ("Ghosty") pero negocio es "Formmy"
**Fix**: `if (config.name === 'Ghosty') businessDomain = 'Formmy'`

### Oct 1, 2025 - Temperature Bug
**Problema**: BD contenía temperatures > 1.5 causando alucinaciones
**Fix**: Validación estricta `<= 1.5` en `createLLM()`, NUNCA confiar en BD sin sanitizar

---

## Scripts Útiles

```bash
# Auditar y migrar contextos a embeddings
npx tsx scripts/audit-chatbot-embeddings.ts
npx tsx scripts/migrate-contexts-to-embeddings.ts --all --dry-run

# Test RAG agéntico
npx tsx scripts/test-agentic-rag.ts

# Migrar temperatures a óptimas
npx tsx scripts/migrate-temperatures.ts

# Migrar ContactStatus
npx tsx scripts/migrate-contact-status.ts
```

---

## Docs Pendientes

- [ ] github.com/formmy/agent-examples (framework, ejemplos, tutoriales)
- [ ] formmy.app/docs (guías API, reference)

---

**Última actualización**: Oct 10, 2025
**Versión**: Optimizada (~430 líneas vs 742 original)
