#!/bin/bash

echo "🚀 Setting up development environment..."

# Instalar dependencias
echo "📦 Installing npm dependencies..."
npm install

# Instalar Playwright browsers para desarrollo
echo "🎭 Installing Playwright browsers for development..."
npx playwright install chromium

# Generar Prisma client
echo "🗃️ Generating Prisma client..."
npx prisma generate

echo "✅ Development setup complete!"
echo ""
echo "🎯 To start development:"
echo "npm run dev"