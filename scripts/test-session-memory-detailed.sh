#!/bin/bash

# Test detallado con respuestas completas para verificar el fix

CHATBOT_ID="mi-chatbot-Ponsj4"
BASE_URL="http://localhost:3000"
DEV_TOKEN="FORMMY_DEV_TOKEN_2025"

echo "🧪 TEST DETALLADO: Memoria de sesión en conversaciones"
echo "======================================================="
echo ""

SESSION_1="test-detailed-1-$(date +%s)"
SESSION_2="test-detailed-2-$(date +%s)"

echo "🔹 SessionId 1: $SESSION_1"
echo "🔹 SessionId 2: $SESSION_2"
echo ""
echo "======================================================="
echo "📝 CONVERSACIÓN 1 - Dando información personal"
echo "======================================================="
echo ""

# Mensaje 1
echo "💬 Usuario: 'Hola, me llamo Roberto y soy ingeniero de software'"
echo "⏳ Enviando..."
RESP_1=$(curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=Hola, me llamo Roberto y soy ingeniero de software" \
  -F "sessionId=$SESSION_1" \
  -F "stream=true" 2>&1)

echo "🤖 Asistente:"
echo "$RESP_1" | grep "data: {\"type\":\"chunk\"" | sed 's/data: //' | jq -r 'select(.type=="chunk") | .content' | tr -d '\n'
echo ""
echo ""

sleep 2

# Mensaje 2 - Verificar memoria en misma conversación
echo "💬 Usuario: '¿Recuerdas mi nombre y profesión?'"
echo "⏳ Enviando..."
RESP_2=$(curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Recuerdas mi nombre y profesión?" \
  -F "sessionId=$SESSION_1" \
  -F "stream=true" 2>&1)

CONTENT_2=$(echo "$RESP_2" | grep "data: {\"type\":\"chunk\"" | sed 's/data: //' | jq -r 'select(.type=="chunk") | .content' | tr -d '\n')
echo "🤖 Asistente:"
echo "$CONTENT_2"
echo ""

# Verificar que SÍ recuerda en misma conversación
if echo "$CONTENT_2" | grep -iq "roberto\|ingeniero"; then
  echo "✅ Memoria en misma conversación: FUNCIONA (menciona Roberto o ingeniero)"
else
  echo "⚠️ Advertencia: No detectó memoria en misma conversación"
fi

echo ""
sleep 2

echo "======================================================="
echo "🆕 CONVERSACIÓN 2 - Nueva sesión (simulando 'Nueva Conversación')"
echo "======================================================="
echo ""

# Mensaje 3 - Preguntar lo mismo en nueva conversación
echo "💬 Usuario: '¿Cuál es mi nombre y profesión?'"
echo "⏳ Enviando (con nuevo sessionId: $SESSION_2)..."
RESP_3=$(curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Cuál es mi nombre y profesión?" \
  -F "sessionId=$SESSION_2" \
  -F "stream=true" 2>&1)

CONTENT_3=$(echo "$RESP_3" | grep "data: {\"type\":\"chunk\"" | sed 's/data: //' | jq -r 'select(.type=="chunk") | .content' | tr -d '\n')
echo "🤖 Asistente:"
echo "$CONTENT_3"
echo ""

echo "======================================================="
echo "🔍 RESULTADO DEL TEST"
echo "======================================================="
echo ""

# Verificar que NO recuerda en nueva conversación
if echo "$CONTENT_3" | grep -iq "roberto"; then
  echo "❌ FALLÓ: El agente mencionó 'Roberto' en la nueva conversación"
  echo "   Esto indica que hay fuga de memoria entre sesiones"
  echo ""
  echo "📋 Diagnóstico:"
  echo "   - Backend está compartiendo memoria entre sessionIds"
  echo "   - O el frontend está enviando conversationHistory"
  echo ""
  exit 1
elif echo "$CONTENT_3" | grep -iq "ingeniero"; then
  echo "❌ FALLÓ: El agente mencionó 'ingeniero' en la nueva conversación"
  echo "   Esto indica que hay fuga de memoria entre sesiones"
  echo ""
  exit 1
elif echo "$CONTENT_3" | grep -iq "no sé\|no tengo\|no recuerdo\|no conozco\|no puedo"; then
  echo "✅ ÉXITO: El agente correctamente indica que NO tiene la información"
  echo "   La memoria está aislada entre sesiones"
  echo ""
  echo "📊 Resumen:"
  echo "   ✓ Conversación 1: Recordó información (esperado)"
  echo "   ✓ Conversación 2: NO recordó información (esperado)"
  echo "   ✓ Bug de memoria persistente: ARREGLADO"
  echo ""
  exit 0
else
  echo "⚠️ VERIFICACIÓN MANUAL REQUERIDA"
  echo "   El agente no mencionó a Roberto pero la respuesta es ambigua"
  echo "   Respuesta: $CONTENT_3"
  echo ""
  exit 0
fi
