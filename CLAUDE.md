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

### 7. Sistema de Integraciones Composio - Arquitectura Simplificada (Oct 17, 2025)
⚠️ **REGLA FUNDAMENTAL**: Usar configuración declarativa centralizada, NO duplicar código

**Ubicación**: `/server/integrations/composio-config.ts` - ÚNICA FUENTE DE VERDAD

#### Problemas Anteriores (resueltos):
1. **Gmail no reconocida por Ghosty**: Integrations venían del cliente (request body), NO desde BD ❌
2. **Código duplicado masivo**: Cada integración repetía ~350 líneas de OAuth flow, handlers, callbacks ❌
3. **Fácil confusión**: Copiar/pegar código causaba errores (`toolkitSlug: 'gmail'` vs `'whatsapp'`) ❌

#### Solución Implementada (Oct 17):

**✅ 1. Ghosty carga integrations desde BD automáticamente**
```typescript
// api.ghosty.v0.ts:146-177
const userChatbots = await db.chatbot.findMany({ where: { userId: user.id } });
for (const chatbot of userChatbots) {
  const flags = await getChatbotIntegrationFlags(chatbot.id);
  integrationFlags.gmail = integrationFlags.gmail || flags.gmail;
  // ... otras integraciones
}
```

**✅ 2. Configuración Declarativa en `/server/integrations/composio-config.ts`**
```typescript
export const COMPOSIO_INTEGRATIONS: Record<string, ComposioIntegrationConfig> = {
  GMAIL: {
    name: "GMAIL",
    displayName: "Gmail",
    toolkitSlug: "gmail",  // ✅ Una sola vez, no se repite
    authMethod: "oauth2",
    authConfigEnvVar: "COMPOSIO_GMAIL_AUTH_CONFIG_ID",
    emoji: "📧",
  },
  WHATSAPP: { /* config */ },
  // ...
};
```

**Beneficios:**
- ✅ **DRY**: Una sola definición por integración (vs 500+ líneas duplicadas)
- ✅ **Type-safe**: TypeScript valida configuración
- ✅ **Fácil agregar**: Nuevo provider = agregar config + handlers (sin rutas duplicadas)
- ✅ **Menos errores**: Imposible confundir `toolkitSlug` entre integraciones

#### Agregar Nueva Integración (proceso simplificado):
1. Agregar valor al `enum IntegrationType` en `schema.prisma`
2. Agregar configuración a `COMPOSIO_INTEGRATIONS` en `/server/integrations/composio-config.ts`
3. Crear handlers en `/server/tools/handlers/[nombre].ts`
4. Registrar tools en `/server/tools/index.ts` (usar `getToolsForPlan()`)
5. ✅ **Las rutas OAuth se generan automáticamente** (futuro: usar factory pattern)

#### Debugging Integraciones:
```bash
# Verificar integrations cargadas por Ghosty
grep "🔌 \[Ghosty\] Cargando integraciones" logs.txt

# Verificar tools disponibles
grep "🛠️ \[getToolsForPlan\]" logs.txt
```

**Documentación extendida**: Ver sección "Integraciones con Composio" más abajo para OAuth flows, testing, troubleshooting.

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

⚠️ **NUEVO SISTEMA (Oct 17, 2025)**: Todas las integraciones están centralizadas en `/server/integrations/composio-config.ts`. Ver sección "Sistema de Integraciones Composio" arriba para la arquitectura completa.

### WhatsApp + Composio (Oct 17, 2025) ✅
**Status**: ✅ **ACTIVO** - Integración completa con Composio para tools de agentes
**Features**: Embedded Signup, Meta SDK, webhook interno, filtrado echo, **Tools para agentes**
**Provider**: Composio (gestión de tokens y API calls)
**Meta App Review**: ⏳ Pendiente Advanced Access (1-2 semanas)
**Config**: `/server/integrations/composio-config.ts:COMPOSIO_INTEGRATIONS.WHATSAPP`

#### Arquitectura de Integración

**Flow de Conexión:**
1. Usuario → Embedded Signup de Meta → obtiene `accessToken`, `phoneNumberId`
2. Frontend → POST `/api/v1/composio/whatsapp?intent=connect` con tokens
3. Backend → Registra en Composio con `AuthScheme.APIKey({ api_key: accessToken })`
4. Composio → Gestiona tokens, refresh automático, API calls a Meta

**Entity ID Pattern**: `chatbot_${chatbotId}` (cada chatbot = entity separada)

#### Tools Disponibles (via `/server/tools/index.ts`)

| Tool | Plan | Descripción | Handler |
|------|------|-------------|---------|
| `send_whatsapp_message` | PRO/ENT/TRIAL | Enviar mensajes de WhatsApp | `/server/tools/handlers/whatsapp.ts:sendWhatsAppMessageHandler` |
| `list_whatsapp_conversations` | PRO/ENT/TRIAL | Listar conversaciones recientes | `/server/tools/handlers/whatsapp.ts:listWhatsAppConversationsHandler` |
| `get_whatsapp_stats` | PRO/ENT/TRIAL (Ghosty only) | Estadísticas de WhatsApp del chatbot | `/server/tools/handlers/whatsapp.ts:getWhatsAppStatsHandler` |

**Acceso por Plan:**
- **Ghosty (PRO/ENT/TRIAL)**: Todas las tools (puede enviar en nombre de chatbots del usuario)
- **Chatbots públicos (PRO/ENT/TRIAL)**: `send_whatsapp_message`, `list_whatsapp_conversations`
- **STARTER/FREE**: ❌ Sin access a tools (solo recepción de mensajes)

#### Rutas de API

**Conexión/Gestión:**
- `GET /api/v1/composio/whatsapp?intent=status&chatbotId={id}` - Verificar estado
- `POST /api/v1/composio/whatsapp?intent=connect` - Conectar con tokens de Meta
- `GET /api/v1/composio/whatsapp?intent=disconnect&chatbotId={id}` - Desconectar

**Variables de Entorno Requeridas:**
```bash
COMPOSIO_API_KEY=<tu_api_key_de_composio>
COMPOSIO_WHATSAPP_AUTH_CONFIG_ID=<auth_config_id_de_dashboard>
```

#### Composio Actions Disponibles

**Docs oficiales**: https://docs.composio.dev/toolkits/whatsapp

Actions principales: `WHATSAPP_SEND_MESSAGE`, `WHATSAPP_SEND_TEMPLATE_MESSAGE`, `WHATSAPP_SEND_MEDIA`, `WHATSAPP_SEND_INTERACTIVE_BUTTONS`, `WHATSAPP_GET_MESSAGE_TEMPLATES`

#### Testing

**Script de prueba**: `/scripts/test-composio-whatsapp.ts`

```bash
# Ejecutar test end-to-end
bash scripts/run-whatsapp-test.sh

# O manualmente
export TEST_CHATBOT_ID=your_chatbot_id
export TEST_PHONE_NUMBER=+521234567890
npx tsx scripts/test-composio-whatsapp.ts
```

**Verifica:**
1. Conexión activa en Composio
2. phone_number_id en BD
3. Envío de mensaje de prueba
4. Tools disponibles

#### Troubleshooting Común

**"not connected" o "authentication"**
→ Verificar que completó Embedded Signup y que `connectedViaComposio: true` en whatsappConfig

**Mensajes no se envían**
→ Verificar que destinatario envió primer mensaje (restricción WhatsApp Business)

**phone_number_id faltante**
→ Asegurar que Embedded Signup guardó `phoneNumberId` en `chatbot.whatsappConfig`

**Composio error 400**
→ Revisar formato de `execute()` (tool slug primero, luego objeto con userId y arguments)

---

### Gmail + Composio (Oct 17, 2025) ✅
**Status**: ✅ **ACTIVO** - Integración completa con OAuth2 para enviar/leer emails
**Features**: OAuth2 flow, envío de emails, lectura de inbox, búsquedas, **Tools para agentes**
**Provider**: Composio (gestión de tokens OAuth2 y refresh automático)
**Auth Method**: OAuth2 (usuario autoriza con su cuenta de Google)
**Config**: `/server/integrations/composio-config.ts:COMPOSIO_INTEGRATIONS.GMAIL`

🔧 **Bugs Resueltos (Oct 17)**:
1. **Integrations no cargadas**: Gmail tools no eran reconocidas por Ghosty porque las integrations venían del request body en lugar de cargarse desde BD. ✅ Solucionado en `api.ghosty.v0.ts:146-177`.
2. **Detección de conexiones fallaba**: Handler buscaba `conn.appName === 'gmail'` pero Composio usa `conn.toolkit.slug`. ✅ Solucionado usando estructura oficial de Composio (ver Troubleshooting abajo).

#### Arquitectura de Integración

**Flow de Conexión OAuth2:**
1. Usuario → Clic en "Conectar Gmail" en Formmy
2. Frontend → POST `/api/v1/composio/gmail?intent=connect` con `chatbotId`
3. Backend → `composio.connectedAccounts.initiate()` con `authConfigId` OAuth2
4. Composio → Genera `redirectUrl` de Google OAuth
5. Backend → Redirige usuario a Google para autorizar
6. Usuario → Autoriza acceso a Gmail en popup de Google
7. Google → Callback a Composio (https://backend.composio.dev/api/v3/toolkits/auth/callback)
8. Composio → Guarda conexión y redirige a `/dashboard/chatbots/{chatbotId}/settings?gmail_connected=true`
9. ✅ Gmail conectado (Composio maneja token refresh automáticamente, BD guarda pending connection)

**Entity ID Pattern**: `chatbot_${chatbotId}` (cada chatbot = entity separada)

#### Tools Disponibles (via `/server/tools/index.ts`)

| Tool | Plan | Descripción | Handler |
|------|------|-------------|---------|
| `send_gmail` | PRO/ENT/TRIAL | Enviar emails desde Gmail del usuario | `/server/tools/handlers/gmail.ts:sendGmailHandler` |
| `read_gmail` | PRO/ENT/TRIAL | Leer/buscar emails en inbox del usuario | `/server/tools/handlers/gmail.ts:readGmailHandler` |

**Acceso por Plan:**
- **Ghosty (PRO/ENT/TRIAL)**: Todas las tools (puede enviar/leer Gmail en nombre de chatbots del usuario)
- **Chatbots públicos (PRO/ENT/TRIAL)**: `send_gmail`, `read_gmail` (si Gmail conectado)
- **STARTER/FREE**: ❌ Sin access a Gmail tools

**Capacidades de send_gmail:**
- Enviar a múltiples destinatarios (to, cc, bcc)
- Soporte HTML (`is_html: true`)
- Subject y body opcionales (al menos uno requerido)
- Email se envía desde la cuenta de Gmail del usuario autenticado

**Capacidades de read_gmail:**
- Búsqueda con query (ej: `from:juan@example.com`, `subject:importante`)
- Filtros por etiquetas (INBOX, SENT, UNREAD, SPAM, TRASH)
- Máximo 10 emails por consulta
- Retorna: remitente, asunto, snippet (preview)

#### Rutas de API

**Conexión/Gestión:**
- `POST /api/v1/composio/gmail?intent=connect` - Iniciar OAuth flow (redirige a Google)
- `GET /api/v1/composio/gmail?intent=status&chatbotId={id}` - Verificar estado de conexión
- `GET /api/v1/composio/gmail?intent=disconnect&chatbotId={id}` - Desconectar Gmail

**Nota sobre Callback OAuth:**
- Composio maneja el callback automáticamente en `https://backend.composio.dev/api/v3/toolkits/auth/callback`
- Después de autorizar, redirige al usuario a: `/dashboard/chatbots/{chatbotId}/settings?gmail_connected=true`
- NO necesitamos una ruta de callback personalizada (a diferencia de Google Calendar)

**Variables de Entorno Requeridas:**
```bash
COMPOSIO_API_KEY=<tu_api_key_de_composio>
COMPOSIO_GMAIL_AUTH_CONFIG_ID=<auth_config_id_de_dashboard>
APP_URL=https://formmy-v2.fly.dev  # Para redirect_uri del OAuth
```

#### Composio Actions Disponibles

**Docs oficiales**: https://docs.composio.dev/toolkits/gmail

Actions principales:
- `GMAIL_SEND_EMAIL` - Enviar email (con cc, bcc, attachments, HTML)
- `GMAIL_FETCH_EMAILS` - Buscar/leer emails con filtros
- `GMAIL_SEND_DRAFT` - Enviar borrador existente
- `GMAIL_CREATE_EMAIL_DRAFT` - Crear borrador
- `GMAIL_FETCH_MESSAGE_BY_MESSAGE_ID` - Leer email específico por ID

#### Testing

**Script de prueba**: `/scripts/test-composio-gmail.ts`

```bash
# Ejecutar test end-to-end
bash scripts/run-gmail-test.sh

# O manualmente
export TEST_CHATBOT_ID=your_chatbot_id
export TEST_RECIPIENT_EMAIL=tu_email@example.com
npx tsx scripts/test-composio-gmail.ts
```

**Verifica:**
1. `COMPOSIO_GMAIL_AUTH_CONFIG_ID` configurado en .env
2. Conexión OAuth activa en Composio
3. Envío de email de prueba
4. Lectura de últimos 5 emails
5. Tools disponibles para el chatbot

#### Crear Auth Config en Composio Dashboard

**Paso 1 - Obtener Credenciales de Google Cloud:**
1. Ve a https://console.cloud.google.com/apis/credentials
2. Crea proyecto nuevo o selecciona existente
3. Habilita **Gmail API**
4. Crear credenciales → **OAuth 2.0 Client ID**
5. Tipo de aplicación: **Web application**
6. Authorized redirect URIs: `https://backend.composio.dev/api/v1/auth-apps/add`
7. Copia `Client ID` y `Client Secret`

**Paso 2 - Crear Auth Config en Composio:**
1. Ve a https://platform.composio.dev/marketplace/gmail
2. Clic en **"Create Gmail Auth Config"**
3. Selecciona **OAuth2**
4. Pega `Client ID` y `Client Secret` de Google
5. Scopes (ya pre-configurados):
   - `https://mail.google.com/` (acceso completo a Gmail)
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`
6. Guarda y copia el **Auth Config ID** (empieza con `ac_`)
7. Agrega a `.env`: `COMPOSIO_GMAIL_AUTH_CONFIG_ID=ac_YOUR_ID_HERE`

#### Troubleshooting Común

**"not connected" o "authentication"**
→ Verificar que el usuario completó el OAuth flow de Google y que la conexión esté `ACTIVE` en Composio

**"COMPOSIO_GMAIL_AUTH_CONFIG_ID no está configurado"**
→ Crear Auth Config en Composio dashboard (ver sección anterior)

**OAuth callback falla con 404**
→ Verificar que `APP_URL` en .env apunte a tu dominio correcto (ej: `https://formmy-v2.fly.dev`)

**Composio error "invalid_grant"**
→ Token expiró, usuario debe re-autorizar (desconectar y volver a conectar Gmail)

**Email no se envía pero no hay error**
→ Verificar que `recipient_email` sea válido y que el usuario autenticado tenga permisos de envío

**"insufficient permissions"**
→ Verificar que los scopes de OAuth incluyan `https://mail.google.com/` (Gmail full access)

**Error Prisma: "Invalid value for argument `platform`. Expected IntegrationType"**
→ Asegurar que `GMAIL` esté en el enum `IntegrationType` del schema de Prisma:
```prisma
enum IntegrationType {
  WHATSAPP
  GOOGLE_CALENDAR
  GMAIL        // ← Debe estar presente
  STRIPE
}
```
→ Correr `npx prisma generate` después de agregar el valor al enum

**🐛 CRÍTICO: Detección de conexiones fallaba (Oct 17)**
→ **Problema**: Handler buscaba `conn.appName === 'gmail'` pero Composio NO usa `appName`
→ **Estructura oficial** (según `@composio/client` tipos):
```typescript
interface ConnectedAccountListResponse.Item {
  id: string;
  status: 'ACTIVE' | 'INACTIVE' | 'FAILED' | ...;
  is_disabled: boolean;
  toolkit: { slug: string };  // ← AQUÍ está el toolkit, NO appName
  // ... otros campos
}
```

→ **Solución correcta** (`gmail.ts:94-106`):
```typescript
// ✅ CORRECTO según docs oficiales
const connection = connections.items.find(conn =>
  conn.status === 'ACTIVE' &&
  !conn.is_disabled &&
  conn.toolkit?.slug === 'gmail'
);

// Fallback: toolkitSlugs ya filtró, tomar primera ACTIVE
const final = connection || connections.items.find(
  conn => conn.status === 'ACTIVE' && !conn.is_disabled
);
```

→ **Por qué funcionó antes**: El fallback rescató la funcionalidad, pero era un bug enmascarado
→ **Lección**: NO asumir estructura de APIs externas, revisar tipos oficiales primero

#### Diferencias con WhatsApp Integration

| Aspecto | WhatsApp | Gmail |
|---------|----------|-------|
| **Auth Method** | API Key (accessToken de Meta) | OAuth2 (usuario autoriza) |
| **Token Management** | Manual (Embedded Signup) | Automático (Composio refresh) |
| **User Flow** | Meta Embedded Signup → tokens | OAuth popup → autorización |
| **Webhook** | Sí (recibir mensajes) | No (solo enviar/leer) |
| **Restricciones** | Destinatario debe enviar 1er msg | Ninguna (envío libre) |

---

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

**⚠️ PATRÓN CORRECTO**: GET (loader) que retorna JSON con authUrl + Frontend abre popup

**Ruta principal** (`/api/v1/composio/[integration].ts`):

```typescript
// app/routes/api.v1.composio.gmail.ts
import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import { getSession } from '~/sessions';
import { db } from '~/utils/db.server';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

/**
 * GET /api/v1/composio/gmail?intent=connect|status|disconnect&chatbotId=xxx
 * ✅ USAR LOADER (GET), NO ACTION (POST)
 */
export async function loader({ request }: any) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const chatbotId = url.searchParams.get("chatbotId");

  // Autenticación y validación...
  const session = await getSession(request.headers.get("Cookie"));
  const user = await db.user.findFirst({ where: { id: session.get("userId") } });
  const chatbot = await db.chatbot.findFirst({ where: { id: chatbotId, userId: user.id } });

  const entityId = `chatbot_${chatbotId}`;

  switch (intent) {
    case "connect":
      return handleConnect(entityId, chatbotId, request);
    case "status":
      return handleStatus(entityId);
    case "disconnect":
      return handleDisconnect(entityId, chatbotId);
  }
}

/**
 * ✅ RETORNAR JSON CON authUrl (NO redirect directo)
 * Frontend abrirá esta URL en popup
 */
async function handleConnect(entityId: string, chatbotId: string, request: Request) {
  const authConfigId = process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID;
  const requestUrl = new URL(request.url);
  const baseUrl = `${requestUrl.protocol}//${requestUrl.host}`;

  const connection = await composio.connectedAccounts.initiate(
    entityId,
    authConfigId,
    {
      callbackUrl: `${baseUrl}/api/v1/composio/gmail/callback?chatbotId=${chatbotId}`,
    }
  );

  // ✅ Retornar JSON (no redirect)
  return new Response(
    JSON.stringify({
      success: true,
      authUrl: connection.redirectUrl,
      entityId,
      chatbotId,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}
```

**Ruta de callback** (`/api/v1/composio/[integration].callback.ts`):

```typescript
/**
 * ✅ CALLBACK CON HTML + postMessage
 * Composio redirige aquí después de OAuth exitoso
 */
export async function loader({ request }: any) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const connectedAccountId = url.searchParams.get("connectedAccountId");
  const chatbotId = url.searchParams.get("chatbotId");

  // Manejo de errores
  if (status && status !== 'success') {
    return new Response(`
      <!DOCTYPE html>
      <html>
        <body>
          <h1>❌ Error</h1>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'composio_oauth_error',
                error: 'composio_error',
                description: 'Status: ${status}'
              }, '*');
            }
            setTimeout(() => window.close(), 3000);
          </script>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }

  // ✅ Éxito: Guardar en BD + postMessage + HTML con countdown
  if (status === 'success' && connectedAccountId) {
    await db.integration.upsert({
      where: { platform_chatbotId: { platform: 'GMAIL', chatbotId } },
      create: {
        platform: 'GMAIL',
        chatbotId,
        isActive: true,
        token: connectedAccountId,
        lastActivity: new Date(),
      },
      update: {
        isActive: true,
        token: connectedAccountId,
        lastActivity: new Date(),
      },
    });

    return new Response(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 3rem;
              border-radius: 16px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
              animation: slideIn 0.5s ease-out;
            }
            @keyframes slideIn {
              from { opacity: 0; transform: translateY(-20px); }
              to { opacity: 1; transform: translateY(0); }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div style="font-size: 4rem;">✅</div>
            <h1>¡Autorización Exitosa!</h1>
            <p>Gmail conectado correctamente.</p>
            <p><strong>Cerrando en <span id="countdown">3</span>s...</strong></p>
          </div>
          <script>
            // ✅ CRÍTICO: Notificar a ventana padre INMEDIATAMENTE
            if (window.opener && !window.opener.closed) {
              window.opener.postMessage({
                type: 'composio_oauth_success',
                provider: 'gmail',
                message: 'Gmail conectado exitosamente'
              }, window.location.origin);
            }

            // Countdown y cerrar ventana
            let seconds = 3;
            const countdownEl = document.getElementById('countdown');
            const interval = setInterval(() => {
              seconds--;
              if (countdownEl) countdownEl.textContent = seconds.toString();
              if (seconds <= 0) {
                clearInterval(interval);
                window.close();
                setTimeout(() => {
                  if (!window.closed) {
                    window.location.href = '/dashboard?integration=success';
                  }
                }, 500);
              }
            }, 1000);
          </script>
        </body>
      </html>
    `, { headers: { "Content-Type": "text/html" } });
  }
}
```

**Frontend Modal (React)**:

```typescript
const handleConnect = async () => {
  try {
    // Paso 1: Obtener authUrl del backend
    const response = await fetch(
      `/api/v1/composio/gmail?intent=connect&chatbotId=${chatbot.id}`,
      { method: 'GET', credentials: 'include' }
    );
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error);
    }

    // Paso 2: Abrir popup con authUrl
    const popup = window.open(
      data.authUrl,
      'gmail_oauth',
      'width=600,height=700,left=100,top=100'
    );

    // Paso 3: Escuchar postMessage desde callback
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'composio_oauth_success') {
        // ✅ Éxito
        setIsConnected(true);
        onClose();
      } else if (event.data.type === 'composio_oauth_error') {
        // ❌ Error
        setError(event.data.description);
      }
      window.removeEventListener('message', handleMessage);
    };

    window.addEventListener('message', handleMessage);

    // Limpiar listener si popup se cierra manualmente
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleMessage);
      }
    }, 1000);
  } catch (err) {
    setError(err.message);
  }
};
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
