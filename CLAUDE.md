# Formmy - Project Context

## Overview

Formmy es una plataforma SaaS de formularios y chatbots con capacidades avanzadas de AI y automatización, que posee un agente inteligente con acceso a herramientas avanzadas e integraciones.

## Arquitectura

- **Frontend**: React Router v7 no Remix, tailwindcss
- **Backend**: fly.io + Prisma
- **Base de datos**: MongoDB
- **AI**: Open Router
- **Pagos**: Stripe
- **Analytics**: Google Analytics, Google Search Console API
- **Email**: AWS SES con nodemailer

## Agentes y Asistentes

### Ghosty

**Ubicación**: `/dashboard/ghosty`
**Descripción**: Agente principal de la plataforma que actúa como interfaz conversacional para:

- Guiar a usuarios en la creación de formularios y chatbots
- Proporcionar insights y métricas SEO
- Ofrecer recomendaciones de optimización
- Ejecutar tareas automatizadas
- Servir como punto central de información del sistema

### Formmy Agent Framework (Micro-framework propio)

**Ubicación**: `/server/formmy-agent/`
**Descripción**: Micro-framework de agentes AI desarrollado internamente (~500 líneas) que proporciona:

- **Agent Loop robusto**: Pattern ReAct con retry automático y manejo de errores
- **Context optimization**: Chunking inteligente y selección de contexto relevante sin embeddings
- **Unified API**: Interfaz simple para todos los chatbots de la plataforma
- **Tool integration**: Sistema modular de herramientas con registro centralizado

**Arquitectura del framework**:
```
/server/formmy-agent/
  ├── index.ts           - Core del framework y clase FormmyAgent
  ├── agent-core.ts      - Retry logic y error handling
  ├── agent-executor.ts  - Loop ReAct mejorado con memoria
  ├── context-chunker.ts - División y selección de contexto
  ├── context-optimizer.ts - Optimización de tokens
  ├── config.ts          - Configuración y factory
  └── types.ts           - Interfaces TypeScript
```

**Características clave**:
- Sin dependencias de frameworks externos (LangChain, Mastra, etc.)
- Retry automático con exponential backoff para respuestas vacías
- Chunking de contexto para optimizar uso de tokens (4KB límite)
- Iteraciones dinámicas (3-7) según complejidad del query
- Compatible con streaming y non-streaming
- Integración nativa con proveedores existentes (OpenAI, Anthropic, OpenRouter)

## Estructura de carpetas principales

```
/app
  /routes - React Router v7 routes
  /utils
    /notifyers - Email notification utilities
  /lib - Core business logic
    /stripe - Stripe integration utilities
    /google.server.ts - Google OAuth integration
/server - Server utilities and configurations
```

## Estrategia de Pricing y Monetización

### Planes y Precios (Optimizados para mercado mexicano)
- **Free**: $0 - Solo 3 formmys, 0 chatbots, trial 60 días
- **Starter**: $149 MXN/mes - 2 chatbots, 50 conversaciones, GPT-5 Nano + Gemini 2.5 Flash-Lite
- **Pro**: $499 MXN/mes - 10 chatbots, 250 conversaciones, Claude 3 Haiku
- **Enterprise**: $1,499 MXN/mes - Ilimitado, 1000 conversaciones, GPT-5 Mini + Claude 3.5 Haiku

### Proyección Año 1 (150 clientes)
- **60% Starter** (90 clientes): $160.9K MXN revenue → $157.7K profit (98% margen)
- **33% Pro** (50 clientes): $299.4K MXN revenue → $290.6K profit (97% margen)  
- **7% Enterprise** (10 clientes): $179.9K MXN revenue → $161.9K profit (90% margen)
- **Total**: $640.2K MXN revenue → $610.2K profit anual (~$33.9K USD)

### Revenue Streams Adicionales
- **Conversaciones extra**: $59-179 MXN/100 según plan
- **WhatsApp Integration**: $99 MXN/mes
- **Setup Service**: $1,500 MXN one-time
- **White Label**: $299 MXN/mes
- **API Access**: $199 MXN/mes

### Optimizaciones de Costo
- **Smart Model Routing**: Haiku para queries simples, Sonnet para complejos
- **Context Compression**: Reducir tokens manteniendo calidad
- **Response Caching**: 30% reducción en llamadas API
- **Pricing psicológico**: Precios bajo barreras ($149, $499, $1,499)
- **Límites de protección**: Máximo tokens por consulta según plan
- **RAG futuro**: Vector embeddings para contexto masivo sin explosión de costos

## 🛠️ Herramientas Disponibles

### create_payment_link (Stripe)
- **Función**: Generar links de pago seguros
- **Acceso**: Usuarios PRO/ENTERPRISE con Stripe configurado
- **Parámetros**: amount, description, currency
- **Respuesta**: URL de pago + confirmación formateada

### schedule_reminder (Recordatorios) ✨
- **Función**: Programar recordatorios y citas
- **Acceso**: Usuarios PRO/ENTERPRISE 
- **Parámetros**: title, date (YYYY-MM-DD), time (HH:MM), email (opcional)
- **Features**: 
  - Almacenamiento en `ScheduledAction` model (MongoDB/Prisma)
  - Email automático con template Formmy
  - Validación de fecha futura
  - ✅ **Compatible con agenda.js**: Usa `type: "reminder"` y `runAt` field
- **Respuesta**: Confirmación con fecha formateada

#### Schema de Base de Datos:
```typescript
model ScheduledAction {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  chatbotId String   @db.ObjectId
  chatbot   Chatbot  @relation(fields: [chatbotId], references: [id])
  
  type      String   // 'reminder', 'email', 'webhook', etc.
  data      Json     // { title, time, email, phone, userMessage }
  runAt     DateTime // Momento exacto de ejecución
  status    String   // 'pending', 'done', 'failed', 'cancelled'
}
```

## 🐛 Issues Complejos Resueltos (Documentación de Debugging)

### ❌→✅ "Ocurrió un error inesperado" Framework Issue (Agosto 24, 2025)

**Síntoma**: Framework devolvía `"message": "Ocurrió un error inesperado"` con 0 tokens y 0 iteraciones.

**Root Causes encontrados**:

1. **❌ Configuración de modelo faltante**: 
   - El código usaba `claude-3-haiku-20240307` pero `server/formmy-agent/config.ts` solo tenía `claude-3-haiku`
   - **Solución**: Agregadas configuraciones específicas para `claude-3-haiku-20240307` y `claude-3-5-haiku-20241022`

2. **❌ getAvailableTools desconectado**:
   - El framework tenía su propio método `getAvailableTools` (placeholder) en lugar de usar el registry real
   - **Solución**: Importar y usar `getAvailableTools` de `../tools/registry` 

3. **❌ UI incompatible con respuesta del framework**:
   - UI esperaba `jsonData.success && jsonData.response`
   - Framework devolvía `jsonData.message` 
   - **Solución**: UI unificado que soporta `jsonData.message || jsonData.response || jsonData.content`

### ❌→✅ Schedule Reminder No Guarda en DB (Agosto 24, 2025)

**Síntoma**: Herramientas se ejecutan exitosamente pero no aparecen registros en base de datos.

**Root Cause**: 
- MongoDB schema desactualizado - colección `scheduled_actions` no existía
- **Solución**: `npx prisma db push --accept-data-loss` creó la colección faltante

### ❌→✅ UI Muestra "Error en la respuesta" con Tools (Agosto 24, 2025)

**Root Cause**: 
- ChatPreview.tsx línea 218: `if (jsonData.success && jsonData.response)` muy específico
- Framework devuelve estructura diferente cuando usa herramientas
- **Solución**: Lógica unificada que maneja tanto streaming como tools en el UI

**Código crítico**:
```typescript
// ✅ ANTES (restrictivo)
if (jsonData.success && jsonData.response) 

// ✅ DESPUÉS (unificado) 
const responseContent = jsonData.message || jsonData.response || jsonData.content;
if (hasValidResponse)
```

### 🛠️ Lecciones de Debugging Críticas

1. **Configuraciones de modelos**: SIEMPRE verificar que model IDs exactos estén en `server/formmy-agent/config.ts`
2. **Registry connections**: Framework necesita conectarse al registry real, no placeholders 
3. **UI response handling**: Debe ser flexible para soportar múltiples formatos de respuesta
4. **Database schema**: `npx prisma db push` crítico después de cambios en schema
5. **Logging granular**: Los console.log del framework fueron clave para identificar problemas

### 📋 Checklist Futuro para Tool Integration

- [ ] Modelo AI está en `MODEL_CONFIGS` de `server/formmy-agent/config.ts`
- [ ] Handler conectado correctamente al registry  
- [ ] Schema de DB actualizado con `npx prisma db push`
- [ ] UI maneja respuesta del framework (streaming + non-streaming)
- [ ] Testing con datos reales, no placeholders

## ✅ Cambios Recientes (Agosto 2024)

### ⚠️ Issue de Producción Resuelto (22 Agosto 2024)
- **✅ SOLUCIONADO**: Server no levantaba en producción por import faltante
- **Problema**: `server.js` importaba `./app/services/email-scheduler.server.js` que no existía en deploy
- **Root Cause**: Archivo TypeScript `.ts` no se compilaba correctamente al build de producción
- **Solución Temporal**: Email scheduler deshabilitado temporalmente en `server.js`
- **Status**: ✅ Server funcionando, ⏳ Email scheduler pendiente de reactivación
- **Próximo**: Mover email scheduler a ruta que se compile automáticamente o crear versión `.js` correcta

### Sistema de Recordatorios Implementado ✨
- **✅ COMPLETADO**: Sistema completo de recordatorios con herramientas
- **Componentes añadidos**:
  - Schema `Reminder` en Prisma con relación a Chatbot
  - `ReminderService` para gestión de recordatorios
  - Tool `schedule_reminder` disponible para GPT-5-nano y Claude
  - Template de email con estándar Formmy
  - Handler completo en API con validaciones
- **Arquitectura**: Híbrido DB local + futuro agenda.js + AWS SES
- **Acceso**: Solo usuarios PRO/ENTERPRISE (mismo que Stripe)

### GPT-5 Nano: Herramientas Funcionando ✨
- **✅ COMPLETADO**: GPT-5-nano ahora soporta herramientas Stripe completamente
- **Fixes aplicados**:
  - `max_completion_tokens` en lugar de `max_tokens` para modelos GPT-5
  - Corregido streaming vs non-streaming con herramientas (forzar `stream: false`)
  - Temperature range 0-1 para GPT-5-nano (vs 0-2 para otros)
  - OpenAI provider ahora envía/extrae tool calls correctamente
- **Impacto**: GPT-5 Nano es ahora el **modelo por defecto** más económico con herramientas
- **Profit**: Ahorro ~$36K USD/año, profit margin subió a 99%

### Arquitectura de Proveedores Mejorada
- **OpenAI Provider**: ✅ Soporte completo para herramientas (GPT-5-nano, GPT-5-mini)
- **Anthropic Provider**: ✅ Herramientas funcionando (Claude 3 Haiku, 3.5 Haiku)  
- **OpenRouter Provider**: ❌ Sin herramientas (Gemini, Mistral, otros)
- **Warning System**: Notifica cuando modelos no soportan herramientas

### Configuración de Planes Actualizada
- **FREE**: Sin acceso después trial
- **TRIAL**: **GPT-5 Nano** con herramientas (60 días)
- **STARTER**: **GPT-5 Nano** con herramientas ($149 MXN)  
- **PRO**: **GPT-5 Nano** con herramientas ($499 MXN)
- **ENTERPRISE**: **GPT-5 Mini** premium ($1,499 MXN)

### ✅ Tools vs Streaming Issue Resuelto (22 Agosto 2024)
- **✅ SOLUCIONADO**: GPT-5-nano tools funcionando correctamente
- **Problema identificado**: Streaming mode impedía el uso de herramientas
- **Root Cause**: 
  1. Tools solo se pasaban en non-streaming mode 
  2. Lógica de streaming invertida (stream = true cuando había tools)
  3. Tool calls no se parseaban en streaming responses
- **Solución implementada**:
  - ✅ `stream = !agentDecision.needsTools` → NO stream cuando necesita herramientas
  - ✅ Tools disponibles siempre que el modelo las soporte
  - ✅ Agent decision engine con keywords naturales ("agenda", "recordame", "avísame")
  - ✅ Prompts anti-falsificación para evitar fingir acciones
- **Regla crítica**: **NUNCA** intentar parsear tool calls en streaming mode
- **Estrategia**: Cambiar a non-streaming automáticamente cuando se detecten herramientas

### ✅ Tokens Tracking Corregido (22 Agosto 2024)
- **✅ SOLUCIONADO**: Sistema de tokens del admin dashboard ahora funciona correctamente
- **Problema identificado**: Los mensajes ASSISTANT no se guardaban en BD durante conversaciones
- **Root Cause**: La API `/api/v1/chatbot` caso `preview_chat` no llamaba `addUserMessage`/`addAssistantMessage`
- **Solución implementada**:
  - ✅ Agregados imports `addUserMessage`, `addAssistantMessage` en `server/chatbot-api.server.ts`
  - ✅ Implementado guardado automático en modo streaming y non-streaming
  - ✅ Manejo de conversaciones con `sessionId` para continuidad
  - ✅ Logging detallado de tokens guardados
  - ✅ Manejo de errores sin fallar la respuesta del chat
- **Archivos modificados**:
  - `server/chatbot-api.server.ts` → Exports agregados
  - `app/routes/api.v1.chatbot.ts` → Guardado implementado (líneas 1819-1857, 1651-1688)
- **Testing**: Dashboard admin `/admin` ahora muestra correctamente "Uso de Tokens por Proveedor (30 días)"
- **Impacto**: Métricas de costos y usage tracking ahora operativas para optimización

### ✅ Formmy Agent Framework: Tool Simulation → Real Execution (24 Agosto 2025) 🔧
- **✅ SOLUCIONADO**: Framework ejecutaba simulaciones en lugar de herramientas reales
- **Problema crítico**: Herramientas aparentaban funcionar pero no generaban registros en BD
- **Root Cause**: `server/formmy-agent/agent-executor.ts` líneas 463-479 contenían código de simulación hardcodeado
- **Descubrimiento complejo**: 
  - Framework tenía 3 capas de desconexión: configuración, registry, y ejecución simulada
  - Logs mostraban éxito pero `ScheduledAction.count() === 0` revelaba simulación
  - Lógica de tools usaba `switch` con casos hardcodeados en lugar de registry real
- **Solución implementada**:
  - ✅ Agregado import real: `import { executeToolCall } from '../tools/registry';`
  - ✅ Reemplazado simulación con ejecución real: `const toolResult = await executeToolCall(tool.name, decision.args, toolContext);`
  - ✅ Conectado `toolContext` con chatbotId, userId, message para handlers reales
  - ✅ Framework ahora ejecuta herramientas reales del registry centralizado
- **Archivos críticos modificados**:
  - `server/formmy-agent/agent-executor.ts:463-479` → Simulación → Ejecución real
  - `server/formmy-agent/index.ts` → getAvailableTools conectado a registry
  - `server/formmy-agent/config.ts` → Modelos faltantes agregados
- **Testing**: `check-db.cjs` debe mostrar registros después de tool execution
- **Impacto**: Herramientas del framework ahora operan en sistema real, no simulación

### ✅ Framework Memory Fix: Placeholder Response → Real AI Integration (24 Agosto 2025) 🧠
- **✅ SOLUCIONADO**: Framework devolvía respuestas placeholder + perdía memoria de conversación
- **Problema crítico**: 
  1. Respuestas como "Esta sería la respuesta procesada para: [mensaje]" en lugar de AI real
  2. Framework no mantenía contexto de conversación entre mensajes
- **Root Causes identificados**:
  - `generateSimpleResponse()` usaba placeholder hardcodeado en lugar de sistema de proveedores
  - Framework no recibía `conversationHistory` del API endpoint
  - Temperature incorrecta para GPT-5-nano (debe ser `undefined`)
- **Solución implementada**:
  - ✅ Conectado `generateSimpleResponse` con `AIProviderManager` real
  - ✅ Agregado `conversationHistory` a `ChatOptions` y `AgentContext` interfaces
  - ✅ Modificado endpoint API para pasar historial truncado al framework
  - ✅ Actualizado construcción de mensajes para incluir historial completo
  - ✅ Corregido manejo de temperature: `context.model === 'gpt-5-nano' ? undefined : 0.7`
- **Archivos modificados**:
  - `server/formmy-agent/index.ts:243-281` → Placeholder → AI Provider real
  - `server/formmy-agent/agent-executor.ts:563-578` → Historial en agent loop
  - `server/formmy-agent/types.ts` → Interfaces con `conversationHistory`
  - `app/routes/api.v1.chatbot.ts:1641` → Pasar historial al framework
- **Testing**: Conversaciones mantienen contexto, respuestas naturales, temperature correcta
- **Impacto**: Framework ahora funciona como chat AI real con memoria conversacional

## 📝 Blog Posts y Documentación

### Blog Posts Creados (Agosto 2024)
- **Post 1**: `como-construimos-nuestro-framework-agentes-ia.md` - Storytelling sobre desarrollo del framework
- **Post 2**: `tutorial-express-formmy-agent-framework.md` - Tutorial práctico de Express.js

### ⚠️ Links Pendientes de Crear
Los blog posts referencian estos recursos que necesitan ser creados:

1. **Repository GitHub**: https://github.com/formmy/agent-examples
   - **Contenido necesario**: Ejemplos de código, framework files, documentación
   - **Prioridad**: Alta - links rotos en blog posts
   - **Estructura sugerida**:
     ```
     formmy/agent-examples/
     ├── framework/          # Core framework files  
     ├── examples/          # Código de ejemplo
     ├── tutorials/         # Tutoriales paso a paso
     └── README.md         # Documentación principal
     ```

2. **Discord Community**: https://discord.gg/formmy
   - **Status**: ✅ Existe y funciona
   - **Contenido**: Community para soporte y discusión

3. **Documentación Formmy**: https://formmy.app/docs
   - **Status**: ⚠️ Verificar si existe
   - **Contenido necesario**: Docs del framework, guías, API reference

### 📋 Tareas Pendientes
- [ ] Crear repository `formmy/agent-examples` en GitHub
- [ ] Subir archivos del framework al repository
- [ ] Crear documentación básica en README
- [ ] Verificar funcionamiento de todos los links en blog posts
- [ ] Crear documentación en formmy.app/docs si no existe

## Próximos pasos técnicos

### 🔥 Email Scheduler Reactivación (Prioridad inmediata - 1-2 días)
- **Problema**: Email scheduler deshabilitado temporalmente por issues de compilación
- **Solución A**: Mover `EmailScheduler` a `/app/lib/` para que se compile automáticamente
- **Solución B**: Crear sistema de cron jobs externo con webhook calls
- **Solución C**: Migrar lógica a React Router action/loader que se ejecute programáticamente
- **Archivos afectados**: 
  - `server.js` (reactivar scheduler)
  - `app/services/email-scheduler.server.ts` (mover o refactorizar)
- **Testing**: Verificar que emails automáticos funcionen en staging antes de producción

### Google Gemini Direct API Integration (Prioridad alta - 2-3 semanas)
- **Objetivo**: Reducir costos adicionales 90% (OpenRouter $0.054 → Gemini Direct $0.006)
- **Problema**: OpenRouter no pasa herramientas correctamente a Gemini
- **Solución**: Implementar proveedor Google Gemini directo (como Anthropic/OpenAI directos)
- **Stack**: Google AI SDK + Function Calling nativo
- **ROI**: ~$48K USD/año ahorro adicional
- **Implementación**: 
  - Crear `/server/chatbot/providers/google.ts`
  - Agregar Google API keys en configuración
  - Testing extensivo de herramientas con Gemini 2.5 Flash
  - Fallback automático a GPT-5-nano si Gemini falla

### RAG Implementation (Prioridad alta - 4-6 semanas)
- **Objetivo**: Permitir contexto de 50MB+ sin explosión de costos
- **Stack**: ChromaDB + OpenAI Embeddings + LangChain
- **ROI**: Diferenciador clave para Enterprise $1,499
- **Costos operativos**: <1% del revenue
- **Implementación**: Vector DB + chunking + búsqueda semántica

### Límites de protección (Siguiente semana)
- **Tokens máximos por consulta**: Starter 4K, Pro 8K, Enterprise 16K
- **Límites diarios**: Starter 20, Pro 100, Enterprise 500 consultas con contexto
- **Truncamiento inteligente**: Primeras páginas + palabras clave de consulta
- **UI warnings**: Notificar cuando se trunca contenido

## Convenciones de código

- TypeScript estricto, **NUNCA imports dinámicos** - usar solo imports estáticos
- **NUNCA colocar utilidades en el mismo módulo de ruta** - siempre crear archivos `.server.tsx` correspondientes para utilidades
- No agregar funciones de utilidad directamente en archivos de rutas - moverlas a archivos server separados
- Server Components por defecto
- Prisma para ORM
- Tailwind CSS para estilos
- Para importar archivos desde `/server` en archivos dentro de `/app`, usar la ruta `server/...` sin prefijo ni alias

### Sistema Centralizado de Herramientas
- **Registro único**: Todas las herramientas en `/server/tools/registry.ts`
- **Handlers modulares**: Cada herramienta en `/server/tools/handlers/[nombre].ts` 
- **Auto-detección**: Plan, integraciones y modelo detectados automáticamente
- **Prompts dinámicos**: Se generan según herramientas disponibles
- **Para agregar nueva herramienta**: Solo registrar en registry.ts + crear handler

## AI Models Architecture Rules

### Modelos Oficialmente Soportados (Agosto 2025)

#### 🏆 TIER ENTERPRISE (Plan Enterprise)
- **GPT-5 Mini** (`gpt-5-mini`) - Máximo rendimiento, OpenAI Direct API
  - *Default para Enterprise* | Temperature: 0.3 | Context: 5000 tokens
- **Claude 3.5 Haiku** (`claude-3-5-haiku-20241022`) - Premium Anthropic, Direct API  
  - Temperature: 0.5 | Context: 4000 tokens

#### 💎 TIER PRO (Planes PRO/TRIAL)
- **GPT-5 Nano** (`gpt-5-nano`) - Ultra económico con herramientas ⚡ *Modelo principal*
  - *Recomendado* | Sin temperature | Context: 4000 tokens | OpenAI Direct API
- **Claude 3 Haiku** (`claude-3-haiku-20240307`) - Calidad para integraciones críticas
  - Temperature: 0.7 | Context: 3500 tokens | Anthropic Direct API
- **Claude 3.5 Haiku** (`claude-3-5-haiku-20241022`) - Estabilidad mejorada
  - Temperature: 0.5 | Context: 4000 tokens | Anthropic Direct API

#### 🚀 TIER STARTER (Plan Starter)
- **GPT-5 Nano** (`gpt-5-nano`) - Default económico
- **Gemini 2.5 Flash-Lite** (`google/gemini-2.5-flash-lite`) - Via OpenRouter

#### ❌ TIER FREE (Plan Free)
- **Sin acceso** después del trial de 60 días

### Configuraciones del Framework Formmy Agent

Cada modelo tiene configuración optimizada en el micro-framework:

```typescript
// Configuraciones por modelo (server/formmy-agent/config.ts)
'gpt-5-nano': {
  temperature: undefined,      // GPT-5 nano no soporta temperature
  maxIterations: 5,
  contextLimit: 4000,
  retryConfig: { maxRetries: 3, backoffMs: 1000 }
},
'claude-3-haiku-20240307': {
  temperature: 0.7,            // Haiku necesita control de variabilidad 
  maxIterations: 4,            // Menos iteraciones para Haiku
  contextLimit: 3500,
  retryConfig: { maxRetries: 4, backoffMs: 1500 } // Más retries
},
'claude-3-5-haiku-20241022': {
  temperature: 0.5,            // Más determinista que 3.0
  maxIterations: 6,            // 3.5 es más estable
  contextLimit: 4000,
  retryConfig: { maxRetries: 3, backoffMs: 1000 }
},
'gpt-5-mini': {
  temperature: 0.3,            // Máximo determinismo Enterprise
  maxIterations: 6,
  contextLimit: 5000,          // Modelo más capaz
  retryConfig: { maxRetries: 2, backoffMs: 800 }
}
```

### Arquitectura de Proveedores

- **Anthropic Direct API**: `claude-3-haiku-20240307`, `claude-3-5-haiku-20241022`
- **OpenAI Direct API**: `gpt-5-nano`, `gpt-5-mini` 
- **OpenRouter API**: `google/gemini-2.5-flash-lite` y modelos terceros
- **Separación estricta**: NUNCA mezclar prefijos entre proveedores
- **Sin fallback cross-provider**: Errores no degradan entre tipos de API

### Smart Model Routing (PRO)

```typescript
// Smart routing para usuarios PRO
function getSmartModelForPro(hasActiveIntegrations: boolean, isComplexQuery: boolean): string {
  if (hasActiveIntegrations || isComplexQuery) {
    return "claude-3-haiku-20240307"; // Calidad para integraciones críticas
  }
  return "gpt-5-nano"; // Velocidad y costo para chat normal
}
```

### Herramientas por Modelo

✅ **Modelos con Tools Support**:
- `gpt-5-nano`, `gpt-5-mini` (OpenAI Function Calling)
- `claude-3-haiku-20240307`, `claude-3-5-haiku-20241022` (Anthropic Tools)

❌ **Modelos sin Tools Support**:
- `google/gemini-2.5-flash-lite` (OpenRouter limitations)

### Precios Reales API (Agosto 2025)

#### GPT-5 Family (OpenAI Direct)
- **GPT-5 nano**: $0.05/1M input, $0.40/1M output ⚡ *99% profit margin*
- **GPT-5 mini**: $0.25/1M input, $2.00/1M output  
- **GPT-5 (full)**: $1.25/1M input, $10.00/1M output

#### Claude Family (Anthropic Direct)
- **Claude 3 Haiku**: ~$0.25/1M input, ~$1.25/1M output
- **Claude 3.5 Haiku**: ~$1.00/1M input, ~$5.00/1M output

#### OpenRouter (Terceros)
- **Gemini 2.5 Flash**: ~$0.075/1M (via OpenRouter markup)
- **Otros modelos**: Precios variables con markup OpenRouter

### Streaming & Tools Implementation
- **Smart Streaming**: Non-streaming automático cuando hay herramientas disponibles
- **Tools Support**: GPT-5-nano, GPT-5-mini, Claude 3 Haiku, Claude 3.5 Haiku
- **Warning System**: Markdown blockquotes para modelos sin herramientas
- **TextDecoderStream**: Streams nativos para UTF-8 sin corrupción
- **Buffer Management**: TransformStream con buffer persistente
- **Token Limits**: Sistema inteligente según contexto (200-600 tokens)
- **Error Handling**: Manejo robusto de finishReason y cierre correcto

## Email System

### Email Templates disponibles:
- **Welcome Email**: `app/utils/notifyers/welcome.ts` → función `sendWelcomeEmail`
- **No Usage Email**: `app/utils/notifyers/noUsage.ts` → función `sendNoUsageEmail`
- **Free Trial Email**: `app/utils/notifyers/freeTrial.ts` → función `sendFreeTrialEmail`
- **Pro Upgrade Email**: `app/utils/notifyers/pro.ts` → función `sendProEmail`
- **Plan Cancellation**: `app/utils/notifyers/planCancellation.ts` → función `sendPlanCancellation`
- **Week Summary**: `app/utils/notifyers/weekSummary.ts` → función `sendWeekSummaryEmail`

### Configuración SES:
- Cliente SES configurado en `/app/utils/notifyers/ses.tsx`
- Remitente estándar: `Formmy <notificaciones@formmy.app>`

### Puntos de integración identificados:
- **Registro de usuario**: `/app/lib/google.server.ts` (líneas 144-166)
- **Webhooks de Stripe**: `/app/lib/stripe/webhook-utils.ts`
- **Invitaciones**: Implementado en `/app/routes/dash_.$projectId_.settings.access.tsx`

## GitHub Integration

- **Claude Code Action**: Configurado para responder a menciones `@claude` en issues y PRs
- **Workflow**: `.github/workflows/claude-code.yml`
- **Secrets requeridos**: `ANTHROPIC_API_KEY`

## Deployment

- Producción: fly.io
- always use server directly in imports from that folder with no prefix

### 🚀 Optimizaciones de Deploy Implementadas (22 Agosto 2024)
- **✅ COMPLETADO**: Deploy optimizado de 8-15min → 2-4min (60-75% mejora)
- **Dockerfile Multi-stage**: Cache inteligente de dependencias y build layers
- **VM mejorada**: 512MB → 1024MB memoria para builds más rápidos
- **BuildKit + Cache**: Registry cache persistente para layers de Docker
- **Deploy inteligente**: Detecta cambios en dependencias vs código
- **Scripts de deploy**: `npm run deploy` (rápido) y `npm run deploy:force` (completo)

### Archivos modificados:
- `fly.toml`: VM más grande, builder optimizado, timeouts ajustados
- `Dockerfile`: Multi-stage con cache mount y usuario no-root
- `.dockerignore`: Filtrado completo de archivos innecesarios
- `scripts/fast-deploy.sh`: Deploy inteligente con detección de cambios
- `.fly/docker-cache.sh`: Cache registry persistente

### Issues Conocidos de Deployment
- **Server.js + TypeScript**: Los archivos `.ts` en `/app/services/` no se compilan automáticamente al build
- **Solución**: Mover lógica server-side a `/app/lib/` o `/server/` para compilación automática
- **Email Scheduler**: Temporalmente deshabilitado en `server.js` (línea 42-43)
- **Status Actual**: ✅ Server funcionando sin email automation, ⏳ Pendiente reactivación

## Comandos útiles

- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Deploy rápido**: `npm run deploy`
- **Deploy forzado**: `npm run deploy:force`
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint` (verificar si existe)
- no me gustan los adjetivos bobos y agringados como "felicidades champion"