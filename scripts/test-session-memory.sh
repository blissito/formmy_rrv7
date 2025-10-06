#!/bin/bash

# Script para probar que el bug de memoria persistente está arreglado
# Bug: handleClearConversation no regeneraba sessionId → agente mantenía memoria

CHATBOT_ID="mi-chatbot-Ponsj4"
BASE_URL="http://localhost:3000"
DEV_TOKEN="FORMMY_DEV_TOKEN_2025"

echo "🧪 TEST: Verificar que nueva conversación limpia memoria del agente"
echo "=================================================="
echo ""

# Generar sessionIds únicos
SESSION_1="test-session-1-$(date +%s)"
SESSION_2="test-session-2-$(date +%s)"

echo "📝 FASE 1: Conversación inicial (sessionId: $SESSION_1)"
echo "------------------------------------------------"
echo ""

# Mensaje 1: Dar información específica
echo "💬 Mensaje 1: 'Mi nombre es Juan y trabajo en Acme Corp'"
curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=Mi nombre es Juan y trabajo en Acme Corp" \
  -F "sessionId=$SESSION_1" \
  -F "stream=false" \
  2>&1 | grep -o "data: {.*}" | tail -1
echo ""
echo ""

sleep 2

# Mensaje 2: Confirmar que recuerda
echo "💬 Mensaje 2: '¿Cuál es mi nombre?'"
RESPONSE_1=$(curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Cuál es mi nombre?" \
  -F "sessionId=$SESSION_1" \
  -F "stream=false" \
  2>&1)

echo "$RESPONSE_1" | grep -o "data: {.*}" | tail -1
echo ""
echo ""

sleep 2

echo "📝 FASE 2: NUEVA conversación (sessionId: $SESSION_2)"
echo "------------------------------------------------"
echo "⚠️ Este es el test crítico - debe NO recordar a Juan"
echo ""

# Mensaje 3: Preguntar lo mismo en nueva conversación
echo "💬 Mensaje 3: '¿Cuál es mi nombre?' (en nueva conversación)"
RESPONSE_2=$(curl -s -X POST "$BASE_URL/api/v0/chatbot" \
  -H "x-dev-token: $DEV_TOKEN" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Cuál es mi nombre?" \
  -F "sessionId=$SESSION_2" \
  -F "stream=false" \
  2>&1)

echo "$RESPONSE_2" | grep -o "data: {.*}" | tail -1
echo ""
echo ""

echo "=================================================="
echo "🔍 ANÁLISIS DE RESULTADOS"
echo "=================================================="
echo ""

# Verificar si menciona "Juan" en la segunda conversación
if echo "$RESPONSE_2" | grep -iq "juan"; then
  echo "❌ FALLO: El agente recordó información de conversación anterior"
  echo "   Detectado 'Juan' en respuesta de nueva conversación"
  echo "   El bug NO está arreglado"
  echo ""
  exit 1
else
  echo "✅ ÉXITO: El agente NO tiene memoria de conversación anterior"
  echo "   No mencionó 'Juan' en nueva conversación"
  echo "   El bug está ARREGLADO"
  echo ""
  exit 0
fi
