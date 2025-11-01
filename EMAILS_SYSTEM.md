# Sistema de Correos - Formmy

Sistema unificado de envío de correos con Agenda.js para cron jobs semanales.

## 📧 Lista de Envíos

### Emails Transaccionales (Funcionando)

| # | Nombre | Archivo | Trigger | Estado |
|---|--------|---------|---------|--------|
| 1 | **Bienvenida** | `/app/utils/notifyers/welcome.ts` | Google OAuth signup | ✅ Activo |
| 2 | **Upgrade a PRO** | `/app/utils/notifyers/pro.ts` | Webhook Stripe - Nueva suscripción | ✅ Activo |
| 3 | **Cancelación de plan** | `/app/utils/notifyers/planCancellation.ts` | Webhook Stripe - Cancelación | ✅ Activo |
| 4 | **Notificación a owner** | `/app/utils/notifyers/notifyOwner.ts` | Nuevo mensaje en formmy | ✅ Activo |
| 5 | **Invitación a proyecto** | `/app/utils/notifyers/sendInvite.tsx` | Invitar miembro | ✅ Activo |
| 6 | **Recordatorio** | `/app/utils/notifyers/reminder.ts` | Scheduler + ReminderService | ✅ Activo |
| 7 | **Compra de créditos** | `/app/utils/notifyers/creditsPurchase.ts` | Webhook Stripe - Checkout créditos | ✅ Activo |
| 8 | **Compra de conversaciones** | `/app/utils/notifyers/conversationsPurchase.ts` | Webhook Stripe - Checkout conversaciones | ✅ Activo |

### Emails Automáticos/Recurrentes (Cron Semanal)

| # | Nombre | Archivo | Schedule | Estado |
|---|--------|---------|----------|--------|
| 9 | **Trial expiry** | `/server/notifyers/freeTrial.ts` | Lunes 9:00 AM | ✅ Activo |
| 10 | **No usage** | `/server/notifyers/noUsage.ts` | Lunes 9:00 AM | ✅ Activo |
| 11 | **Resumen semanal** | `/server/notifyers/weekSummary.ts` | Lunes 9:00 AM | ✅ Activo |

### Procesos Automáticos (Sin Email)

| # | Nombre | Descripción | Schedule | Estado |
|---|--------|-------------|----------|--------|
| 12 | **Trial → FREE conversion** | Convierte usuarios TRIAL expirados (365 días) a plan FREE y desactiva chatbots | Lunes 9:00 AM | ✅ Activo |

**Worker**: `/server/jobs/workers/weekly-emails-worker.ts`
**Schedule**: Corre automáticamente cada lunes a las 9:00 AM via Agenda.js
**Inicialización**: `server.js` - Se registra al inicio del servidor

## 🏗️ Arquitectura

### Template System
**Ubicación**: `/server/email/templates/base-template.ts`

- `createEmailTemplate()` - Template base con branding Formmy
- `emailH2()` - Título H2
- `emailParagraph()` - Párrafo
- `emailTeamSignature()` - Firma del equipo

**Características**:
- ✅ Respeta 100% estilos del branding
- ✅ Header con logo Formmy
- ✅ Footer con redes sociales
- ✅ Sin links de unsubscribe
- ✅ Componentes reutilizables

### Email Service
**Ubicación**: `/server/email/email.service.ts`

**Métodos**:
- `send()` - Envío con retry logic (3 intentos, exponential backoff)
- `sendBatch()` - Envío masivo con throttling
- `validateEmails()` - Validación de emails

**Features**:
- ✅ Retry logic automático
- ✅ Error handling centralizado
- ✅ Logging detallado
- ✅ Rate limiting para batches

### Agenda.js
**Ubicación**: `/server/jobs/agenda.server.ts`

**Workers activos**:
1. `/server/jobs/workers/parser-worker.ts` - Procesamiento asíncrono de documentos
2. `/server/jobs/workers/weekly-emails-worker.ts` - Emails semanales + conversión de trials expirados

**Schedule**:
- Parser: On-demand (cuando se sube un documento)
- Weekly emails: Lunes a las 9:00 AM (cron: `0 9 * * 1`)

**Estado**: ✅ Activo en producción

## 🔌 Integraciones

### Stripe Webhooks
**Archivo**: `/app/lib/stripe/webhook-utils.ts`

- `checkout.session.completed` → Compra de créditos/conversaciones
- `customer.subscription.created` → Upgrade a PRO
- `customer.subscription.deleted` → Cancelación de plan

### Google OAuth
**Archivo**: `/app/lib/google.server.ts`

- Signup exitoso → Email de bienvenida

### Formmy API
**Archivo**: `/app/routes/api.formmy.tsx`

- Nuevo mensaje → Notificación a owner

## 📊 Parámetros Comunes

### BaseEmailParams
```typescript
{
  email: string;
  name?: string;
  userId?: string; // Para tracking futuro
}
```

### Específicos por Email
- **Reminder**: `title`, `date`, `chatbotName`
- **Plan Cancellation**: `endDate`
- **Weekly Summary**: `chatbotName`, `metrics`
- **Credits Purchase**: `credits`, `newBalance`
- **Conversations Purchase**: `conversations`, `newTotal`

## 🛠️ Testing

### Enviar email individual
```typescript
import { sendWelcomeEmail } from 'server/notifyers/welcome';
await sendWelcomeEmail({ email: 'test@example.com', name: 'Test' });
```

### Probar notifyers
```bash
# Crear un script de prueba en scripts/
npx tsx scripts/test-email-notifier.ts
```

## 📝 Convenciones

1. **Imports**: Usar `~/` para rutas absolutas
2. **Error handling**: Try-catch en todos los envíos
3. **Logging**: `console.log` con prefijo `[EmailService]` o `[WeeklyEmailsWorker]`
4. **Async**: Todos los métodos son async/await
5. **Tipos**: TypeScript estricto con interfaces

## 🚀 Deploy

1. Build: `npm run build`
2. Deploy: `npm run deploy`
3. Verificar logs: `fly logs`
4. Monitorear Agenda.js: Collection `agendaJobs` en MongoDB

## ⚠️ Notas Importantes

- **SES**: Remitente único `notificaciones@formmy.app`
- **Rate limits**: Respetar límites de AWS SES
- **Retry**: Máximo 3 intentos con backoff exponencial
- **Batch**: Máximo 5 emails concurrentes
- **Agenda.js**: Collection separada `agendaJobs` - Solo para parser jobs
- **Branding**: NUNCA modificar estilos de templates
- **Weekly emails**: NO implementados actualmente (notifyers existen pero sin scheduler)
