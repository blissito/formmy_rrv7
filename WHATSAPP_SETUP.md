# WhatsApp Embedded Signup - Configuración Meta Dashboard

## ⚠️ CONFIGURACIÓN CRÍTICA REQUERIDA

### Paso 1: Agregar Redirect URI a Whitelist en Meta Dashboard

**URL**: https://developers.facebook.com/apps/1128273322061107/settings/basic/

**Sección**: "Valid OAuth Redirect URIs"

**Agregar esta URL**:
```
https://www.formmy.app/dashboard/integrations/whatsapp/callback
```

**IMPORTANTE**: Sin este redirect_uri en la whitelist, Meta rechazará la conexión con error "URL bloqueada".

---

# Configuración de WhatsApp Embedded Signup

Este documento explica cómo configurar correctamente WhatsApp Embedded Signup para Formmy.

## Variables de Entorno Requeridas

### Frontend (Vite)
```bash
VITE_FACEBOOK_APP_ID=tu_app_id
VITE_FACEBOOK_CONFIG_ID=tu_config_id  # ⚠️ REQUERIDO
```

### Backend
```bash
FACEBOOK_APP_ID=tu_app_id  # DEBE coincidir con VITE_FACEBOOK_APP_ID
FACEBOOK_APP_SECRET=tu_app_secret
```

## ⚠️ Error Actual (RESUELTO ✅)

Si ves este error:
```
❌ [Modal] VITE_FACEBOOK_APP_ID no configurado
Error fetching templates: Meta Graph API error: 401
❌ [Embedded Signup] Error: init not called with valid version
```

**Causa**: Falta `VITE_FACEBOOK_CONFIG_ID` en las variables de entorno.

**Solución**: Ya configurado con `VITE_FACEBOOK_CONFIG_ID=1306050453776674`

## 📋 Cómo Obtener el Facebook Config ID

### ✅ Ya Encontrado

El Config ID para esta aplicación es: **`1306050453776674`**

Se encontró en la URL de onboarding:
```
https://business.facebook.com/messaging/whatsapp/onboard/?app_id=1128273322061107&config_id=1306050453776674
```

### Opción 1: Facebook App Dashboard (Para referencia futura)

1. Ve a tu Facebook App Dashboard:
   ```
   https://developers.facebook.com/apps/1128273322061107/whatsapp-business/wa-settings/
   ```

2. En el panel izquierdo, selecciona:
   - **WhatsApp** → **Embedded Signup**

3. En la sección "Embedded Signup Configuration", encontrarás:
   ```
   Configuration ID: 1306050453776674
   ```

### Opción 2: Meta Business Suite

1. Ve a [Meta Business Suite](https://business.facebook.com/wa/manage/home/)

2. Selecciona tu cuenta de WhatsApp Business

3. En **Settings** → **Embedded Signup**, encontrarás el Config ID

## 🚀 Deployment a Fly.io

Después de agregar el Config ID a tu `.env` local, también debes configurarlo en Fly.io:

```bash
fly secrets set VITE_FACEBOOK_CONFIG_ID=tu_config_id
```

Verifica que se haya configurado correctamente:
```bash
fly secrets list | grep VITE_FACEBOOK_CONFIG_ID
```

## 🧪 Verificación

Para verificar que todo está configurado correctamente:

1. **Local Development**:
   ```bash
   npm run dev
   ```

   - Abre el navegador en http://localhost:3000
   - Ve a Dashboard → Integraciones → WhatsApp
   - Haz clic en "Conectar"
   - NO deberías ver el error "VITE_FACEBOOK_APP_ID no configurado"

2. **Production (Fly.io)**:
   ```bash
   npm run deploy
   ```

   - Espera a que el deploy termine
   - Abre https://formmy.app/dashboard/integrations
   - Verifica que puedas conectar WhatsApp sin errores

## 🔧 Troubleshooting

### Error: "init not called with valid version"
**Causa**: El FB SDK no pudo inicializarse correctamente.

**Solución**:
1. Verifica que `VITE_FACEBOOK_APP_ID` esté configurado
2. Verifica que `VITE_FACEBOOK_CONFIG_ID` esté configurado
3. Limpia caché del navegador y recarga

### Error 401 al obtener templates
**Causa**: La integración está desconectada o el token ha expirado.

**Solución**:
1. Desconecta WhatsApp desde el dashboard
2. Vuelve a conectar usando Embedded Signup
3. Esto generará un nuevo token válido

### WhatsApp se desconecta después de cerrar sesión
**Causa**: El flujo de desconexión no limpia correctamente el estado.

**Solución** (ya implementada):
- Ahora `handleDisconnect` recarga la página automáticamente
- Esto previene que componentes usen tokens inválidos

## 📝 Notas Importantes

1. **Config ID es diferente del App ID**: No los confundas
   - `VITE_FACEBOOK_APP_ID`: ID de tu Facebook App (ej: `1128273322061107`)
   - `VITE_FACEBOOK_CONFIG_ID`: ID de configuración de Embedded Signup (ej: `123456789_abcdefgh`)

2. **Reinicia el servidor después de cambiar .env**:
   ```bash
   # Detén el servidor (Ctrl+C)
   npm run dev  # Reinicia
   ```

3. **Fly.io secrets requieren redeploy**:
   Después de `fly secrets set`, debes hacer deploy nuevamente para que tome efecto.

## 🔗 Enlaces Útiles

- [Facebook App Dashboard](https://developers.facebook.com/apps/)
- [Meta Business Suite](https://business.facebook.com/)
- [WhatsApp Embedded Signup Docs](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Documentación Interna](./docs/whatsapp-embedded-signup-solution.md)
