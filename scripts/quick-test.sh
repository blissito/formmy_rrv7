#!/bin/bash

# 🚀 Quick Test Script para Chatbot
# Testing rápido de funcionalidad básica

API_URL="${API_URL:-http://localhost:3000}"
CHATBOT_ID="${CHATBOT_ID:-}"

echo "🤖 Quick Test del Sistema de Chatbot"
echo "API: $API_URL"
echo

# Test 1: Health Check
echo "1. Testing Health Check..."
response=$(curl -s "$API_URL/api/health/chatbot")
if echo "$response" | grep -q "healthy\|degraded"; then
    echo "✅ Health check OK"
else
    echo "❌ Health check failed"
    echo "Response: $response"
fi

# Test 2: Rate Limiting (hacer 3 requests rápidos)
echo
echo "2. Testing Rate Limiting..."
for i in {1..3}; do
    status=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        "$API_URL/api/v0/chatbot" \
        -d "intent=chat&chatbotId=test&message=quick-test-$i")
    echo "Request $i: HTTP $status"
done

# Test 3: Chat funcional (si se proporciona CHATBOT_ID)
if [[ -n "$CHATBOT_ID" ]]; then
    echo
    echo "3. Testing Chat Funcional..."
    response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -d "intent=chat&chatbotId=$CHATBOT_ID&message=Hola&stream=false")

    if echo "$response" | grep -q "message\|response\|content"; then
        echo "✅ Chat funcional OK"
        echo "Response preview: $(echo "$response" | head -c 100)..."
    else
        echo "❌ Chat no funcional"
        echo "Response: $response"
    fi
else
    echo
    echo "⚠️  CHATBOT_ID no configurado - saltando test de chat"
    echo "   Usa: CHATBOT_ID=tu-chatbot-id ./quick-test.sh"
fi

echo
echo "✅ Quick test completado"
echo
echo "Para test completo ejecuta:"
echo "  ./scripts/test-chatbot.sh --chatbot-id $CHATBOT_ID --verbose"