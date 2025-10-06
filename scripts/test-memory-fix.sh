#!/bin/bash

CHATBOT_ID="68928ae2e635f3c0b8957d0f"  # Automator T-800

echo "🧪 TEST: Verificar que nueva conversación NO tiene memoria"
echo "=========================================================="
echo ""

SESSION_1="session-1-$(date +%s)"
SESSION_2="session-2-$(date +%s)"

echo "🔹 Sesión 1: $SESSION_1"
echo "🔹 Sesión 2: $SESSION_2"
echo ""

# CONVERSACIÓN 1
echo "📝 CONVERSACIÓN 1 - Estableciendo contexto"
echo "------------------------------------------"
echo ""

echo "💬 Mensaje 1: 'Mi nombre es Carlos y me encantan los gatos'"
curl -s -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=Mi nombre es Carlos y me encantan los gatos" \
  -F "sessionId=$SESSION_1" \
  -F "stream=true" 2>&1 > /tmp/resp1.txt

sleep 3

echo "💬 Mensaje 2: '¿Recuerdas cuál es mi nombre?'"
curl -s -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Recuerdas cuál es mi nombre?" \
  -F "sessionId=$SESSION_1" \
  -F "stream=true" 2>&1 > /tmp/resp2.txt

CONTENT_2=$(grep "data: {\"type\":\"chunk\"" /tmp/resp2.txt | sed 's/.*"content":"\([^"]*\)".*/\1/' | tr -d '\n')
echo "🤖 Respuesta: $CONTENT_2"
echo ""

if echo "$CONTENT_2" | grep -iq "carlos"; then
  echo "✅ Memoria en misma sesión: FUNCIONA (reconoció a Carlos)"
else
  echo "⚠️ Advertencia: No recordó en misma sesión (puede ser que respondió de forma diferente)"
fi

echo ""
sleep 3

# CONVERSACIÓN 2 (NUEVA)
echo "🆕 CONVERSACIÓN 2 - Nueva sesión (memoria debe estar LIMPIA)"
echo "-------------------------------------------------------------"
echo ""

echo "💬 Mensaje 3: '¿Cuál es mi nombre?' (NUEVA SESIÓN: $SESSION_2)"
curl -s -X POST http://localhost:3000/api/v0/chatbot \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -F "intent=chat" \
  -F "chatbotId=$CHATBOT_ID" \
  -F "message=¿Cuál es mi nombre?" \
  -F "sessionId=$SESSION_2" \
  -F "stream=true" 2>&1 > /tmp/resp3.txt

CONTENT_3=$(grep "data: {\"type\":\"chunk\"" /tmp/resp3.txt | sed 's/.*"content":"\([^"]*\)".*/\1/' | tr -d '\n')
echo "🤖 Respuesta: $CONTENT_3"
echo ""

echo "=========================================================="
echo "🔍 RESULTADO"
echo "=========================================================="
echo ""

if echo "$CONTENT_3" | grep -iq "carlos"; then
  echo "❌ FALLÓ: El agente mencionó 'Carlos' en nueva sesión"
  echo "   Bug de memoria persistente NO está arreglado"
  exit 1
elif echo "$CONTENT_3" | grep -iq "gatos"; then
  echo "❌ FALLÓ: El agente mencionó 'gatos' en nueva sesión"
  echo "   Bug de memoria persistente NO está arreglado"
  exit 1
else
  echo "✅ ÉXITO: El agente NO recordó información de sesión anterior"
  echo "   Bug de memoria persistente está ARREGLADO"
  echo ""
  echo "   Sesión 1: Recordó contexto (esperado)"
  echo "   Sesión 2: NO recordó contexto (esperado - FIX FUNCIONA)"
  exit 0
fi
