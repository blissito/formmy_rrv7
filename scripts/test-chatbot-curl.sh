#!/bin/bash

CHATBOT_ID="${1:-mi-chatbot-Ponsj4}"
MESSAGE="${2:-hola}"

echo "🧪 Testing chatbot: $CHATBOT_ID"
echo "💬 Message: $MESSAGE"
echo ""

curl -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=$MESSAGE" \
  -F "sessionId=test-curl-$(date +%s)" \
  -F "conversationHistory=[{\"role\":\"assistant\",\"content\":\"Hola\"}]" \
  -F "stream=true" \
  2>&1