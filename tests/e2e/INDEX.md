# 📋 Tests E2E - Índice de Documentación

Documentación completa de los tests end-to-end de Formmy con Playwright.

## 🎯 Propósito

Sistema de tests **100% open source y gratuito** para validar visualmente los flujos principales de Formmy.

## 📚 Documentación

### Para Empezar

1. **[QUICKSTART.md](./QUICKSTART.md)** - 🚀 Empieza aquí (5 minutos)
   - Setup inicial
   - Primera ejecución
   - Comandos básicos

2. **[README.md](./README.md)** - 📖 Documentación completa
   - Arquitectura de tests
   - Todos los flujos cubiertos
   - Configuración avanzada
   - Troubleshooting

3. **[EXAMPLES.md](./EXAMPLES.md)** - 💡 Guía práctica
   - Patterns comunes
   - Ejemplos de código
   - Cómo extender tests
   - Tips avanzados

## 🧪 Tests Disponibles

### Smoke Tests (00-smoke.spec.ts)
Tests rápidos de verificación básica
```bash
npm run test:e2e:smoke
```

**Cubre:**
- ✅ Servidor corriendo
- ✅ Páginas cargan sin errores
- ✅ Navegación básica funciona
- ✅ Recursos estáticos cargan

---

### Autenticación (01-auth.spec.ts)
Validación de login y acceso al dashboard
```bash
npm run test:e2e:auth
```

**Cubre:**
- ✅ Home page carga
- ✅ Navegación a chat-ia
- ✅ Acceso al dashboard (si está logueado)
- ✅ Navegación por secciones del dashboard
- 💾 Guarda estado de autenticación para otros tests

---

### Chatbots (02-chatbot.spec.ts)
Crear, configurar y probar chatbots
```bash
npm run test:e2e:chatbot
```

**Cubre:**
- ✅ Ver lista de chatbots
- ✅ Crear nuevo chatbot
- ✅ Ver chatbot en la lista
- ✅ Probar conversación con el chatbot

---

### RAG/Documentos (03-rag.spec.ts)
Upload y consulta de documentos
```bash
npm run test:e2e:rag
```

**Cubre:**
- ✅ Acceder a sección de contexto
- ✅ Ver documentos existentes
- ✅ Subir nuevo documento
- ✅ Buscar en documentos

---

### API Keys (04-apikeys.spec.ts)
Gestión de API Keys y observabilidad
```bash
npm run test:e2e:apikeys
```

**Cubre:**
- ✅ Ver página de API Keys
- ✅ Navegar tabs (RAG, Parser, Voice, Observability)
- ✅ Crear nueva API Key
- ✅ Ver lista de keys
- ✅ Copiar key al clipboard
- ✅ Ver traces de observabilidad

---

## 🚀 Comandos Quick Reference

```bash
# Setup (una sola vez)
npm run playwright:install

# Todos los tests (modo visual)
npm run test:e2e

# Modo UI interactivo ⭐
npm run test:e2e:ui

# Tests individuales
npm run test:e2e:smoke      # Verificaciones básicas
npm run test:e2e:auth       # Autenticación
npm run test:e2e:chatbot    # Chatbots
npm run test:e2e:rag        # RAG/Documentos
npm run test:e2e:apikeys    # API Keys

# Sin ver navegador (headless)
npm run test:e2e:headless

# Ver reporte HTML
npm run test:e2e:report
```

## 📁 Estructura del Proyecto

```
tests/e2e/
├── INDEX.md                  # ← Estás aquí
├── QUICKSTART.md             # Guía rápida de inicio
├── README.md                 # Documentación completa
├── EXAMPLES.md               # Ejemplos y patterns
│
├── 00-smoke.spec.ts          # Smoke tests
├── 01-auth.spec.ts           # Autenticación
├── 02-chatbot.spec.ts        # Chatbots
├── 03-rag.spec.ts            # RAG/Documentos
├── 04-apikeys.spec.ts        # API Keys
│
├── helpers/
│   └── auth.helper.ts        # Helpers de autenticación
│
├── fixtures/
│   └── test-document.txt     # Documentos de prueba
│
├── screenshots/              # 📸 Screenshots generados (git-ignored)
└── .auth/                    # 🔐 Sesiones guardadas (git-ignored)
```

## ⚙️ Configuración

### playwright.config.ts
Configuración principal:
- **Base URL**: http://localhost:5173
- **Modo**: Visual (headless: false)
- **Viewport**: 1280x720
- **Timeout**: 10s por acción

### Variables de Entorno (Opcional)

```bash
# .env.test (opcional)
PLAYWRIGHT_BASE_URL=http://localhost:5173
TEST_GOOGLE_EMAIL=test@example.com
```

## 🎓 Flujo de Trabajo

### Primera Vez
```bash
# 1. Instalar
npm run playwright:install

# 2. Iniciar servidor
npm run dev

# 3. Loguearse manualmente en http://localhost:5173

# 4. Ejecutar test de auth (guarda sesión)
npm run test:e2e:auth

# 5. Ejecutar todos los tests
npm run test:e2e
```

### Desarrollo Diario
```bash
# Servidor corriendo en una terminal
npm run dev

# En otra terminal - ejecutar tests
npm run test:e2e:chatbot
```

### Modo Interactivo (Recomendado)
```bash
npm run test:e2e:ui
```
- Ver todos los tests
- Ejecutar individuales
- Ver timeline
- Inspector de DOM
- Network requests

## 💡 Tips Importantes

### ✅ DO's

- ✅ Ejecutar smoke tests primero
- ✅ Loguearse manualmente antes de correr tests
- ✅ Usar modo UI para debugging
- ✅ Revisar screenshots en caso de fallos
- ✅ Mantener el servidor corriendo mientras ejecutas tests

### ❌ DON'Ts

- ❌ No ejecutar tests sin estar logueado
- ❌ No modificar playwright.config.ts sin revisar docs
- ❌ No ignorar screenshots de errores
- ❌ No ejecutar múltiples instancias en paralelo (aún)

## 🐛 Troubleshooting Común

| Problema | Solución |
|----------|----------|
| "No se encontró elemento" | Verifica que `npm run dev` esté corriendo |
| "Test timeout" | Primera vez puede ser lenta (LLM calls) |
| "No puedo loguearme" | Loguéate manualmente, luego ejecuta test de auth |
| "Browser no abre" | Ejecuta `npm run playwright:install` |
| "Error de permisos" | Revisa que tengas permisos en el directorio |

Ver más en: [README.md - Troubleshooting](./README.md#-troubleshooting)

## 📊 Resultados

### Screenshots
Guardados en: `tests/e2e/screenshots/`
- Cada test genera screenshots
- Nombrados por test: `01-dashboard.png`
- Útiles para debugging visual

### Reportes HTML
```bash
npm run test:e2e:report
```
- Abre reporte interactivo
- Timeline de ejecución
- Screenshots de errores
- Network logs

## 🔧 Personalización

### Agregar Nuevo Test

1. Crea `XX-nombre.spec.ts`
2. Usa estructura base (ver EXAMPLES.md)
3. Agrega script en package.json
4. Actualiza esta documentación

### Modificar Configuración

Ver: `playwright.config.ts`

Común:
- Cambiar viewport
- Aumentar timeouts
- Agregar más navegadores (Firefox, Safari)
- Habilitar video recording

## 🚦 Status

✅ **Implementado:**
- Smoke tests básicos
- Autenticación (con Google OAuth)
- CRUD de chatbots
- RAG/Upload de documentos
- Gestión de API Keys
- Observabilidad (traces)

🔜 **Próximamente:**
- Tests de formularios
- Tests de integraciones (WhatsApp, Gmail)
- Tests de Voice AI
- Tests de planes y billing

## 📞 Soporte

- 📖 Ver documentación completa en README.md
- 💡 Ver ejemplos en EXAMPLES.md
- 🐛 Issues en GitHub
- 💬 Preguntar al equipo

## 🔗 Links Útiles

- [Playwright Docs](https://playwright.dev/)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [API Reference](https://playwright.dev/docs/api/class-playwright)
- [Debugging Guide](https://playwright.dev/docs/debug)

---

**Última actualización**: Noviembre 2025

**Mantenido por**: Equipo Formmy

**Licencia**: MIT (Playwright es Apache 2.0)
