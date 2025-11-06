# WhatsApp Embedded Signup - Configuración ACTUAL (2025-01-05)

## ✅ Método que FUNCIONA - POPUP FLOW

### Flujo Actual (RESTAURADO)
**FB.login() Popup Flow** - Token directo sin redirect

**Por qué funciona:**
1. ✅ NO requiere redirect_uri en whitelist
2. ✅ Popup NO necesita validar URL de retorno
3. ✅ Meta retorna access token directamente (sin code exchange)
4. ✅ Message event captura waba_id y phone_number_id
5. ✅ Backend recibe token + waba_id + phone_number_id en un solo request

### Configuración en Meta Dashboard

**Location**: https://developers.facebook.com/apps/1128273322061107

1. **App Settings → Basic → App Domains**:
   ```
   www.formmy.app
   formmy.app
   ```

2. **NO se requiere** OAuth Redirect URI (popup flow no lo usa)

### Código Actual (Popup con FB.login)

**File**: `app/components/integrations/WhatsAppEmbeddedSignupModal.tsx:296`

```typescript
window.FB.login(
  (response: any) => {
    processAuthResponse(response);
  },
  {
    config_id: configId,
    // ✅ NO incluir response_type: 'code' - obtenemos token directo
    scope: 'whatsapp_business_management,whatsapp_business_messaging',
    extras: {
      setup: {},
      featureType: 'whatsapp_business_app_onboarding',
      sessionInfoVersion: 3,
    },
  }
);
```

### Flujo Completo

1. Usuario click "Conectar WhatsApp"
2. `FB.login()` abre popup de Meta
3. Usuario completa Embedded Signup en popup
4. **Message Event** envía: `waba_id`, `phone_number_id`
5. **FB.login callback** retorna: `accessToken`
6. `processAuthResponse()` envía al backend: `{ accessToken, wabaId, phoneNumberId }`
7. Backend:
   - Guarda access token
   - Configura webhook
   - Retorna integración completa
8. ✅ Modal cierra, integración activa

## ❌ Métodos que NO FUNCIONAN

### 1. FB.login() con Popup (DEPRECADO para este caso)

**Por qué NO funciona:**
- El `config_id` está configurado para Authorization Code Flow
- Meta rechaza el flujo popup con error: "response_type=token no se admite"
- Requiere que Meta configure el `config_id` para permitir token directo

**NO intentar:**
```typescript
// ❌ NO USAR - Genera error de "response_type=token"
window.FB.login(callback, {
  config_id: configId,
  scope: 'whatsapp_business_management,whatsapp_business_messaging'
});
```

### 2. Redirect sin config_id

**Por qué NO funciona:**
- Embedded Signup requiere el `config_id` específico
- Sin él, Meta no sabe qué configuración de signup usar

**NO intentar:**
```typescript
// ❌ NO USAR - Falta config_id
const authUrl = new URL('https://www.facebook.com/v21.0/dialog/oauth');
authUrl.searchParams.set('client_id', appId);
authUrl.searchParams.set('redirect_uri', redirectUri);
// Falta config_id - NO FUNCIONARÁ
```

### 3. URL de business.facebook.com/messaging/whatsapp/onboard

**Por qué NO funciona (parcialmente):**
- SÍ muestra el flujo de signup
- Usuario completa el onboarding
- PERO no redirige de vuelta porque NO incluye `redirect_uri` en los parámetros
- Meta no sabe a dónde regresar después del signup

**NO intentar:**
```typescript
// ❌ NO USAR - No redirige de vuelta
const authUrl = new URL('https://business.facebook.com/messaging/whatsapp/onboard/');
authUrl.searchParams.set('app_id', appId);
authUrl.searchParams.set('config_id', configId);
// Falta redirect_uri - Usuario queda varado en Meta
```

## 🔧 Variables de Entorno

### Frontend (.env)
```bash
VITE_FACEBOOK_APP_ID=1128273322061107
VITE_FACEBOOK_CONFIG_ID=1306050453776674
```

### Backend (.env)
```bash
FACEBOOK_APP_ID=1128273322061107
FACEBOOK_APP_SECRET=********************************
FACEBOOK_BUSINESS_ID=413249178486852
```

### Fly.io Secrets
```bash
fly secrets list | grep FACEBOOK
FACEBOOK_APP_ID=1128273322061107
FACEBOOK_APP_SECRET=********************************
VITE_FACEBOOK_APP_ID=1128273322061107
VITE_FACEBOOK_CONFIG_ID=1306050453776674
```

## 📊 Estado del Sistema

### Integraciones Existentes
```
ID: 690bec01ff67482b36033b5b
Chatbot ID: 69062a5a18b9ed0f66119fa2
WABA ID: 1132931650195479
Phone Number ID: 743552492182800
Estado: ACTIVO
Access Token: ❌ NO EXISTE
Creado: 2025-11-05 18:29:53

ID: 68f6adf288c6f1e41f18c1f6
Chatbot ID: 68f456dca443330f35f8c81d
WABA ID: 1649369379786047
Phone Number ID: 699799856554182
Estado: ACTIVO
Access Token: ❌ NO EXISTE
Creado: 2025-10-20 15:47:30
```

**Análisis**: Hay 2 integraciones parcialmente configuradas. Meta guardó WABA ID y Phone Number ID, pero nunca se recibió el access token.

## 🎯 Próximos Pasos

1. **CRÍTICO**: Verificar en Meta Dashboard dónde está configurado el Embedded Signup Callback
2. **CRÍTICO**: Crear endpoint que procese ese callback OR cambiar la configuración en Meta
3. Implementar handler que reciba:
   - WABA ID
   - Phone Number ID
   - Authorization code
4. Intercambiar code por access_token
5. Guardar token en DB
6. Configurar webhook con `subscribed_apps`

## 📚 Referencias

- [Meta Embedded Signup Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup/)
- [OAuth Authorization Code Flow](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- Documentación anterior: `docs/whatsapp-embedded-signup-solution.md` (método popup deprecado para este caso)

---

**Última actualización**: 2025-01-05
**Autor**: Claude Code
**Estado**: 🔴 Bloqueado - Callback no configurado correctamente
