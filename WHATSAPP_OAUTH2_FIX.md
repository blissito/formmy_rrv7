# WhatsApp OAuth2 Fix - Embedded Signup

## 🔴 Problemas Identificados y Corregidos

### 1. App ID Mismatch (CRÍTICO) ✅
**Problema**: Cliente y servidor usaban Facebook App IDs diferentes
- **Cliente (Modal)**: `VITE_FACEBOOK_APP_ID=1128273322061107`
- **Servidor (Token Exchange)**: `FACEBOOK_APP_ID=1696672987689907` ❌

**Impacto**: El código OAuth2 es generado para un App ID específico. Intentar intercambiarlo con un App ID diferente causa rechazo de Meta.

**Solución**: Unificado ambos a `1128273322061107`

```bash
# .env (ANTES)
FACEBOOK_APP_ID=1696672987689907  # ❌ INCORRECTO
VITE_FACEBOOK_APP_ID=1128273322061107

# .env (AHORA)
FACEBOOK_APP_ID=1128273322061107  # ✅ CORRECTO
VITE_FACEBOOK_APP_ID=1128273322061107
```

### 2. redirect_uri Innecesario ✅
**Problema**: El endpoint incluía un `redirect_uri` en el token exchange que:
- No es necesario para Embedded Signup (es flujo de popup, no redirect)
- Posiblemente no estaba registrado en Facebook App Dashboard

**Solución**: Removido el parámetro `redirect_uri` del intercambio del token

```typescript
// ANTES
tokenExchangeUrl.searchParams.append('redirect_uri',
  'https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/embedded_signup');

// AHORA
// Sin redirect_uri - no es necesario para Embedded Signup
tokenExchangeUrl.searchParams.append('code', code);
```

### 3. Modal en Español ✅
**Problema**: Para la grabación de validación con Meta, el modal debe estar en inglés.

**Solución**: Traducido todos los textos del modal

```tsx
// Textos actualizados:
- "Connect WhatsApp"
- "Connect your WhatsApp Business number so your agents can send automated messages"
- "Loading Facebook SDK..."
- "Connecting..."
- "Connect with WhatsApp"
- "A Facebook window will open to authorize your WhatsApp Business account"
- "WhatsApp connected successfully!"
- "Close" / "Cancel"
```

## 🛠️ Mejoras Adicionales

### Logging Detallado
Agregado logging extensivo en todo el flujo OAuth2 para facilitar debugging:

**Modal (Cliente)**:
- ✅ App ID usado para FB.init()
- ✅ Validación de variables de entorno
- ✅ Respuesta completa de FB.login()
- ✅ Código recibido (primeros 30 caracteres)

**Endpoint (Servidor)**:
- ✅ Parámetros recibidos del cliente
- ✅ Validación de código de autorización
- ✅ App ID usado para token exchange
- ✅ Errores detallados de Meta (error type, code, message, fbtrace_id)

### Validaciones Agregadas
1. ✅ Verificar que el código fue recibido antes de intercambiarlo
2. ✅ Validar que `VITE_FACEBOOK_APP_ID` esté configurado
3. ✅ Mensajes de error con hints útiles

## 📋 Checklist de Verificación

### Pre-requisitos en Facebook App Dashboard

1. **App Settings > Basic**
   - [ ] App ID: `1128273322061107`
   - [ ] App Secret está configurado correctamente

2. **App Settings > Advanced**
   - [ ] OAuth Redirect URIs incluye: `https://formmy-v2.fly.dev/` (opcional para Embedded Signup)

3. **WhatsApp > Configuration**
   - [ ] Embedded Signup está habilitado
   - [ ] Webhook configurado: `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook`

4. **Permissions & Features**
   - [ ] `whatsapp_business_management` - Approved
   - [ ] `whatsapp_business_messaging` - Approved

### Variables de Entorno (.env)

```bash
# Verificar que ambos sean iguales
FACEBOOK_APP_ID=1128273322061107
VITE_FACEBOOK_APP_ID=1128273322061107
FACEBOOK_APP_SECRET=c49cf42e3c45c64f818b70d09daa4c63
```

### Testing Flow

1. **Rebuild & Restart** (importante para que tome las nuevas variables)
   ```bash
   npm run build
   npm run dev
   ```

2. **Probar en Browser**
   - Abrir `/dashboard/codigo`
   - Clic en "Connect WhatsApp"
   - Abrir DevTools Console (CMD+Option+I)
   - Buscar logs:
     ```
     ✅ [Modal] Inicializando Facebook SDK con App ID: 1128273322061107
     🚀 [Modal] Iniciando Facebook Login for Business
     📥 [Modal] Facebook Login Response recibido
     ```

3. **Verificar Token Exchange**
   - Después de autorizar en popup de Facebook
   - Revisar logs del servidor (fly logs o terminal local):
     ```
     📊 [Embedded Signup] Parámetros recibidos del cliente
     📋 [Embedded Signup] Client ID (App ID): 1128273322061107
     🔐 [Embedded Signup] Code recibido: AQA...
     ✅ [Embedded Signup] Token de larga duración obtenido exitosamente
     ```

4. **Si hay errores**
   - Los logs ahora mostrarán:
     - HTTP Status
     - Error Type, Code, Message
     - Fbtrace ID (para reportar a Meta Support)
     - Hint con posible solución

## 🔍 Debugging

### Error: "Error al intercambiar el código por token"

**Causas posibles**:

1. **App ID mismatch** (ahora corregido)
   ```
   Verificar logs:
   ✅ [Modal] App ID: 1128273322061107
   📋 [Embedded Signup] Client ID (App ID): 1128273322061107
   ```
   Deben ser iguales.

2. **App Secret incorrecto**
   ```
   Error de Meta: OAuthException - Invalid client_secret
   Solución: Verificar FACEBOOK_APP_SECRET en .env
   ```

3. **Código expirado**
   ```
   Error de Meta: Code has expired
   Solución: El código OAuth2 expira en ~10 minutos. Reintentar.
   ```

4. **Permisos no aprobados**
   ```
   Error de Meta: Permissions not granted
   Solución: Verificar en App Dashboard que whatsapp_business_* estén aprobados
   ```

### Logs de Referencia

**Flujo Exitoso**:
```
🚀 [Modal] Iniciando Facebook Login for Business
   App ID: 1128273322061107

📥 [Modal] Facebook Login Response recibido:
   Status: connected
   Code: AQA...

📊 [Embedded Signup] Parámetros recibidos del cliente:
   chatbotId: abc123
   code: AQA...

🔄 [Embedded Signup] Iniciando intercambio de código por token...
📋 [Embedded Signup] Client ID (App ID): 1128273322061107

✅ [Embedded Signup] Token de larga duración obtenido exitosamente

✅ [Embedded Signup] PROCESO COMPLETADO EXITOSAMENTE
```

**Flujo con Error (ejemplo)**:
```
❌❌❌❌❌❌❌...
❌ [Embedded Signup] Token exchange FAILED
   HTTP Status: 400 Bad Request
   Client ID usado: 1128273322061107
   Code usado: AQA...
   Error Type: OAuthException
   Error Code: 100
   Error Message: Invalid OAuth 2.0 Access Token
   Fbtrace ID: AqWS7x...
❌❌❌❌❌❌❌...
```

## 🚀 Deploy a Producción

```bash
# 1. Verificar cambios
git status

# 2. Commit
git add .
git commit -m "fix: WhatsApp OAuth2 - unificar App ID y remover redirect_uri"

# 3. Deploy a Fly.io
npm run deploy

# 4. Verificar variables de entorno en producción
fly secrets list

# 5. Si FACEBOOK_APP_ID necesita actualizarse:
fly secrets set FACEBOOK_APP_ID=1128273322061107
```

## 📝 Notas Importantes

1. **No confundir App IDs**:
   - `1128273322061107` - App para Embedded Signup (CORRECTO) ✅
   - `1696672987689907` - App antigua (deprecado) ❌

2. **Config ID es opcional**:
   - `VITE_FACEBOOK_CONFIG_ID` solo es necesario si tienes una configuración específica de Embedded Signup en Meta
   - Sin Config ID, se muestra el flujo estándar de Embedded Signup

3. **Rebuild después de cambios en .env**:
   - Variables `VITE_*` solo se cargan en build time
   - Siempre hacer `npm run build` después de cambiar variables VITE_*

4. **Testing local vs producción**:
   - Asegurarse de que Facebook App tenga ambos dominios en App Domains:
     - `localhost` (para desarrollo)
     - `formmy-v2.fly.dev` (para producción)

---

**Última actualización**: 2025-01-20
**Archivos modificados**:
- `/app/components/integrations/WhatsAppEmbeddedSignupModal.tsx`
- `/app/routes/api.v1.integrations.whatsapp.embedded_signup.ts`
- `/.env`
