# 🔧 Configuración del Webhook de WhatsApp - GUÍA PASO A PASO

## ⚠️ PROBLEMA ACTUAL

Los mensajes de WhatsApp NO llegan a Formmy porque **el webhook NO está configurado en Meta Dashboard**.

En modo coexistencia, el webhook debe configurarse **UNA VEZ** en el App Dashboard de Meta, y ese webhook global recibirá TODOS los mensajes de TODOS los usuarios.

---

## 📋 PASO 1: Configurar Webhook en Meta Dashboard

### 1.1 Ir a la configuración de webhooks

Abre esta URL:
```
https://developers.facebook.com/apps/1128273322061107/webhooks/
```

### 1.2 Configurar el webhook de WhatsApp

1. **Busca la sección "WhatsApp"** en la lista de productos
2. **Haz clic en "Edit Subscription"** (o "Configure" si es la primera vez)
3. **Ingresa esta información**:

   **Callback URL:**
   ```
   https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook
   ```

   **Verify Token:**
   ```
   formmy_wh_2024_secure_token_f7x9k2m8
   ```

4. **Suscríbete a estos campos** (marca los checkboxes):
   - ✅ `messages` (CRÍTICO - mensajes entrantes)
   - ✅ `message_template_status_update` (estado de templates)

5. **Haz clic en "Verify and Save"**

   Meta enviará una petición GET a tu webhook con un challenge:
   ```
   GET https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook
       ?hub.mode=subscribe
       &hub.verify_token=formmy_wh_2024_secure_token_f7x9k2m8
       &hub.challenge=RANDOM_STRING
   ```

   Tu webhook debe responder con el `hub.challenge` para verificar.

---

## 📋 PASO 2: Verificar que el Webhook Funciona

### 2.1 Verificar en Meta Dashboard

Después de guardar, deberías ver:
- ✅ Estado: "Verified" o "Active"
- ✅ Callback URL: `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`
- ✅ Campos suscritos: `messages`, `message_template_status_update`

### 2.2 Verificar con script

Ejecuta el script de verificación:
```bash
./scripts/whatsapp-webhook-setup.sh
```

### 2.3 Enviar mensaje de prueba

1. Abre WhatsApp en tu teléfono
2. Envía un mensaje a tu número de WhatsApp Business
3. Observa los logs de Fly.io:
   ```bash
   fly logs
   ```

Deberías ver:
```
✅ [WhatsApp Webhook] Message received
📨 [WhatsApp Webhook] From: +1234567890
📨 [WhatsApp Webhook] Message: Hola!
```

---

## 🔍 PASO 3: Troubleshooting

### Problema: "Verify and Save" falla

**Síntoma**: Meta muestra error al verificar el webhook

**Causas posibles**:
1. ❌ Verify token incorrecto
2. ❌ Webhook endpoint no responde
3. ❌ Firewall bloqueando peticiones de Meta

**Solución**:
```bash
# Verificar que el endpoint responde
curl "https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=formmy_wh_2024_secure_token_f7x9k2m8&hub.challenge=test123"

# Debe responder: test123
```

### Problema: Mensajes no llegan

**Síntoma**: Webhook verificado pero mensajes no aparecen en Formmy

**Causas posibles**:
1. ❌ Webhook no suscrito al campo `messages`
2. ❌ WABA no suscrito a la app
3. ❌ Número de teléfono no verificado

**Solución**:

1. **Verificar suscripción de campos**:
   ```bash
   curl -X GET "https://graph.facebook.com/v21.0/1128273322061107/subscriptions?access_token=$FACEBOOK_SYSTEM_USER_TOKEN"
   ```

2. **Verificar WABA suscrito**:
   ```bash
   WABA_ID="1448673546342153"
   curl -X GET "https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps?access_token=$FACEBOOK_SYSTEM_USER_TOKEN"
   ```

   Debe retornar:
   ```json
   {
     "data": [
       {
         "whatsapp_business_api_data": {
           "id": "1128273322061107"
         }
       }
     ]
   }
   ```

3. **Si WABA NO está suscrito** (lista vacía), suscribirlo:
   ```bash
   curl -X POST "https://graph.facebook.com/v21.0/${WABA_ID}/subscribed_apps?access_token=$FACEBOOK_SYSTEM_USER_TOKEN"
   ```

### Problema: Mensajes llegan pero no se enrutan al chatbot correcto

**Síntoma**: Logs muestran mensajes pero no aparecen en conversaciones

**Causa**: Falta `chatbotId` en metadata de la integración

**Solución**:
El webhook usa este flujo:
1. Recibe mensaje de WhatsApp
2. Busca integración por `phoneNumberId`
3. Obtiene `chatbotId` de la integración
4. Crea conversación asociada al chatbot

Verificar que la integración tiene `chatbotId`:
```javascript
// En MongoDB
db.integration.findOne({
  platform: "WHATSAPP",
  phoneNumberId: "845237608662425"
})
// Debe tener: chatbotId: "xxx"
```

---

## 📊 Arquitectura del Webhook en Coexistencia

```
┌─────────────────────────────────────────────────────────────┐
│                     Meta WhatsApp                           │
│                                                             │
│  Usuario envía mensaje → Meta recibe → Busca apps          │
│  suscritas al WABA → Envía a webhook global                │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │  Webhook Global (UNA VEZ)          │
         │  /api/v1/integrations/whatsapp/    │
         │         webhook                    │
         │                                    │
         │  - Recibe TODOS los mensajes       │
         │  - Busca integración por phoneId   │
         │  - Obtiene chatbotId               │
         │  - Crea conversación               │
         └────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │  Conversación en Formmy            │
         │  - Asociada al chatbot correcto    │
         │  - Visible en dashboard            │
         │  - Agent responde                  │
         └────────────────────────────────────┘
```

**Diferencia clave con OAuth normal**:
- ❌ OAuth: Cada usuario tiene su propio webhook con `override_callback_uri`
- ✅ Coexistencia: UN webhook global, enrutamiento por `phoneNumberId`

---

## ✅ Checklist Final

Antes de enviar mensajes de prueba, verifica:

- [ ] Webhook configurado en Meta Dashboard
- [ ] Callback URL: `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`
- [ ] Verify Token: `formmy_wh_2024_secure_token_f7x9k2m8`
- [ ] Campos suscritos: `messages` ✓
- [ ] Estado: "Verified" en Meta Dashboard
- [ ] WABA suscrito a la app (verificar con Graph API)
- [ ] Integración en DB tiene `chatbotId`
- [ ] `FACEBOOK_SYSTEM_USER_TOKEN` configurado en Fly.io

---

## 🔗 Enlaces Útiles

- **Webhook Config**: https://developers.facebook.com/apps/1128273322061107/webhooks/
- **Embedded Signup**: https://developers.facebook.com/apps/1128273322061107/whatsapp-business/wa-settings/
- **Meta Business Suite**: https://business.facebook.com/latest/whatsapp_manager
- **Graph API Explorer**: https://developers.facebook.com/tools/explorer/

---

## 🆘 Si Nada Funciona

1. **Revisa logs de Fly.io en tiempo real**:
   ```bash
   fly logs
   ```

2. **Envía mensaje de prueba** mientras observas los logs

3. **Si no ves NADA en logs** → Webhook no está configurado correctamente en Meta

4. **Si ves logs pero no llega a DB** → Problema en el handler del webhook

5. **Si llega a DB pero no aparece en UI** → Problema en el frontend/loader

Documenta qué ves en logs y podemos diagnosticar juntos.
