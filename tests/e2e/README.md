# Tests E2E de Formmy con Playwright

Tests end-to-end básicos para observar y validar los flujos principales de Formmy.

## 🎯 Objetivo

Estos tests te permiten:
- ✅ Ver visualmente cómo funcionan los flujos principales
- ✅ Validar que las features críticas funcionan
- ✅ Detectar regresiones rápidamente
- ✅ Documentar el comportamiento esperado

## 🛠️ Setup Inicial

### 1. Instalar Playwright (si no está instalado)

```bash
npm run playwright:install
```

Esto instala solo Chromium (el más ligero). **100% gratis y open source**.

### 2. Autenticación

Formmy usa **Google OAuth** (sin passwords). Para los tests necesitas:

**OPCIÓN A - Sesión Manual (Recomendada para desarrollo local):**

1. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

2. Abre http://localhost:5173 en tu navegador

3. Loguéate con tu cuenta de Google

4. Ejecuta el test de auth para guardar la sesión:
   ```bash
   npm run test:e2e:auth
   ```

5. La sesión se guarda en `tests/e2e/.auth/user.json`

6. Los demás tests reutilizarán automáticamente esta sesión

**OPCIÓN B - Login Automático:**

Para CI/CD o automatización completa, necesitas configurar una cuenta de Google de prueba. Ver `tests/e2e/helpers/auth.helper.ts` para más detalles.

## 🚀 Ejecutar Tests

### Ver todos los tests (modo visual)
```bash
npm run test:e2e
```

### Tests específicos (modo visual)
```bash
npm run test:e2e:auth      # Solo autenticación
npm run test:e2e:chatbot   # Solo chatbots
npm run test:e2e:rag       # Solo RAG/documentos
npm run test:e2e:apikeys   # Solo API Keys
```

### Modo UI interactivo (recomendado para debug)
```bash
npm run test:e2e:ui
```

### Modo headless (sin ver el navegador)
```bash
npm run test:e2e:headless
```

### Ver reporte HTML
```bash
npm run test:e2e:report
```

## 📁 Estructura

```
tests/e2e/
├── 01-auth.spec.ts           # Tests de autenticación y navegación
├── 02-chatbot.spec.ts        # Crear, configurar, probar chatbots
├── 03-rag.spec.ts            # Upload y query de documentos
├── 04-apikeys.spec.ts        # Gestión de API Keys
├── helpers/
│   └── auth.helper.ts        # Helpers de autenticación
├── fixtures/
│   └── test-document.txt     # Documentos de prueba para RAG
├── screenshots/              # Screenshots de cada test
└── .auth/                    # Sesiones guardadas (git-ignored)
```

## 📸 Screenshots

Cada test genera screenshots automáticos en `tests/e2e/screenshots/`:
- Capturas del estado inicial
- Capturas después de cada acción importante
- Capturas al detectar errores

## 🔧 Configuración

La configuración está en `playwright.config.ts`:

```typescript
{
  baseURL: 'http://localhost:5173',
  headless: false,              // Modo visual por defecto
  viewport: { width: 1280, height: 720 },
  actionTimeout: 10000,
}
```

## 📝 Flujos Cubiertos

### 1. Autenticación (01-auth.spec.ts)
- ✅ Página principal carga
- ✅ Navegación a sección de chat
- ✅ Acceso al dashboard (si está logueado)
- ✅ Navegación por secciones del dashboard

### 2. Chatbots (02-chatbot.spec.ts)
- ✅ Ver lista de chatbots
- ✅ Crear nuevo chatbot
- ✅ Ver chatbot creado en la lista
- ✅ Probar conversación con el chatbot

### 3. RAG/Documentos (03-rag.spec.ts)
- ✅ Acceder a sección de contexto/RAG
- ✅ Ver documentos existentes
- ✅ Subir nuevo documento
- ✅ Buscar/consultar en documentos

### 4. API Keys (04-apikeys.spec.ts)
- ✅ Ver página de API Keys
- ✅ Ver tabs (RAG, Parser, Observability, Voice)
- ✅ Crear nueva API Key
- ✅ Ver lista de keys existentes
- ✅ Copiar API Key al clipboard
- ✅ Ver sección de observabilidad (traces)

## 💡 Tips

### Debug individual
Para debuggear un test específico, usa `test.only()`:

```typescript
test.only('puede crear un chatbot', async ({ page }) => {
  // ...
});
```

### Slow motion
Para ver los tests más despacio:

```typescript
// En playwright.config.ts
use: {
  launchOptions: {
    slowMo: 1000  // 1 segundo entre acciones
  }
}
```

### Esperar elementos
```typescript
// Esperar que elemento sea visible
await page.locator('selector').waitFor({ state: 'visible' });

// Esperar timeout custom
await page.waitForTimeout(2000);

// Esperar navegación
await page.waitForLoadState('networkidle');
```

## 🚫 Limitaciones Conocidas

1. **Google OAuth**: No se automatiza completamente por seguridad. Requiere sesión manual inicial.

2. **Tests no destructivos**: Los tests de eliminación están comentados para no borrar datos reales.

3. **Dependencias de tiempo**: Algunos tests esperan respuestas de LLM que pueden tardar.

4. **Orden de ejecución**: Los tests deben ejecutarse en orden (01, 02, 03, 04).

## 🐛 Troubleshooting

### "No se encontró elemento X"
- Verifica que el servidor esté corriendo (`npm run dev`)
- Verifica que estés logueado
- Revisa los selectores en el código del test

### "Test timeout"
- Aumenta el timeout en `playwright.config.ts`
- Verifica tu conexión a internet (para llamadas a LLM)

### "No puedo loguearme"
- Usa la opción de sesión manual (ver sección Autenticación)
- Verifica que Google OAuth esté configurado correctamente

### Ver más detalles
```bash
# Modo debug con inspector
PWDEBUG=1 npm run test:e2e

# Con más logs
DEBUG=pw:api npm run test:e2e
```

## 📚 Recursos

- [Playwright Docs](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Locators](https://playwright.dev/docs/locators)

## 🤝 Contribuir

Para agregar nuevos tests:

1. Crea un archivo `XX-nombre.spec.ts`
2. Sigue la estructura de los tests existentes
3. Agrega screenshots en puntos clave
4. Documenta prerequisitos
5. Agrega script en `package.json` si es necesario
