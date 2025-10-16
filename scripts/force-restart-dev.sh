#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🔄 FORCE RESTART DEV SERVER                                  ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# 1. Matar TODOS los procesos Node/Vite
echo "⏹️  Paso 1: Matando procesos Node/Vite..."
pkill -f "node.*vite" 2>/dev/null
pkill -f "node.*dev" 2>/dev/null
pkill -f "tsx.*dev" 2>/dev/null
sleep 2

# Verificar que se mataron
if pgrep -f "vite" > /dev/null; then
    echo "⚠️  Procesos Vite aún corriendo, forzando..."
    pkill -9 -f "vite"
    sleep 1
fi

echo "✅ Procesos terminados"
echo ""

# 2. Limpiar cachés
echo "🧹 Paso 2: Limpiando cachés..."
rm -rf .react-router
rm -rf build
rm -rf node_modules/.vite
rm -rf .cache

echo "✅ Cachés limpiados"
echo ""

# 3. Verificar cambios críticos
echo "🔍 Paso 3: Verificando cambios en código..."

# Verificar que save_contact_info NO está disponible para Ghosty
if grep -q "!context.isGhosty.*save_contact_info" server/tools/index.ts 2>/dev/null; then
    echo "✅ save_contact_info: Correctamente filtrada (!context.isGhosty)"
else
    echo "⚠️  save_contact_info: NO filtrada correctamente"
fi

# Verificar prompt optimizado de Ghosty
if grep -q "REGLA #1 - LINKS DE PAGO" server/agents/agent-workflow.server.ts 2>/dev/null; then
    echo "✅ System prompt: Optimizado aplicado"
else
    echo "⚠️  System prompt: NO encontrado"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 LISTO PARA REINICIAR"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Ejecuta manualmente en tu terminal:"
echo ""
echo "   npm run dev"
echo ""
echo "Y luego prueba con:"
echo ""
echo "   npx tsx scripts/test-localhost-ghosty.ts"
echo ""
