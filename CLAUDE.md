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

## Integraciones con Composio (Google Calendar, etc.)

### Arquitectura de Integraciones

**Proveedor**: Composio (https://composio.dev)
**SDK**: `@composio/core` + `@composio/llamaindex`
**Auth**: OAuth2 con entity-based authentication (chatbot-level)

### ⚠️ REGLAS CRÍTICAS - Integración con Composio

#### 1. Entity Management (Chatbot-based)

Cada chatbot tiene su propia "entity" en Composio para aislar conexiones:

```typescript
// ✅ CORRECTO: Entity ID basado en chatbot
const entityId = `chatbot_${chatbotId}`;

// ❌ INCORRECTO: Usar userId directamente
const entityId = userId; // NO - mezcla cuentas de diferentes chatbots
```

**Por qué**: Un usuario puede tener múltiples chatbots, cada uno conectado a diferentes cuentas de Google Calendar.

#### 2. Formato de composio.tools.execute()

**CRÍTICO**: El formato es específico de Composio y diferente de LlamaIndex tools:

```typescript
// ✅ CORRECTO
const result = await composio.tools.execute(
  'GOOGLECALENDAR_EVENTS_LIST',  // ← Tool slug (primer parámetro)
  {
    userId: entityId,              // ← Entity ID del chatbot
    arguments: {                   // ← "arguments" no "params"
      calendarId: 'primary',
      maxResults: 10,
      timeMin: now.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    },
  }
);

// ❌ INCORRECTO (causaba ComposioError)
const result = await composio.tools.execute(
  entityId,                        // ← Entity NO va aquí
  {
    name: 'GOOGLECALENDAR_EVENTS_LIST',  // ← Formato inválido
    params: { ... }                // ← "params" no existe, usar "arguments"
  }
);
```

#### 3. Extracción de Resultados

Composio retorna datos en `result.data`, no directamente en `result`:

```typescript
// ✅ CORRECTO
const events = (result as any).data?.items || [];

// ❌ INCORRECTO (retorna array vacío aunque haya eventos)
const events = (result as any).items || [];
```

#### 4. Fechas Relativas > Fechas ISO

**PROBLEMA**: Los LLMs no conocen la fecha actual (knowledge cutoff en enero 2025)

**SOLUCIÓN**: Server-side date calculation con parámetros semánticos:

```typescript
// Tool definition
parameters: z.object({
  period: z.enum(['today', 'tomorrow', 'this_week', 'next_week', 'next_7_days', 'next_30_days']),
  maxResults: z.number().optional(),
  // timeMin/timeMax solo para casos edge, NO para uso normal
})

// Handler calculates dates server-side
function calculateDateRange(period: string) {
  const now = new Date(); // ← Fecha REAL del servidor

  switch (period) {
    case 'today':
      return { timeMin: startOfDay(), timeMax: endOfDay() };
    case 'tomorrow':
      return { timeMin: tomorrowStart(), timeMax: tomorrowEnd() };
    // etc...
  }
}
```

**Por qué**: El modelo dirá "hoy es octubre 10, 2023" cuando en realidad es 2025. Server-side date calculation previene esto.

---

### Paso a Paso: Agregar Nueva Integración con Composio

#### Paso 1: Configurar Auth en Composio Dashboard

1. Ir a https://app.composio.dev
2. Crear nuevo Auth Config para el toolkit (ej: Google Calendar)
3. Configurar OAuth redirect URL: `https://formmy-v2.fly.dev/api/v1/composio/google-calendar/callback`
4. Copiar `authConfigId` del dashboard

#### Paso 2: Crear Rutas de Autenticación

**Ruta de inicio OAuth** (`/api/v1/composio/[integration].ts`):

```typescript
// app/routes/api.v1.composio.google-calendar.ts
import { Composio } from '@composio/core';

const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const chatbotId = formData.get('chatbotId') as string;
  const userId = formData.get('userId') as string;

  // Entity ID basado en chatbot
  const entityId = `chatbot_${chatbotId}`;

  // Iniciar OAuth flow
  const connection = await composio.connectedAccounts.initiate({
    userId: entityId,
    authConfig: 'YOUR_AUTH_CONFIG_ID',
    redirectUrl: `${process.env.APP_URL}/api/v1/composio/google-calendar/callback`,
    entityId: entityId,
  });

  return redirect(connection.redirectUrl);
}
```

**Ruta de callback** (`/api/v1/composio/[integration].callback.ts`):

```typescript
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/dashboard?error=oauth_failed');
  }

  // Composio maneja el token exchange automáticamente
  // Solo redirigir al usuario de vuelta
  return redirect('/dashboard?success=calendar_connected');
}
```

#### Paso 3: Crear Handlers

**Ubicación**: `/server/tools/handlers/[integration].ts`

```typescript
import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import type { ToolContext, ToolResponse } from '../types';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

export async function listItemsHandler(
  input: {
    period?: 'today' | 'tomorrow' | 'this_week';
    maxResults?: number;
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  try {
    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && input.chatbotId
      ? input.chatbotId
      : context.chatbotId;

    const entityId = `chatbot_${targetChatbotId}`;

    // Calcular fechas server-side
    const { timeMin, timeMax } = calculateDateRange(input.period);

    // Ejecutar tool de Composio
    const result = await composio.tools.execute(
      'TOOLKIT_ACTION_NAME',
      {
        userId: entityId,
        arguments: {
          param1: input.param1,
          timeMin,
          timeMax,
        },
      }
    );

    // Extraer datos de result.data
    const items = (result as any).data?.items || [];

    if (items.length === 0) {
      return {
        success: true,
        message: '📭 No hay items disponibles.',
        data: { items: [] },
      };
    }

    // Formatear respuesta
    const itemList = items.map((item: any, i: number) =>
      `${i + 1}. **${item.title}**\n   📅 ${item.date}`
    ).join('\n\n');

    return {
      success: true,
      message: `✅ **Items encontrados** (${items.length}):\n\n${itemList}`,
      data: { items },
    };

  } catch (error: any) {
    // Manejo de errores OAuth
    if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
      return {
        success: false,
        message: '🔐 Necesitas conectar tu cuenta primero. Ve a Integraciones en tu perfil.',
        data: { needsAuth: true },
      };
    }

    return {
      success: false,
      message: `❌ Error: ${error.message || 'Error desconocido'}`,
    };
  }
}
```

#### Paso 4: Registrar Tools en `/server/tools/index.ts`

```typescript
import { z } from 'zod';
import { tool } from '@llamaindex/workflow';
import type { ToolContext } from './types';

export const createListItemsTool = (context: ToolContext) => tool(
  async ({ period, maxResults }) => {
    const { listItemsHandler } = await import('./handlers/integration-name');
    const result = await listItemsHandler({ period, maxResults }, context);
    return result.message;
  },
  {
    name: "list_items",
    description: `Listar items del servicio integrado.

**⚠️ IMPORTANTE - FECHAS RELATIVAS:**
- Para "hoy": usa period: "today"
- Para "mañana": usa period: "tomorrow"
- NUNCA calcules fechas ISO manualmente

**EJEMPLOS:**
✅ "Qué tengo hoy?" → period: "today"
✅ "Muéstrame de mañana" → period: "tomorrow"`,
    parameters: z.object({
      period: z.enum(['today', 'tomorrow', 'this_week', 'next_week']).optional()
        .describe("Período relativo: 'today', 'tomorrow', 'this_week', etc."),
      maxResults: z.number().optional().default(10)
        .describe("Número máximo de items (default: 10)"),
    })
  }
);

// Agregar al registry en getToolsForPlan()
export function getToolsForPlan(context: ToolContext): any[] {
  const tools: any[] = [];

  // ... otras tools ...

  // Agregar si chatbot tiene integración activa
  if (context.integrations?.serviceName) {
    tools.push(createListItemsTool(context));
    tools.push(createCreateItemTool(context));
    // etc...
  }

  return tools;
}
```

#### Paso 5: Agregar Integración al Modelo de Chatbot

```typescript
// En Prisma schema o donde esté definido el modelo
interface ChatbotIntegrations {
  stripe?: boolean;
  googleCalendar?: boolean;
  serviceName?: boolean; // ← Nueva integración
  whatsapp?: boolean;
}
```

---

### Checklist de Integración Completa

- [ ] Auth Config creado en Composio Dashboard
- [ ] Redirect URL configurada correctamente
- [ ] Ruta OAuth (`/api/v1/composio/[service].ts`) implementada
- [ ] Ruta Callback (`/api/v1/composio/[service].callback.ts`) implementada
- [ ] Handlers creados en `/server/tools/handlers/[service].ts`
- [ ] Tools registrados en `/server/tools/index.ts`
- [ ] Entity ID formato `chatbot_${chatbotId}` usado consistentemente
- [ ] Fechas relativas (period) implementadas, NO ISO strings manuales
- [ ] Extracción de datos usa `result.data` no `result` directamente
- [ ] Error handling para `not connected` / `authentication` implementado
- [ ] UI de conexión agregada en Dashboard/Integraciones
- [ ] Testing con script de prueba (ej: `scripts/test-composio-[service].ts`)
- [ ] Documentación actualizada en CLAUDE.md

---

### Ejemplos de Testing

**Script de prueba** (`/scripts/test-composio-service.ts`):

```typescript
import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';

const CHATBOT_ID = 'your_chatbot_id';
const ENTITY_ID = `chatbot_${CHATBOT_ID}`;

async function main() {
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new LlamaindexProvider(),
  });

  // 1. Verificar conexión
  const connection = await composio.connectedAccounts.list({
    userId: ENTITY_ID,
  });

  console.log(`Conexiones: ${connection.items.length}`);

  // 2. Ejecutar tool
  const result = await composio.tools.execute(
    'SERVICE_ACTION_NAME',
    {
      userId: ENTITY_ID,
      arguments: {
        param1: 'value1',
      },
    }
  );

  console.log('Resultado:', result);
}

main();
```

**Ejecutar con**:
```bash
bash scripts/run-composio-test.sh
```

---

### Troubleshooting Común

**Error: "ComposioError: Error executing tool"**
- ✅ Verificar formato de `composio.tools.execute()` (tool slug primero, luego objeto con userId y arguments)
- ✅ Confirmar que `entityId` tiene formato `chatbot_${chatbotId}`
- ✅ Revisar que argumentos coincidan con API del servicio

**Eventos vacíos aunque existan**
- ✅ Cambiar `result.items` a `result.data?.items`
- ✅ Verificar que el rango de fechas sea correcto (usar `period` relativo)

**Usuario dice "mañana" pero retorna eventos de 2023**
- ✅ Implementar `period` parameter con cálculo server-side
- ✅ NUNCA dejar que el LLM calcule fechas ISO manualmente

**"Not connected" error**
- ✅ Verificar que el chatbot completó el OAuth flow
- ✅ Confirmar que `entityId` es el mismo que se usó en `initiate()`
- ✅ Revisar que la conexión esté `ACTIVE` en Composio dashboard

---

## Docs Pendientes

- [ ] github.com/formmy/agent-examples (framework, ejemplos, tutoriales)
- [ ] formmy.app/docs (guías API, reference)

---

**Última actualización**: Oct 15, 2025
**Versión**: Con guía completa de integraciones Composio
