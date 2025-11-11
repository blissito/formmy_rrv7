# Integración de Facebook Messenger

Integración completa de Facebook Messenger con OAuth 2.0 para permitir que los chatbots de Formmy respondan mensajes automáticamente en páginas de Facebook.

## Características

- ✅ OAuth 2.0 flow completo
- ✅ Soporte para múltiples páginas de Facebook
- ✅ Webhook para recibir mensajes
- ✅ Envío de mensajes de texto
- ✅ Envío de imágenes, videos y archivos
- ✅ Indicadores de escritura (typing indicators)
- ✅ Marcar mensajes como leídos
- ✅ Obtener perfil del usuario
- ✅ Quick Replies
- ✅ Get Started button
- ✅ Mensaje de bienvenida

## Configuración

### 1. Variables de Entorno

Agrega las siguientes variables al archivo `.env`:

```bash
# Meta App Credentials
META_APP_ID=tu_app_id
META_APP_SECRET=tu_app_secret

# Webhook Verify Token (opcional, para testing manual)
MESSENGER_WEBHOOK_VERIFY_TOKEN=formmy_messenger_webhook_verify
```

### 2. Configurar App de Facebook

1. Ve a [Facebook Developers](https://developers.facebook.com/apps/)
2. Crea una nueva app o usa una existente
3. Agrega el producto "Messenger"
4. En "Messenger Settings":
   - Configura el Webhook URL: `https://formmy.app/api/v1/integrations/messenger/webhook`
   - Verify Token: usa el mismo que configuraste en `.env`
   - Suscríbete a los siguientes eventos:
     - `messages`
     - `messaging_postbacks`
     - `message_reactions`
     - `message_reads`

5. En "Basic Settings":
   - Copia el App ID y App Secret a tu `.env`

6. En "App Review":
   - Solicita permisos avanzados:
     - `pages_messaging`
     - `pages_manage_metadata`
     - `pages_read_engagement`

### 3. Agregar al archivo Fly Secrets

```bash
fly secrets set META_APP_ID=tu_app_id
fly secrets set META_APP_SECRET=tu_app_secret
fly secrets set MESSENGER_WEBHOOK_VERIFY_TOKEN=formmy_messenger_webhook_verify
```

## Flujo de Usuario

### Conectar Página de Facebook

1. Usuario hace clic en "Conectar" en Messenger desde el dashboard
2. Se redirige a Facebook para autorizar la app
3. Facebook devuelve un código de autorización
4. El código se intercambia por tokens de acceso
5. Se obtienen las páginas del usuario
6. Si hay múltiples páginas, se muestra un selector
7. Se guarda la integración en la base de datos
8. Se suscribe la página a la app para recibir webhooks

### Recibir Mensajes

1. Usuario envía mensaje en Messenger
2. Facebook envía webhook a `/api/v1/integrations/messenger/webhook`
3. Se busca la integración por Page ID
4. Se procesa el mensaje y se genera respuesta del chatbot
5. Se envía respuesta usando MessengerService

## Servicios

### MessengerOAuthService

Maneja el flujo completo de OAuth:

```typescript
// Generar URL de autorización
const authUrl = MessengerOAuthService.getAuthorizationUrl(chatbotId);

// Completar flujo OAuth
const result = await MessengerOAuthService.completeOAuthFlow(code, chatbotId, pageId);

// Guardar integración
await MessengerOAuthService.saveIntegration(chatbotId, pageId, pageAccessToken);
```

### MessengerService

Servicio para enviar mensajes:

```typescript
// Crear instancia desde chatbot
const messenger = await MessengerService.fromChatbot(chatbotId);

// Enviar mensaje de texto
await messenger.sendTextMessage(recipientId, "Hola!");

// Enviar imagen
await messenger.sendAttachment(recipientId, "image", "https://example.com/image.jpg");

// Mostrar indicador de escritura
await messenger.sendTypingIndicator(recipientId, "typing_on");

// Marcar como leído
await messenger.markSeen(recipientId);

// Obtener perfil del usuario
const profile = await messenger.getUserProfile(recipientId);
```

## API Endpoints

### `GET /dashboard/integrations/messenger/connect`
Inicia el flujo de OAuth redirigiendo a Facebook.

**Query params:**
- `chatbotId`: ID del chatbot a conectar

### `GET /api/v1/integrations/messenger/callback`
Callback de OAuth. Facebook redirige aquí con el código de autorización.

**Query params:**
- `code`: Código de autorización
- `state`: chatbotId original

### `GET /dashboard/integrations/messenger/select-page`
Página de selección de página de Facebook (si hay múltiples).

### `POST /api/v1/integrations/messenger/webhook`
Webhook para recibir eventos de Messenger.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "object": "page",
  "entry": [
    {
      "id": "PAGE_ID",
      "messaging": [
        {
          "sender": { "id": "USER_ID" },
          "recipient": { "id": "PAGE_ID" },
          "message": {
            "mid": "MESSAGE_ID",
            "text": "Hola!"
          }
        }
      ]
    }
  ]
}
```

## Modelo de Datos

La integración se guarda en el modelo `Integration`:

```prisma
model Integration {
  platform        IntegrationType // MESSENGER
  pageId          String?         // Facebook Page ID
  pageAccessToken String?         // Page Access Token (long-lived)
  metadata        Json?           // { pageName, subscribedFields }
  isActive        Boolean
  chatbotId       String
  chatbot         Chatbot
}
```

## Testing

### Verificar Webhook

```bash
curl -X GET "https://formmy.app/api/v1/integrations/messenger/webhook?hub.mode=subscribe&hub.verify_token=formmy_messenger_webhook_verify&hub.challenge=TEST"
```

### Enviar Mensaje de Prueba

Usa el Messenger Webhook Tester en Facebook Developers para enviar mensajes de prueba.

## Troubleshooting

### Error: "Token verification failed"
- Verifica que el verify token en Facebook coincida con el de `.env`
- Asegúrate de que el webhook esté correctamente configurado

### Error: "Integration not found"
- Verifica que la página esté conectada al chatbot
- Revisa que `pageId` en la integración coincida con el de Facebook

### Error: "Error sending Messenger message"
- Verifica que el Page Access Token sea válido
- Asegúrate de que la página tenga permisos de la app
- Revisa que la app esté aprobada por Facebook

### Mensajes no llegan
- Verifica que el webhook esté suscrito correctamente
- Revisa los logs en Facebook Developers > Webhooks
- Asegúrate de que los eventos estén suscritos (`messages`, `messaging_postbacks`, etc.)

## Documentación Oficial

- [Messenger Platform](https://developers.facebook.com/docs/messenger-platform)
- [Send API](https://developers.facebook.com/docs/messenger-platform/reference/send-api)
- [Webhooks](https://developers.facebook.com/docs/messenger-platform/webhooks)
- [OAuth](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
