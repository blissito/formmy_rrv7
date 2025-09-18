# 📱 WhatsApp Business Platform - Configuración como Tech Provider

## 🎯 Flujo Actual (2025)

WhatsApp ahora requiere que te registres como **Tech Provider** (Proveedor de Tecnología) para enviar mensajes en nombre de tus clientes.

## 📋 Pasos para Convertirte en Tech Provider

### 1. Registro como Tech Provider

1. Ve a **Meta for Developers** → Tu App
2. En WhatsApp, busca **"Become a Tech Provider"** o **"Conviértete en un proveedor de tecnología"**
3. Completa el formulario de registro:
   - Información de tu empresa
   - Caso de uso (SaaS de chatbots)
   - Volumen estimado de mensajes
   - Países donde operarás

### 2. Configuración Básica de la App

```bash
# Variables de entorno necesarias
FACEBOOK_APP_ID=1128273322061107
FACEBOOK_APP_SECRET=c49cf42e3c45c64f818b70d09daa4c63
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id
WHATSAPP_PHONE_NUMBER_ID=tu_phone_number_id
```

### 3. Flujo de Onboarding para Clientes

Una vez aprobado como Tech Provider, tus clientes podrán:

1. **Conectar su número de WhatsApp Business** a través de tu plataforma
2. **Autorizar a tu app** para enviar mensajes en su nombre
3. **Gestionar plantillas** de mensajes

## 🔄 Flujo Simplificado Actual

### Para Desarrollo/Testing:

1. **Usar números de prueba**:
   - Meta for Developers → WhatsApp → API Setup
   - "Add phone number" → Test number
   - No requiere verificación de negocio

2. **Configurar Webhook**:
   ```
   URL: https://tu-dominio.com/api/v1/webhooks/whatsapp
   Verify Token: tu_token_secreto
   Campos: messages, message_status
   ```

3. **Obtener Access Token temporal**:
   - En API Setup → "Temporary access token"
   - Válido por 24 horas (para desarrollo)

### Para Producción:

1. **Verificar tu negocio** en Meta Business Manager
2. **Solicitar número de producción**
3. **Generar System User Access Token** (permanente)

## 🛠️ Implementación Actualizada

### Modal Simplificado

En lugar del Embedded Signup complejo, usar un flujo más simple:

```typescript
// WhatsAppSimpleIntegration.tsx
export default function WhatsAppSimpleIntegration() {
  // Flujo manual con los tokens que el usuario obtiene de Meta
  return (
    <form>
      <Input
        label="WhatsApp Business Account ID"
        placeholder="Obtener de Meta for Developers"
      />
      <Input
        label="Phone Number ID"
        placeholder="ID del número de WhatsApp"
      />
      <Input
        label="Access Token"
        placeholder="Token de acceso (temporal o permanente)"
      />
      <Input
        label="Webhook Verify Token"
        placeholder="Token para verificar webhook"
      />
    </form>
  );
}
```

## 📊 Configuración del Webhook

### Cloudflare Worker actualizado:

```javascript
// Verificación del webhook (GET)
if (request.method === 'GET') {
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }

  return new Response('Forbidden', { status: 403 });
}

// Recepción de mensajes (POST)
if (request.method === 'POST') {
  const body = await request.json();

  // Procesar solo mensajes entrantes
  for (const entry of body.entry) {
    for (const change of entry.changes) {
      if (change.field === 'messages') {
        const message = change.value.messages?.[0];

        if (message) {
          // Procesar mensaje
          await processMessage(message);
        }
      }
    }
  }

  // Siempre responder 200 OK
  return new Response('OK', { status: 200 });
}
```

## 🚀 Testing Rápido

### 1. Con número de prueba:

```bash
# Enviar mensaje de prueba
curl -X POST https://graph.facebook.com/v18.0/PHONE_NUMBER_ID/messages \
  -H "Authorization: Bearer ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "RECIPIENT_PHONE_NUMBER",
    "type": "text",
    "text": {
      "body": "Hola desde Formmy!"
    }
  }'
```

### 2. Verificar webhook:

```bash
# Test webhook verification
curl "https://tu-webhook.com/webhook?hub.mode=subscribe&hub.verify_token=tu_token&hub.challenge=test_challenge"
```

## ⚠️ Limitaciones del Modo de Desarrollo

- **Números de prueba**: Máximo 5 números receptores
- **Rate limit**: 250 mensajes por hora
- **Sin plantillas personalizadas** hasta aprobar Business Verification

## ✅ Ventajas del Nuevo Sistema

1. **Más simple**: No requiere Embedded Signup complejo
2. **Más directo**: Usuario obtiene tokens de Meta directamente
3. **Más transparente**: Usuario ve exactamente qué permisos otorga
4. **Desarrollo rápido**: Números de prueba disponibles inmediatamente

## 📝 Próximos Pasos

1. [ ] Registrarse como Tech Provider (cuando tengas clientes reales)
2. [ ] Implementar flujo manual de tokens
3. [ ] Crear documentación para usuarios sobre cómo obtener tokens
4. [ ] Configurar webhooks de producción
5. [ ] Implementar manejo de plantillas de mensajes

## 🔗 Referencias

- [WhatsApp Business Platform Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/get-started)
- [Tech Provider Registration](https://developers.facebook.com/docs/whatsapp/solution-providers)
- [Webhook Setup](https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks)