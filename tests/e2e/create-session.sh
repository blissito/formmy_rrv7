#!/bin/bash

# Script para crear sesión de Playwright después de login manual
#
# USO:
#   1. Loguéate en tu navegador normal en localhost:3000
#   2. Ejecuta este script
#   3. Sigue las instrucciones

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🔐 Crear Sesión de Playwright para Tests E2E           ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Este script te ayudará a crear una sesión de autenticación"
echo "que los tests de Playwright podrán reutilizar."
echo ""
echo "📋 PREREQUISITOS:"
echo "   ✓ Servidor corriendo (npm run dev)"
echo "   ✓ Te has logueado en http://localhost:3000"
echo "   ✓ Puedes ver el dashboard"
echo ""
echo "Presiona ENTER para continuar (Ctrl+C para cancelar)..."
read

echo ""
echo "🌐 Abriendo navegador persistente de Playwright..."
echo ""
echo "En el navegador que se abre:"
echo "  1. Haz login con Google"
echo "  2. Verifica que llegas al dashboard"
echo "  3. CIERRA el navegador cuando termines"
echo ""
echo "La sesión se guardará automáticamente."
echo ""

# Crear directorio si no existe
mkdir -p tests/e2e/.auth

# Abrir Playwright con perfil persistente
npx playwright open \
  --browser chromium \
  --user-data-dir=tests/e2e/.auth/browser-data \
  http://localhost:3000

echo ""
echo "✅ Navegador cerrado."
echo ""
echo "Ahora vamos a guardar el estado de la sesión..."
echo ""

# Ejecutar script de Node para guardar la sesión
cat > /tmp/save-playwright-session.mjs << 'EOF'
import { chromium } from 'playwright';

async function saveSession() {
  const browser = await chromium.launchPersistentContext(
    './tests/e2e/.auth/browser-data',
    { headless: true }
  );

  await browser.storageState({ path: './tests/e2e/.auth/user.json' });
  await browser.close();

  console.log('✅ Sesión guardada en: tests/e2e/.auth/user.json');
}

saveSession();
EOF

node /tmp/save-playwright-session.mjs

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  🎉 ¡Listo! Sesión creada correctamente                 ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Ahora puedes ejecutar los tests E2E:"
echo ""
echo "  npm run test:e2e          # Todos los tests"
echo "  npm run test:e2e:ui       # Modo UI interactivo"
echo "  npm run test:e2e:chatbot  # Solo chatbots"
echo ""
