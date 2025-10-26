#!/bin/bash

API_KEY="sk_live_ZY2gfHB4C-xY-71m-AGTstR589mIgkBT"
CHATBOT_ID="68f456dca443330f35f8c81d"
BASE_URL="https://formmy-v2.fly.dev"

echo "🧪 Testing RAG API Endpoints"
echo ""

# Test 1: List contexts
echo "1️⃣ Testing GET /api/v1/rag?intent=list"
RESPONSE=$(curl -s "${BASE_URL}/api/v1/rag?intent=list" \
  -H "Authorization: Bearer ${API_KEY}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

# Test 2: Query RAG
echo "2️⃣ Testing POST /api/v1/rag?intent=query"
RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/rag?intent=query" \
  -H "Authorization: Bearer ${API_KEY}" \
  -H "Content-Type: application/json" \
  -d "{\"query\":\"¿Qué información tienes?\",\"chatbotId\":\"${CHATBOT_ID}\"}")

echo "Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"
echo ""

echo "✅ Tests completed"
