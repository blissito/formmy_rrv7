# 🚀 Quick Start - Tests E2E

Guía rápida para empezar a usar los tests en 5 minutos.

## Paso 1: Instalar Playwright

```bash
npm run playwright:install
```

**¿Qué hace?** Instala solo Chromium (~100MB). Es gratis y open source.

## Paso 2: Iniciar servidor

En una terminal:

```bash
npm run dev
```

Espera a que aparezca: `Local: http://localhost:5173`

## Paso 3: Loguearte (una sola vez)

1. Abre http://localhost:5173 en tu navegador
2. Click en "Iniciar sesión" o "Login"
3. Loguéate con tu cuenta de Google
4. Verifica que puedas ver el dashboard

## Paso 4: Ejecutar smoke tests

En otra terminal:

```bash
npm run test:e2e:auth
```

**¿Qué hace?**
- Verifica que estés logueado
- Guarda tu sesión en `.auth/user.json`
- Los demás tests usarán esta sesión

Si ves ✅ en verde, todo está listo!

## Paso 5: Ejecutar tests completos

```bash
npm run test:e2e
```

**Esto abrirá un navegador visible donde verás:**
- ✅ Navegación por el dashboard
- ✅ Creación de chatbots
- ✅ Upload de documentos
- ✅ Gestión de API Keys
- 📸 Screenshots en `tests/e2e/screenshots/`

## Comandos útiles

```bash
# Ver solo los tests de chatbot
npm run test:e2e:chatbot

# Modo UI interactivo (recomendado!)
npm run test:e2e:ui

# Ver reporte HTML con resultados
npm run test:e2e:report

# Ejecutar sin ver el navegador (headless)
npm run test:e2e:headless
```

## ¿Problemas?

### "No se encontró elemento X"
→ Verifica que `npm run dev` esté corriendo

### "Test timeout"
→ Primeras ejecuciones pueden ser lentas (llamadas a LLM)

### "No puedo loguearme"
→ Loguéate manualmente primero (Paso 3)

## Siguiente nivel

Revisa el README completo: `tests/e2e/README.md`

---

**¿Dudas?** Abre un issue o pregunta en el equipo.
