---
title: "WhatsApp Coexistencia: Cómo Integrar Cloud API sin Perder tu App Móvil"
excerpt: "Guía práctica para implementar WhatsApp Business Coexistence, permitiendo usar la misma cuenta en tu app móvil y Cloud API simultáneamente. Incluye la estructura real de webhooks."
date: "2025-11-07"
tags: ["Tutorial", "WhatsApp", "Cloud API", "Integraciones", "Webhooks"]
author: "Equipo Formmy"
image: "/blogposts/whatsapp-coexistence.webp"
category: "tutorial"
---

Cuando intentas integrar WhatsApp Business Cloud API, te encuentras con un problema frustrante: **usar la Cloud API desconecta tu WhatsApp Business App del móvil**. Esto significa que pierdes acceso a tus conversaciones históricas y ya no puedes responder desde tu teléfono.

¿La solución? **WhatsApp Business Coexistence** - una funcionalidad que te permite usar ambos simultáneamente.

## 🎯 ¿Qué es Coexistencia?

Coexistencia permite que la misma cuenta de WhatsApp Business funcione en:

- **WhatsApp Business App** (móvil) - Para responder manualmente
- **Cloud API** (servidor) - Para automatizar con chatbots

**Sin coexistencia:** Elegir Cloud API = Perder acceso móvil
**Con coexistencia:** Ambos funcionan al mismo tiempo ✅

## 📋 Requisitos Previos

Antes de comenzar, necesitas:

- Cuenta de WhatsApp Business con número verificado
- Acceso a Meta for Developers
- Embedded Signup implementado
- Webhook endpoint configurado

## 🔑 Paso 1: Activar Coexistencia Durante Onboarding

La coexistencia se activa al conectar tu cuenta. En tu flujo de Embedded Signup:

```typescript
// Al recibir el código de autorización
const response = await fetch(
  `https://graph.facebook.com/v21.0/oauth/access_token`,
  {
    method: 'POST',
    body: JSON.stringify({
      client_id: YOUR_APP_ID,
      client_secret: YOUR_APP_SECRET,
      code: authorizationCode,
    }),
  }
);
```

**Importante:** El usuario DEBE aceptar "Compartir historial" durante el flujo de onboarding para activar coexistencia.

## 📡 Paso 2: Suscribir Webhooks para History Sync

Después del onboarding, solicita la sincronización del historial:

```typescript
// Endpoint: POST https://graph.facebook.com/v21.0/{phone_number_id}/smb_app_data

async function initializeHistorySync(phoneNumberId: string, accessToken: string) {
  // Paso 1: Sincronizar contactos
  await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/smb_app_data`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        sync_type: 'smb_app_state_sync', // Contactos
      }),
    }
  );

  // Paso 2: Sincronizar historial de mensajes
  await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/smb_app_data`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        sync_type: 'history', // Historial (hasta 6 meses)
      }),
    }
  );
}
```

**⏱️ Timing Crítico:** Debes llamar esto **dentro de las 24 horas** después del onboarding.

## 🎣 Paso 3: La Estructura REAL del History Sync Webhook

Aquí está el descubrimiento clave. Meta NO envía la estructura que su documentación sugiere.

### ❌ Lo que esperarías (según docs):

```json
{
  "phone_number_id": "123456789",
  "messages": [
    { "from": "521...", "text": { "body": "Hola" } }
  ]
}
```

### ✅ Lo que REALMENTE envía Meta:

```json
{
  "messaging_product": "whatsapp",
  "metadata": {
    "phone_number_id": "845237608662425"
  },
  "history": [
    {
      "metadata": {
        "phase": 1,
        "chunk_order": 5,
        "progress": 100
      },
      "threads": [
        {
          "id": "5217715268513",
          "messages": [
            {
              "from": "5217712412825",
              "id": "wamid.HBg...",
              "timestamp": "1760104640",
              "text": { "body": "Hola" },
              "type": "text",
              "history_context": {
                "status": "read",
                "from_me": true
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 💻 Paso 4: Procesar el History Sync Correctamente

Aquí está el código para parsear la estructura real:

```typescript
// En tu webhook handler
export async function handleHistorySyncWebhook(payload: any) {
  // ✅ Obtener phone_number_id del metadata
  const phoneNumberId = payload.metadata?.phone_number_id;
  const historyArray = payload.history || [];

  if (!phoneNumberId) {
    console.warn('No phone_number_id found');
    return;
  }

  // ✅ Iterar sobre history array
  for (const historyItem of historyArray) {
    const metadata = historyItem.metadata || {};
    const progress = metadata.progress || 0;
    const phase = metadata.phase || 1;
    const threads = historyItem.threads || [];

    console.log(`Processing chunk: phase ${phase}, progress ${progress}%`);

    // ✅ Iterar sobre threads (conversaciones)
    for (const thread of threads) {
      const contactPhone = thread.id; // Thread ID = número del contacto
      const messages = thread.messages || [];

      console.log(`Thread ${contactPhone}: ${messages.length} messages`);

      // ✅ Iterar sobre mensajes del thread
      for (const msg of messages) {
        // Determinar dirección usando history_context
        const isFromBusiness = msg.history_context?.from_me === true;

        // Solo procesar mensajes de texto
        if (msg.type !== 'text') continue;

        // Guardar mensaje en base de datos
        await saveMessage({
          conversationId: await getOrCreateConversation(contactPhone),
          content: msg.text?.body || '',
          role: isFromBusiness ? 'ASSISTANT' : 'USER',
          timestamp: new Date(parseInt(msg.timestamp) * 1000),
          externalId: msg.id,
        });
      }
    }
  }
}
```

## 🔍 Puntos Clave del Código

### 1. El Thread ID es el Contacto

```typescript
const contactPhone = thread.id; // ✅ Este es el número del cliente
```

### 2. Usar `history_context.from_me` para Dirección

```typescript
const isFromBusiness = msg.history_context?.from_me === true;
// from_me: true  → Mensaje enviado por tu negocio (ASSISTANT)
// from_me: false → Mensaje enviado por el cliente (USER)
```

### 3. Progress Tracking

```typescript
const progress = metadata.progress || 0;

if (progress === 100) {
  console.log('✅ History sync completed!');
  // Actualizar estado en DB
  await markSyncCompleted(phoneNumberId);
}
```

## 📊 Paso 5: Mostrar Estado de Sincronización

Crea un banner en tu UI para mostrar el progreso:

```typescript
function SyncStatusBanner({ integrationId }: { integrationId: string }) {
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'completed' | 'failed'>('syncing');

  useEffect(() => {
    // Poll cada 5 segundos
    const interval = setInterval(async () => {
      const status = await fetch(`/api/sync/status?id=${integrationId}`);
      const data = await status.json();
      setSyncStatus(data.syncStatus);

      if (data.syncStatus === 'completed') {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [integrationId]);

  const config = {
    syncing: { icon: '🔄', text: 'Sincronizando WhatsApp...', color: 'blue' },
    completed: { icon: '✅', text: 'Sincronización completada', color: 'green' },
    failed: { icon: '⚠️', text: 'Error en sincronización', color: 'red' },
  };

  return (
    <div className={`banner banner-${config[syncStatus].color}`}>
      <span>{config[syncStatus].icon}</span>
      <span>{config[syncStatus].text}</span>
    </div>
  );
}
```

## ⚠️ Errores Comunes y Soluciones

### Error: "No history data received"

**Causa:** Usuario no aceptó "Compartir historial" durante onboarding

**Solución:**
```typescript
// Verificar error específico de Meta
if (errorText.includes('2593109')) {
  console.log('User declined history sharing - this is expected');
  // No marcar como error fatal
}
```

### Error: "Timeout esperando webhooks"

**Causa:** History sync puede tardar varios minutos

**Solución:**
```typescript
// Usar timeout pragmático
const shouldComplete =
  progress === 100 ||
  (timeSinceLastWebhook > 60 && lastProgress > 0);
```

### Error: "Phone number undefined"

**Causa:** Buscar `phone_number_id` en lugar equivocado

**Solución:**
```typescript
// ❌ Incorrecto
const phoneNumberId = payload.phone_number_id;

// ✅ Correcto
const phoneNumberId = payload.metadata?.phone_number_id;
```

## 🎓 Checklist de Implementación

Para implementar coexistencia correctamente:

- [ ] Embedded Signup configurado con scope `whatsapp_business_messaging`
- [ ] Usuario acepta "Compartir historial" durante onboarding
- [ ] Webhook subscrito a campo `history`
- [ ] Sincronización iniciada dentro de 24 horas post-onboarding
- [ ] Parser maneja estructura `history[].threads[].messages[]`
- [ ] Usar `history_context.from_me` para determinar dirección
- [ ] Progress tracking implementado (0-100%)
- [ ] Timeout pragmático para cuentas con poco historial

## 🚀 Beneficios de Coexistencia

Una vez implementado correctamente:

✅ Respuestas automáticas por chatbot 24/7
✅ Respuestas manuales desde móvil cuando sea necesario
✅ Historial completo sincronizado (hasta 6 meses)
✅ Contactos compartidos entre móvil y Cloud API
✅ Sin perder acceso a ninguna plataforma

## 📚 Recursos Adicionales

- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Embedded Signup Guide](https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows)
- [Webhook Reference](https://developers.facebook.com/docs/graph-api/webhooks)

## Conclusión

WhatsApp Business Coexistence es la clave para aprovechar lo mejor de ambos mundos: automatización potente con Cloud API y flexibilidad manual con la app móvil.

La estructura real de los webhooks (`history[].threads[]`) es diferente a la documentación, pero con este tutorial tienes todo lo necesario para implementarlo correctamente desde la primera vez.

---

**¿Quieres integrar WhatsApp Business con coexistencia automáticamente?**

[Prueba Formmy](https://formmy.app) - manejamos toda la complejidad de Meta por ti, incluyendo History Sync, webhooks y sincronización.

*¿Tienes preguntas sobre la implementación? ¡Nuestro equipo está listo para ayudarte!*
