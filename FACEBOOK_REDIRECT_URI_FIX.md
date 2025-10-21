# 🔐 Facebook Redirect URI Fix

## ✅ Problema Identificado

```
Error Message: Error validating verification code. Please make sure your redirect_uri is identical to the one you used in the OAuth dialog request
Error Code: 100
Error Subcode: 36008
Fbtrace ID: AQl4NmZbon7JmCmBYrzXXQB
```

### Causa Raíz

Cuando **NO** especificas un `redirect_uri` en `FB.login()`, Facebook **automáticamente usa la URL de la página actual** como redirect_uri implícito.

En el token exchange, **NO estábamos enviando ningún redirect_uri**, causando que Meta rechazara la solicitud porque espera que coincida con el implícito.

## ✅ Solución Implementada

Agregado `redirect_uri` en el token exchange:

```typescript
const redirectUri = 'https://formmy-v2.fly.dev/';
tokenExchangeUrl.searchParams.append('redirect_uri', redirectUri);
```

## 📋 Configuración Requerida en Facebook App Dashboard

### Paso 1: Ir a Facebook Developers

🔗 https://developers.facebook.com/apps/1128273322061107/

### Paso 2: Settings > Basic

1. **App Domains**: Agregar `formmy-v2.fly.dev`
   ```
   formmy-v2.fly.dev
   ```

### Paso 3: Settings > Advanced > OAuth Redirect URIs

Agregar las siguientes URLs:

```
https://formmy-v2.fly.dev/
https://formmy-v2.fly.dev/dashboard/codigo
```

**¿Por qué ambas?**
- `/` es la URL base que estamos usando en el token exchange
- `/dashboard/codigo` es la página específica donde se inicia el OAuth

### Paso 4: Guardar Cambios

Click en **"Save Changes"** en la parte inferior de la página.

## 🚀 Deploy y Testing

### 1. Build y Deploy

```bash
npm run build
fly deploy
```

### 2. Probar en Producción

1. **Ir a**: https://formmy-v2.fly.dev/dashboard/codigo
2. **Click en**: "Connect WhatsApp"
3. **Autorizar** en el popup de Facebook
4. **Verificar** que ahora funcione correctamente

### 3. Logs Esperados (Éxito)

```
🔄 [Embedded Signup] Iniciando intercambio de código por token...
📋 [Embedded Signup] Client ID (App ID): 1128273322061107
🔗 [Embedded Signup] Redirect URI: https://formmy-v2.fly.dev/
✅ [Embedded Signup] Token de larga duración obtenido exitosamente
✅✅✅✅✅✅✅...
✅ [Embedded Signup] PROCESO COMPLETADO EXITOSAMENTE
✅✅✅✅✅✅✅...
```

## 📝 Configuración por Entorno

### Producción (Fly.io)
- **URL Base**: `https://formmy-v2.fly.dev/`
- **OAuth Redirect**: `https://formmy-v2.fly.dev/`
- **Registrado en Facebook**: ✅ Requerido

### Desarrollo Local (No funciona)
- **URL Base**: `http://localhost:3000/`
- **OAuth Redirect**: `http://localhost:3000/`
- **Nota**: ❌ Facebook Login requiere HTTPS, no funciona en localhost

Para probar en desarrollo, necesitarías:
- Usar ngrok o similar para tener HTTPS local
- O simplemente probar en producción

## ⚠️ Notas Importantes

1. **El redirect_uri es case-sensitive**: `https://Formmy-v2.fly.dev/` ≠ `https://formmy-v2.fly.dev/`

2. **Debe incluir el trailing slash**:
   - ✅ `https://formmy-v2.fly.dev/`
   - ❌ `https://formmy-v2.fly.dev`

3. **Debe estar registrado en Facebook App**: Sin esto, seguirá fallando

4. **El redirect_uri del token exchange debe coincidir EXACTAMENTE** con:
   - El especificado en FB.login() (si se especifica)
   - O la URL de la página actual (si no se especifica en FB.login())

## 🔍 Debugging

Si el error persiste:

### Verificar en Facebook App Dashboard

1. **App Domains** contiene: `formmy-v2.fly.dev`
2. **OAuth Redirect URIs** contiene: `https://formmy-v2.fly.dev/`
3. **Changes guardados**: Click en "Save Changes"

### Verificar en Logs

```bash
fly logs | grep "Redirect URI"
```

Debe mostrar:
```
🔗 [Embedded Signup] Redirect URI: https://formmy-v2.fly.dev/
```

### Error Code 36008

Este error **específicamente** indica redirect_uri mismatch:
- El redirect_uri del FB.login() (implícito o explícito)
- NO coincide con el redirect_uri del token exchange

## 📚 Referencias

- [Facebook OAuth Documentation](https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow)
- [Embedded Signup for WhatsApp](https://developers.facebook.com/docs/whatsapp/embedded-signup)

---

**Última actualización**: 2025-01-20
**Error corregido**: Error Code 100, Subcode 36008 - redirect_uri mismatch
