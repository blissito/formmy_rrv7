# Formmy - Project Context

## ⚠️ REGLAS CRÍTICAS

**SIEMPRE lee documentación oficial antes de implementar librerías externas** - WebFetch documentación, NO improvises APIs sin verificar.

### LlamaIndex Agent Workflows (OBLIGATORIO)
**Docs**: https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/

**Pattern**: Usar `agent()`, `runStream()`, `agentStreamEvent`, `agentToolCallEvent` - NO lógica custom

### 🚫 ANTI-PATTERNS PROHIBIDOS
**Eliminados del codebase:**
- ❌ Keyword matching para tool selection (usar `getToolsForPlan()`)
- ❌ Dual-agent systems con handoff manual (un agente con todas las tools)
- ❌ Intent classification custom (dejar que AI decida)

**✅ Pattern correcto**: `agent({ llm, tools: getToolsForPlan(), systemPrompt })`
**Código limpio**: `/server/agents/agent-workflow.server.ts`, `/server/tools/index.ts`

## 🛠️ Sistema de Herramientas (Tools)

**Ubicación**: `/server/tools/` - Registry en `index.ts`, handlers en `/handlers/[nombre].ts`

### Acceso por Plan
- **FREE**: Sin tools | **STARTER**: `save_contact`, `get_datetime`, `web_search`
- **PRO/ENTERPRISE**: + `create_payment_link` (si Stripe) | **TRIAL**: Acceso completo
- **ANONYMOUS** (chatbots públicos): Mismo que STARTER
- **Ghosty privado**: + `schedule_reminder`, `list_reminders`, `query_chatbots`, `get_chatbot_stats`

### Crear Nueva Herramienta
1. Handler en `/server/tools/handlers/ejemplo.ts` con `ToolContext` y `ToolResponse`
2. Registrar en `/server/tools/index.ts` con Zod schema
3. Asignar planes en `getToolsForPlan()`
4. Usar imports dinámicos `await import()`

```typescript
interface ToolContext { userId, userPlan, chatbotId, message, integrations }
interface ToolResponse { success, message, data? }
```

## Overview

**Formmy**: SaaS de formularios y chatbots AI con automatización avanzada | **URL**: https://formmy-v2.fly.dev

**Stack**: React Router v7, Tailwind, fly.io, Prisma, MongoDB, OpenRouter, Stripe, AWS SES

## Arquitectura (Producción ✅)

**Motor**: AgentEngine_v0 (`/server/agent-engine-v0/simple-engine.ts`) - Industrial, multi-proveedor
**Agentes**: `/server/agents/` → ghosty, sales, content, data
**Legacy eliminado**: llamaindex-engine-v2, ghosty-llamaindex

## Ghosty AgentV0 (Producción ✅)

**Ubicación**: `/dashboard/ghosty` | **Endpoint**: `/api/ghosty/v0`
**Motor**: LlamaIndex Agent Workflows 100% nativo (`/server/agents/agent-v0.server.ts`)
**Performance**: 62% menos código (176 líneas), latencia 981ms (GPT-4o-mini transparente)

### Optimizaciones Críticas
**GPT-5 nano → GPT-4o-mini** (Sept 29): Mapeo transparente, 85% mejora latencia, +86% costo vs 7s+ original
**Temperature Bug Fix** (Oct 1): Validación estricta `<= 1.5`, NUNCA confiar en BD sin sanitizar
**Features**: Streaming SSE, 6 tools, error handling robusto, profit margin 90%+

### TODOs Ghosty - Herramientas Pendientes
**CRUD**: create/update/delete/clone chatbots, toggle status
**Contextos**: add/remove/update/optimize contexts (archivos, URLs, texto)
**Forms**: query/create/update/delete forms, get_form_responses
**Integraciones**: setup whatsapp/stripe/webhooks, test integrations
**Analytics**: conversation_insights, performance_metrics, reports, forecasts
**Automatización**: bulk_operations, schedule_maintenance, backup_restore, export_import

### Integraciones Completadas ✅
**WhatsApp** (Sept 18): Embedded Signup, Meta SDK, webhook interno, filtrado echo
**Status**: ⏳ Pendiente Meta App Review para Advanced Access (1-2 semanas)

**Respuestas Manuales** (Sept): Toggle manual/auto, WhatsApp Business API, BD persistente, UX optimizada
**Pendiente**: Email/SMS fallback, audit trail, notificaciones equipo, asignación agentes

### Prioridades
1. **Sistema Tool Credits** - Tracking, deduction, monitoring, upgrade prompts, refill, overage protection
2. **Context compression** - Optimizar prompts del sistema
3. Completar herramientas CRUD Ghosty

### Seguridad Web Search (IMPLEMENTADO ✅)
**Problema**: Chatbots públicos pueden abusar de Google Search API con queries off-topic
**Soluciones**:
1. ✅ Scoped search via system prompt - Restricciones en `buildSystemPrompt()` cuando `web_search_google` disponible
2. ✅ Rate limiting per conversation - Max búsquedas diarias por plan implementado en `google-search.ts`
3. ⏳ Behavioral analytics - Flagear anomalías (cambios súbitos de tema, queries sospechosas) (futuro)

**Rate Limits Implementados** (Lógica: Más pagas → más valor):

| Plan | Precio/mes | Búsquedas/día | Costo API/día | Razón |
|------|------------|---------------|---------------|-------|
| **ANONYMOUS** | Gratis | 2 | $0.01 USD | Demo limitado, previene abuso |
| **FREE** | $0 | 0 | $0 | Incentiva upgrade a STARTER |
| **STARTER** | $149 MXN | 10 | $0.05 USD | Valor tangible, cumple promesa |
| **PRO** | $499 MXN | 25 | $0.125 USD | 2.5x STARTER, justifica precio |
| **ENTERPRISE** | $1,499 MXN | 100 | $0.50 USD | Prácticamente ilimitado |
| **TRIAL** | Temporal | 10 | $0.05 USD | Evaluar funcionalidad real |

**Costos**: Google Search API = $5 USD por 1,000 queries

**Features**:
- Tracking por `conversationId` en tabla `ToolUsage`
- Mensajes de upgrade automáticos al alcanzar límite
- Contador de búsquedas restantes en respuesta
- Fail-open en caso de error de BD (no bloquear UX)


## Pricing y Monetización

### Planes (MXN/mes)
- **Free**: Trial 60 días | **Starter**: $149 (2 chatbots, 50 conv, 200 credits) `price_1S5AqXDtYmGT70YtepLAzwk4`
- **Pro**: $499 (10 chatbots, 250 conv, 1000 credits) `price_1S5CqADtYmGT70YtTZUtJOiS`
- **Enterprise**: $1,499 (∞ chatbots, 1000 conv, 5000 credits) `price_1S5Cm2DtYmGT70YtwzUlp99P`

**Tool Credits**: Básicas 1, Intermedias 2-3, Avanzadas 4-6 | PRO activo ~305/mes
**Proyección Año 1** (150 clientes): $640K MXN → $610K profit (~$34K USD)
**Revenue extra**: Conversaciones, WhatsApp ($99), Setup ($1.5K), White Label ($299), API ($199)

## Herramientas Principales

**create_payment_link**: Links Stripe seguros (PRO/ENTERPRISE)
**schedule_reminder**: Recordatorios con email automático, schema `ScheduledAction` (type, data, runAt, status)
**search_context**: RAG agéntico - búsqueda semántica en base de conocimiento (PRO/ENTERPRISE/TRIAL)

## RAG Agéntico (Producción ✅)

**Status**: Operativo Oct 4, 2025 | **Index**: `vector_index_2` en MongoDB Atlas
**Embeddings**: text-embedding-3-small (768 dimensiones) | **Chunking**: 2000 chars, overlap 200

### Features
- ✅ **Búsqueda semántica** con similitud coseno
- ✅ **Auto-vectorización** en background (FILE/URL/TEXT/QUESTION contexts)
- ✅ **Agentic behavior**: Agente ejecuta múltiples búsquedas iterativas para preguntas complejas
- ✅ **System prompt optimizado**: Instruye al agente CUÁNDO y CÓMO usar RAG
- ✅ **Cita fuentes**: Agente referencia documentos/archivos en respuestas

### Acceso por Plan
- **FREE/STARTER**: ❌ No RAG (prompts estáticos únicamente)
- **PRO**: ✅ RAG ilimitado, max 50MB contexto total
- **ENTERPRISE**: ✅ RAG ilimitado, contexto ilimitado
- **TRIAL**: ✅ Acceso completo temporal

### Tool: `search_context`
```typescript
search_context({
  query: string,  // Consulta específica con keywords relevantes
  topK?: number   // Resultados (1-10, default: 5)
})
```

**Estrategia Agéntica** (definida en tool description):
1. Descomponer preguntas complejas en consultas específicas
2. Ejecutar MÚLTIPLES búsquedas si la pregunta tiene varios temas
3. Ajustar query y reintentar si resultados no son relevantes
4. Combinar resultados coherentemente

**Ejemplo de uso agéntico**:
```
User: "¿Cuánto cuestan los planes y qué formas de pago aceptan?"
Agent:
  1. search_context("precios planes suscripción") → obtiene pricing
  2. search_context("métodos formas de pago") → obtiene payment methods
  3. Combina ambos resultados en respuesta coherente
```

### Implementación Técnica
**Vectorización**: `/server/vector/auto-vectorize.service.ts`
- Se ejecuta automáticamente al añadir/editar contextos (PRO+)
- Chunking inteligente con overlap para preservar contexto
- Metadata: contextId, contextType, title, fileName, url, chunkIndex

**Búsqueda**: `/server/vector/vector-search.service.ts`
- MongoDB `$vectorSearch` aggregation con filtro por chatbotId
- Score threshold mínimo recomendado: 60%
- Resultados ordenados por relevancia (similitud coseno)

**Tool Handler**: `/server/tools/handlers/context-search.ts`
- Validación de chatbotId (no disponible para anónimos sin chatbot)
- Formateo de resultados con fuentes y scores
- Error handling para índice no configurado

### System Prompt RAG
El agente recibe instrucciones específicas cuando tiene acceso a `search_context`:
- Reglas sobre CUÁNDO buscar (preguntas específicas, precios, políticas)
- Prohibición de adivinar datos que deben buscarse
- Estrategia de múltiples búsquedas para preguntas complejas
- Obligación de citar fuentes

Implementado en `/server/agents/agent-workflow.server.ts:72` - `buildSystemPrompt()`

### Migración de Contextos Legacy
**Scripts disponibles**:
```bash
# Auditar chatbots con contextos sin embeddings
npx tsx scripts/audit-chatbot-embeddings.ts

# Migrar (dry-run primero)
npx tsx scripts/migrate-contexts-to-embeddings.ts --all --dry-run
npx tsx scripts/migrate-contexts-to-embeddings.ts --all

# Testing agéntico
npx tsx scripts/test-agentic-rag.ts
```

### Monitoreo
**Señales de RAG agéntico funcionando**:
- ✅ Ejecuta 2+ búsquedas para preguntas multi-tema
- ✅ Cita fuentes: "Según [archivo]..." o "De acuerdo a..."
- ✅ Dice "no encontré" si búsqueda falla (no adivina)
- ✅ Ajusta queries si primera búsqueda no es suficiente

**Métricas** (tabla `ToolUsage`):
- Búsquedas por conversación
- Top queries más frecuentes
- % conversaciones que usan RAG

### Límites y Costos
**Embeddings API** (OpenAI text-embedding-3-small):
- $0.02 por 1M tokens
- ~1 contexto promedio = 500 tokens = $0.00001

**Storage** (MongoDB Atlas):
- 768 float32 por embedding = 3KB
- 1000 embeddings ≈ 3MB storage

## Modelos AI

**Proveedores**: OpenAI (GPT-5-nano/mini + tools), Anthropic (Claude 3/3.5 Haiku + tools), OpenRouter (Gemini sin tools)
**Mapeo performance**: UI "GPT-5 Nano" → backend GPT-4o-mini (981ms vs 7s)

**Por Plan**:
- **FREE**: Sin acceso post-trial | **STARTER/PRO**: GPT-4o-mini ($149/$499 MXN)
- **ENTERPRISE**: GPT-5 Mini + Claude 3.5 Haiku ($1,499 MXN)

## API v1 Chatbot - Modular (Sept 16) ✅

**Estructura**: `/app/routes/api.v1.chatbot.ts` delega a handlers modulares
- **Context**: `/server/chatbot/context-handler.server.ts` (CRUD contextos PDF/DOCX/XLSX/URLs)
- **Management**: `/server/chatbot/management-handler.server.ts` (CRUD chatbots)
- **Integration**: `/server/chatbot/integration-handler.server.ts` (gestión integraciones)

**Prompts simplificados** (90% reducción tokens): Sales, SEO, Analyst, Automation, Growth → 1 línea cada uno


## Roadmap

**Gemini Direct API**: Reducción 90% costo vs OpenRouter, ROI ~$48K/año
**RAG**: ChromaDB + embeddings para contexto 50MB+, diferenciador Enterprise
**Límites protección**: Tokens 4K/8K/16K, consultas 20/100/500 diarias por plan

## Docs Pendientes
- [ ] github.com/formmy/agent-examples (framework, ejemplos, tutoriales)
- [ ] formmy.app/docs (guías API, reference)

## Convenciones

- TypeScript estricto, imports dinámicos en endpoints
- **NO utilidades en rutas** - crear `.server.tsx` separado
- Arquitectura modular, delegar a handlers
- Prisma ORM, Tailwind CSS
- Imports `/server`: usar `server/...` sin prefijo
- Rutas nuevas: agregar a `routes.ts`
- NO usar `json`, usar `{}` directo

## Configuración Modelos AI

**Temperature por modelo**: gpt-5-nano (undefined), claude-3-haiku (0.7), claude-3.5-haiku (0.5), gpt-5-mini (0.3)
**Context limits**: 3500-5000 tokens según modelo
**Smart routing PRO**: Claude para integraciones críticas, GPT-5-nano para chat normal

**Precios API** (por 1M tokens):
- GPT-4o-mini: $0.15/$0.60 | GPT-5-mini: $0.25/$2.00
- Claude 3 Haiku: $0.25/$1.25 | Claude 3.5 Haiku: $1.00/$5.00
- Gemini 2.5 Flash: $0.075 (OpenRouter)

**Motor features**: Streaming disabled (tools compat), reintentos automáticos, límites por plan, memory con truncamiento

## Email & GitHub

**AWS SES** (`/app/utils/notifyers/`): welcome, noUsage, freeTrial, pro, planCancellation, weekSummary
**Remitente**: `Formmy <notificaciones@formmy.app>`
**Integración**: Google OAuth, Stripe webhooks, invitaciones

**GitHub**: Claude Code Action responde `@claude` en issues/PRs (workflow `.github/workflows/claude-code.yml`)

## AgentMapper (Formmy ↔️ Flowise)

**Mapeo**: Chatbot config → AgentFlow, Contexts → Knowledge Store, Tools → API Tools, Integraciones → Sub-workflows
**Flycast**: Posible deploy Flowise en Fly.io con networking privado
**TODO**: Endpoints `/api/export/flowise` y `/api/import/flowise`, UI sync bidireccional

## Deploy & Comandos

**Producción**: fly.io | **Deploy**: 2-4min (optimizado con Dockerfile multi-stage)
**Scripts**: `npm run build/dev/deploy/deploy:force/typecheck`
**Imports**: usar `server/...` directo sin prefijo