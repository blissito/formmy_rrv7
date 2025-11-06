#!/bin/bash

# Test simple de memoria (asume servidor corriendo en fly.io o localhost)
CHATBOT_ID="68ba2400acaca27f1371ed2a"
SESSION_ID="curl-test-$(date +%s)"
VISITOR_ID="curl-visitor-$(date +%s)"

# Determinar URL del servidor
if [ -n "$1" ]; then
  SERVER_URL="$1"
else
  # Default: producción fly.io
  SERVER_URL="https://formmy.app"
fi

echo ""
echo "🧪 TEST DE MEMORIA CON CURL"
echo "═══════════════════════════════════════════════════════════"
echo "Servidor: $SERVER_URL"
echo "SessionId: $SESSION_ID"
echo "ChatbotId: $CHATBOT_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "📤 [1/2] Enviando: 'soy bliss'"
echo ""

curl -X POST "$SERVER_URL/api/v0/chatbot" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=soy bliss" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer \
  --silent \
  --show-error 2>&1 | grep -E '(data:|type|content)' | head -20

echo ""
echo "⏳ Esperando 2 segundos..."
sleep 2
echo ""

echo "📤 [2/2] Enviando: 'quien soy?'"
echo ""

curl -X POST "$SERVER_URL/api/v0/chatbot" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=quien soy?" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer \
  --silent \
  --show-error 2>&1 | grep -E '(data:|type|content|bliss)' | head -20

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Test completado"
echo ""
echo "SessionId: $SESSION_ID"
echo ""
echo "🔍 Ahora ejecuta:"
echo "   npx tsx scripts/check-curl-test.ts $SESSION_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""
