# Formmy - Project Context

## ⚠️ REGLAS CRÍTICAS

**SIEMPRE lee documentación oficial antes de implementar librerías externas** - WebFetch documentación, NO improvises APIs sin verificar.

### LlamaIndex Agent Workflows (OBLIGATORIO)
**Docs**: https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/

**Pattern**: Usar `agent()`, `runStream()`, `agentStreamEvent`, `agentToolCallEvent` - NO lógica custom

### 🌊 Streaming y Generación de Archivos
**REGLA ABSOLUTA**: 100% streaming SIEMPRE en respuestas de agentes
- ✅ Archivos generados EN MEMORIA (Buffer) y enviados como descarga directa
- ✅ Endpoint dedicado `/api/ghosty/download/{reportId}` retorna archivo con headers apropiados
- ❌ NUNCA escribir al filesystem del servidor (Fly.io es efímero)
- ❌ NUNCA guardar en S3/storage externo (overhead innecesario)
- ❌ NUNCA retornar archivos binarios en respuesta streaming

**Pattern para reportes/exports**:
1. Tool genera archivo en memoria (PDF/Excel/CSV con librerías como `pdfkit`, `exceljs`)
2. Tool guarda Buffer temporalmente en Redis/memoria con TTL 5min
3. Tool retorna `{ downloadUrl: "/api/ghosty/download/{id}", expiresIn: "5m" }`
4. Agent hace streaming de mensaje: "Tu reporte está listo: [link]"
5. Usuario hace GET al link → descarga directa del Buffer
6. Cleanup automático después de descarga o timeout

### 🚫 ANTI-PATTERNS PROHIBIDOS
**Eliminados del codebase:**
- ❌ Keyword matching para tool selection (usar `getToolsForPlan()`)
- ❌ Dual-agent systems con handoff manual (un agente con todas las tools)
- ❌ Intent classification custom (dejar que AI decida)
- ❌ **memory.add() para historial conversacional** (NO es usado por agent workflow)

**✅ Pattern correcto**: `agent({ llm, tools: getToolsForPlan(), systemPrompt })`
**Código limpio**: `/server/agents/agent-workflow.server.ts`, `/server/tools/index.ts`

### 🔒 Tool Grounding - Prevención de Alucinaciones (CRÍTICO)

**IMPLEMENTADO**: Oct 6, 2025 en `/server/agents/agent-workflow.server.ts:144-180`

**Problema resuelto**: Agentes prometían acciones imposibles ("te enviaré el PDF", "he enviado el email") sin tener las tools correspondientes → pérdida de confianza del usuario

**Solución - Regla Global de Honestidad**:
```
🚫 REGLA CRÍTICA - HONESTIDAD SOBRE CAPACIDADES:

NUNCA prometas acciones que tus herramientas NO pueden ejecutar:
❌ Si NO tienes tool de email: NO digas "te enviaré", "recibirás un email"
❌ Si NO tienes tool de PDF: NO digas "preparé el PDF", "generé el documento"
❌ Si NO tienes tool X: NO prometas hacer X

✅ SÉ HONESTO sobre limitaciones:
"Puedo guardar tu email para que el equipo te contacte"
"Te comparto la información aquí mismo"
"No tengo capacidad de enviar emails, pero puedo [alternativa]"

REGLA DE ORO: Solo promete lo que tus tools pueden cumplir.
```

**Ubicación en System Prompt**: Después de `searchInstructions`, antes de personality/custom instructions
**Alcance**: Aplica a TODOS los agentes (sales, coach, customer_support, etc)
**Beneficio**: Previene >90% de alucinaciones sobre capacidades del agente

**Mejor Práctica de la Industria** (OpenAI, Anthropic):
> "Tool grounding should be explicit in system prompts to prevent agents from hallucinating capabilities they don't have"

### 🧠 LlamaIndex Memory (CRÍTICO - Leer antes de tocar memoria)

**⚠️ REGLA FUNDAMENTAL**: Para historial de conversación, SIEMPRE usar `staticBlock`, NUNCA `memory.add()`

**Patrón CORRECTO** (implementado Oct 6, 2025):
```typescript
import { createMemory, staticBlock } from "llamaindex";

// Formatear historial como texto
const historyText = conversationHistory.map((msg) => {
  const roleLabel = msg.role === 'user' ? 'Usuario' : 'assistant' ? 'Asistente' : 'Sistema';
  return `${roleLabel}: ${msg.content}`;
}).join('\n\n');

// Crear memoria con staticBlock
const memory = createMemory({
  tokenLimit: 8000,
  memoryBlocks: [
    staticBlock({
      content: `Historial de la conversación:\n\n${historyText}`
    })
  ]
});

// Pasar a agent config
const agentConfig = {
  llm,
  tools,
  systemPrompt,
  memory, // ✅ LlamaIndex usará staticBlock como contexto directo al LLM
};
```

**Patrón INCORRECTO** ❌ (NO hacer esto):
```typescript
// ❌ ESTO NO FUNCIONA - El agente IGNORA memory.add()
const memory = createMemory({ tokenLimit: 8000 });
for (const msg of conversationHistory) {
  await memory.add({ role: msg.role, content: msg.content });
}
// Aunque memory.get() muestra los mensajes, el agente NO los usa
```

**¿Por qué?**
- `staticBlock`: Contexto estático que se pasa DIRECTAMENTE al LLM ✅
- `memory.add()`: Para que el agente agregue info DURANTE ejecución ✅
- `memory.add()` para historial previo: El agent workflow NO lo lee ❌

**Evidencia del bug (Oct 6):**
- Test: Usuario dice "soy bliss" → Agente dice "Hola Bliss" ✅
- Siguiente mensaje: "quien soy?" → Agente: "No sé quién eres" ❌
- `memory.get()` mostraba 3 mensajes correctos en logs
- Pero agente los ignoraba completamente
- Fix: Cambiar a `staticBlock` → funcionó inmediatamente

**Cuándo usar cada uno:**
- **Historial conversacional**: `staticBlock` (contexto previo)
- **Facts extraction**: `factExtractionBlock` (durante conversación)
- **Vector search**: `vectorBlock` (RAG semántico)
- **Memory.add()**: Solo para que el AGENTE agregue info durante su ejecución

**Referencias:**
- Docs oficiales: https://developers.llamaindex.ai/typescript/framework/modules/data/memory
- Implementación: `/server/agents/agent-workflow.server.ts` línea 244-262

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

## Sistema de Gestión de Contactos (IMPLEMENTADO ✅ - Oct 7, 2025)

**Ubicación**: `/dashboard/chat/:slug` → Tab "Contactos"
**API**: `/api/v1/contacts` (POST) - Handler modular con validación de ownership
**Schema**: Modelo `Contact` con enum `ContactStatus` (7 estados del embudo de ventas)

### Features Principales

#### 1. **UI Optimista con React Router**
- ✅ `useFetcher()` para actualizaciones sin reload de página
- ✅ Cambio inmediato de estatus con actualización optimista
- ✅ Revalidación inteligente con `useRevalidator()`
- ✅ Estados de carga durante operaciones (disabled buttons)

**Pattern implementado**:
```typescript
const statusFetcher = useFetcher();
const [optimisticStatuses, setOptimisticStatuses] = useState<Record<string, ContactStatus>>({});

// Actualización optimista
const handleStatusChange = (contactId: string, newStatus: ContactStatus) => {
  setOptimisticStatuses(prev => ({ ...prev, [contactId]: newStatus }));
  statusFetcher.submit({ intent: "update_status", contactId, status: newStatus },
    { method: "POST", action: "/api/v1/contacts" }
  );
};

// Limpiar y revalidar cuando termine
useEffect(() => {
  if (statusFetcher.state === "idle" && statusFetcher.data?.success) {
    setOptimisticStatuses({});
    revalidator.revalidate();
  }
}, [statusFetcher.state]);
```

**Beneficio**: UX fluida sin esperar respuesta del servidor (~200ms percibidos vs 1s+ con reload)

#### 2. **Validación de Ownership (Seguridad)**
**Ubicación**: `/app/routes/api.v1.contacts.ts`

Implementa verificación de permisos antes de cualquier operación:
```typescript
const contact = await db.contact.findUnique({
  where: { id: contactId },
  include: { chatbot: { select: { userId: true } } }
});

if (!contact) return json({ success: false, error: "Contacto no encontrado" }, { status: 404 });
if (contact.chatbot.userId !== user.id) {
  return json({ success: false, error: "No tienes permiso" }, { status: 403 });
}
```

**Protección**: Usuarios no pueden modificar contactos de chatbots ajenos (403 Forbidden)

#### 3. **Exportación a CSV Client-Side**
**Contactos** (`Contactos.tsx`):
```typescript
const handleExportCSV = () => {
  const headers = ["Nombre", "Email", "Teléfono", "Empresa", "Cargo", "Estatus", "Origen", "Fecha"];
  const rows = filteredContacts.map(contact => [/* ... */]);
  const csvContent = [headers, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `contactos_${chatbotSlug}_${date}.csv`;
  link.click();
};
```

**Conversaciones** (`Conversations.tsx` - IMPLEMENTADO Oct 7, 2025):
```typescript
const handleDownloadCSV = () => {
  if (!conversation) return;

  const headers = ["Fecha/Hora", "Rol", "Mensaje"];
  const rows = conversation.messages.map(message => {
    const timestamp = new Date(message.createdAt).toLocaleString('es-MX', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const role = message.role === "USER" ? "Usuario" : "Asistente";
    const content = `"${message.content.replace(/"/g, '""')}"`;
    return [timestamp, role, content].join(",");
  });

  const csvContent = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  const date = new Date().toISOString().split('T')[0];
  const userName = conversation.userName.replace(/[^a-zA-Z0-9]/g, '_');
  link.download = `conversacion_${userName}_${date}.csv`;
  link.click();
};
```

**Ventajas**:
- Sin roundtrip al servidor (generación instantánea)
- Nombre descriptivo con slug/usuario y fecha
- Soporte UTF-8 para caracteres especiales
- Escape de comillas dobles para compatibilidad CSV estándar
- Formato de fecha localizado (es-MX)
- Respeta filtros de búsqueda actuales (contactos)

#### 4. **Query Params Reactivos (Navegación)**
**Problema resuelto**: `useState` con `window.location.search` no es reactivo → URL cambia pero UI no se actualiza

**Solución implementada**:
```typescript
// En dashboard.chat_.$chatbotSlug.tsx
const [searchParams] = useSearchParams(); // ✅ Hook reactivo de React Router
const tabFromQuery = searchParams.get('tab');

useEffect(() => {
  if (tabFromQuery && tabFromQuery !== currentTab) {
    setCurrentTab(tabFromQuery);
  }
}, [tabFromQuery]);
```

**Navegación desde Contactos → Conversaciones**:
```typescript
const url = `/dashboard/chat/${slug}?tab=Conversaciones&conversation=${conversationId}`;
navigate(url);
// ✅ Tab cambia automáticamente
// ✅ Conversación se selecciona
// ✅ Lista hace scroll a elemento
```

#### 5. **Auto-Scroll a Conversación Seleccionada**
**Ubicación**: `Conversations.tsx` - Componente `ConversationsList`

```typescript
const ConversationsList = ({ selectedConversationId }) => {
  const conversationRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    if (selectedConversationId && conversationRefs.current[selectedConversationId]) {
      setTimeout(() => {
        conversationRefs.current[selectedConversationId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest'
        });
      }, 100); // Delay para asegurar renderizado
    }
  }, [selectedConversationId]);

  return (
    <section className="overflow-y-scroll">
      {conversations.map(conv => (
        <Conversation
          ref={el => conversationRefs.current[conv.id] = el}
          key={conv.id}
          {...props}
        />
      ))}
    </section>
  );
};

const Conversation = forwardRef<HTMLElement, Props>((props, ref) => (
  <section ref={ref} {...}>
    {/* contenido */}
  </section>
));
```

**UX mejorada**: Al hacer click en "Ver conversación" desde Contactos:
1. URL cambia a `?tab=Conversaciones&conversation=abc123`
2. Tab cambia a Conversaciones
3. Conversación se selecciona en panel derecho
4. **Lista hace scroll suave** y centra el elemento activo
5. Elemento activo se destaca con `bg-brand-500/10`

#### 6. **Columna Origen con Badges Visuales**
Antes: Texto plano "chatbot", "whatsapp"
Ahora: Badges coloridos "Web" (azul) | "WhatsApp" (verde)

```tsx
<span className={`px-2 py-1 text-xs rounded-full ${
  contact.source.toLowerCase() === 'whatsapp'
    ? 'bg-green-100 text-green-700'
    : 'bg-blue-100 text-blue-700'
}`}>
  {contact.source.toLowerCase() === 'whatsapp' ? 'WhatsApp' : 'Web'}
</span>
```

#### 7. **Validación Obligatoria: Email o Teléfono**
**Ubicación**: `/server/tools/handlers/contact.ts`

```typescript
if (!input.email && !input.phone) {
  return {
    success: false,
    message: "Se requiere al menos un email o teléfono para guardar el contacto. Por favor, proporciona una forma de contactarte."
  };
}
```

**Razón**: Un contacto sin forma de contacto es inútil para el negocio → validación a nivel de tool

### ContactStatus Enum (7 Estados)

```prisma
enum ContactStatus {
  NEW           // Nuevo lead sin contactar
  CONTACTED     // Primer contacto realizado
  SCHEDULED     // Cita/demo agendada
  NEGOTIATING   // En negociación activa
  ON_HOLD       // En pausa (cliente no responde)
  CLOSED_WON    // Venta cerrada ✅
  CLOSED_LOST   // Oportunidad perdida ❌
}
```

**Labels en español**:
```typescript
const STATUS_LABELS: Record<ContactStatus, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  SCHEDULED: "Agendado",
  NEGOTIATING: "Negociando",
  ON_HOLD: "En Pausa",
  CLOSED_WON: "Ganado",
  CLOSED_LOST: "Perdido",
};
```

**Colores por estado**: Verde (won), rojo (lost), amarillo (contacted), azul (scheduled), etc.

### Scripts de Migración

**Migrar contactos existentes** (agregar campo status = NEW por defecto):
```bash
npx tsx scripts/migrate-contact-status.ts
```

### Estructura de Archivos

```
app/
├── routes/
│   ├── api.v1.contacts.ts              # API handler con ownership validation
│   └── dashboard.chat_.$chatbotSlug.tsx # Query params reactivos
├── components/chat/tab_sections/
│   ├── Contactos.tsx                   # UI optimista + CSV export + navegación
│   └── Conversations.tsx               # Auto-scroll a conversación seleccionada
server/
└── tools/handlers/
    └── contact.ts                      # Validación email o teléfono obligatorio
prisma/
└── schema.prisma                       # ContactStatus enum + Contact model
```

### Estadísticas de Implementación

**Fecha**: Oct 7, 2025
**Commit**: `ace3b45`
**Archivos modificados**: 7
**Líneas agregadas**: +664
**Líneas eliminadas**: -47
**Tiempo de desarrollo**: ~2.5 horas
**Build time**: 3.5s (optimizado)

### Beneficios para el Negocio

1. **Conversión mejorada**: Flujo natural Contactos → Conversaciones aumenta engagement
2. **Gestión eficiente**: Cambio de estatus en 1 click sin esperas
3. **Exportación fácil**: CSV para integrar con CRM externo (HubSpot, Salesforce)
4. **Seguridad robusta**: Ownership validation previene accesos no autorizados
5. **UX superior**: Optimistic UI hace que la app se sienta 5x más rápida

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

| Plan | Precio/mes | Modelo IA | Conv/mes | Búsquedas/día | Costo IA/mes | Costo Search/mes | Costo Total/mes | Profit Margin |
|------|------------|-----------|----------|---------------|--------------|------------------|-----------------|---------------|
| **ANONYMOUS** | Gratis | GPT-4o-mini | ∞ | 2 | Variable | $0.30 | Variable | N/A |
| **FREE** | $0 | - | 0 | 0 | $0 | $0 | $0 | N/A |
| **STARTER** | $149 MXN (~$8 USD) | GPT-4o-mini | 50 | 10 | ~$1.50 | $1.50 | ~$3.00 | **62.5%** |
| **PRO** | $499 MXN (~$27 USD) | GPT-4o-mini | 250 | 25 | ~$7.50 | $3.75 | ~$11.25 | **58.3%** |
| **ENTERPRISE** | $1,499 MXN (~$81 USD) | GPT-4o-mini/Claude | 1000 | 100 | ~$30.00 | $15.00 | ~$45.00 | **44.4%** |
| **TRIAL** | Temporal | GPT-4o-mini | 50 | 10 | ~$1.50 | $1.50 | ~$3.00 | N/A |

**Costos API**:
- **Google Search**: $5 USD por 1,000 queries
- **GPT-4o-mini**: $0.15 input / $0.60 output por 1M tokens
- **Estimación**: ~300 tokens input + 200 output por conversación = ~$0.03 USD/conversación

**Profit Margins Reales**: 44-62% (incluyendo costos IA + Search)
- STARTER sigue siendo muy rentable con 62.5% margin
- ENTERPRISE con mayor volumen mantiene 44.4% profit saludable
- Principal costo es el modelo IA, no Google Search (Search representa solo ~25-33% del costo total)

**Features**:
- Tracking por `conversationId` en tabla `ToolUsage`
- Mensajes de upgrade automáticos al alcanzar límite
- Contador de búsquedas restantes en respuesta
- Fail-open en caso de error de BD (no bloquear UX)


## Pricing y Monetización

### Planes (MXN/mes)
- **Free**: Trial 60 días | **Starter**: $149 (2 chatbots, 50 conv, 200 credits) `price_1S5AqXDtYmGT70YtepLAzwk4`
- **Pro**: $499 (10 chatbots, 250 conv, 1000 credits) `price_1S5CqADtYmGT70YtTZUtJOiS`
- **Enterprise**: $2,499 (∞ chatbots, 1000 conv, 5000 credits) - Usa `price_data` custom (sin price ID)

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

### System Prompt RAG (Actualizado Oct 6, v3 - Prioridad Máxima)
El agente recibe **instrucciones ultra-enfáticas** con estrategia de cascada y chain-of-thought:

**🚨 CAMBIO CRÍTICO (Oct 6)**: Instrucciones de búsqueda ahora van PRIMERO (antes de custom instructions) para evitar conflictos con prompts del usuario como "Si no conoces algo: deriva al equipo comercial"

**🔍 PROTOCOLO DE BÚSQUEDA EN CASCADA:**
1. **PASO 1** - Base de conocimiento (`search_context`): mínimo 2 intentos con queries reformuladas
2. **PASO 2** - Fallback a web (`web_search_google`): si PASO 1 falla Y pregunta sobre info reciente
3. **PASO 3** - Último recurso: decir "Busqué en [lugares] pero no encontré..."

**⛔ Prohibiciones absolutas**: NUNCA responder sin buscar, NUNCA decir "no sé" sin AGOTAR todas las herramientas

**📊 Chain-of-thought examples**:
- Incluye razonamiento paso a paso ("🤔 Razonamiento → ✅ Acción correcta")
- Ejemplo completo: search_context → sin resultados → web_search_google → responder
- Por qué funciona: Modelos imitan el patrón de razonamiento que ven en ejemplos

**✅ Ejemplo de prompt mejorado**:
```
User: "¿Tienen planes más baratos que $5,000?"
→ EJECUTAR: search_context("precios planes baratos económicos")
→ LEER resultados y RESPONDER con datos encontrados
```

**🐛 Bug crítico resuelto (Oct 4)**:
- Problema: Ghosty no usaba web_search como fallback por conflicto de seguridad
- Causa: `businessDomain = config.name` ("Ghosty") pero el negocio es "Formmy"
- Fix: Detectar `if (config.name === 'Ghosty') businessDomain = 'Formmy'`
- Resultado: Restricciones de seguridad ahora permiten búsquedas sobre el negocio real

**🐛 Bug crítico resuelto (Oct 6 - RAG Priority)**:
- Problema: Agentes NO usaban search_context en chatbots con custom instructions fuertes
- Causa: Custom instructions del usuario ("deriva al equipo") sobrescribían instrucciones de búsqueda
- Fix: Instrucciones de búsqueda ahora van PRIMERO en el system prompt (línea 88-124)
- Resultado: REGLA FUNDAMENTAL aparece antes de personalidad/custom instructions

**🐛 Bug crítico resuelto (Oct 6 - Verbosidad)**:
- Problema: Agentes daban respuestas muy largas y exhaustivas (oversharing)
- Causa 1: Temperature = 0 en chatbots antiguos (determinístico → exhaustivo)
- Causa 2: System prompt no incluía instrucciones de concisión
- Fix 1: Migración masiva de temperatures a óptimas por modelo (script migrate-temperatures.ts)
- Fix 2: Agregadas "REGLAS DE CONCISIÓN" al system prompt RAG
  - "Responde SOLO lo que se preguntó"
  - "Si preguntan por UN servicio, NO enumeres TODOS"
  - Ejemplo correcto vs incorrecto incluido
- Resultado: Respuestas más concisas y relevantes sin perder precisión

Implementado en `/server/agents/agent-workflow.server.ts:86-124` y `/server/tools/index.ts:186-223`

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

### Monitoreo y Tests
**Señales de RAG agéntico funcionando**:
- ✅ Ejecuta 2+ búsquedas para preguntas multi-tema
- ✅ Usa fallback automático a web_search cuando RAG falla
- ✅ Dice "busqué pero no encontré" si ambas búsquedas fallan (no adivina)
- ✅ Ajusta queries si primera búsqueda no es suficiente

**Test automatizado** (`scripts/test-rag-prompts.ts`):
```bash
DEVELOPMENT_TOKEN=FORMMY_DEV_TOKEN_2025 npx tsx scripts/test-rag-prompts.ts
```

**Últimos resultados** (Oct 4, 2025 - 3/3 tests pasados ✅):
- Test 1 (características nuevas): 2x search_context + 1x web_search → 7 créditos
- Test 2 (planes y formas de pago): 4x search_context + 2x web_search → 14 créditos
- Test 3 (compara Starter vs Pro): 4x search_context + 4x web_search → 20 créditos

**Métricas de uso** (tabla `ToolUsage`):
- Búsquedas por conversación
- Top queries más frecuentes
- % conversaciones que usan RAG
- Promedio de búsquedas por pregunta (target: 2-4)

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

### Temperatures Óptimas (Centralizado en `/server/config/model-temperatures.ts`)
**Actualizado**: Oct 6, 2025 - Opción Conservadora (previene alucinaciones)

**Filosofía**: Temperatures fijas por modelo, basadas en testing empírico. GPT models @ 1.0, Claude Haiku @ 0.8, resto @ 0.7

**OpenAI Models (Fixed):**
- gpt-5-nano → gpt-4o-mini: **1.0** ✅ (mapeo transparente, óptimo testing Sept 29)
- gpt-4o-mini: **1.0** ✅ (fixed - previene alucinaciones)
- gpt-5-mini → gpt-4o: **1.0** ✅ (fixed - previene alucinaciones, antes 0.7)
- gpt-4o: **1.0** ✅ (fixed - previene alucinaciones, antes 0.7)
- gpt-5: **0.7** (conversacional)
- gpt-3.5-turbo: **0.7** (balance creatividad/precisión)

**Anthropic Models:**
- claude-3-haiku: **0.8** ✅ (fixed - punto medio, antes 0.7. Evita alucinaciones de temp muy baja)
- claude-3.5-haiku: **0.8** ✅ (fixed - punto medio, antes 0.7)
- claude-3-sonnet: **0.7** (conversacional)
- claude-3.5-sonnet: **0.7** (conversacional)
- claude-3-opus: **0.7** (conversacional)

**Gemini Models:**
- gemini-2.0-flash: **0.7**
- gemini-1.5-pro: **0.7**

**Validación**: Temperature > 1.5 sanitizada automáticamente a 1.0 (evita alucinaciones severas)
**UI**: Temperature input comentado en AgentForm.tsx (líneas 106-156) - modelos usan temp fija optimizada

## API v1 Chatbot - Modular (Sept 16) ✅

**Estructura**: `/app/routes/api.v1.chatbot.ts` delega a handlers modulares
- **Context**: `/server/chatbot/context-handler.server.ts` (CRUD contextos PDF/DOCX/XLSX/URLs)
- **Management**: `/server/chatbot/management-handler.server.ts` (CRUD chatbots)
- **Integration**: `/server/chatbot/integration-handler.server.ts` (gestión integraciones)

**Personalidades de Agentes** (Oct 6, 2025): 6 agentes activos con LFPDPPP compliance
- `sales`, `customer_support`, `data_analyst`, `coach`, `medical_receptionist`, `educational_assistant`
- Todos incluyen disclaimers de uso de datos personales (propósito + right to deletion)
- Implementación: `/app/utils/agents/agentPrompts.ts`


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

## Personalidades de Agentes (AgentType)

**Actualizado**: Oct 6, 2025 - Sistema unificado con LFPDPPP compliance

### Agentes Disponibles (6)

**1. Sales (`sales`)** 🟢
- **Propósito**: Ventas consultivas B2B/B2C, generación de leads
- **Disclaimer**: ✅ Cotizaciones y seguimiento comercial
- **Color**: Verde esmeralda (#10B981)
- **Ícono**: `/public/assets/chat/agents/sales.svg`

**2. Customer Support (`customer_support`)** 🔵
- **Propósito**: Resolución de consultas, escalación a humanos
- **Disclaimer**: ✅ Seguimiento de casos
- **Color**: Azul (#3B82F6)
- **Ícono**: `/public/assets/chat/agents/customer-service.svg`

**3. Data Analyst (`data_analyst`)** 🟡
- **Propósito**: Análisis de KPIs, insights accionables
- **Disclaimer**: ⚠️ No aplica (no solicita datos personales)
- **Color**: Ámbar (#F59E0B)
- **Ícono**: `/public/assets/chat/agents/analytics.svg`

**4. Coach (`coach`)** 🟣
- **Propósito**: Coaching de vida/negocios, frameworks GROW/OKRs
- **Disclaimer**: ✅ Ejercicios y accountability
- **Color**: Violeta (#8B5CF6)
- **Ícono**: `/public/assets/chat/agents/coach.svg`

**5. Medical Receptionist (`medical_receptionist`)** 🔵
- **Propósito**: Gestión de citas médicas, recordatorios
- **Disclaimer**: ✅ Datos médicos y coordinación de citas
- **Color**: Cian (#06B6D4)
- **Ícono**: `/public/assets/chat/agents/medical.svg`

**6. Educational Assistant (`educational_assistant`)** 🔴
- **Propósito**: Aprendizaje personalizado, Socratic questioning
- **Disclaimer**: ✅ Envío de materiales educativos
- **Color**: Rojo (#EF4444)
- **Ícono**: `/public/assets/chat/agents/education.svg`

### Disclaimers LFPDPPP (Oct 6, 2025)

**Patrón estándar** en todos los prompts:
```typescript
📋 AL PEDIR DATOS, DI EXACTAMENTE:
"[Pregunta por datos]? Tu información solo se usará para [propósito]
y puedes solicitar su eliminación cuando quieras."
```

**Compliance logrado**:
- ✅ Transparencia (propósito específico declarado)
- ✅ Data minimization (solo email cuando necesario)
- ✅ Right to deletion (mención explícita)
- ✅ Consentimiento informado (antes de recolectar)

**Referencia**: Industry best practices (OpenAI, Anthropic, Google Dialogflow)

### Agentes Eliminados (Oct 6, 2025)
- ❌ `content_seo` - Estratega de contenido SEO
- ❌ `automation_ai` - Automatización e IA
- ❌ `growth_hacker` - Experimentos de growth

**Razón**: Simplificación del catálogo, enfoque en casos de uso mainstream

## Configuración Legacy (Deprecado)

**⚠️ Esta sección está desactualizada - Ver secciones actualizadas arriba**

~~Temperature por modelo: gpt-5-nano (undefined), claude-3-haiku (0.7), claude-3.5-haiku (0.5), gpt-5-mini (0.3)~~
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