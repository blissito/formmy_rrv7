#!/bin/bash

# Script de deploy automático que actualiza secrets desde .env
# Uso: ./deploy.sh [production|development]

set -e  # Salir si hay errores

ENV=${1:-production}

echo "🚀 Deploying WhatsApp-Flowise Bridge to $ENV..."

# Verificar que existe .env
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "💡 Copy .env.example to .env and configure your variables"
    exit 1
fi

# Cargar variables del .env
echo "📋 Loading environment variables from .env..."
export $(grep -v '^#' .env | xargs)

# Verificar variables críticas
if [ -z "$WHATSAPP_TOKEN" ]; then
    echo "❌ Error: WHATSAPP_TOKEN not found in .env"
    exit 1
fi

if [ -z "$PHONE_NUMBER_ID" ]; then
    echo "❌ Error: PHONE_NUMBER_ID not found in .env"
    exit 1
fi

if [ -z "$VERIFY_TOKEN" ]; then
    echo "❌ Error: VERIFY_TOKEN not found in .env"
    exit 1
fi

echo "🔑 Updating Cloudflare secrets..."

# Actualizar secrets en Cloudflare
echo "$WHATSAPP_TOKEN" | wrangler secret put WHATSAPP_TOKEN --env $ENV
echo "$PHONE_NUMBER_ID" | wrangler secret put PHONE_NUMBER_ID --env $ENV
echo "$VERIFY_TOKEN" | wrangler secret put VERIFY_TOKEN --env $ENV

# Actualizar FLOWISE_API_KEY si existe
if [ ! -z "$FLOWISE_API_KEY" ]; then
    echo "$FLOWISE_API_KEY" | wrangler secret put FLOWISE_API_KEY --env $ENV
fi

echo "📦 Deploying worker..."

# Deploy del worker
wrangler deploy --env $ENV

echo "✅ Deploy completed successfully!"
echo ""
echo "🔗 Webhook URL: https://formmy-whatsapp-bridge.fixtergeek.workers.dev/webhook"
echo "🔍 Monitor logs: npm run tail"
echo "🧪 Test endpoint: npm run test"

# Mostrar configuración actual
echo ""
echo "📊 Current configuration:"
npm run config:current