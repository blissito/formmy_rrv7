# 🔐 Facebook App Secret Verification

## ❌ Problema Identificado

El error "Error al intercambiar el código por token" persiste porque:

**FACEBOOK_APP_SECRET no corresponde al FACEBOOK_APP_ID actual**

### IDs Actuales

```bash
# WhatsApp Assets (CORRECTOS)
Phone Number ID: 699799846554182
Business Account ID (WABA): 1649369379786047

# Facebook App (NECESITA VERIFICACIÓN)
FACEBOOK_APP_ID=1128273322061107  ✅ CORRECTO
FACEBOOK_APP_SECRET=c49cf42e3c45c64f818b70d09daa4c63  ❓ POSIBLEMENTE INCORRECTO
```

### ¿Por qué falla?

El App Secret `c49cf42e3c45c64f818b70d09daa4c63` probablemente corresponde al App ID antiguo `1696672987689907`.

Meta **valida** que el App Secret corresponda al App ID durante el token exchange:

```
POST https://graph.facebook.com/v21.0/oauth/access_token
  ?client_id=1128273322061107
  &client_secret=c49cf42e3c45c64f818b70d09daa4c63  ← Si no coinciden, falla
  &code=AQA...
```

## 🔍 Cómo Verificar el App Secret Correcto

### Opción 1: Facebook Developers Dashboard (Recomendado)

1. **Ir a**: https://developers.facebook.com/apps/
2. **Seleccionar App**: App ID `1128273322061107`
3. **Navegar a**: Settings > Basic
4. **Ver App Secret**: Click en "Show" junto a "App Secret"
5. **Copiar** el App Secret que se muestra

### Opción 2: Verificar con curl

Puedes probar si el App Secret es correcto haciendo un simple request:

```bash
curl "https://graph.facebook.com/v21.0/1128273322061107?fields=name&access_token=1128273322061107|c49cf42e3c45c64f818b70d09daa4c63"
```

**Si es correcto**: Devuelve `{"name":"Tu App Name","id":"1128273322061107"}`
**Si es incorrecto**: Devuelve error de autenticación

## ✅ Pasos para Corregir

### 1. Obtener el App Secret Correcto

Del Facebook Developers Dashboard (App ID: 1128273322061107):
- Settings > Basic > App Secret (click "Show")

### 2. Actualizar .env Local

```bash
# Reemplazar con el App Secret correcto
FACEBOOK_APP_SECRET=<EL_APP_SECRET_CORRECTO_AQUI>
```

### 3. Actualizar Fly.io Secrets

```bash
fly secrets set FACEBOOK_APP_SECRET=<EL_APP_SECRET_CORRECTO_AQUI>
```

### 4. Verificar Rebuild

```bash
# Local
npm run build

# Producción (automático al actualizar secret)
fly status
```

## 🎯 Configuración Correcta Final

Una vez obtengas el App Secret correcto, la configuración debe ser:

```bash
# .env
FACEBOOK_APP_ID=1128273322061107
FACEBOOK_APP_SECRET=<CORRECTO_PARA_1128273322061107>
VITE_FACEBOOK_APP_ID=1128273322061107

# WhatsApp Assets (ya configurados)
PHONE_NUMBER_ID=699799846554182
# Business Account ID se obtiene dinámicamente del token exchange
```

## 🔍 Verificación Adicional en Facebook Dashboard

Mientras estás en el Facebook Developers Dashboard, verifica también:

### 1. App Domains
Settings > Basic > App Domains:
- `localhost` ✅
- `formmy-v2.fly.dev` ✅

### 2. OAuth Redirect URIs
Settings > Advanced > OAuth Redirect URIs:
- `https://formmy-v2.fly.dev/` ✅
- (Opcional, ya que Embedded Signup usa popup)

### 3. WhatsApp Business Account Vinculado
WhatsApp > Configuration:
- Business Account ID: `1649369379786047` ✅
- Phone Number ID: `699799846554182` ✅
- Webhook URL: `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook` ✅

### 4. Permissions
Permissions & Features:
- `whatsapp_business_management` - Approved ✅
- `whatsapp_business_messaging` - Approved ✅
- `business_management` - Approved ✅

## 📊 Testing después de corregir

```bash
# 1. Local
npm run dev

# 2. Browser
https://localhost:3000/dashboard/codigo

# 3. Check Console Logs
✅ [Modal] App ID: 1128273322061107
✅ [Embedded Signup] Client ID: 1128273322061107
✅ [Embedded Signup] Token de larga duración obtenido exitosamente
```

## ❓ Si el error persiste después de actualizar el App Secret

1. **Verificar que el App tiene los permisos aprobados** por Meta
2. **Revisar si el App está en Development Mode** (puede requerir App Review)
3. **Verificar que el WABA y Phone Number están vinculados al App correcto**
4. **Contactar a Meta Business Support** con el fbtrace_id del error

---

**IMPORTANTE**: El App Secret es como una contraseña. Cada App ID tiene su propio App Secret único.
