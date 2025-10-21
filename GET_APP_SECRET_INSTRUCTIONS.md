# 🔐 Cómo Obtener el Facebook App Secret

## Paso a Paso

### 1. Ir a Facebook Developers
🔗 https://developers.facebook.com/apps/

### 2. Seleccionar tu App
- **App ID**: `1128273322061107`
- **App Name**: (el nombre que configuraste)

### 3. Ir a Settings > Basic
En el menú lateral izquierdo:
- Click en **"Settings"**
- Click en **"Basic"**

### 4. Ver App Secret
En la página de Basic Settings, busca el campo **"App Secret"**:

```
App ID: 1128273322061107
App Secret: [••••••••••••••••••] [Show]  [Reset]
```

- Click en **"Show"**
- Facebook te pedirá tu contraseña para verificar
- El App Secret se revelará (algo como: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`)

### 5. Copiar el App Secret

El formato será similar a:
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

**NO** es:
- ❌ "formmy" (ese es el webhook verify token)
- ❌ Un token de acceso de WhatsApp
- ❌ Un número corto

Es un **hash de 32 caracteres** (letras y números).

### 6. Actualizar en el proyecto

Una vez que tengas el App Secret correcto:

```bash
# .env
FACEBOOK_APP_SECRET=<pegar_aqui_el_app_secret>

# Fly.io
fly secrets set FACEBOOK_APP_SECRET=<pegar_aqui_el_app_secret>
```

## 🎯 Resumen de IDs Correctos

```bash
# WhatsApp (YA CONFIGURADOS)
Phone Number ID: 699799846554182  ✅
Business Account ID: 1649369379786047  ✅

# Facebook App (NECESITA APP SECRET)
App ID: 1128273322061107  ✅
App Secret: ???  ← NECESITAS OBTENER ESTO DEL DASHBOARD

# Webhook (YA CONFIGURADO)
Webhook Verify Token: formmy  ✅
```

## ⚠️ Importante

El **App Secret** es como una contraseña maestra para tu App de Facebook. Nunca debe compartirse públicamente y se usa para autenticar las llamadas a la API de Facebook Graph.

Sin el App Secret correcto que corresponda al App ID `1128273322061107`, el intercambio de código OAuth2 **SIEMPRE fallará**.
