#!/bin/bash

# Test simple para verificar si usa search_context
# Por defecto usa LOCALHOST, pero puedes pasar API_URL como variable de entorno

API_URL="${API_URL:-http://localhost:3000}"

echo "🧪 Testing RAG en: $API_URL"
echo ""

echo "Test 1: Pregunta sobre precios"
curl -s -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -d "intent=chat" \
  -d "chatbotId=68a8bccb2b5f4db764eb931d" \
  -d "message=cuanto cuesta" \
  -d "sessionId=test-1-$(date +%s)" \
  -d "stream=false" > /tmp/response1.txt

echo ""
echo "Metadata:"
grep "metadata" /tmp/response1.txt | tail -1
echo ""
echo "Tools ejecutadas:"
grep -o '"toolsExecuted":[0-9]*' /tmp/response1.txt | tail -1
grep -o '"toolsUsed":\[[^]]*\]' /tmp/response1.txt | tail -1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 3

echo "Test 2: Pregunta sobre horarios"
curl -s -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -d "intent=chat" \
  -d "chatbotId=68a8bccb2b5f4db764eb931d" \
  -d "message=que horarios tienen" \
  -d "sessionId=test-2-$(date +%s)" \
  -d "stream=false" > /tmp/response2.txt

echo "Metadata:"
grep "metadata" /tmp/response2.txt | tail -1
echo ""
echo "Tools ejecutadas:"
grep -o '"toolsExecuted":[0-9]*' /tmp/response2.txt | tail -1
grep -o '"toolsUsed":\[[^]]*\]' /tmp/response2.txt | tail -1
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

sleep 3

echo "Test 3: Pregunta compleja multi-tema"
curl -s -X POST "$API_URL/api/v0/chatbot" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -H "x-dev-token: FORMMY_DEV_TOKEN_2025" \
  -d "intent=chat" \
  -d "chatbotId=68a8bccb2b5f4db764eb931d" \
  -d "message=dame informacion de servicios precios y horarios" \
  -d "sessionId=test-3-$(date +%s)" \
  -d "stream=false" > /tmp/response3.txt

echo "Metadata:"
grep "metadata" /tmp/response3.txt | tail -1
echo ""
echo "Tools ejecutadas:"
grep -o '"toolsExecuted":[0-9]*' /tmp/response3.txt | tail -1
grep -o '"toolsUsed":\[[^]]*\]' /tmp/response3.txt | tail -1
echo ""

echo ""
echo "ANÁLISIS:"
echo "Si toolsExecuted es 0 en todos, el agente NO está usando search_context"
echo "Deberíamos ver toolsUsed con search_context para preguntas específicas"
echo ""
