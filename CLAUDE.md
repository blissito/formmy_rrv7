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
- **Pricing psicológico**: Precios bajo barreras ($189, $499, $899)

## Convenciones de código

- TypeScript estricto, **NUNCA imports dinámicos** - usar solo imports estáticos
- **NUNCA colocar utilidades en el mismo módulo de ruta** - siempre crear archivos `.server.tsx` correspondientes para utilidades
- No agregar funciones de utilidad directamente en archivos de rutas - moverlas a archivos server separados
- Server Components por defecto
- Prisma para ORM
- Tailwind CSS para estilos
- Para importar archivos desde `/server` en archivos dentro de `/app`, usar la ruta `server/...` sin prefijo ni alias

## AI Models Architecture Rules

- **Anthropic models**: SIEMPRE usar conexión directa API, NUNCA a través de OpenRouter
- **OpenAI models**: SIEMPRE usar conexión directa API con CHATGPT_API_KEY, NUNCA a través de OpenRouter
- **OpenRouter models**: Solo para Google, Meta, Mistral y otros proveedores terceros
- **Separación de proveedores**: Mantener Anthropic y OpenAI directos vs OpenRouter completamente separados
- **No mezclar**: Nunca usar prefijos `anthropic/` o `openai/` con proveedor OpenRouter
- **Modelos PRO**: Todos los modelos requieren plan PRO o trial activo de 60 días
- **Usuarios FREE**: Acceso completo durante 60 días desde registro, luego sin acceso a modelos
- **Sin fallback entre planes**: Usuarios sin acceso reciben error, no degradación de modelo

### Streaming Implementation
- **TextDecoderStream**: Usar streams nativos para evitar corrupción de caracteres UTF-8
- **Buffer Management**: TransformStream con buffer persistente para manejar líneas incompletas
- **Token Limits**: Sistema inteligente de tokens según contexto (200-600 tokens)
- **Error Handling**: Manejo robusto de finishReason y cierre correcto de streams

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