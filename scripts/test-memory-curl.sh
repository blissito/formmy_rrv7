#!/bin/bash

# Test de memoria con curl
CHATBOT_ID="68ba2400acaca27f1371ed2a"
USER_ID="6885969379a1d0118e9a0da9"
SESSION_ID="curl-test-$(date +%s)"
VISITOR_ID="curl-visitor-$(date +%s)"

echo "🧪 TEST DE MEMORIA CON CURL"
echo "═══════════════════════════════════════════════════════════"
echo "SessionId: $SESSION_ID"
echo "ChatbotId: $CHATBOT_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "📤 Mensaje 1: 'soy bliss'"
echo "-----------------------------------------------------------"

curl -X POST http://localhost:5173/api/v0/chatbot \
  -H "Content-Type: multipart/form-data" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=soy bliss" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer 2>&1 | head -100

echo ""
echo ""
echo "⏳ Esperando 3 segundos..."
sleep 3
echo ""

echo "📤 Mensaje 2: 'quien soy?'"
echo "-----------------------------------------------------------"

curl -X POST http://localhost:5173/api/v0/chatbot \
  -H "Content-Type: multipart/form-data" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=quien soy?" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer 2>&1 | head -100

echo ""
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Test completado"
echo "SessionId usado: $SESSION_ID"
echo ""
echo "🔍 Revisa los logs del servidor para ver:"
echo "   - Si se reutilizó el sessionId"
echo "   - Si se cargó el historial"
echo "   - Si se creó la memoria"
echo "   - Si el agente recordó 'bliss'"
echo "═══════════════════════════════════════════════════════════"
