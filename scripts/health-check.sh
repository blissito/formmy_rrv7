#!/bin/bash

echo "🏥 Health Check - Formmy Production"
echo "===================================="
echo ""

# 1. Check if server responds
echo "1. Verificando servidor..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://formmy.app)
if [ "$STATUS" = "200" ]; then
  echo "   ✅ Servidor responde (HTTP $STATUS)"
else
  echo "   ❌ Servidor no responde (HTTP $STATUS)"
fi

echo ""

# 2. Check API health
echo "2. Verificando API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://formmy.app/api/v1/health 2>/dev/null)
if [ "$API_STATUS" = "200" ]; then
  echo "   ✅ API funciona (HTTP $API_STATUS)"
elif [ "$API_STATUS" = "404" ]; then
  echo "   ⚠️  API responde pero no hay endpoint /health (HTTP $API_STATUS)"
  echo "   (Esto es OK si no existe el endpoint)"
else
  echo "   ❌ API no responde (HTTP $API_STATUS)"
fi

echo ""

# 3. Check Fly.io machine status
echo "3. Verificando estado de máquina Fly.io..."
fly status --app formmy-v2 2>&1 | grep -E "Machines|ID|started"

echo ""
echo "===================================="
echo "✅ Health check completo"
