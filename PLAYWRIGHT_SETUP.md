# 🎭 Playwright Setup Guide

Playwright es necesario para las funciones de búsqueda web de Ghosty. Este documento explica cómo configurarlo en diferentes entornos.

## 🏠 Development Setup

### Opción 1: Setup automático
```bash
npm run dev:setup
```

### Opción 2: Setup manual
```bash
npm install
npm run playwright:install
```

### Opción 3: Script de setup completo
```bash
./scripts/setup-dev.sh
```

## 🐳 Production (Docker)

En producción, Playwright se configura automáticamente a través del Dockerfile:

- ✅ Instala Chromium del sistema Alpine Linux
- ✅ Configura variables de entorno automáticamente
- ✅ No requiere setup manual

## 🔧 Environment Variables

### Development
No requiere variables especiales - Playwright usa sus binaries bundled.

### Production (Docker)
```bash
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 🐛 Troubleshooting

### "Executable doesn't exist" en desarrollo
```bash
npx playwright install chromium
```

### "Browser not initialized" en producción
Verificar que el Dockerfile tenga:
```dockerfile
RUN apk add chromium
```

### Web search no funciona
El servicio tiene fallback automático - Ghosty seguirá funcionando sin búsqueda web, usando su conocimiento base.

## 📊 Logs

### Desarrollo exitoso:
```
💻 Using Playwright bundled Chromium in development
✅ Playwright web search service initialized successfully
```

### Producción exitosa:
```
🐳 Using system Chromium in production: /usr/bin/chromium-browser
✅ Playwright web search service initialized successfully
```

### Fallback (si falla):
```
⚠️ Browser not initialized - search will fail gracefully
```