# WhatsApp Webhook Implementation

## Archivo Implementado

**Ruta:** `app/routes/api.v1.integrations.whatsapp.webhook.tsx`

## Funcionalidades Implementadas

### 1. **Loader Function (GET) - Verificación de Webhook**

- Maneja las solicitudes de verificación de webhook de WhatsApp
- Valida parámetros: `hub.mode`, `hub.verify_token`, `hub.challenge`
- Retorna el challenge para completar la verificación
- Logging detallado para debugging

**Parámetros esperados:**

- `hub.mode=subscribe`
- `hub.verify_token=<token>`
- `hub.challenge=<challenge_string>`

### 2. **Action Function (POST) - Procesamiento de Webhooks**

- Procesa mensajes entrantes de WhatsApp
- Maneja actualizaciones de estado de mensajes
- Genera respuestas automáticas del chatbot
- Envía respuestas de vuelta a WhatsApp

## Flujo de Procesamiento de Mensajes

### 1. **Recepción y Validación**

```typescript
// Estructura del payload de WhatsApp
interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: WhatsAppWebhookEntry[];
}
```

### 2. **Verificación de Firma (Opcional)**

- Implementación preparada para verificar firmas de webhook
- Actualmente deshabilitada para desarrollo
- Fácil de habilitar en producción

### 3. **Procesamiento de Mensajes**

Para cada mensaje entrante:

1. **Buscar Integración**: Encuentra la integración activa por `phoneNumberId`
2. **Validar Chatbot**: Verifica que el chatbot existe y está activo
3. **Gestionar Conversación**: Crea o encuentra conversación existente
4. **Guardar Mensaje**: Almacena el mensaje del usuario con metadata de WhatsApp
5. **Generar Respuesta**: Usa el motor de IA del chatbot (placeholder implementado)
6. **Enviar Respuesta**: Envía la respuesta de vuelta a WhatsApp
7. **Actualizar Base de Datos**: Guarda la respuesta con el ID de mensaje de WhatsApp

## Tipos de Mensajes Soportados

### Mensajes Entrantes

- ✅ **Texto**: Contenido completo del mensaje
- ✅ **Imagen**: Caption o "📷 Image"
- ✅ **Documento**: Caption o nombre del archivo
- ✅ **Audio**: "🎵 Audio message"
- ✅ **Video**: Caption o "🎥 Video"
- ✅ **Otros tipos**: Mensaje de tipo no soportado

### Respuestas Salientes

- ✅ **Texto**: Respuestas de texto del chatbot
- 🔄 **Media**: Preparado para futuras implementaciones

## Gestión de Conversaciones

### Identificación Única

- **SessionId**: `whatsapp_{phone_number}`
- **VisitorId**: Número de teléfono del usuario
- **Channel**: Automáticamente marcado como "whatsapp"

### Persistencia

- Reutiliza conversaciones existentes para el mismo número
- Crea nuevas conversaciones automáticamente
- Integra con el sistema de conversaciones existente

## Integración con Base de Datos

### Mensajes

```typescript
// Mensaje del usuario
await addWhatsAppUserMessage(conversationId, messageContent, whatsappMessageId);

// Respuesta del chatbot
await addWhatsAppAssistantMessage(
  conversationId,
  responseContent,
  whatsappResponseId,
  tokens,
  responseTime
);
```

### Integraciones

- Busca integraciones activas por `phoneNumberId`
- Valida que la integración esté habilitada
- Usa credenciales almacenadas para enviar respuestas

## API de WhatsApp - Envío de Mensajes

### Endpoint

```
POST https://graph.facebook.com/v17.0/{phone_number_id}/messages
```

### Payload

```json
{
  "messaging_product": "whatsapp",
  "to": "phone_number",
  "type": "text",
  "text": {
    "body": "message_content"
  }
}
```

### Autenticación

```
Authorization: Bearer {access_token}
```

## Manejo de Errores

### Errores de Webhook

- **401**: Firma de webhook inválida
- **400**: Payload malformado o parámetros faltantes
- **500**: Errores internos del servidor

### Errores de Procesamiento

- Integración no encontrada o inactiva
- Chatbot no encontrado
- Errores de base de datos
- Errores de API de WhatsApp

### Logging

- Todos los errores se registran con detalles
- Payloads de webhook se logean para debugging
- Respuestas de WhatsApp API se registran

## Seguridad

### Verificación de Webhook

- Preparado para verificar firmas HMAC-SHA256
- Validación de tokens de verificación
- Logging de intentos de acceso

### Validación de Datos

- Validación de estructura de payload
- Sanitización de contenido de mensajes
- Verificación de integraciones activas

## Limitaciones Actuales

### 1. **Generación de Respuestas**

- Implementación placeholder del motor de IA
- Necesita integración con el servicio de IA existente
- Respuestas básicas por ahora

### 2. **Tipos de Media**

- Solo procesamiento de texto implementado
- Media se identifica pero no se procesa completamente
- Preparado para futuras implementaciones

### 3. **Verificación de Firmas**

- Deshabilitada para desarrollo
- Necesita configuración de secreto de webhook

## Próximos Pasos

### Integración Completa de IA

```typescript
// TODO: Reemplazar con servicio de IA real
const response = await aiService.generateResponse({
  message: userMessage,
  chatbot: chatbot,
  conversationHistory: messages,
});
```

### Procesamiento de Media

- Descargar y procesar imágenes
- Manejar documentos y archivos
- Responder con media cuando sea apropiado

### Monitoreo y Métricas

- Tracking de mensajes procesados
- Métricas de tiempo de respuesta
- Alertas de errores

## Testing

### Verificación de Webhook

```bash
curl -X GET "https://your-domain.com/api/v1/integrations/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test_challenge"
```

### Simulación de Mensaje

```bash
curl -X POST "https://your-domain.com/api/v1/integrations/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [...]
  }'
```

La implementación está completa y lista para testing e integración con el sistema de IA existente.
