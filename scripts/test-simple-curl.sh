#!/bin/bash

SESSION_ID="test-$(date +%s)"

echo "Testing with sessionId: $SESSION_ID"
echo ""

curl -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=mi-chatbot-Ponsj4" \
  -F "message=Hola, me llamo Pedro" \
  -F "sessionId=$SESSION_ID" \
  -F "stream=true"

echo ""
echo ""
echo "Now asking about the name with SAME session..."
echo ""

curl -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=mi-chatbot-Ponsj4" \
  -F "message=¿Cual es mi nombre?" \
  -F "sessionId=$SESSION_ID" \
  -F "stream=true"
