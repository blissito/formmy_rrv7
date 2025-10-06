#!/bin/bash

echo ""
echo "🧪 TEST DE MEMORIA EN LOCALHOST"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "INSTRUCCIONES:"
echo ""
echo "1. En OTRA TERMINAL, ejecuta el servidor:"
echo "   npm run dev"
echo ""
echo "2. Espera a que el servidor inicie (verás 'ready')"
echo ""
echo "3. Presiona ENTER aquí para continuar..."
echo ""
read -p "Presiona ENTER cuando el servidor esté listo: "
echo ""

CHATBOT_ID="68ba2400acaca27f1371ed2a"
SESSION_ID="test-$(date +%s)"
VISITOR_ID="visitor-$(date +%s)"

echo "═══════════════════════════════════════════════════════════"
echo "SessionId: $SESSION_ID"
echo "═══════════════════════════════════════════════════════════"
echo ""

echo "📤 [1/2] Enviando: 'soy bliss'"
echo ""

curl -X POST "http://localhost:5173/api/v0/chatbot" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=soy bliss" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer 2>&1 | grep -E 'data:' | head -10

echo ""
echo ""
echo "⏳ Esperando 2 segundos..."
sleep 2
echo ""

echo "📤 [2/2] Enviando: 'quien soy?'"
echo ""

curl -X POST "http://localhost:5173/api/v0/chatbot" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=quien soy?" \
  -F "sessionId=$SESSION_ID" \
  -F "visitorId=$VISITOR_ID" \
  -F "stream=true" \
  --no-buffer 2>&1 | grep -E 'data:' | head -10

echo ""
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "✅ Test completado"
echo ""
echo "🔍 AHORA REVISA LA TERMINAL DEL SERVIDOR"
echo ""
echo "Busca en los logs estos símbolos:"
echo "  🔥 - Inicio de streamAgentWorkflow"
echo "  🧠 - Creación de memoria"
echo "  📚 - Carga de historial"
echo "  ✅ - Confirmaciones"
echo "  ❌ - Errores"
echo ""
echo "Copia y pega TODO el output del servidor aquí"
echo "═══════════════════════════════════════════════════════════"
echo ""
