#!/bin/bash

CHATBOT_ID="68928ae2e635f3c0b8957d0f"
S1="quick-test-1-$(date +%s)"
S2="quick-test-2-$(date +%s)"

echo "⚡ QUICK TEST: Memoria entre sesiones"
echo ""

# Sesión 1
curl -s -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=Mi color favorito es el azul" \
  -F "sessionId=$S1" \
  -F "stream=true" > /dev/null

sleep 2

# Sesión 2 - preguntar por color
RESP=$(curl -s -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Cuál es mi color favorito?" \
  -F "sessionId=$S2" \
  -F "stream=true")

if echo "$RESP" | grep -iq "azul"; then
  echo "❌ FALLÓ: Memoria compartida entre sesiones"
  exit 1
else
  echo "✅ PASÓ: Sesiones aisladas correctamente"
  exit 0
fi
