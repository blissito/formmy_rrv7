# Tests de Formmy

## 📂 Estructura

```
tests/
├── e2e/              # Tests end-to-end con Playwright
└── (futuro)          # Unit tests, integration tests, etc.
```

## 🧪 Tests E2E (Playwright)

Tests visuales end-to-end para validar flujos principales de Formmy.

### 🚀 Quick Start

```bash
# 1. Instalar Playwright
npm run playwright:install

# 2. Iniciar servidor en una terminal
npm run dev

# 3. Loguearse manualmente en http://localhost:5173

# 4. Ejecutar tests (en otra terminal)
npm run test:e2e
```

### 📚 Documentación Completa

Todo está en: **[tests/e2e/INDEX.md](./e2e/INDEX.md)**

O si prefieres ir directo:
- **[QUICKSTART](./e2e/QUICKSTART.md)** - Empieza aquí (5 min)
- **[README](./e2e/README.md)** - Documentación completa
- **[EXAMPLES](./e2e/EXAMPLES.md)** - Ejemplos y patterns

### 🎯 Tests Disponibles

- `npm run test:e2e:smoke` - Verificaciones básicas
- `npm run test:e2e:auth` - Autenticación y dashboard
- `npm run test:e2e:chatbot` - Crear y probar chatbots
- `npm run test:e2e:rag` - Upload y query de documentos
- `npm run test:e2e:apikeys` - Gestión de API Keys
- `npm run test:e2e:ui` - Modo UI interactivo ⭐

### ✅ Características

- ✅ 100% open source (Playwright)
- ✅ Modo visual (puedes ver todo)
- ✅ Screenshots automáticos
- ✅ Reportes HTML
- ✅ Sin costo alguno

---

**¿Dudas?** Lee la [documentación completa](./e2e/INDEX.md)
