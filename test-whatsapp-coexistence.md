# 🧪 Guía de Prueba - WhatsApp Coexistence Mode

## ✅ Checklist de Implementación

### 1. Archivos Creados
- [x] `/app/components/integrations/WhatsAppCoexistenceModal.tsx` - Modal con Embedded Signup
- [x] `/app/routes/api.v1.integrations.whatsapp.embedded-signup.ts` - Endpoint para token exchange
- [x] `/cloudflare-worker-whatsapp-coexistence.js` - Worker actualizado con filtrado de echo
- [x] `/WHATSAPP_COEXISTENCE_ENV.md` - Documentación de variables de entorno

### 2. Archivos Modificados
- [x] `/app/components/chat/tab_sections/Codigo.tsx` - Lógica para usar modal de coexistence

## 📋 Pasos de Configuración

### 1. Variables de Entorno en `.env`

```bash
# Backend (servidor)
FACEBOOK_APP_ID=tu_app_id_aqui
FACEBOOK_APP_SECRET=tu_app_secret_aqui

# Frontend (cliente)
VITE_FACEBOOK_APP_ID=tu_app_id_aqui
VITE_FACEBOOK_CONFIG_ID=tu_config_id_opcional

# Cloudflare Worker
WEBHOOK_SECRET=tu_webhook_secret_aqui
```

### 2. Configuración en Meta for Developers

1. **Crear o seleccionar App**:
   - Ve a https://developers.facebook.com
   - Crea una nueva app tipo "Business"
   - Agrega el producto "WhatsApp"

2. **Configurar permisos**:
   - App Review > Permissions
   - Habilitar: `whatsapp_business_management`, `whatsapp_business_messaging`, `business_management`

3. **Configurar Embedded Signup** (opcional):
   - WhatsApp > Embedded Signup
   - Configurar el flujo según necesidades
   - Copiar Config ID si se usa configuración personalizada

### 3. Deploy del Worker de Cloudflare

```bash
cd /Volumes/blissmo/PROYECTOS/formmy_rrv7

# Configurar wrangler si no está configurado
wrangler login

# Configurar secrets
wrangler secret put WEBHOOK_SECRET
wrangler secret put FORMMY_API_URL

# Deploy del worker
wrangler deploy cloudflare-worker-whatsapp-coexistence.js
```

### 4. Configurar Webhook en Meta

1. Ve a tu App > WhatsApp > Configuration
2. Webhook URL: `https://tu-worker.workers.dev/webhook/{chatbotId}`
3. Verify Token: El mismo que configuraste en `WEBHOOK_SECRET`
4. Subscribe to fields: `messages`, `message_status`

## 🧪 Pruebas a Realizar

### Test 1: Verificar Variables de Entorno

```javascript
// En la consola del navegador
console.log('Facebook App ID:', import.meta.env.VITE_FACEBOOK_APP_ID);

// En el servidor (agregar temporalmente a un endpoint)
console.log('App Secret exists:', !!process.env.FACEBOOK_APP_SECRET);
```

### Test 2: Modal de Coexistence

1. **Como usuario PRO/ENTERPRISE**:
   - Navegar a Dashboard > Tu Chatbot > Código > Integraciones
   - Click en "Conectar" en WhatsApp
   - Debería abrir el modal de Coexistence (no el manual)
   - Verificar que el SDK de Facebook carga correctamente

2. **Como usuario FREE/STARTER**:
   - Mismo proceso
   - Debería abrir el modal manual tradicional

### Test 3: Flujo de Embedded Signup

1. Abrir el modal de Coexistence
2. Click en "Continuar con Facebook"
3. Completar autorización en Meta
4. Verificar en Network tab:
   - Request a `/api/v1/integrations/whatsapp/embedded-signup`
   - Response exitosa con datos de integración

### Test 4: Webhook y Mensajes Echo

1. Enviar mensaje desde WhatsApp
2. Verificar logs del Worker:
   ```bash
   wrangler tail --format json
   ```
3. Confirmar que:
   - Mensajes normales se procesan
   - Mensajes "echo" (business_initiated) se filtran
   - No hay loops de mensajes

### Test 5: Base de Datos

```sql
-- Verificar que la integración se creó con coexistence mode
SELECT * FROM Integration
WHERE type = 'WHATSAPP'
AND settings->>'coexistenceMode' = 'true';
```

## 🐛 Troubleshooting

### Error: "Facebook SDK not loading"
- Verificar `VITE_FACEBOOK_APP_ID` en `.env`
- Revisar consola para errores de CORS
- Confirmar que el dominio está autorizado en Meta

### Error: "Token exchange failed"
- Verificar `FACEBOOK_APP_SECRET` en servidor
- Confirmar permisos de la app en Meta
- Revisar logs del servidor para detalles

### Error: "Webhook not receiving messages"
- Verificar configuración del webhook en Meta
- Confirmar que el Worker está desplegado
- Revisar logs: `wrangler tail`

### Mensajes duplicados
- Verificar filtrado de echo en Worker
- Confirmar deduplicación con KV storage
- Revisar `MESSAGE_DEDUP_TTL` en configuración

## 📊 Monitoreo

### Logs del Worker
```bash
# Ver logs en tiempo real
wrangler tail --format json | jq

# Filtrar por chatbot
wrangler tail --format json | grep "chatbotId"
```

### Métricas a Monitorear
- Tasa de mensajes filtrados (echo)
- Latencia de procesamiento
- Errores de token exchange
- Tasa de éxito de Embedded Signup

## ✅ Criterios de Éxito

1. ✅ Usuario PRO puede conectar WhatsApp sin interrumpir conversaciones existentes
2. ✅ Mensajes de la Business App no causan loops
3. ✅ Historial de 6 meses se sincroniza (cuando se implemente)
4. ✅ Chatbot responde solo cuando está configurado para hacerlo
5. ✅ No hay interrupción del servicio existente

## 📝 Notas Adicionales

- El modo coexistencia está habilitado solo para usuarios PRO y ENTERPRISE
- Los mensajes echo se identifican por `metadata.origin.type = "business_initiated"`
- La deduplicación usa KV con TTL de 24 horas por defecto
- El webhook automático se configura durante el Embedded Signup

## 🚀 Próximos Pasos

1. [ ] Implementar sincronización de historial (6 meses)
2. [ ] Agregar configuración de horarios de respuesta
3. [ ] Implementar filtros por palabras clave
4. [ ] Dashboard de métricas de coexistencia
5. [ ] Notificaciones de conflictos potenciales