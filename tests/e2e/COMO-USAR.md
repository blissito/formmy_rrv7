# 🚀 Cómo Usar los Tests E2E de Formmy

Guía práctica y directa.

## ⚡ Quick Start (3 pasos)

### 1. Ejecutar servidor

```bash
npm run dev
```

### 2. Loguéate y copia la sesión

```bash
npm run test:e2e:inject-session
```

**Te pedirá:**
1. Loguéate en Chrome en http://localhost:3000
2. Abre DevTools (F12) → Application → Cookies
3. Copia el valor de la cookie `__session`
4. Pégalo en el script

### 3. Ejecuta los tests

```bash
npm run test:e2e
```

¡Listo! Verás todos los tests ejecutándose con tu sesión.

---

## 📋 Comandos Disponibles

### Tests sin login (siempre funcionan)
```bash
npm run test:e2e:smoke      # Tests básicos
```

### Tests con login (requiere paso 2)
```bash
npm run test:e2e:auth       # Dashboard y navegación
npm run test:e2e:chatbot    # Chatbots
npm run test:e2e:rag        # RAG/Documentos
npm run test:e2e:apikeys    # API Keys
npm run test:e2e            # Todos
```

### Modo UI interactivo (recomendado)
```bash
npm run test:e2e:ui
```

---

## 🍪 Cómo Copiar la Cookie __session

### Visual rápido:

1. **Chrome abierto** en http://localhost:3000 (logueado)
2. **F12** (DevTools)
3. **Application** (pestaña superior)
4. **Cookies** → **http://localhost:3000** (menú izquierdo)
5. Buscar **`__session`**
6. **Doble-click en Value** → **Ctrl+C**

### Si no ves la cookie:
- Verifica que estés logueado
- Refresca la página (F5)
- Verifica que la URL sea exactamente `localhost:3000` (no 127.0.0.1)

---

## 🔄 Actualizar Sesión

La cookie expira en 7 días. Si los tests fallan con redirección a login:

```bash
# Volver a inyectar sesión
npm run test:e2e:inject-session
```

---

## 🎯 Lo que los Tests Prueban

### Smoke Tests (sin login)
- ✅ Página principal carga
- ✅ Navegación funciona
- ✅ No hay errores JavaScript

### Auth Tests (con login)
- ✅ Acceso al dashboard
- ✅ Navegación entre secciones
- ✅ Elementos principales visibles

### Chatbot Tests (con login)
- ✅ Ver lista de chatbots
- ✅ Crear nuevo chatbot
- ✅ Configurar chatbot
- ✅ Probar conversación

### RAG Tests (con login)
- ✅ Ver documentos
- ✅ Subir archivo
- ✅ Buscar en documentos

### API Keys Tests (con login)
- ✅ Ver API keys
- ✅ Crear nueva key
- ✅ Copiar key
- ✅ Ver observabilidad

---

## 🐛 Troubleshooting

### "El test se salta porque no hay sesión"
→ Ejecuta: `npm run test:e2e:inject-session`

### "Me redirige al login"
→ La cookie expiró, vuelve a inyectarla

### "No encuentro la cookie __session"
→ Verifica que estés logueado en localhost:3000

### "El servidor no responde"
→ Asegúrate que `npm run dev` esté corriendo

### "Chromium no está instalado"
→ Ejecuta: `npm run playwright:install`

---

## 📸 Screenshots

Los tests generan screenshots automáticamente en:
- `tests/e2e/screenshots/` - Screenshots de los tests
- `test-results/` - Screenshots de errores

---

## 📊 Reportes HTML

Después de ejecutar tests:

```bash
npm run test:e2e:report
```

Abre un reporte HTML interactivo con:
- Timeline de ejecución
- Screenshots
- Logs detallados
- Network requests

---

## ⚠️ Limitaciones

**Google OAuth NO se puede automatizar.**

Por eso usamos la cookie de tu sesión real. Es la única forma de hacer tests con autenticación.

Ver: `SETUP-LOGIN.md` para más detalles.

---

## 💡 Tips

1. **Modo UI es el mejor** para desarrollo:
   ```bash
   npm run test:e2e:ui
   ```

2. **Ejecuta smoke tests primero** para validar setup:
   ```bash
   npm run test:e2e:smoke
   ```

3. **Actualiza la sesión** si los tests empiezan a fallar

4. **Usa --headed** para ver el navegador:
   ```bash
   npx playwright test --headed
   ```

5. **Debug con inspector**:
   ```bash
   PWDEBUG=1 npm run test:e2e
   ```

---

## 🔗 Más Documentación

- `SETUP-LOGIN.md` - Por qué Google OAuth no funciona
- `extract-cookies.md` - Guía detallada de cookies
- `README.md` - Documentación completa
- `EXAMPLES.md` - Ejemplos de código
