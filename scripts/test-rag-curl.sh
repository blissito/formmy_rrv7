#!/bin/bash

# Test RAG Agéntico con curl usando DEVELOPMENT_TOKEN
# Simula conversación con chatbot real

CHATBOT_ID="68a8bccb2b5f4db764eb931d" # Merlina
API_URL="${API_URL:-http://localhost:3001}"
DEV_TOKEN="${DEVELOPMENT_TOKEN:-FORMMY_DEV_TOKEN_2025}"

echo ""
echo "🧪 TEST RAG AGÉNTICO CON CURL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📌 Chatbot ID: $CHATBOT_ID (Merlina)"
echo "🌐 API URL: $API_URL"
echo "🔑 Dev Token: ${DEV_TOKEN:0:20}..."
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Generar sessionId único
SESSION_ID="test-session-$(date +%s)"

# ESCENARIO 1: Búsqueda Simple
echo "📋 ESCENARIO 1: Búsqueda Simple"
echo "   Query: ¿Cuáles son los horarios de servicio?"
echo "   Esperado: 1 búsqueda en search_context"
echo ""

curl -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: $DEV_TOKEN" \
  -d "intent=chat" \
  -d "chatbotId=$CHATBOT_ID" \
  -d "message=¿Cuáles son los horarios de servicio?" \
  -d "sessionId=$SESSION_ID" \
  -d "stream=false" \
  2>/dev/null | jq -r '.response' | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Esperar un poco
sleep 2

# ESCENARIO 2: Pregunta Comparativa
echo "📋 ESCENARIO 2: Pregunta Comparativa"
echo "   Query: Dame información sobre los servicios y sus precios"
echo "   Esperado: 2 búsquedas (servicios + precios)"
echo ""

curl -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: $DEV_TOKEN" \
  -d "intent=chat" \
  -d "chatbotId=$CHATBOT_ID" \
  -d "message=Dame información sobre los servicios que ofrecen y sus precios" \
  -d "sessionId=$SESSION_ID-2" \
  -d "stream=false" \
  2>/dev/null | jq -r '.response' | head -20

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Esperar un poco
sleep 2

# ESCENARIO 3: Pregunta Multi-tema
echo "📋 ESCENARIO 3: Pregunta Multi-tema"
echo "   Query: Necesito saber qué ofrecen, precios, horarios y contacto"
echo "   Esperado: 3-4 búsquedas (servicios + precios + horarios + contacto)"
echo ""

curl -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: $DEV_TOKEN" \
  -d "intent=chat" \
  -d "chatbotId=$CHATBOT_ID" \
  -d "message=Necesito saber qué servicios ofrecen, cuánto cuestan, cuáles son los horarios y cómo puedo contactarlos" \
  -d "sessionId=$SESSION_ID-3" \
  -d "stream=false" \
  2>/dev/null | jq -r '.response' | head -30

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 ANÁLISIS:"
echo ""
echo "Para comportamiento agéntico CORRECTO esperamos ver:"
echo "  ✅ Múltiples menciones a fuentes/documentos en preguntas complejas"
echo "  ✅ Respuestas específicas basadas en contexto (no genéricas)"
echo "  ✅ Citas como 'Según...', 'De acuerdo a...'"
echo ""
echo "❌ Señales de problema:"
echo "  ❌ Respuestas genéricas sin citar fuentes"
echo "  ❌ Datos inventados en vez de buscar"
echo "  ❌ No usa información de los contextos"
echo ""
echo "📊 Para ver logs detallados de tool calls, revisa la consola del servidor"
echo ""
