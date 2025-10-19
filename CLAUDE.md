# Formmy - Project Context

**SaaS formularios/chatbots AI** | https://formmy-v2.fly.dev
**Stack**: React Router v7, Tailwind, Fly.io, Prisma, MongoDB, OpenRouter, Stripe, AWS SES

## ⚠️ REGLAS CRÍTICAS

### 1. LlamaIndex Agent Workflows (OBLIGATORIO)
**Docs**: https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/

```typescript
import { agent, runStream } from "@llamaindex/workflow";
const agentInstance = agent({ llm, tools, systemPrompt, memory });
const events = agentInstance.runStream(message);
```

❌ NO lógica custom routing | ✅ Dejar que modelo decida tools

### 2. Streaming y Archivos
**ABSOLUTO**: 100% streaming respuestas agentes

✅ Archivos: Buffer → Redis TTL 5min → `/api/ghosty/download/{id}`
❌ NUNCA: Filesystem (Fly.io efímero), S3, binarios en stream

### 3. LlamaIndex Memory - Historial
⚠️ **`staticBlock` para historial, NUNCA `memory.add()`**

```typescript
import { createMemory, staticBlock } from "llamaindex";
const memory = createMemory({
  tokenLimit: 8000,
  memoryBlocks: [staticBlock({ content: `Historial:\n\n${historyText}` })]
});
```

### 4. Tool Grounding
`/server/agents/agent-workflow.server.ts:144-180`

```
🚫 NUNCA promesas sin tools:
❌ "Te enviaré email" sin tool email
✅ "Puedo guardar email para que equipo contacte"
```

### 5. Anti-Patterns
- ❌ Keyword matching → `getToolsForPlan()`
- ❌ Dual-agent systems
- ❌ Intent classification custom
- ❌ `memory.add()` para historial

### 6. Docs Externas
**SIEMPRE** `WebFetch` docs oficiales ANTES implementar

### 7. Integraciones Composio
**Config centralizada**: `/server/integrations/composio-config.ts` - ÚNICA FUENTE

**Proceso agregar integración**:
1. `enum IntegrationType` en `schema.prisma`
2. Config en `COMPOSIO_INTEGRATIONS`
3. Handlers en `/server/tools/handlers/`
4. Registrar en `/server/tools/index.ts`

---

## Arquitectura

**Motor**: AgentEngine_v0 (`/server/agent-engine-v0/simple-engine.ts`)
**Agentes**: `/server/agents/` → ghosty, sales, content, data

### Ghosty AgentV0
**Endpoint**: `/api/ghosty/v0` | LlamaIndex 100% nativo
**Performance**: 981ms (GPT-4o-mini), 62% menos código

**Optimizaciones**:
- GPT-5 nano → GPT-4o-mini mapping (85% mejora)
- Temperature validation `<= 1.5`
- Streaming timeout 45s, max 1000 chunks

**TODOs**: CRUD chatbots/contextos/forms, Analytics

---

## Sistema Herramientas

**Ubicación**: `/server/tools/` - Registry `index.ts`, handlers `/handlers/`

### Acceso por Plan
- **FREE**: Sin tools
- **STARTER**: `save_contact`, `get_datetime`, `web_search`
- **PRO/ENTERPRISE**: + `create_payment_link`
- **TRIAL**: Completo temporal
- **Ghosty**: + reminders, query_chatbots, stats

### Tool Credits ✅ (Implementado)
**Ubicación**: `/server/llamaparse/credits.service.ts`

**Sistema Dual de Créditos**:
1. **Créditos Mensuales** (`toolCreditsUsed`): Resetean cada mes
2. **Créditos Comprados** (`purchasedCredits`): Permanentes hasta agotarse

**Orden de Consumo**: Primero mensuales, luego comprados

**Costos por Tool**:
- Básicas: 1 crédito (save_contact, get_datetime)
- Intermedias: 2-3 créditos (search_context, web_search)
- Avanzadas: 4-6 créditos (generate_report)

**Parser Avanzado** (Pricing por página):
- `COST_EFFECTIVE`: 1 crédito/página
- `AGENTIC`: 3 créditos/página
- `AGENTIC_PLUS`: 6 créditos/página (con OCR)

**Cálculo de Créditos**:
- Sistema híbrido que match exacto con LlamaCloud
- Pre-scan PDF para contar páginas ANTES de cobrar
- Ejemplo: PDF de 9 páginas en modo AGENTIC = 9 × 3 = 27 créditos
- Fallback para no-PDFs: DOCX/XLSX/TXT = 5 páginas estimadas

**Límites Mensuales**:
- STARTER: 200 créditos/mes
- PRO: 1,000 créditos/mes
- ENTERPRISE: 5,000 créditos/mes

**Compra de Paquetes** (vía Stripe):
- 500 créditos: $99 MXN (`price_1SLwONRuGQeGCFrvx7YKBzMT`)
- 2,000 créditos: $349 MXN (`price_1SLwPBRuGQeGCFrvwVfKj8Lk`)
- 5,000 créditos: $799 MXN (`price_1SLwPqRuGQeGCFrvQZeRStNm`)

**Reset Automático**: Primer día de cada mes (solo mensuales)

**DB Schema**:
```prisma
model User {
  toolCreditsUsed     Int @default(0)      // Créditos mensuales consumidos
  creditsResetAt      DateTime @default(now())  // Última fecha reset
  purchasedCredits    Int @default(0)      // Créditos comprados restantes
  lifetimeCreditsUsed Int @default(0)      // Total histórico consumido
}
```

**API Stripe**:
- `/api/stripe?intent=buy_credits&package=[500|2000|5000]`
- Webhook: `checkout.session.completed` para acreditar compras

---

## RAG Agéntico ✅

**Status**: Operativo | **Index**: `vector_index_2` MongoDB
**Embeddings**: text-embedding-3-small (768d) | **Chunk**: 2000/100 (5% overlap, optimizado)

### Vectorización Unificada ⭐ (Enero 2025)

**Servicio Central**: `/server/context/unified-processor.server.ts`

**Función principal**:
```typescript
addContextWithEmbeddings({
  chatbotId, content,
  metadata: { type, fileName, fileType, fileSize, contextId? }
})
```

**Proceso**:
1. Construye ContextItem completo (TODOS los campos presentes, `null` para opcionales)
2. Inserción atómica con `$push` MongoDB
3. Chunking optimizado: 2000 chars, 100 overlap (5%)
4. Deduplicación semántica (85% threshold)
5. Generación de embeddings

**Migración completada**:
- ✅ `job.service.ts`: 70 líneas → 40 líneas
- ✅ `embedding.service.ts`: 220 líneas → ELIMINADO (migrado completamente)
- ✅ `api.v1.llamaparse.ts`: Usa servicio unificado
- ✅ Código duplicado eliminado: ~200 líneas

**Beneficios**:
- Estructura 100% consistente (campos `fileUrl`, `url`, `title`, `questions`, `answer` siempre presentes)
- 50% menos chunks procesados (overlap reducido 10% → 5%)
- Un solo lugar para cambios (threshold, chunk size, etc.)
- Método de inserción eficiente en todos los flujos

### System Prompt (ANTES custom instructions)
```
⚠️ BÚSQUEDA CASCADA:
1. search_context (2+ intentos reformulados)
2. web_search_google (fallback)
3. "Busqué en X pero no encontré"

❌ Responder sin buscar
📏 CONCISIÓN: Solo lo preguntado
```

**Acceso**: FREE/STARTER ❌ | PRO 50MB | ENTERPRISE ilimitado | TRIAL ✅

---

## Modelos & Temperatures

**Centralizado**: `/server/config/model-temperatures.ts`

**OpenAI**: gpt-4o-mini **1.0**, gpt-4o **1.0**, gpt-5 **0.7**
**Anthropic**: haiku **0.8**, sonnet **0.7**
**Gemini**: **0.7**

**Validación**: temp > 1.5 → 1.0

**Plan Mapping**:
- STARTER/PRO: GPT-4o-mini
- ENTERPRISE: GPT-5 Mini + Claude 3.5 Haiku

---

## Pricing (MXN/mes)

| Plan | $ | Bots | Conv | Credits | Price ID |
|------|---|------|------|---------|----------|
| Free | 0 | 0 | 0 | 0 | - |
| Starter | 149 | 2 | 50 | 200 | `price_1S5AqX...` |
| Pro | 499 | 10 | 250 | 1000 | `price_1S5CqA...` |
| Enterprise | 1499 | ∞ | 1000 | 5000 | Custom |

**Revenue Extra**: WhatsApp $99, Setup $1.5K, White Label $299, API $199

### Web Search Rate Limits
ANONYMOUS: 2/día | STARTER: 10/día | PRO: 25/día | ENTERPRISE: 100/día

---

## Integraciones Activas

### WhatsApp + Composio ✅
**Features**: Embedded Signup, webhook, tools agentes
**Config**: `/server/integrations/composio-config.ts:WHATSAPP`

**Flow**: Meta Signup → tokens → Composio AuthScheme.APIKey
**Entity**: `chatbot_${chatbotId}`

**Tools**: `send_whatsapp_message`, `list_whatsapp_conversations`, `get_whatsapp_stats`
**Acceso**: PRO/ENT/TRIAL

**Rutas**:
- `GET /api/v1/composio/whatsapp?intent=status`
- `POST /api/v1/composio/whatsapp?intent=connect`

**Testing**: `bash scripts/run-whatsapp-test.sh`

**Troubleshooting**:
- "not connected" → Verificar Embedded Signup completo
- Mensajes no envían → Destinatario debe enviar 1er msg
- Error 400 → Revisar formato `execute(toolSlug, {userId, arguments})`

### Gmail + Composio ✅
**Features**: OAuth2, envío/lectura emails, tools agentes
**Config**: `/server/integrations/composio-config.ts:GMAIL`

**Flow**: OAuth popup → Composio callback → token refresh auto
**Entity**: `chatbot_${chatbotId}`

**Tools**: `send_gmail`, `read_gmail`
**Capacidades**: Multi-destinatarios, HTML, búsquedas, filtros

**Rutas**:
- `POST /api/v1/composio/gmail?intent=connect`
- `GET /api/v1/composio/gmail?intent=status`

**Auth Config**: Google Cloud Console → OAuth2 Client → Composio Dashboard

**Testing**: `bash scripts/run-gmail-test.sh`

**🐛 Bug Crítico Resuelto (Oct 17)**:
```typescript
// ❌ INCORRECTO
conn.appName === 'gmail'

// ✅ CORRECTO
conn.toolkit?.slug === 'gmail'
```

### Otras
- **Respuestas Manuales** ✅: Toggle, WhatsApp API
- **SSE Real-time** ✅: Polling 1s → push SSE <1s

---

## Features

### Contactos ✅
7 estados: NEW → CONTACTED → SCHEDULED → NEGOTIATING → ON_HOLD → CLOSED_WON/LOST
Optimistic updates, CSV export client-side

### Favoritos ✅
`/api/v1/conversations?intent=toggle_favorite`

### Paginación ✅
Botón "Cargar más" 50/request

---

## API v1 Chatbot Modular

- **Context**: `/server/chatbot/context-handler.server.ts`
- **Management**: `/server/chatbot/management-handler.server.ts`
- **Integration**: `/server/chatbot/integration-handler.server.ts`

---

## Personalidades (AgentType)

`/app/utils/agents/agentPrompts.ts` - 6 activos:
sales, customer_support, data_analyst, coach, medical_receptionist, educational_assistant

**LFPDPPP**: Todos con disclaimers datos personales

---

## Convenciones

- TypeScript estricto, imports dinámicos endpoints
- NO utilidades en rutas → `.server.tsx`
- Modular, handlers separados
- Imports: `server/...` sin prefijo
- Rutas nuevas → `routes.ts`
- NO `json` → `{}` directo

---

## Deploy

**Fly.io** | 2-4min

```bash
npm run build
npm run dev
npm run deploy
npm run typecheck
```

---

## Roadmap

1. **Parser API v1 - Stripe Price IDs** ⭐⭐⭐
   - Crear products en Stripe Dashboard para paquetes de créditos
   - Actualizar placeholders: `price_credits_100_prod`, `price_credits_500_prod`, etc.
   - Testing end-to-end: compra → webhook → acreditación

2. **Expandir API v1 - RAG Endpoint** ⭐⭐⭐
   - `POST /api/v1/rag?intent=query` - Consultar RAG de un chatbot vía API
   - `POST /api/v1/rag?intent=upload` - Subir contexto vía API (similar a parser)
   - `GET /api/v1/rag?intent=list` - Listar contextos del chatbot
   - Autenticación: Mismo sistema de API Keys
   - Credits: 1-2 créditos por query según complexity
   - Response format: `{ query, answer, sources[], creditsUsed }`

3. Context compression
4. CRUD Ghosty completo
5. Gemini Direct API
6. ChromaDB

---

## Email & GitHub

**AWS SES**: welcome, noUsage, trial, pro, cancel, weekSummary
**Remitente**: `Formmy <notificaciones@formmy.app>`
**GitHub Action**: Claude Code en issues/PRs

---

## Bugs Resueltos

**Oct 6 - RAG**: Instrucciones búsqueda PRIMERO en prompt
**Oct 6 - Verbosidad**: Temps óptimas + reglas concisión
**Oct 4 - Ghosty Web Search**: `businessDomain = 'Formmy'` if Ghosty
**Oct 1 - Temperature**: Validación `<= 1.5`

---

## Scripts

```bash
npx tsx scripts/audit-chatbot-embeddings.ts
npx tsx scripts/migrate-contexts-to-embeddings.ts --all --dry-run
npx tsx scripts/test-agentic-rag.ts
npx tsx scripts/migrate-temperatures.ts
```

---

## Composio Integrations - Guía Rápida

### Reglas Críticas

**1. Entity Management**
```typescript
const entityId = `chatbot_${chatbotId}`; // ✅ Correcto
```

**2. Formato execute()**
```typescript
// ✅ CORRECTO
composio.tools.execute('ACTION_NAME', {
  userId: entityId,
  arguments: { param: value }
});
```

**3. Extracción Resultados**
```typescript
const data = (result as any).data?.items || []; // ✅
```

**4. Fechas Relativas**
```typescript
// Server-side calculation
parameters: z.object({
  period: z.enum(['today', 'tomorrow', 'this_week'])
});
```

### Agregar Nueva Integración

**Paso 1**: Auth Config en Composio Dashboard

**Paso 2**: Rutas
- `/api/v1/composio/[service].ts` - loader GET retorna JSON authUrl
- `/api/v1/composio/[service].callback.ts` - HTML + postMessage

**Paso 3**: Handlers `/server/tools/handlers/`

**Paso 4**: Registrar tools `/server/tools/index.ts`

**Paso 5**: Agregar a ChatbotIntegrations

### Checklist
- [ ] Auth Config Composio
- [ ] Redirect URL
- [ ] Rutas OAuth + Callback
- [ ] Handlers
- [ ] Tools registrados
- [ ] Entity ID consistente
- [ ] Fechas relativas
- [ ] `result.data` extracción
- [ ] Error handling auth
- [ ] UI Dashboard
- [ ] Testing script
- [ ] Docs

### Testing Template
```typescript
const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });
const entityId = `chatbot_${CHATBOT_ID}`;
const connection = await composio.connectedAccounts.list({ userId: entityId });
const result = await composio.tools.execute('ACTION', { userId: entityId, arguments: {} });
```

### Troubleshooting
- ComposioError → Verificar formato execute()
- Datos vacíos → `result.data?.items`
- Fechas incorrectas → period server-side
- Not connected → OAuth completado + ACTIVE

---

## Parser API v1 ✅ (External REST API)

### Overview
API REST pública para parsear documentos con LlamaParse avanzado. Estilo LlamaCloud.

**Endpoint Base**: `https://formmy-v2.fly.dev/api/parser/v1`

### Autenticación
```bash
Authorization: Bearer sk_live_xxxxx
# O
X-API-Key: sk_live_xxxxx
```

**Gestión de Keys**: `/dashboard/api-keys`

### Endpoints

#### POST /api/parser/v1?intent=upload
```bash
curl -X POST https://formmy-v2.fly.dev/api/parser/v1?intent=upload \
  -H "Authorization: Bearer sk_live_xxxxx" \
  -F "file=@documento.pdf" \
  -F "mode=AGENTIC"
```

**Response**:
```json
{
  "id": "job_abc123",
  "status": "PENDING",
  "fileName": "documento.pdf",
  "mode": "AGENTIC",
  "creditsUsed": 3,
  "createdAt": "2025-01-18T10:00:00Z"
}
```

#### GET /api/parser/v1?intent=status&jobId=xxx
```bash
curl https://formmy-v2.fly.dev/api/parser/v1?intent=status&jobId=job_abc123 \
  -H "Authorization: Bearer sk_live_xxxxx"
```

**Response (COMPLETED)**:
```json
{
  "id": "job_abc123",
  "status": "COMPLETED",
  "markdown": "# Contenido parseado...",
  "pages": 15,
  "processingTime": 45.2,
  "creditsUsed": 3
}
```

### SDK TypeScript
**Ubicación**: `/sdk/formmy-parser.ts` (50 líneas, standalone)

```typescript
import { FormmyParser } from './sdk/formmy-parser';

const parser = new FormmyParser('sk_live_xxxxx');

// Parse
const job = await parser.parse('./doc.pdf', 'AGENTIC');
console.log(`Job ${job.id} - Créditos: ${job.creditsUsed}`);

// Wait for completion
const result = await parser.waitFor(job.id);
console.log(result.markdown);
```

### Pricing (Créditos por Página)
| Modo | Créditos/Página | Features |
|------|-----------------|----------|
| COST_EFFECTIVE | 1 | Parsing básico, rápido |
| AGENTIC | 3 | Tablas estructuradas, mejor calidad |
| AGENTIC_PLUS | 6 | OCR avanzado, imágenes, máxima precisión |

**Ejemplo de Cobro**:
- PDF de 5 páginas con AGENTIC = 5 × 3 = 15 créditos
- PDF de 9 páginas con AGENTIC = 9 × 3 = 27 créditos ✅ Match con LlamaCloud
- DOCX de 20 páginas con COST_EFFECTIVE = 20 × 1 = 20 créditos

### Rate Limits
- 1000 requests/hour por API key
- Tracking mensual automático

### Errores
- `401`: API key inválida o inactiva
- `402`: Créditos insuficientes
- `429`: Rate limit excedido

### Implementación
**Archivos clave**:
- `/app/routes/api.parser.v1.ts` - API endpoints
- `/app/routes/dashboard.api-keys.tsx` - UI gestión + docs
- `/server/llamaparse/credits.service.ts` - Validación créditos
- `/sdk/formmy-parser.ts` - SDK cliente

---

**Última actualización**: Ene 18, 2025
