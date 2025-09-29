#!/bin/bash

# 🔥 AUDITORÍA REAL - USER FLOW COMPLETO
# Simula usuarios reales sin development tokens
# Si esto falla, NO DEPLOYAMOS

API_URL="${API_URL:-http://localhost:3000}"
echo "🔥 AUDITORÍA REAL - USER FLOW END-TO-END"
echo "API: $API_URL"
echo "Fecha: $(date)"
echo "REGLA: Si cualquier test falla, sistema NO APTO para producción"
echo

# Variables críticas
critical_failures=0
total_critical_tests=0

fail_critical() {
    echo "❌ CRITICAL FAILURE: $1"
    ((critical_failures++))
}

test_critical() {
    ((total_critical_tests++))
    echo "🧪 CRITICAL TEST: $1"
}

# ===== TEST 1: BASIC CONNECTIVITY =====
test_critical "Basic API Connectivity"
echo "  Testing /api/v0/chatbot endpoint availability..."

basic_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=test&message=hello" 2>/dev/null)

if [[ "$basic_response" == "000" ]]; then
    fail_critical "API endpoint not responding (connection failed)"
elif [[ "$basic_response" == "503" ]]; then
    fail_critical "Service Unavailable (503) - rate limiter or server error"
elif [[ "$basic_response" == "500" ]]; then
    fail_critical "Internal Server Error (500) - server crash"
else
    echo "  ✅ Endpoint responds with HTTP $basic_response"
fi

# ===== TEST 2: RATE LIMITER FUNCTIONALITY =====
test_critical "Rate Limiter Stability"
echo "  Testing rate limiter doesn't crash system..."

rate_limit_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=test&message=hello" 2>/dev/null)

if echo "$rate_limit_response" | grep -q "keyGenerator"; then
    fail_critical "Rate limiter configuration error (keyGenerator undefined)"
elif echo "$rate_limit_response" | grep -q "Service Unavailable"; then
    fail_critical "Rate limiter causing 503 errors"
else
    echo "  ✅ Rate limiter functioning (no config errors detected)"
fi

# ===== TEST 3: MODEL CONFIGURATION =====
test_critical "AI Model Configuration"
echo "  Testing real chatbot has valid AI model..."

# Simular un chatbot real con ID válido desde la DB
model_test_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=687edb4e7656b411c6a6c628&message=hello" 2>/dev/null)

if echo "$model_test_response" | grep -q "blocked"; then
    fail_critical "Chatbot model set to 'blocked' - no AI responses possible"
elif echo "$model_test_response" | grep -q "model.*invalid\|model.*error"; then
    fail_critical "Invalid AI model configuration"
elif echo "$model_test_response" | grep -q "No authenticated\|401"; then
    echo "  ⚠️  Authentication required (expected for real user flow)"
else
    echo "  ✅ Model configuration appears valid"
fi

# ===== TEST 4: AUTHENTICATION FLOW =====
test_critical "Authentication System"
echo "  Testing auth system doesn't crash..."

auth_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
    -H "Cookie: test=value" \
    -d "intent=chat&chatbotId=687edb4e7656b411c6a6c628&message=hello" 2>/dev/null)

if echo "$auth_response" | grep -q "Cannot read properties of undefined"; then
    fail_critical "Authentication system has undefined property errors"
elif echo "$auth_response" | grep -q "TypeError\|ReferenceError"; then
    fail_critical "JavaScript errors in authentication flow"
else
    echo "  ✅ Auth system stable (no JS errors)"
fi

# ===== TEST 5: DATABASE CONNECTIVITY =====
test_critical "Database Operations"
echo "  Testing DB queries don't crash system..."

db_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=507f1f77bcf86cd799439011&message=hello" 2>/dev/null)

if echo "$db_response" | grep -q "PrismaClientKnownRequestError.*not handled"; then
    fail_critical "Unhandled Prisma errors exposed to users"
elif echo "$db_response" | grep -q "ECONNREFUSED\|connection.*failed"; then
    fail_critical "Database connection failed"
else
    echo "  ✅ DB operations stable (errors handled gracefully)"
fi

# ===== TEST 6: FRONTEND INTEGRATION =====
test_critical "Frontend Integration"
echo "  Testing ChatPreview page loads..."

frontend_response=$(curl -s "$API_URL/dash/chat-preview?id=test" 2>/dev/null | head -100)

if echo "$frontend_response" | grep -q "ChatPreview\|chat.*preview"; then
    echo "  ✅ ChatPreview page loads successfully"
elif [[ ${#frontend_response} -lt 100 ]]; then
    fail_critical "ChatPreview page not loading (empty/minimal response)"
else
    echo "  ⚠️  ChatPreview page loads but content unclear"
fi

# ===== TEST 7: ERROR HANDLING ROBUSTNESS =====
test_critical "Error Handling Quality"
echo "  Testing system handles errors gracefully..."

# Test con múltiples tipos de errores
error_scenarios=(
    "intent=invalid&chatbotId=test&message=hello"
    "intent=chat&chatbotId=&message=hello"
    "intent=chat&chatbotId=test&message="
    "intent=chat&chatbotId=invalid-id-format&message=hello"
)

graceful_errors=0
for scenario in "${error_scenarios[@]}"; do
    error_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" -d "$scenario" 2>/dev/null)

    if echo "$error_response" | grep -q "userMessage\|Por favor\|intenta"; then
        ((graceful_errors++))
    fi
done

if [[ $graceful_errors -ge 3 ]]; then
    echo "  ✅ Error handling graceful ($graceful_errors/4 scenarios)"
else
    fail_critical "Poor error handling ($graceful_errors/4 scenarios handled gracefully)"
fi

# ===== RESULTADO FINAL =====
echo
echo "🏁 RESULTADO FINAL"
echo "=================="
echo "Tests críticos: $total_critical_tests"
echo "Fallas críticas: $critical_failures"

if [[ $critical_failures -eq 0 ]]; then
    echo
    echo "✅ SISTEMA APTO PARA PRODUCCIÓN"
    echo "   Todos los flujos críticos funcionando"
    echo "   ✅ API responde correctamente"
    echo "   ✅ Rate limiter estable"
    echo "   ✅ Modelos AI configurados"
    echo "   ✅ Auth system funcional"
    echo "   ✅ DB operations robustas"
    echo "   ✅ Frontend integración OK"
    echo "   ✅ Error handling graceful"
    echo
    echo "🚀 DEPLOY APROBADO"
    exit 0
else
    echo
    echo "❌ SISTEMA NO APTO PARA PRODUCCIÓN"
    echo "   $critical_failures fallas críticas detectadas"
    echo
    echo "🚨 DEPLOY BLOQUEADO"
    echo "   Arreglar todas las fallas críticas antes de deploy"
    echo
    echo "ACCIONES REQUERIDAS:"

    if curl -s "$API_URL/api/v0/chatbot" -d "test" 2>/dev/null | grep -q "keyGenerator"; then
        echo "  1. ❌ URGENTE: Fix rate limiter configuration"
        echo "     - Error: keyGenerator undefined"
        echo "     - File: server/middleware/rateLimiter.server.ts"
    fi

    if curl -s "$API_URL/api/v0/chatbot" -d "intent=chat&chatbotId=687edb4e7656b411c6a6c628&message=test" 2>/dev/null | grep -q "blocked"; then
        echo "  2. ❌ URGENTE: Fix blocked AI models"
        echo "     - Error: chatbot model set to 'blocked'"
        echo "     - Fix: Update model to valid value (e.g., gpt-5-nano)"
    fi

    echo "  3. ❌ Re-run this audit after fixes:"
    echo "     ./scripts/audit-real-user-flow.sh"

    exit 1
fi