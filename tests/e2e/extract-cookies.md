# 🍪 Cómo Extraer Cookies de tu Navegador

Guía visual paso a paso para extraer cookies y usarlas en Playwright.

## Método 1: Chrome DevTools (Más Fácil)

### Paso 1: Loguéate en tu navegador normal
1. Abre **Chrome** (tu navegador normal, no Chromium)
2. Ve a http://localhost:3000
3. Haz login con Google
4. Verifica que estás en el dashboard

### Paso 2: Abre DevTools
- **Windows/Linux**: Presiona `F12` o `Ctrl + Shift + I`
- **Mac**: Presiona `Cmd + Option + I`

### Paso 3: Ve a la pestaña Application
1. En DevTools, click en la pestaña **"Application"**
2. Si no la ves, click en el icono `>>` y busca "Application"

### Paso 4: Encuentra las cookies
1. En el menú izquierdo, expande **"Storage"** → **"Cookies"**
2. Click en **"http://localhost:3000"**
3. Verás una lista de cookies en el panel derecho

### Paso 5: Identifica la cookie de sesión
Busca cookies con nombres como:
- `__session`
- `__Secure-next-auth.session-token`
- `connect.sid`
- O cualquier cookie que parezca de autenticación

### Paso 6: Copia la cookie
1. Click en la cookie
2. Copia el **Name** (nombre)
3. Copia el **Value** (valor - puede ser largo)

### Paso 7: Usa el script para inyectarla
```bash
npm run test:e2e:inject-cookies
```

Pega el nombre y valor cuando te lo pida.

---

## Método 2: Exportar Todo el Estado (Avanzado)

### En Chrome:
1. Abre DevTools → Application
2. En lugar de copiar cookies individuales, usa este script en la **Console**:

```javascript
// Ejecuta esto en la consola de Chrome (DevTools → Console)
copy(await (async () => {
  const cookies = await window.cookieStore.getAll();
  return JSON.stringify(cookies, null, 2);
})());
```

3. Esto copia TODAS las cookies al clipboard
4. Pégalas en un archivo `tests/e2e/.auth/cookies.json`

### Convertir a formato Playwright:

```bash
# Ejecuta el script de conversión
npm run test:e2e:convert-cookies
```

---

## Método 3: Extension de Chrome (Más Visual)

### Instalar "EditThisCookie" o similar:
1. Ve a Chrome Web Store
2. Busca "EditThisCookie" o "Cookie-Editor"
3. Instala la extensión
4. Click en el icono de la extensión cuando estés en localhost:3000
5. Click en "Export" → Copia las cookies
6. Pégalas en el script

---

## Verificar que Funcionó

Después de inyectar las cookies:

```bash
# Test rápido
npm run test:e2e:auth

# Si ves el dashboard en el test = ✅ Funcionó
# Si te redirige a login = ❌ La cookie expiró o es incorrecta
```

---

## Troubleshooting

### "Las cookies no funcionan"

**Problema 1: Cookie expiró**
- Solución: Vuelve a loguearte y extrae cookies nuevas

**Problema 2: Cookie de dominio diferente**
- Verifica que la cookie sea de `localhost` o `localhost:3000`
- NO copies cookies de `accounts.google.com`

**Problema 3: Cookie HttpOnly**
- Algunas cookies no se pueden copiar con JavaScript
- Usa DevTools manualmente (Método 1)

**Problema 4: Formato incorrecto**
- Asegúrate de copiar el valor completo (puede ser muy largo)
- No incluyas comillas extras

### "El test sigue pidiendo login"

Tu app probablemente usa múltiples cookies o localStorage:

```bash
# Usa este script para capturar TODO el estado
npm run test:e2e:capture-full-state
```

---

## Scripts Disponibles

```bash
# Inyectar cookies manualmente
npm run test:e2e:inject-cookies

# Convertir cookies exportadas
npm run test:e2e:convert-cookies

# Capturar estado completo (cookies + localStorage)
npm run test:e2e:capture-full-state

# Verificar que las cookies funcionan
npm run test:e2e:verify-auth
```

---

## Notas Importantes

1. **Las cookies expiran** - Puede que tengas que hacer esto cada día/semana
2. **No compartas cookies** - Contienen tu sesión de autenticación
3. **localhost vs 127.0.0.1** - Asegúrate de usar el mismo dominio
4. **HTTPS vs HTTP** - Las cookies Secure solo funcionan con HTTPS

---

## Para CI/CD

En CI/CD no puedes hacer login manual. Opciones:

1. **Usar secrets** para guardar cookies de larga duración
2. **Mockear la autenticación** completamente
3. **Crear un usuario de prueba** con token de API

Ver: `tests/e2e/CI-CD-AUTH.md` para más detalles.
