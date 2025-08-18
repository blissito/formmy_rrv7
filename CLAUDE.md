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
- **OpenRouter models**: Usar para OpenAI, Google, Meta y otros proveedores
- **Separación de proveedores**: Mantener Anthropic directo vs OpenRouter completamente separados
- **No mezclar**: Nunca usar prefijo `anthropic/` con proveedor OpenRouter
- **Modelos "Free"**: Solo rotan entre sí, NUNCA hacen fallback a modelos pagados
- **Modelos "Paid"**: Sin fallback - si fallan, reportar error al usuario

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