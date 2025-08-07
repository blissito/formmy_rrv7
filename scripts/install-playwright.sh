#!/bin/bash

echo "🎭 Installing Playwright browsers..."

# Instalar solo chromium para reducir tamaño
npx playwright install --with-deps chromium

echo "✅ Playwright installation complete"

# Verificar instalación
if npx playwright --version > /dev/null 2>&1; then
    echo "✅ Playwright verification successful"
else
    echo "❌ Playwright verification failed"
    exit 1
fi