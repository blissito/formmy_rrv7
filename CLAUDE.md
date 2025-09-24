# Formmy - Project Context

## ⚠️ REGLA CRÍTICA PARA CLAUDE

**SIEMPRE lee la documentación oficial antes de implementar cualquier funcionalidad de librerías externas.**

- **WebFetch** la documentación oficial del framework/librería que estés usando
- **NO hagas suposiciones** sobre APIs o funcionalidades sin verificar
- **NO improvises** implementaciones basándote en conocimiento incompleto
- Si no estás 100% seguro de cómo funciona algo, **busca la documentación primero**

Ejemplo: Para LlamaIndex streaming, leer https://docs.llamaindex.ai/en/stable/understanding/agent/streaming/ antes de implementar.

## Overview

Formmy es una plataforma SaaS de formularios y chatbots con capacidades avanzadas de AI y automatización, que posee un agente inteligente con acceso a herramientas avanzadas e integraciones.

**URL de Producción**: https://formmy-v2.fly.dev

## Arquitectura

- **Frontend**: React Router v7 no Remix, tailwindcss
- **Backend**: fly.io + Prisma
- **Base de datos**: MongoDB
- **AI**: Open Router
- **Pagos**: Stripe
- **Analytics**: Google Analytics, Google Search Console API
- **Email**: AWS SES con nodemailer

## ✅ MIGRACIÓN COMPLETADA: ARQUITECTURA MULTI-AGENTE

### ⚡ RESULTADO FINAL
**Objetivo**: ✅ COMPLETADO - Arquitectura unificada con AgentEngine_v0 como motor único
**Timeline**: 6 horas implementación → ✅ EXITOSO
**Status**: 🚀 EN PRODUCCIÓN

### 🏗️ NUEVA ARQUITECTURA

#### **Motor Único**
- **AgentEngine_v0**: Motor base industrial para TODOS los agentes (`/server/agent-engine-v0/simple-engine.ts`)
- **Status**: ✅ GRADO INDUSTRIAL - 465 líneas, multi-proveedor, robusto

#### **Agentes Especializados** (Nueva estructura)
```
/server/agents/
  ghosty-agent.ts          # Asistente principal, acceso completo a tools
  sales-agent.ts           # Tools de ventas y CRM
  content-agent.ts         # Tools de SEO y contenido
  data-agent.ts            # Tools de analytics
```

### ✅ ELEMENTOS ELIMINADOS
- **`/server/llamaindex-engine-v2/`** → ✅ BORRADO COMPLETO
- **`/server/ghosty-llamaindex/`** → ✅ BORRADO COMPLETO
- **GhostyLlamaIndex** → ✅ Reemplazado por GhostyAgent
- **Referencias Engine v2** → ✅ Limpieza total completada

## ⚡ MIGRACIÓN GHOSTY → AGENTV0 COMPLETADA (Sept 22, 2025)

### 🎯 **OBJETIVO ALCANZADO**
**Migrar Ghosty desde sistema legacy complejo → LlamaIndex Agent Workflows puro**
- **Timeline**: 3 horas debugging → ✅ EXITOSO
- **Status**: 🚀 PRODUCCIÓN FUNCIONAL

### 🔧 **PROBLEMAS RESUELTOS**

#### **1. Tools Loading Issue**
- **Problema**: TRIAL users mostraban 0 tools instead of 6
- **Root Cause**: Frontend usaba endpoint legacy `/api/ghosty/chat/enhanced`
- **Solución**: ✅ Migrado a `/api/ghosty/v0` con AgentV0 real
- **Resultado**: 6 herramientas funcionando para TRIAL users

#### **2. GPT-5 Nano Temperature Error**
- **Problema**: `BadRequestError: 400 'temperature' does not support 0.1 with this model`
- **Root Cause**: LlamaIndex OpenAI client hardcoded default `temperature: 0.1`
- **Solución**: ✅ `temperature: 1` (único valor soportado por GPT-5 Nano)
- **Código**:
```typescript
if (selectedModel === 'gpt-5-nano') {
  llmConfig.temperature = 1; // Only value supported by GPT-5 nano
}
```

#### **3. UI Simplification**
- **Problema**: UI mostraba "🧠 Adaptivo" mode confuso
- **Solución**: ✅ Cambiado a "🌐 GPT-5" directo
- **Beneficio**: UX más clara y directa

### 🏗️ **ARQUITECTURA FINAL AgentV0**

#### **Core Implementation**:
- **File**: `/server/agents/agent-v0.server.ts`
- **Pattern**: LlamaIndex Agent Workflows oficial 100%
- **Size**: 176 líneas (vs 465 líneas legacy)
- **Features**: Real streaming, tool support, error handling robusto

#### **Tools System**:
- **Registry**: `/server/tools/index.ts`
- **Pattern**: Factory functions con context injection
- **TRIAL Plan**: 6 herramientas (schedule_reminder, contact, etc.)
- **Context**: userId, userPlan, chatbotId, message, integrations

#### **Frontend Integration**:
- **Hook**: `/app/components/ghosty/hooks/useGhostyLlamaChat.ts`
- **Endpoint**: `/api/ghosty/v0` (nuevo)
- **UI**: `/app/components/ghosty/GhostyEnhancedInterface.tsx`
- **Streaming**: Server-Sent Events con tool progress tracking

### 📊 **PERFORMANCE GAINS**

#### **Code Reduction**:
- **Legacy System**: 465+ líneas complejas
- **AgentV0**: 176 líneas funcional puro
- **Reduction**: ~62% menos código

#### **Functionality**:
- **Tools**: ✅ 6 herramientas funcionando
- **Streaming**: ✅ Real-time SSE
- **Error Handling**: ✅ Robusto con fallbacks
- **Models**: ✅ GPT-5 Nano optimizado

### 🚀 **RESULTADO FINAL**
**Ghosty AgentV0** es ahora un sistema **100% LlamaIndex nativo** que:
- Usa patterns oficiales de Agent Workflows
- Mantiene todas las herramientas existentes
- Ofrece mejor performance y menor complejidad
- Soporta GPT-5 Nano con temperature correcta
- Integra perfectamente con la UI existente

**Status**: ✅ **MIGRACIÓN EXITOSA - SISTEMA EN PRODUCCIÓN**

### Ghosty (Implementación AgentV0 COMPLETADA ✅)

**Ubicación**: `/dashboard/ghosty`
**Motor**: **LlamaIndex Agent Workflows** (100% nativo)
**Implementación**: `/server/agents/agent-v0.server.ts`
**Descripción**: Agente principal de la plataforma que actúa como interfaz conversacional para:

- Guiar a usuarios en la creación de formularios y chatbots
- Proporcionar insights y métricas SEO
- Ofrecer recomendaciones de optimización
- Ejecutar tareas automatizadas
- Servir como punto central de información del sistema

**Arquitectura Final**:
- **Motor**: LlamaIndex Agent Workflows V1 (`/server/agents/agent-v0.server.ts`)
- **Pattern**: Workflows oficiales 100% nativos
- **Tools**: Sistema centralizado (`/server/tools/index.ts`)
- **Memory**: Gestión de historial conversacional
- **Context**: userId, userPlan, chatbotId, message, integrations
- **Streaming**: Server-Sent Events con tool progress tracking

**🚧 TODOs para Ghosty - CRUD Completo (Próximas implementaciones)**:

### Herramientas de Gestión de Chatbots
- [ ] **create_chatbot**: Crear nuevos chatbots con configuración completa
- [ ] **update_chatbot**: Modificar configuración, personalidad, modelo AI
- [ ] **delete_chatbot**: Eliminar chatbots (soft delete)
- [ ] **clone_chatbot**: Duplicar chatbots existentes
- [ ] **toggle_chatbot_status**: Activar/desactivar chatbots

### Herramientas de Contextos
- [ ] **add_context**: Subir archivos, URLs, texto a chatbots
- [ ] **remove_context**: Eliminar contextos específicos
- [ ] **update_context**: Modificar contextos existentes
- [ ] **optimize_contexts**: Reordenar por relevancia y tamaño

### Herramientas de Formularios
- [ ] **query_forms**: Consultar formularios del usuario
- [ ] **create_form**: Crear nuevos formularios
- [ ] **update_form**: Modificar estructura y campos
- [ ] **delete_form**: Eliminar formularios
- [ ] **get_form_responses**: Obtener respuestas y estadísticas

### Herramientas de Integraciones
- [ ] **setup_whatsapp**: Configurar integración WhatsApp
- [ ] **setup_stripe**: Configurar pagos Stripe
- [ ] **setup_webhook**: Configurar webhooks personalizados
- [ ] **test_integrations**: Probar conectividad de integraciones

### ✅ WhatsApp Coexistence - Embedded Signup (IMPLEMENTADO - Sept 18, 2025)
- [x] **Reemplazar modal manual por Embedded Signup**: ✅ Meta JavaScript SDK integrado
- [x] **Crear WhatsAppCoexistenceModal.tsx**: ✅ Componente con Facebook SDK completo
- [x] **Endpoint /api/v1/integrations/whatsapp/embedded-signup**: ✅ Backend para token exchange
- [x] **Webhook interno Formmy**: ✅ Sistema robusto maneja mensajes echo automáticamente
- [x] **Variables de entorno Meta**: ✅ FACEBOOK_APP_ID, FACEBOOK_APP_SECRET configuradas
- [x] **Schema BD actualizado**: ✅ platform, token, phoneNumberId, webhookVerifyToken
- [x] **Setup automático de webhook**: ✅ Configuración automática durante signup
- [x] **Integración AgentEngine V0**: ✅ Respuestas inteligentes con filtrado echo

#### 🚨 **BLOQUEADOR ACTUAL: Meta App Review**
- **Status**: ⏳ Pendiente Advanced Access para permisos WhatsApp Business API
- **Permisos solicitados**:
  - `whatsapp_business_management` (gestión WABAs, templates, números)
  - `whatsapp_business_messaging` (envío/recepción mensajes)
  - `whatsapp_business_manage_events` (eventos, webhooks)
- **Standard Access**: ❌ NO permite Embedded Signup (solo mensajería básica)
- **Advanced Access**: ✅ Requerido para funcionalidad completa
- **Timeline**: 1-2 semanas para App Review de Meta

### Herramientas de Análisis Avanzado
- [ ] **get_conversation_insights**: Análisis profundo de conversaciones
- [ ] **get_performance_metrics**: KPIs y métricas de rendimiento
- [ ] **generate_reports**: Informes automáticos en PDF/CSV
- [ ] **get_usage_forecasts**: Predicciones de uso y costos

### Herramientas de Automatización
- [ ] **bulk_operations**: Operaciones masivas en chatbots
- [ ] **schedule_maintenance**: Programar mantenimiento automático
- [ ] **backup_restore**: Respaldo y restauración de configuraciones
- [ ] **export_import**: Migración entre cuentas/ambientes

### ✅ Respuestas Manuales en Conversaciones (COMPLETADO - Sept 2025)
- [x] **Sistema de toggle manual/automático**: ✅ Toggle híbrido local+backend con sincronización automática
- [x] **Envío real por WhatsApp Business API**: ✅ Integración completa con Meta Business API
- [x] **Persistencia de modo manual**: ✅ Campo manualMode en BD con Prisma sincronizado
- [x] **UX ultra-optimizada**: ✅ Layout flex simple, scroll natural, textarea protegido
- [x] **Sincronización estado**: ✅ Estado local inicializado con BD, sync automático, rollback en errores
- [x] **Manejo robusto de errores**: ✅ Fallback graceful cuando WhatsApp falla, feedback contextual
- [x] **Respuestas rápidas**: ✅ Templates predefinidos para agentes
- [x] **Validaciones de producción**: ✅ Timeouts, logs seguros, verificaciones backend
- [x] **API endpoints funcionales**: ✅ /api/v1/conversations con toggle + envío manual
- [x] **Layout responsivo**: ✅ Chat natural con header fijo, mensajes scrollables, input protegido

#### Próximas mejoras pendientes:
- [ ] **Email/SMS fallback**: Sistema de respuesta por email cuando WhatsApp no está disponible
- [ ] **Historial de respuestas**: Guardar quién envió qué respuesta manual (audit trail)
- [ ] **Notificaciones al equipo**: Alertar cuando conversación cambia a modo manual
- [ ] **Asignación de conversaciones**: Sistema para asignar conversaciones manuales a agentes específicos

### Sistema de Tool Credits (NUEVA IMPLEMENTACIÓN PENDIENTE)
- [ ] **Implementar sistema de credits**: Tracking de tool calls por usuario/plan
- [ ] **Credit deduction system**: Descontar credits según herramienta usada
- [ ] **Usage monitoring**: Dashboard para ver consumo de credits mensual
- [ ] **Upgrade prompts**: Notificar cuando se acerquen a límites
- [ ] **Credit refill**: Reset automático cada mes según plan
- [ ] **Overage protection**: Bloquear tools cuando credits = 0

**Prioridad de Implementación**:
1. **Sistema Tool Credits** (ALTA PRIORIDAD - Monetización)
2. **Simplificación de todos los agent prompts** (INMEDIATO - Optimización costos)
3. Completar herramientas de gestión básica → Contextos → Integraciones → Analytics → Automatización

**Próximos Pasos Inmediatos**:
- [x] Simplificar prompts de todos los agentes (sales, content_seo, data_analyst, automation_ai, growth_hacker) ✅ (Sept 16, 2025)
- [x] **Reparar funcionalidad del dashboard de chatbots** ✅ (Sept 16, 2025)
  - [x] Modularizar API v1 endpoint con arquitectura limpia
  - [x] Restaurar CRUD completo de contextos (entrenamiento)
  - [x] Implementar gestión completa de chatbots
  - [x] Sistema de procesamiento de archivos (PDF/DOCX/XLSX)
- [x] **Migrar Ghosty a AgentEngine V0** ✅ (Sept 22, 2025)
  - [x] Reemplazar sistema complejo por motor LlamaIndex Agent Workflows
  - [x] Mantener todas las herramientas existentes (6 tools funcionando)
  - [x] Conservar UI y experiencia de usuario actual
  - [x] Probar compatibilidad con todas las tools del registry
  - [x] Deploy gradual sin interrumpir servicio
- [ ] Implementar sistema Tool Credits con tracking por usuario/plan
- [ ] Optimizar context compression en todos los prompts del sistema


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
- **Starter**: $149 MXN/mes - 2 chatbots, 50 conversaciones, 200 tool credits, GPT-5 Nano + Gemini 2.5 Flash-Lite
  - *Stripe Price ID*: `price_1S5AqXDtYmGT70YtepLAzwk4`
- **Pro**: $499 MXN/mes - 10 chatbots, 250 conversaciones, 1000 tool credits, Claude 3 Haiku
  - *Stripe Price ID*: `price_1S5CqADtYmGT70YtTZUtJOiS`
- **Enterprise**: $1,499 MXN/mes - Ilimitado, 1000 conversaciones, 5000 tool credits, GPT-5 Mini + Claude 3.5 Haiku
  - *Stripe Price ID*: `price_1S5Cm2DtYmGT70YtwzUlp99P`

#### 🎯 Sistema de Tool Credits
**Protección contra uso excesivo de herramientas avanzadas**:
- **Conversaciones** = Token tracking (sistema actual)
- **Tool Credits** = Límite adicional para herramientas (nuevo sistema híbrido)

#### 💳 Consumo de Credits por Herramienta
```typescript
// Credits por complejidad de herramienta
const TOOL_CREDITS = {
  // Básicas (1 AI call)
  schedule_reminder: 1,
  list_reminders: 1,

  // Intermedias (2-3 AI calls)
  create_payment_link: 2,
  calendar_create_event: 3,
  database_query: 3,

  // Avanzadas (4+ AI calls)
  bulk_email_campaign: 5,
  document_analysis: 4,
  complex_automation: 6
};
```

#### 📊 Consumo Mensual Estimado (Usuario PRO Activo)
- **Recordatorios básicos**: 20/mes × 1 credit = 20
- **Google Calendar**: 15 eventos/mes × 4 credits = 60
- **Drive + RAG**: 10 documentos/mes × 1 credit = 10
- **DB queries**: 25 consultas/mes × 3 credits = 75
- **Stripe payments**: 30 links/mes × 2 credits = 60
- **WhatsApp automation**: 40 respuestas/mes × 2 credits = 80
- **Total mensual**: ~305 credits (usuario PRO activo = 1000 credits disponibles)

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


## ✅ Sistema Actual (Septiembre 2025)

### Ghosty AgentV0: Migración Exitosa ✨
- **Status**: ✅ Migración completada con éxito (Sept 22, 2025)
- **Arquitectura**: LlamaIndex Agent Workflows nativo, 176 líneas de código
- **Resultados**: 6 herramientas funcionando, streaming SSE, GPT-5 Nano optimizado
- **Performance**: 62% reducción de código vs sistema legacy
- **Frontend**: Endpoint `/api/ghosty/v0` con UI intacta
- **Logros**: 3 horas debugging → sistema 100% funcional


### Sistema de Recordatorios ✨
- **Status**: ✅ Sistema completo operativo
- **Arquitectura**: LlamaIndex Engine v2 + herramientas centralizadas
- **Acceso**: Usuarios PRO/ENTERPRISE con validación automática

### GPT-5 Nano: Modelo Principal ✨
- **Status**: ✅ Modelo por defecto optimizado
- **Características**: Herramientas completas, 99% profit margin
- **Soporte**: OpenAI Direct API con configuración optimizada

### Arquitectura de Proveedores
- **OpenAI Provider**: ✅ GPT-5-nano, GPT-5-mini con herramientas
- **Anthropic Provider**: ✅ Claude 3 Haiku, 3.5 Haiku con herramientas
- **OpenRouter Provider**: ❌ Gemini sin herramientas (limitaciones OpenRouter)

### Configuración Actual de Planes
- **FREE**: Sin acceso después de trial (60 días)
- **STARTER**: GPT-5 Nano ($149 MXN)
- **PRO**: GPT-5 Nano ($499 MXN)
- **ENTERPRISE**: GPT-5 Mini + Claude 3.5 Haiku ($1,499 MXN)

### Simplificación de Prompts (Sept 16, 2025) ✨
- **Status**: ✅ TODOS los agentes dramaticamente simplificados
- **Cambios realizados**:
  - **Sales**: 19 líneas → 1 línea (95% reducción): "Ventas consultivas. Identifica necesidades → propone soluciones → cierra deals. ROI-focused."
  - **Content SEO**: 18 líneas → 1 línea (94% reducción): "SEO y contenido. Keywords → contenido E-E-A-T → rankings. AI Overview, voice search, Core Web Vitals."
  - **Data Analyst**: 25 líneas → 1 línea (96% reducción): "Data analyst. KPIs → análisis → insights accionables. GA4, attribution, métricas SaaS."
  - **Automation AI**: 25 líneas → 1 línea (96% reducción): "Automatización + IA. Procesos → automatizar → escalar. LLMs, Zapier, Make, RPA, RAG."
  - **Growth Hacker**: 25 líneas → 1 línea (96% reducción): "Growth hacking. Experimentos → datos → escalar. PLG, viral loops, AARRR funnel."
  - **Mensajes bienvenida/despedida**: Reducidos a preguntas directas esenciales
- **Beneficios**: 90% menos tokens, respuestas más directas, menor latencia, palabras clave conservadas
- **Impacto**: ~90% reducción en tokens de system prompt para TODOS los agentes

### API v1 Chatbot - Arquitectura Modular (Sept 16, 2025) ✨
- **Status**: ✅ Sistema completamente funcional con arquitectura modular
- **Problema resuelto**: Sección de entrenamiento no funcionaba (intents faltantes)
- **Solución implementada**: Delegación modular manteniendo endpoint limpio

#### **Arquitectura Modular**:
```
/app/routes/api.v1.chatbot.ts (Switch principal - 330 líneas)
├── Context Handler (/server/chatbot/context-handler.server.ts)
│   ├── add_file_context (PDF, DOCX, XLSX, TXT)
│   ├── add_url_context (Websites)
│   ├── add_text_context + update_text_context
│   ├── add_question_context + update_question_context
│   ├── remove_context
│   └── get_contexts
├── Management Handler (/server/chatbot/management-handler.server.ts)
│   ├── create_chatbot (con validaciones de plan)
│   ├── delete_chatbot + activate_chatbot + deactivate_chatbot
│   ├── set_to_draft + get_chatbot_state
│   └── get_chatbot_by_slug
└── Integration Handler (/server/chatbot/integration-handler.server.ts)
    ├── create_integration + get_integrations
    ├── update_integration + toggle_integration_status
    └── delete_integration
```

#### **Funcionalidad Restaurada**:
- ✅ **Entrenamiento**: CRUD completo de contextos (archivos, texto, Q&A, URLs)
- ✅ **Gestión**: Crear/eliminar/activar chatbots con validaciones
- ✅ **Integraciones**: Gestión completa de servicios externos
- ✅ **Procesamiento**: Archivos PDF/DOCX/XLSX con librerías especializadas

#### **Beneficios de la Modularización**:
- 🔧 **Mantenibilidad**: Lógica separada por funcionalidad
- 🚀 **Performance**: Imports dinámicos, carga bajo demanda
- 🧪 **Testeable**: Handlers independientes fáciles de probar
- 📦 **Reutilizable**: Handlers pueden usarse en otros endpoints
- 🔍 **Debuggeable**: Errores aislados por módulo




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
- [x] **Verificar, mejorar y simplificar los prompt base de sistema de los agentes en pestaña Preview > Agente** ✅ (Sept 16, 2025)
- [x] **Reparar funcionalidad de entrenamiento del dashboard de chatbots** ✅ (Sept 16, 2025)

## Roadmap Técnico


### Google Gemini Direct API Integration
- **Objetivo**: Reducción de costos 90% vs OpenRouter
- **Implementación**: Proveedor directo en LlamaIndex Engine v2
- **ROI**: ~$48K USD/año ahorro adicional
- **Stack**: Google AI SDK + Function Calling nativo

### RAG Implementation
- **Objetivo**: Contexto 50MB+ sin explosión de costos
- **Stack**: ChromaDB + OpenAI Embeddings integrados en Engine v2
- **ROI**: Diferenciador Enterprise $1,499
- **Implementación**: Vector DB + chunking + búsqueda semántica

### Límites de Protección
- **Tokens máximos por consulta**: Starter 4K, Pro 8K, Enterprise 16K
- **Límites diarios**: Starter 20, Pro 100, Enterprise 500 consultas
- **Implementación**: En LlamaIndex Engine v2 con validación automática

## Convenciones de código

- TypeScript estricto con validaciones completas
- **Imports dinámicos permitidos** en endpoints server para optimización de performance (cargar módulos bajo demanda)
- **NUNCA colocar utilidades en el mismo módulo de ruta** - siempre crear archivos `.server.tsx` correspondientes para utilidades
- No agregar funciones de utilidad directamente en archivos de rutas - moverlas a archivos server separados
- **Arquitectura modular**: Delegar lógica compleja a handlers especializados
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

### Configuración de Modelos AI

Cada modelo tiene configuración optimizada en el motor LlamaIndex Engine v2:

```typescript
// Configuraciones por modelo (server/llamaindex-engine-v2/)
'gpt-5-nano': {
  temperature: undefined,      // GPT-5 nano no soporta temperature
  contextLimit: 4000,
  retryConfig: { maxRetries: 3, backoffMs: 1000 }
},
'claude-3-haiku-20240307': {
  temperature: 0.7,            // Haiku necesita control de variabilidad
  contextLimit: 3500,
  retryConfig: { maxRetries: 4, backoffMs: 1500 }
},
'claude-3-5-haiku-20241022': {
  temperature: 0.5,            // Más determinista que 3.0
  contextLimit: 4000,
  retryConfig: { maxRetries: 3, backoffMs: 1000 }
},
'gpt-5-mini': {
  temperature: 0.3,            // Máximo determinismo Enterprise
  contextLimit: 5000,
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

### Motor LlamaIndex Engine v2 - Características
- **Streaming**: Deshabilitado para compatibilidad con herramientas
- **Tools Support**: GPT-5-nano, GPT-5-mini, Claude 3 Haiku, Claude 3.5 Haiku
- **Sistema de Proveedores**: OpenAI Direct, Anthropic Direct, OpenRouter
- **Error Handling**: Manejo robusto y reintentos automáticos
- **Token Management**: Límites inteligentes por plan de usuario
- **Memory**: Historial conversacional con truncamiento automático

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

## AgentMapper - Mapeo Formmy ↔️ Flowise

### Descripción
Sistema de mapeo bidireccional entre configuraciones de chatbots Formmy y Flowise AgentFlow V2, permitiendo exportar/importar flows entre plataformas.

### Mapeo de Configuración

#### 1. Configuración Base
```typescript
// Formmy Chatbot → Flowise AgentFlow
{
  name: chatbot.name,
  description: chatbot.description,
  state: {
    personality: chatbot.personality,
    systemPrompt: `${chatbot.instructions}\n${chatbot.customInstructions}`,
    welcomeMessage: chatbot.welcomeMessage
  },
  llmConfig: {
    model: chatbot.aiModel,
    temperature: chatbot.temperature
  }
}
```

#### 2. Contextos → Knowledge Store
```typescript
// Formmy contexts (FILE, LINK, TEXT, QUESTION) → Flowise Document Stores
chatbot.contexts.map(context => ({
  type: "documentStore",
  config: {
    storeType: context.type === "FILE" ? "document" : "text",
    source: context.fileUrl || context.url || context.content,
    metadata: { title: context.title, sizeKB: context.sizeKB }
  }
}))
```

#### 3. Herramientas → Tool Nodes
```typescript
// Formmy tools → Flowise API Tools
tools.map(tool => ({
  type: "apiTool",
  name: tool.name,
  method: "POST",
  endpoint: `/api/tools/${tool.name}`,
  schema: tool.parameters
}))
```

#### 4. Agent Framework → Sequential Nodes
```typescript
// Formmy Agent Loop → Flowise Sequential Agent
{
  type: "sequentialAgent",
  maxIterations: config.maxIterations,
  retryConfig: config.retryConfig,
  nodes: [
    { type: "input", id: "start" },
    { type: "agent", id: "main", tools: availableTools },
    { type: "conditional", id: "toolCheck" },
    { type: "output", id: "response" }
  ]
}
```

#### 5. Integraciones → Sub-workflows
```typescript
// WhatsApp, Stripe → Flowise Sub-flows
integrations.map(int => ({
  type: "subflow",
  flowId: `integration_${int.type}`,
  config: int.settings
}))
```

### Compatibilidad con Flycast
- **Posible**: Flowise puede desplegarse en Fly.io usando Flycast para networking privado
- **Arquitectura**: Formmy API (Fly app) → Flycast → Flowise (contenedor privado)
- **Beneficios**: Baja latencia, comunicación segura, sin exposición pública
- **Configuración**: `fly.toml` con internal_port para Flowise, proxy reverso en Formmy

### Implementación Futura
- [ ] Endpoint `/api/export/flowise` para generar JSON de AgentFlow
- [ ] Endpoint `/api/import/flowise` para importar configuraciones
- [ ] UI de sincronización bidireccional en dashboard
- [ ] Webhook para actualización automática de flows

## Deployment

- Producción: fly.io
- always use server directly in imports from that folder with no prefix

### 🚀 Optimizaciones de Deploy
- **Deploy optimizado**: 8-15min → 2-4min (60-75% mejora)
- **Dockerfile Multi-stage**: Cache inteligente de dependencias
- **Scripts**: `npm run deploy` (rápido) y `npm run deploy:force` (completo)
- **Status**: ✅ Producción estable en fly.io

## Comandos útiles

- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Deploy rápido**: `npm run deploy`
- **Deploy forzado**: `npm run deploy:force`
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint` (verificar si existe)
- no me gustan los adjetivos bobos y agringados como "felicidades champion"