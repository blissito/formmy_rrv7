# Formmy - Context Esencial

**Stack**: React Router v7, Tailwind, Fly.io, Prisma, MongoDB, OpenRouter, Stripe
**URL**: https://formmy.app

## 🔧 PROBLEMAS RESUELTOS - WhatsApp Conversaciones

### Limitación: Avatares de WhatsApp - Compatibilidad con Datos Legacy (2025-11-23)

**Problema**: WhatsApp Cloud API NO proporciona avatares/fotos de perfil de contactos en webhooks.

**Investigación**:
- ❌ El webhook payload solo incluye `contacts[].profile.name` (sin foto)
- ❌ Meta Graph API NO tiene endpoint público para obtener fotos de perfil de contactos
- ❌ Solo se puede gestionar la foto de perfil del **negocio** (no de usuarios)

**Fuentes**:
- [Stack Overflow: WhatsApp Cloud API - Get User Profile Picture](https://stackoverflow.com/questions/79492845/whatsapp-cloud-api-how-to-get-user-profile-picture-and-locale-in-a-user-initia)
- [WhatsApp Cloud API Webhook Payload Structure](https://docs.ycloud.com/reference/whatsapp-inbound-message-webhook-examples)

**Estructura del Webhook** (solo nombre disponible):
```typescript
contacts: [{
  profile: {
    name: string  // ✅ Disponible
    // ❌ NO incluye: profile_picture_url, avatar, etc.
  },
  wa_id: string
}]
```

**Estrategia de Compatibilidad**:
- ✅ Campo `Contact.profilePictureUrl` se mantiene en schema
- ✅ Avatares existentes se conservan y muestran
- ✅ Servicio `avatar.service.ts` corregido (field name: `profilePictureUrl`)
- ✅ **Fetch de avatares ACTIVO** - intenta obtener en cada mensaje
- 🛡️ **Error handling robusto** - fallos no crashean el webhook
- ⚠️ Endpoint `/${phoneNumber}/profile_picture` puede fallar (limitación de API)

**Comportamiento Actual**:
- ✅ Avatares existentes en DB → Se muestran en UI
- ✅ Avatares nuevos → **Se intenta obtener** (mismo método que antes)
- 🛡️ Si fallo → Log de error (non-blocking), mensaje continúa procesándose
- 🔄 Actualización automática → **HABILITADA** con error handling

**Alternativas** (para futuro):
- Whapi.Cloud API (de pago) - compatible drop-in
- Servicios de terceros con Graph API extendido

**Implementación**:
```typescript
// app/routes/api.v1.integrations.whatsapp.webhook.tsx (línea 783)
import("../../server/integrations/whatsapp/avatar.service").then(({ updateContactAvatar }) => {
  updateContactAvatar(chatbotId, phone, token).catch((err) => {
    console.error("⚠️ Failed to fetch avatar (non-blocking):", err);
  });
});
```

**Fecha**: 2025-11-23
**Estado**: ✅ **ACTIVO** - Fetch de avatares habilitado con error handling robusto

---

### Problema: Conversaciones mezcladas entre chatbots (2025-11-13)

**Síntoma**: Cuando un mismo número de WhatsApp enviaba mensajes a múltiples chatbots, todos los mensajes se guardaban en la conversación del primer chatbot.

**Causa Raíz**: El `sessionId` de WhatsApp no incluía el `chatbotId`, causando 2 problemas:

1. **Mezcla de mensajes**: La función `getOrCreateConversation()` buscaba solo por `sessionId` sin filtrar por `chatbotId`
2. **Constraint UNIQUE**: El schema de Prisma tiene `sessionId` como UNIQUE, impidiendo que múltiples chatbots tengan conversaciones con el mismo número

**Solución Implementada** (`server/integrations/whatsapp/conversation.server.ts`):

```typescript
// ❌ ANTES (causaba conflictos):
const sessionId = `whatsapp_${phoneNumber}`;

// ✅ DESPUÉS (único por chatbot):
const sessionId = `whatsapp_${phoneNumber}_${chatbotId}`;
```

**Resultado**:
- ✅ Cada chatbot tiene su propia conversación con el mismo usuario
- ✅ No hay conflictos de UNIQUE constraint
- ✅ Los mensajes se guardan en el chatbot correcto

**Archivos modificados**:
- `server/integrations/whatsapp/conversation.server.ts` (línea 23)

**Fecha**: 2025-11-13
**Commit**: `2c80001` - fix: WhatsApp sessionId único por chatbot
**Estado**: ✅ Desplegado en producción y verificado funcionando

---

### Feature: Soporte de Reacciones de WhatsApp (2025-01-13)

**Problema**: Las reacciones de WhatsApp no se guardaban ni mostraban en el dashboard.

**Causa**: El webhook de WhatsApp no procesaba mensajes de tipo `"reaction"`, que tienen una estructura diferente a los mensajes normales.

**Solución Implementada**:

#### 1. Backend - Webhook Handler
**Archivo**: `app/routes/api.v1.integrations.whatsapp.webhook.tsx`
- Agregado tipo `"reaction"` al interface TypeScript del webhook (línea 42)
- Agregado campo `reaction?: { message_id: string; emoji: string }` (líneas 73-76)
- Handler especial para detectar y procesar reacciones (líneas 230-270)
- Las reacciones NO generan respuesta del bot (comportamiento WhatsApp nativo)
- Las reacciones NO envían notificaciones al owner

#### 2. Función de Manejo
**Archivo**: `server/integrations/whatsapp/conversation.server.ts` (líneas 84-198)
- `handleReaction()`: Crea/actualiza/elimina reacciones
- Emoji vacío = Usuario removió reacción
- Usuario solo puede tener UNA reacción por mensaje (WhatsApp nativo)
- Busca mensaje original por `externalMessageId`

#### 3. Modelo de Datos
**Archivo**: `prisma/schema.prisma` (líneas 413-416)
```prisma
model Message {
  // ... campos existentes
  isReaction        Boolean?  @default(false)
  reactionEmoji     String?   // Emoji: "👍", "❤️", etc.
  reactionToMsgId   String?   // externalMessageId del mensaje reaccionado
}
```

#### 4. Tipos TypeScript
**Archivos modificados**:
- `server/integrations/whatsapp/types.ts`: Agregado `"reaction"` a `MessageType` (línea 43)
- `server/chatbot/conversationTransformer.server.ts`: Agregados campos de reacción a `UIMessage` (líneas 37-41)

#### 5. Frontend - Visualización
**Archivo**: `app/components/chat/tab_sections/Conversations.tsx`
- Filtra mensajes con `isReaction: true` del map principal (línea 1157)
- Busca reacciones para cada mensaje basado en `externalMessageId` (líneas 1160-1162)
- Muestra emoji como overlay en esquina de la burbuja (líneas 1239-1246 para USER, 1472-1479 para ASSISTANT)
- Estilo: emoji grande con fondo blanco, sombra y borde

**Comportamiento**:
- ✅ Reacciones se guardan en base de datos
- ✅ Se muestran como overlay sobre el mensaje original (estilo WhatsApp)
- ✅ Solo se muestra la reacción más reciente por usuario
- ✅ Remover reacción (emoji vacío) elimina el registro
- ❌ NO genera respuesta del bot
- ❌ NO envía notificaciones

**Estructura del Webhook de Reacciones**:
```json
{
  "type": "reaction",
  "reaction": {
    "message_id": "wamid.XYZ789...",  // ID del mensaje original
    "emoji": "👍"  // Emoji (vacío si se remueve)
  }
}
```

**Fecha**: 2025-01-13
**Estado**: ✅ Implementado y listo para testing

---

### Feature: Separación de Contact y Lead (2025-11-14)

**Problema**: El modelo `Contact` mezclaba dos casos de uso diferentes:
1. Información automática capturada de WhatsApp (nombre, teléfono, foto de perfil)
2. Leads calificados guardados manualmente con `save_contact_info` (email, productInterest, position, website, notes)

Esto causaba:
- Unique constraint `Contact_chatbotId_phone_key` fallaba al intentar guardar leads con teléfonos ya registrados automáticamente por WhatsApp
- Confusión entre contactos automáticos vs leads capturados intencionalmente
- Campos innecesarios mezclados en un solo modelo

**Solución Implementada**:

#### 1. Nuevos Modelos Separados
**Archivo**: `prisma/schema.prisma` (líneas 303-356)

**Contact** - Solo info básica de WhatsApp (automático):
```prisma
model Contact {
  id                String  @id @default(auto()) @map("_id") @db.ObjectId
  name              String? // Nombre del perfil de WhatsApp
  phone             String? // Teléfono de WhatsApp (opcional por datos legacy)
  profilePictureUrl String? // URL de la foto de perfil de WhatsApp

  chatbotId      String        @db.ObjectId
  chatbot        Chatbot       @relation(fields: [chatbotId], references: [id])
  conversationId String?       @db.ObjectId
  conversation   Conversation? @relation(fields: [conversationId], references: [id])

  capturedAt DateTime @default(now())

  @@unique([chatbotId, phone]) // Un teléfono único por chatbot
}
```

**Lead** - Prospectos calificados (manual con save_contact_info):
```prisma
model Lead {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  name            String?       // Nombre completo
  email           String?       // Email de contacto
  phone           String?       // Teléfono
  productInterest String?       // Producto/servicio de interés
  position        String?       // Cargo/posición
  website         String?       // Sitio web
  notes           String?       // Notas adicionales
  status          ContactStatus @default(NEW) // Estado en el pipeline de ventas

  chatbotId      String        @db.ObjectId
  chatbot        Chatbot       @relation(fields: [chatbotId], references: [id])
  conversationId String?       @db.ObjectId
  conversation   Conversation? @relation(fields: [conversationId], references: [id])

  capturedAt  DateTime @default(now())
  lastUpdated DateTime @updatedAt

  @@index([email])
  @@index([phone])
  @@index([chatbotId])
  @@index([status])
}
```

#### 2. Tool Handler Actualizado
**Archivo**: `server/tools/handlers/contact.ts`
- `saveContactInfoHandler()` ahora crea/actualiza **Lead** (no Contact)
- Validación: requiere email O teléfono (al menos uno)
- Búsqueda de duplicados: primero por email, luego por teléfono
- Update si existe, create si es nuevo
- Logs detallados para debug

#### 3. UI Actualizada
**Archivo**: `app/routes/dashboard.chat_.$chatbotSlug.tsx` (líneas 169-192)
- Loader retorna `db.lead.findMany()` para tab de Contactos
- Frontend muestra leads con todos los campos (email, productInterest, position, website, notes, status)

**Archivo**: `app/components/chat/tab_sections/Contactos.tsx`
- UI consume leads del loader
- Búsqueda por: name, email, phone, productInterest
- Exportación CSV incluye todos los campos de lead

#### 4. Flujo Completo

**WhatsApp → Contact (Automático)**:
```typescript
// server/integrations/whatsapp/conversation.server.ts
await db.contact.upsert({
  where: { chatbotId_phone: { chatbotId, phone } },
  create: { name, phone, profilePictureUrl, chatbotId },
  update: { name, profilePictureUrl }
});
```

**save_contact_info → Lead (Manual)**:
```typescript
// server/tools/handlers/contact.ts
await db.lead.create({
  data: {
    name, email, phone, productInterest, position, website, notes,
    chatbotId, conversationId, status: 'NEW'
  }
});
```

**Comportamiento**:
- ✅ Contact: Solo info de WhatsApp, unique por (chatbotId, phone)
- ✅ Lead: Prospectos capturados, sin unique constraint en phone
- ✅ Mismo usuario puede estar en Contact (automático) Y Lead (manual)
- ✅ No más errores de duplicate key
- ✅ Separación clara de responsabilidades

**Archivos modificados**:
- `prisma/schema.prisma` - Modelos Contact y Lead separados
- `server/tools/handlers/contact.ts` - Handler usa Lead
- `server/tools/index.ts` - Tool description actualizada
- `app/routes/dashboard.chat_.$chatbotSlug.tsx` - Loader de leads
- `app/components/chat/tab_sections/Contactos.tsx` - UI de leads
- `server/chatbot/conversationTransformer.server.ts` - Tipos actualizados

**Fecha**: 2025-11-14
**Commit**: `34314c1` - feat: Separar Contact y Lead - WhatsApp auto vs manual capture
**Estado**: ✅ Desplegado en producción

---

### Fix: Leads sin conversationId - Botón de conversación deshabilitado (2025-11-26)

**Problema**: El icono de conversación en la tabla de Leads estaba deshabilitado porque los leads se guardaban sin `conversationId`, imposibilitando navegar a la conversación asociada.

**Causa Raíz**: El factory `createSaveLeadTool()` en `server/tools/vercel/saveLead.ts` no recibía ni pasaba el `conversationId` al handler `saveContactInfoHandler()`, aunque este último sí lo soportaba.

**Flujo incorrecto**:
```typescript
// ❌ ANTES: Context sin conversationId
const context = {
  chatbotId,
  userId: null,
  // ❌ FALTABA: conversationId
};
```

**Solución Implementada**:

#### 1. Actualizado Factory Function
**Archivo**: `server/tools/vercel/saveLead.ts` (líneas 29, 106)
```typescript
// ✅ AHORA: Factory recibe conversationId
export const createSaveLeadTool = (
  chatbotId: string,
  conversationId?: string  // ⬅️ Nuevo parámetro
) => {
  return tool({
    execute: async (params) => {
      const context = {
        chatbotId,
        conversationId,  // ⬅️ Incluido en closure
        // ...
      };
    }
  });
};
```

#### 2. Actualizado Endpoint Web
**Archivo**: `app/routes/chat.vercel.public.tsx` (línea 160)
```typescript
tools: {
  getContextTool: createGetContextTool(chatbotId),
  saveLeadTool: createSaveLeadTool(chatbotId, conversation.id),  // ⬅️ Pasa conversation.id
}
```

#### 3. Actualizado Webhook WhatsApp
**Archivo**: `app/routes/api.v1.integrations.whatsapp.webhook.tsx` (línea 1184)
```typescript
tools: {
  getContextTool: createGetContextTool(chatbot.id),
  saveLeadTool: createSaveLeadTool(chatbot.id, conversation.id),  // ⬅️ Pasa conversation.id
}
```

**Comportamiento**:
- ✅ Nuevos leads se guardan CON `conversationId`
- ✅ Botón de conversación funcional en tabla de Leads
- ✅ Click en icono navega a: `/dashboard/chat/{slug}?tab=Conversaciones&conversation={id}`
- ⚠️ Leads antiguos (sin `conversationId`) siguen con botón deshabilitado

**Handler ya soportaba conversationId** (`server/tools/handlers/contact.ts`):
- Línea 36: `let conversationId: string | undefined = context.conversationId;`
- Línea 153: `...(conversationId && { conversationId })`  (update)
- Línea 214: `...(conversationId && { conversationId })`  (create)

**Archivos modificados**:
- `server/tools/vercel/saveLead.ts` - Factory function y context
- `app/routes/chat.vercel.public.tsx` - Endpoint público
- `app/routes/api.v1.integrations.whatsapp.webhook.tsx` - Webhook WhatsApp

**Fecha**: 2025-11-26
**Estado**: ✅ Implementado - Nuevos leads se vinculan correctamente a conversaciones

---

## 🔄 MIGRACIÓN EN PROGRESO - Context Model

### Arquitectura Actual: Dos sistemas coexistiendo

**Sistema NUEVO (modelo separado)** ✅:
```prisma
model Context {
  id           String      @id @default(auto()) @map("_id") @db.ObjectId
  content      String
  contextType  ContextType @default(TEXT)
  title        String
  chatbotId    String      @db.ObjectId
  chatbot      Chatbot     @relation(fields: [chatbotId], references: [id], onDelete: Cascade)
  embeddings   Embedding[]
  metadata     Json?       // fileName, url, parsingMode, etc.
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt
}
```

**Relación en Chatbot**:
```prisma
model Chatbot {
  contextObjects Context[]  // ✅ Nombre de la relación (NO "contexts")
}
```

**Sistema LEGACY (embebido en JSON)** ⚠️ DEPRECADO:
```prisma
type ContextItem {
  id             String
  type           ContextType
  fileName       String?
  // ... campos embebidos como JSON en Chatbot
}
```

### Archivos por sistema

**✅ Usando Context (modelo separado)**:
- `server/context/vercel_embeddings.ts` - Servicio de RAG con Vercel AI SDK
- `server/context/vercel_embeddings.secure.ts` - Validaciones de ownership
- `app/routes/chat.vercel.tsx` - Ghosty y chat público
- `app/routes/api.v1.rag.ts` - RAG API v1
- `app/routes/api.rag.v1.ts` - RAG API v1 (query/list)
- `server/vector/vector-search.service.ts` - Búsqueda vectorial

**⚠️ Usando ContextItem (legacy embebido)**:
- `server/chatbot/contextManager.server.ts` - DEPRECADO
- `server/chatbot/configResolver.server.ts` - DEPRECADO (líneas 106, 173-174)
- `server/chatbot/chatbotModel.server.ts` - `addContextItem()`, `removeContextItem()` DEPRECADOS

### TODO: Migración completa

**Pendiente**:
1. Eliminar funciones `addContextItem()` y `removeContextItem()` de `chatbotModel.server.ts`
2. Migrar `contextManager.server.ts` a usar `secureUpsert()` de `vercel_embeddings.secure.ts`
3. Actualizar `configResolver.server.ts` para cargar de `contextObjects` en lugar de JSON embebido
4. Eliminar tipo `ContextItem` del schema de Prisma
5. Script de migración de datos legacy (si quedan chatbots con `contexts` JSON)

**Fecha**: 2025-11-24
**Estado**: 🟡 Parcial - APIs críticas migradas, funciones legacy pendientes

---

## ⚠️ REGLAS CRÍTICAS

### 1. Vercel AI SDK - Streaming
```typescript
import { streamText } from "ai";
import { openai } from "@ai-sdk/openai";

const result = streamText({
  model: openai("gpt-4o-mini"),
  messages: convertToModelMessages(allMessages),
  tools: { search_context, save_lead, web_search },
  maxSteps: 5
});
```
✅ Modelo decide tools automáticamente | ✅ 100% streaming

### 2. Memory - Historial
```typescript
// Cargar mensajes desde DB
const allMessages = await getMessagesByConversationId(conversationId);

// Pasar directamente al modelo
streamText({
  messages: convertToModelMessages(allMessages), // Historial completo
  // ...
});
```
⚠️ **Backend es source of truth** - NUNCA confiar en historial del cliente

### 3. Streaming
✅ 100% streaming | ✅ Archivos: Buffer → Redis → `/api/ghosty/download/{id}`
❌ Filesystem (Fly.io efímero)

## Arquitectura

**Endpoints Activos**:
- `/chat/vercel/public` - Chat público (widgets embebidos)
- `/chat/vercel` - Ghosty dashboard

**Tools**: `/server/tools/vercel/` - Factory functions con closures

### ⚠️ ENDPOINTS DEPRECADOS (Requieren migración):
- `/api/v0/chatbot` - TODO: Migrar a Vercel AI SDK
- `/api/agent/v0` - TODO: Migrar a Vercel AI SDK
- `/api/ghosty/v0` - TODO: Migrar a Vercel AI SDK (Ghosty usa `/chat/vercel` ahora)

### Tool Credits
**Ubicación**: `/server/llamaparse/credits.service.ts`
- Sistema dual: Mensuales (reset mes) + Comprados (permanentes)
- Parser: COST_EFFECTIVE(1), AGENTIC(3), AGENTIC_PLUS(6) créditos/página

### RAG (Retrieval-Augmented Generation)
**Servicio**: `/server/context/vercel_embeddings.ts` (Vercel AI SDK)
**Index**: `vector_index_2` MongoDB | **Embeddings**: text-embedding-3-small
**Chunk**: 2000 chars, 100 overlap (5%)

**Tools Vercel AI SDK**:
- `createSearchContextTool(chatbotId)` - RAG search con agent AI
- `createGetContextTool(chatbotId)` - Vector search directo
**Handlers**: `/server/tools/handlers/context-search.ts`
**Query Expansion**: `/server/vector/query-expansion.service.ts`

⚠️ **CRÍTICO - Tool Result Usage**:
Vercel AI SDK inyecta automáticamente los resultados de tools al contexto, PERO los modelos (especialmente gpt-4o-mini) pueden ignorarlos sin instrucciones explícitas en el system prompt.

**System Prompt Requirements**:
```typescript
// ✅ CORRECTO: Prompt imperativo que fuerza uso de resultados
CRITICAL - TOOL RESULTS ARE YOUR ANSWER:
When search_context() returns results, those results ARE the answer.
✅ COPY and PARAPHRASE the information from the tool output
✅ If tool says "Encontré X resultados" - READ THEM and answer based on them
❌ NEVER respond "I don't have information" if the tool returned results
```

**Flujo**:
1. Usuario pregunta → Agent llama `search_context` tool
2. Tool ejecuta → Retorna "Encontré X resultados: [CONTENIDO]"
3. Vercel AI SDK inyecta resultados al contexto automáticamente
4. Modelo genera respuesta usando los resultados

❌ **ERROR COMÚN**: Prompt débil → Modelo ignora resultados del tool
✅ **SOLUCIÓN**: Prompt imperativo que ordena usar los resultados como fuente única de verdad

### Modelos
**Config**: `/server/config/model-temperatures.ts`
- GPT-4o-mini: 1.0 | GPT-5: 0.7 | Claude Haiku: 0.8

## Artefactos (Sistema de UI Interactiva)

### Arquitectura

Sistema que permite al chatbot mostrar componentes React interactivos (tarjetas, galerías, formularios) durante la conversación.

**Registry**: `/server/artifacts/native/index.ts` - Source of truth para artefactos nativos
**Tool**: `/server/tools/vercel/artifactTool.ts` - Factory function con closure de chatbotId
**Componentes**: `/app/components/native-artifacts/` - Componentes React del frontend

### Artefactos Nativos Disponibles

| Nombre | Descripción | Eventos | Datos Requeridos |
|--------|-------------|---------|------------------|
| `date-picker` | Selector de fecha/hora | `onConfirm`, `onCancel` | `minDate?`, `maxDate?` |
| `gallery-card` | Galería de imágenes (hasta 4) | Ninguno (display-only) | `images[]` (URLs) |
| `product-card` | Tarjeta de producto | `onViewMore`, `onAddToCart` | `name`, `price` |
| `payment-card` | Resumen de pago | `onPay`, `onCancel` | `items[]`, `total` |

### Triggers para Activación

Cada artefacto tiene keywords que lo activan automáticamente:

**product-card**: "producto", "precio", "comprar", "cuánto cuesta", "ver producto", "detalles del producto"
**gallery-card**: "fotos", "imágenes", "galería", "ver fotos", "portafolio"
**date-picker**: "agendar", "cita", "reservar", "fecha", "horario"

### Flujo de Uso

1. Usuario menciona keyword (ej: "cuánto cuesta el producto X")
2. Modelo busca datos en RAG: `getContextTool("productos precios")`
3. Modelo extrae `name`, `price` del resultado
4. Modelo llama: `openArtifactTool({ artifactName: "product-card", initialDataJson: '{"name":"X", "price": 299}' })`
5. Frontend renderiza el componente
6. Si tiene eventos → Modelo llama `confirmArtifactTool` para esperar respuesta del usuario

### Validaciones

**product-card**: Requiere `name` y `price` - retorna error si faltan
**gallery-card**: Requiere al menos 1 imagen - intenta buscar en RAG si no hay

### Archivos Clave

- `server/artifacts/native/index.ts` - NATIVE_REGISTRY con metadata y triggers
- `server/tools/vercel/artifactTool.ts` - `createOpenArtifactTool()`, `createConfirmArtifactTool()`
- `app/components/native-artifacts/ProductChatCard.tsx` - Tarjeta de producto
- `app/components/native-artifacts/GalleryChatCard.tsx` - Galería de imágenes
- `prisma/schema.prisma` - Modelos `Artifact`, `ArtifactInstallation`

### Instalación de Artefactos

Los artefactos deben estar instalados y activos en el chatbot para funcionar:
```typescript
// El tool verifica instalación antes de ejecutar
const installation = await db.artifactInstallation.findFirst({
  where: { chatbotId, artifact: { name: artifactName }, isActive: true }
});
```

**Fecha**: 2025-12-23
**Estado**: ✅ Sistema funcional con 4 artefactos nativos

---

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

### Gmail/Calendar
⚠️ **DEPRECADO** - Integraciones Composio eliminadas
**TODO**: Reimplementar con Vercel AI SDK pattern

## Observabilidad ✅

**UI**: `/dashboard/api-keys?tab=observability`
**API**: `/api/v1/traces`
**Instrumentación**: TODO - Migrar a Vercel AI SDK
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
