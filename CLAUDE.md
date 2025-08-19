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

### schedule_reminder (Recordatorios) ✨ NUEVO
- **Función**: Programar recordatorios y citas
- **Acceso**: Usuarios PRO/ENTERPRISE 
- **Parámetros**: title, date (YYYY-MM-DD), time (HH:MM), email (opcional)
- **Features**: 
  - Almacenamiento en DB (MongoDB/Prisma)
  - Email automático con template Formmy
  - Validación de fecha futura
  - Integración futura con agenda.js
- **Respuesta**: Confirmación con fecha formateada

## ✅ Cambios Recientes (Agosto 2024)

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

## Próximos pasos técnicos

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

- **Anthropic models**: SIEMPRE usar conexión directa API, NUNCA a través de OpenRouter
- **OpenAI models**: SIEMPRE usar conexión directa API con CHATGPT_API_KEY, NUNCA a través de OpenRouter
- **OpenRouter models**: Solo para Google, Meta, Mistral y otros proveedores terceros
- **Separación de proveedores**: Mantener Anthropic y OpenAI directos vs OpenRouter completamente separados
- **No mezclar**: Nunca usar prefijos `anthropic/` o `openai/` con proveedor OpenRouter
- **Modelos PRO**: Todos los modelos requieren plan PRO o trial activo de 60 días
- **Usuarios FREE**: Acceso completo durante 60 días desde registro, luego sin acceso a modelos
- **Sin fallback entre planes**: Usuarios sin acceso reciben error, no degradación de modelo

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

## Comandos útiles

- **Build**: `npm run build`
- **Dev**: `npm run dev`
- **Typecheck**: `npm run typecheck`
- **Lint**: `npm run lint` (verificar si existe)