# WhatsApp Coexistence - Variables de Entorno Requeridas

## 📋 Variables de Entorno para Meta Embedded Signup

Agrega estas variables a tu archivo `.env` en el servidor principal de Formmy:

```bash
# =============================================================================
# META / FACEBOOK APP CONFIGURATION (Para WhatsApp Coexistence)
# =============================================================================

# Facebook App ID - Obtenido de Meta for Developers
# https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/
FACEBOOK_APP_ID=1128273322061107

# Facebook App Secret - Obtenido de Meta for Developers
# https://developers.facebook.com/apps/YOUR_APP_ID/settings/basic/
# IMPORTANTE: Mantén este valor seguro y nunca lo expongas públicamente
FACEBOOK_APP_SECRET=c49cf42e3c45c64f818b70d09daa4c63

# Facebook Config ID para Embedded Signup (Opcional)
# Solo necesario si usas configuración personalizada del botón
VITE_FACEBOOK_CONFIG_ID=your-config-id

# =============================================================================
# FRONTEND VARIABLES (Expuestas al cliente con prefijo VITE_)
# =============================================================================

# Facebook App ID para el SDK del frontend
VITE_FACEBOOK_APP_ID=123456789012345

# =============================================================================
# CLOUDFLARE WORKER CONFIGURATION (Para el webhook)
# =============================================================================

# URL del Worker de Cloudflare para WhatsApp
WHATSAPP_WORKER_URL=https://formmy-whatsapp-worker.hectorbliss.workers.dev

# Secret compartido con el Worker para autenticación
WEBHOOK_SECRET=your-super-secret-webhook-key-2025

# =============================================================================
# CONFIGURACIÓN ADICIONAL PARA COEXISTENCE
# =============================================================================

# Habilitar modo coexistencia por defecto
WHATSAPP_COEXISTENCE_ENABLED=true

# Tiempo de retención de mensajes procesados (en segundos)
# Default: 86400 (24 horas)
MESSAGE_DEDUP_TTL=86400

# Sincronización de historial (en meses)
# Default: 6 meses
SYNC_HISTORY_MONTHS=6
```

## 🚀 Pasos para Configurar

### 1. Crear App en Meta for Developers

1. Ve a [Meta for Developers](https://developers.facebook.com)
2. Crea una nueva app o usa una existente
3. Tipo de app: **Business**
4. Agregar producto: **WhatsApp**
5. En configuración básica, copia:
   - App ID → `FACEBOOK_APP_ID`
   - App Secret → `FACEBOOK_APP_SECRET`

### 2. Configurar Webhook y Campos de Suscripción

En **WhatsApp > Configuración > Webhook**:

Campos a suscribir (Webhook fields):
- ✅ `messages` - Para recibir mensajes entrantes
- ✅ `message_status` - Para actualizaciones de estado (opcional)
- ✅ `message_template_status_update` - Para plantillas (opcional)

### 3. Configurar Embedded Signup (Opcional)

Si quieres personalizar el botón:

1. Ve a **WhatsApp > Embedded Signup**
2. Configura el flujo
3. Copia el Config ID → `VITE_FACEBOOK_CONFIG_ID`

### 4. Configurar el Worker de Cloudflare

```bash
# En el directorio del worker
cd cloudflare-worker-whatsapp

# Configurar secrets
wrangler secret put WEBHOOK_SECRET
wrangler secret put FORMMY_API_URL

# Deploy
wrangler deploy
```

### 5. Variables en el Frontend (Vite)

Las variables con prefijo `VITE_` se exponen automáticamente:

```javascript
// En tu componente React
const appId = import.meta.env.VITE_FACEBOOK_APP_ID;
```

### 6. Reiniciar el Servidor

```bash
# Desarrollo
npm run dev

# Producción (Fly.io)
fly deploy
```

## 🔒 Seguridad

### Variables Sensibles (NUNCA exponer al cliente):

- `FACEBOOK_APP_SECRET`
- `WEBHOOK_SECRET`

### Variables Públicas (OK para el cliente):

- `VITE_FACEBOOK_APP_ID`
- `VITE_FACEBOOK_CONFIG_ID`

## 🧪 Testing

### Verificar Variables de Entorno:

```bash
# En el servidor
console.log('App ID:', process.env.FACEBOOK_APP_ID);
console.log('Has App Secret:', !!process.env.FACEBOOK_APP_SECRET);

# En el cliente
console.log('Client App ID:', import.meta.env.VITE_FACEBOOK_APP_ID);
```

### Test de Embedded Signup:

1. Abre el modal de WhatsApp Coexistence
2. Verifica que el SDK de Facebook carga
3. Click en "Continuar con Facebook"
4. Completa el flujo de autorización
5. Verifica que la integración se crea en la BD

## 📝 Notas Importantes

1. **Modo Coexistencia**: Permite que el chatbot y la app móvil funcionen simultáneamente
2. **Filtrado de Echo**: El worker filtra automáticamente mensajes enviados desde la Business App
3. **Deduplicación**: Previene procesamiento duplicado de mensajes
4. **Sin Interrupción**: Los chats existentes continúan sin problemas

## 🆘 Troubleshooting

### Error: "Facebook SDK not loading"

- Verifica que `VITE_FACEBOOK_APP_ID` esté configurado
- Revisa la consola del navegador para errores de CORS

### Error: "Token exchange failed"

- Verifica `FACEBOOK_APP_SECRET` en el servidor
- Confirma que la app tiene los permisos necesarios

### Error: "Webhook not receiving messages"

- Verifica la URL del webhook en Meta for Developers
- Confirma que el Worker está desplegado y funcionando
- Revisa los logs: `wrangler tail`

## 📚 Referencias

- [Meta Embedded Signup Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [WhatsApp Business API](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Cloudflare Workers](https://developers.cloudflare.com/workers)
