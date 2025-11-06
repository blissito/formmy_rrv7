#!/bin/bash

# WhatsApp Webhook Configuration Script
# Este script ayuda a configurar y verificar el webhook de WhatsApp

set -e

echo "🔍 WhatsApp Webhook Setup & Verification"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
else
  echo "❌ .env file not found"
  exit 1
fi

# Check required variables
if [ -z "$FACEBOOK_APP_ID" ]; then
  echo "❌ FACEBOOK_APP_ID not set in .env"
  exit 1
fi

if [ -z "$FACEBOOK_SYSTEM_USER_TOKEN" ]; then
  echo "❌ FACEBOOK_SYSTEM_USER_TOKEN not set in .env"
  exit 1
fi

APP_ID="$FACEBOOK_APP_ID"
TOKEN="$FACEBOOK_SYSTEM_USER_TOKEN"
WEBHOOK_URL="https://formmy-v2.fly.dev/api/v1/integrations/whatsapp/webhook"
VERIFY_TOKEN="formmy_wh_2024_secure_token_f7x9k2m8"

echo "📋 Configuration:"
echo "   App ID: $APP_ID"
echo "   Webhook URL: $WEBHOOK_URL"
echo "   Verify Token: $VERIFY_TOKEN"
echo ""

# Step 1: Check current webhook configuration
echo "📡 Step 1: Checking current webhook configuration..."
CURRENT_CONFIG=$(curl -s -X GET \
  "https://graph.facebook.com/v21.0/$APP_ID/subscriptions?access_token=$TOKEN")

echo "$CURRENT_CONFIG" | python3 -m json.tool || echo "$CURRENT_CONFIG"
echo ""

# Step 2: Subscribe to webhooks (if not already subscribed)
echo "📝 Step 2: Subscribing to webhook fields..."
echo ""
echo "⚠️  IMPORTANTE: Antes de ejecutar esto, debes configurar el webhook en Meta Dashboard:"
echo ""
echo "   1. Ve a: https://developers.facebook.com/apps/$APP_ID/webhooks/"
echo "   2. Haz clic en 'Edit Subscription' para WhatsApp"
echo "   3. Configura:"
echo "      - Callback URL: $WEBHOOK_URL"
echo "      - Verify Token: $VERIFY_TOKEN"
echo "   4. Suscríbete a estos campos:"
echo "      ✓ messages"
echo "      ✓ message_template_status_update"
echo ""
echo "¿Ya configuraste el webhook en Meta Dashboard? (y/n)"
read -r CONFIGURED

if [ "$CONFIGURED" != "y" ]; then
  echo ""
  echo "⏸️  Por favor configura el webhook primero en Meta Dashboard"
  echo "   URL: https://developers.facebook.com/apps/$APP_ID/webhooks/"
  echo ""
  exit 0
fi

echo ""
echo "✅ Webhook configurado en Meta Dashboard"
echo ""

# Step 3: Test webhook endpoint
echo "🧪 Step 3: Testing webhook endpoint..."
echo ""
echo "Verificando que el endpoint responde al challenge de Meta..."

CHALLENGE="test_challenge_123"
TEST_URL="${WEBHOOK_URL}?hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=${CHALLENGE}"

echo "Test URL: $TEST_URL"
echo ""

RESPONSE=$(curl -s "$TEST_URL")
echo "Response: $RESPONSE"

if [ "$RESPONSE" == "$CHALLENGE" ]; then
  echo "✅ Webhook endpoint responding correctly!"
else
  echo "❌ Webhook endpoint not responding with challenge"
  echo "   Expected: $CHALLENGE"
  echo "   Got: $RESPONSE"
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Send a test message to your WhatsApp number"
echo "   2. Check Fly.io logs: fly logs"
echo "   3. Verify message appears in Formmy dashboard"
echo ""
