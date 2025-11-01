# 🔐 Setup de Login - Google OAuth

## ⚠️ IMPORTANTE: Automatizar Google OAuth es IMPOSIBLE

**Google OAuth detecta y bloquea TODOS los navegadores automatizados.**

Esto incluye:
- ❌ Playwright (Chromium)
- ❌ Puppeteer
- ❌ Selenium
- ❌ Cualquier herramienta de automatización

**No hay solución**. Es por diseño de seguridad de Google. La comunidad entera no puede hacerlo.

## ✅ Lo que SÍ puedes hacer:

## ✅ Opción 1: Login Manual + Copiar Sesión (MÁS FÁCIL)

### Paso 1: Loguéate en tu navegador normal

```bash
# El servidor debe estar corriendo
npm run dev
```

Abre **tu navegador normal** (Chrome, Safari, Firefox):
- Ve a http://localhost:3000
- Haz login con Google
- Verifica que llegas al dashboard

### Paso 2: Exportar la sesión para Playwright

**En Chrome/Edge:**
1. Abre DevTools (F12)
2. Ve a "Application" → "Storage"
3. Copia el contenido de:
   - Cookies
   - Local Storage
   - Session Storage

**Script automático** (si tienes jq instalado):

```bash
# Exportar cookies de Chrome a Playwright
# (requiere que estés logueado en localhost:3000)

# Crear el archivo de sesión
mkdir -p tests/e2e/.auth

# Opción A: Usar el navegador de desarrollo de Playwright con perfil persistente
# Esto crea un perfil que puedes usar para loguearte una vez
npx playwright open --browser chromium --load-storage tests/e2e/.auth/user.json http://localhost:3000

# Loguéate ahí, y luego:
npx playwright codegen --save-storage=tests/e2e/.auth/user.json http://localhost:3000
```

### Paso 3: Verificar que funciona

```bash
npm run test:e2e:auth
```

---

## ✅ Opción 2: Tests Sin Login (Para tests públicos)

Los tests que NO requieren login funcionarán sin problema:

```bash
npm run test:e2e:smoke    # Tests básicos de páginas públicas
```

Para los que requieren login, usa `test.skip()` si no hay sesión:

```typescript
test('mi test que requiere login', async ({ page }) => {
  const loggedIn = await isLoggedIn(page);
  if (!loggedIn) {
    test.skip();
    return;
  }
  // ... resto del test
});
```

---

## ✅ Opción 3: Crear usuario de prueba (Para CI/CD)

Para automatización completa (CI/CD), necesitas:

1. **Cuenta de Google dedicada para testing**
   - Crear cuenta de Google específica para tests
   - Puede ser detectada/bloqueada eventualmente

2. **Usar service account de Google** (más complejo)
   - Requiere configurar OAuth flow especial
   - No recomendado para desarrollo local

3. **Mockear la autenticación** (para CI/CD)
   - Interceptar requests de OAuth
   - Devolver respuestas mockeadas
   - Requiere conocer el flujo exacto de tu app

---

## 🎯 Recomendación

**Para desarrollo local:**
→ Usa **Opción 1** (Login manual + copiar sesión)

**Para CI/CD:**
→ Combina **Opción 2** (tests públicos) + mocks de auth

---

## 💡 Script Helper de Sesión

He creado un script que intenta facilitar esto:

```bash
# 1. Loguéate primero en tu navegador normal
# 2. Luego ejecuta este script para crear la sesión de Playwright
npm run test:e2e:create-session
```

O simplemente:

```bash
# Abre Playwright con perfil persistente donde puedes loguearte
npx playwright open --browser chromium http://localhost:3000
# Después de loguearte ahí, las cookies quedan guardadas
```

---

## 🔍 Debugging

Si los tests fallan por falta de auth:

```bash
# Ver si existe la sesión
ls -la tests/e2e/.auth/

# Ver contenido de la sesión (si existe)
cat tests/e2e/.auth/user.json

# Borrar sesión y empezar de nuevo
rm -rf tests/e2e/.auth/
```

---

## ℹ️ Por qué Google bloquea navegadores automatizados

Google OAuth detecta:
- User agents de automatización
- Propiedades JavaScript específicas (`navigator.webdriver = true`)
- Patrones de comportamiento no humanos
- Fingerprinting del navegador

Esto es **por diseño** para seguridad. La solución correcta es usar tu navegador real para el login inicial.
