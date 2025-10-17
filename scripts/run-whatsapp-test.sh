#!/bin/bash

# Script para ejecutar el test de WhatsApp + Composio
# Usage: bash scripts/run-whatsapp-test.sh

echo "🧪 Iniciando test de WhatsApp + Composio..."
echo ""

# Verificar que existe el archivo .env
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "ℹ️  Copia .env.example a .env y configura las variables necesarias"
    exit 1
fi

# Cargar variables de entorno
source .env

# Verificar COMPOSIO_API_KEY
if [ -z "$COMPOSIO_API_KEY" ]; then
    echo "❌ Error: COMPOSIO_API_KEY no está configurada en .env"
    echo "ℹ️  Obtén tu API key desde: https://platform.composio.dev/settings"
    exit 1
fi

# Ejecutar el test
npx tsx scripts/test-composio-whatsapp.ts
