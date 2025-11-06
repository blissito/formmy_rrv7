# WhatsApp Embedded Signup - Solución Final

## Resumen

Implementación exitosa de WhatsApp Embedded Signup usando **FB.login() con token directo** (sin OAuth code flow). Esta solución funciona sin requerir Business Verification y soporta apps en Development Mode.

## Estado

✅ **Funcionando en producción**
- Fecha: 2025-11-05
- Última actualización: Commit `e79aef0`
- Método: FB.login() → accessToken directo

## Arquitectura

### Frontend: WhatsAppEmbeddedSignupModal.tsx

```typescript
// ✅ FB.login() SIN response_type: 'code'
window.FB.login(
  (response) => {
    // accessToken disponible inmediatamente
    const accessToken = response.authResponse.accessToken;
  },
  {
    config_id: FACEBOOK_CONFIG_ID,
    // ❌ NO incluir response_type: 'code'
    scope: 'whatsapp_business_management,whatsapp_business_messaging',
    extras: {
      setup: {},
      featureType: 'whatsapp_business_app_onboarding',
      sessionInfoVersion: 3,
    },
  }
);
```

**Componentes clave:**

1. **Facebook SDK Loader**
   - Carga `sdk.js` dinámicamente
   - Inicializa `FB.init()` con App ID
   - Version: v24.0

2. **Message Event Listener**
   - Captura `WA_EMBEDDED_SIGNUP` messages
   - Parsea JSON y URL-encoded data
   - Decodifica `signed_request` (Base64)
   - Extrae `waba_id` y `phone_number_id`

3. **Auth Flow**
   - Usuario → FB.login() popup
   - Popup → authResponse.accessToken
   - Frontend → Backend con token directo

### Backend: api.v1.integrations.whatsapp.embedded_signup.ts

**Flujo:**

```
1. Recibe accessToken (o code como fallback)
2. Si accessToken → usar directo
3. Si code → exchange por token (legacy)
4. Obtener WABA ID:
   a. Usar wabaId del message event (frontend)
   b. Fallback: GET /me/whatsapp_business_accounts
   c. Fallback 2: debug_token → granular_scopes
5. Obtener phone_number_id
6. Guardar Integration en DB
7. Generar webhook verify token
```

**Estrategias para obtener WABA:**

```typescript
// Estrategia 1: Directo (más rápido)
GET /me/whatsapp_business_accounts
Authorization: Bearer {accessToken}

// Estrategia 2: Granular Scopes (más robusto)
GET /debug_token?input_token={accessToken}
→ Extrae granular_scopes
→ Busca whatsapp_business_messaging.target_ids[0]
```

## Variables de Entorno

```bash
# Frontend (.env)
VITE_FACEBOOK_APP_ID=your_app_id
VITE_FACEBOOK_CONFIG_ID=your_config_id

# Backend (.env)
FACEBOOK_APP_ID=your_app_id        # ⚠️ DEBE COINCIDIR con VITE_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET=your_app_secret
FACEBOOK_BUSINESS_ID=your_business_id
```

## Configuración en Meta

### 1. Facebook App Settings

**Dashboard**: https://developers.facebook.com/apps/{app_id}

**WhatsApp → Configuración:**
- Config ID: `{tu_config_id}` (copiar de la consola)

**Configuración → Básica:**
- Dominios de la app: `formmy.app`
- URL de la política de privacidad: requerida

### 2. Embedded Signup Configuration

**WhatsApp → Embedded Signup:**
- Callback URL: `https://formmy.app/dashboard/integrations`

### 3. Webhook Configuration (CRÍTICO - UNA VEZ)

**⚠️ IMPORTANTE**: El webhook debe configurarse **manualmente UNA SOLA VEZ** en Meta App Dashboard. WhatsApp NO soporta configuración programática de webhooks.

**Ubicación**: `App Dashboard → WhatsApp → Configuration → Webhooks`

**Configuración requerida:**
```
Callback URL: https://formmy.app/api/v1/integrations/whatsapp/webhook
Verify Token: FORMMY_WEBHOOK_VERIFY_TOKEN (variable de entorno global)
```

**Webhook Fields a suscribir:**
- ✅ `messages` - Mensajes entrantes
- ✅ `smb_message_echoes` - Mensajes enviados por usuario vía WhatsApp Business App
- ✅ `smb_app_state_sync` - Estado de la app móvil del usuario

**Cómo funciona el multi-tenancy:**

Por cada usuario que conecte su WhatsApp (Embedded Signup):
1. Frontend → Embedded Signup → accessToken + WABA ID
2. Backend llama a: `POST /{WABA_ID}/subscribed_apps` con:
   ```json
   {
     "override_callback_uri": "https://formmy.app/api/v1/integrations/whatsapp/webhook?chatbotId=abc123",
     "verify_token": "formmy_abc123_1234567890"
   }
   ```
3. Meta enruta mensajes de ese WABA al callback con `?chatbotId=abc123`
4. Webhook handler identifica chatbot por `phoneNumberId` del payload

### 4. Permisos Requeridos

**App Review (opcional para Development):**
- `whatsapp_business_management` (Standard Access)
- `whatsapp_business_messaging` (Standard Access)

**Nota**: En Development Mode, solo necesitas agregar Test Users.

## Manejo de Errores

### Error 424: WABA sin teléfonos

**Síntoma**: Integración creada pero sin phone_number_id

**Respuesta del backend:**
```json
{
  "error": "WhatsApp Business Account conectado pero sin números de teléfono",
  "details": "Completa la configuración en Meta Business Suite",
  "wabaId": "123456789",
  "instructions": [
    "1. Ve a https://business.facebook.com/latest/whatsapp_manager",
    "2. Selecciona tu WhatsApp Business Account",
    "3. Agrega y verifica un número de teléfono",
    "4. Vuelve a intentar la conexión en Formmy"
  ]
}
```

**UI Frontend**: Muestra error multiline + link directo a Meta Business Suite

### Error: redirect_uri mismatch

**Causa**: `FACEBOOK_APP_ID` diferente entre frontend y backend

**Solución**:
```bash
# Verificar que sean iguales
grep FACEBOOK_APP_ID .env
# FACEBOOK_APP_ID=123456789
# VITE_FACEBOOK_APP_ID=123456789  ← DEBEN COINCIDIR
```

## Testing

### Flujo Completo

1. **Iniciar conexión**
   ```
   Usuario → Dashboard → Connect WhatsApp
   ```

2. **Popup FB.login()**
   ```
   - Se abre popup de Facebook
   - Usuario autoriza app
   - Selecciona/crea WABA
   - Configura número de teléfono
   ```

3. **Respuesta**
   ```javascript
   // Console logs esperados:
   ✅ [FB.login] Access Token recibido: EAABsbCS1iHgBO...
   ✅ [Message Event] Captured: { wabaId: "...", phoneNumberId: "..." }
   ✅ [FB.login] WhatsApp conectado exitosamente!
   ```

4. **Verificar en DB**
   ```javascript
   // MongoDB - Integration document
   {
     chatbotId: "...",
     type: "whatsapp",
     businessAccountId: "...",
     phoneNumberId: "...",
     accessToken: "encrypted_...",
     webhookVerifyToken: "wh_...",
   }
   ```

### Debug Logs

**Frontend (navegador console):**
```
📨 [Message Event] Origen: https://www.facebook.com
📨 [Message Event] Data raw: {"type":"WA_EMBEDDED_SIGNUP","event":"FINISH",...}
✅ [Message Event] Captured: { wabaId: "...", phoneNumberId: "..." }
🚀 [FB.login] Lanzando popup de Embedded Signup...
📥 [FB.login] Response: { authResponse: { accessToken: "..." } }
✅ [FB.login] Access Token recibido: EAABsbCS1iHgBO...
```

**Backend (server console):**
```
✅ [Direct Token] Access Token recibido directamente: EAABsbCS1iHgBO...
🔄 [Direct Token] wabaId: 123456789
🔄 [Direct Token] phoneNumberId: 987654321
✅ [Message Event] Usando datos del frontend
✅ [Integration] WhatsApp integration created: int_abc123
```

## Diferencias con OAuth Code Flow

| Aspecto | Code Flow (❌ Problemático) | Token Directo (✅ Actual) |
|---------|---------------------------|--------------------------|
| response_type | `'code'` | NO incluir |
| Backend exchange | Requiere redirect_uri | No requiere |
| Token expiration | 60 segundos | Inmediato |
| Complejidad | Alta (CSRF, state) | Baja |
| Business Verification | Requerida | NO requerida |

## Troubleshooting

### Popup bloqueado

**Síntoma**: FB.login() no abre popup

**Solución**:
1. Permitir popups en el navegador
2. Asegurar que `handleEmbeddedSignup` se llama desde un click event (no async)

### Message event no llega

**Síntoma**: wabaId/phoneNumberId = undefined

**Solución**:
- Verificar `window.addEventListener('message')` está activo
- Check console logs: `📨 [Message Event] Origen: ...`
- Fallback automático: backend consulta Graph API

### Token inválido

**Síntoma**: "Error validating access token"

**Solución**:
1. Verificar App en Active mode (no Development)
2. Check app permissions
3. Regenerar token (reconectar WhatsApp)

## Próximos Pasos

### Mejoras Futuras

1. **Long-lived Token Exchange**
   ```
   POST /oauth/access_token
   - Convertir short-lived → long-lived (60 días)
   ```

2. **Token Refresh Automático**
   - Cron job que renueva tokens antes de expirar
   - Notificar usuario si token expira

3. **Multi-WABA Support**
   - Permitir seleccionar WABA si usuario tiene múltiples
   - UI para listar WABAs disponibles

4. **Webhook Verification UI**
   - Test webhook desde dashboard
   - Logs de mensajes recibidos

## Referencias

- [Meta Embedded Signup Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [FB.login() Reference](https://developers.facebook.com/docs/reference/javascript/FB.login/)
- [Graph API Debug Token](https://developers.facebook.com/docs/graph-api/reference/debug_token)

## Commits Relacionados

- `e79aef0` - fix: WhatsApp Embedded Signup con FB.login() - Token directo (solución final)
- `343ef4c` - feat: WhatsApp Embedded Signup con popup (FB.login) - Solución definitiva
- `0af320b` - fix: FB.login callback debe ser síncrono, no async
- `29a8b01` - fix: Eliminar validación de redirect_uri en popup flow

---

**Última actualización**: 2025-11-05
**Mantenedor**: @blissito
**Estado**: ✅ Producción
