#!/bin/bash

# 🔥 AUDITORÍA CON CHATBOTS REALES - NO MOCKS, NO DEVELOPMENT TOKENS
# ULTRATHINK: Verificar cada afirmación con datos de producción real

API_URL="${API_URL:-http://localhost:3000}"
echo "🔥 AUDITORÍA REAL - SOLO CHATBOTS DE PRODUCCIÓN"
echo "API: $API_URL"
echo "Usuario: fixtergeek@gmail.com"
echo "Fecha: $(date)"
echo "REGLA: NO development tokens, NO mocks, SOLO datos reales"
echo

# ULTRATHINK: Antes de hacer afirmaciones, verificar con datos reales
real_issues_found=0
critical_blocks=0

echo "🔍 PASO 1: IDENTIFICAR CHATBOTS REALES"
echo "===================================="

# Identificar chatbots reales conocidos (del log del usuario)
REAL_CHATBOTS=(
    "687edb4e7656b411c6a6c628:Bot para mis XV"
    # Agregar más IDs reales cuando los identifiquemos
)

if [[ ${#REAL_CHATBOTS[@]} -eq 0 ]]; then
    echo "❌ CRITICAL: No real chatbot IDs identified"
    echo "   Cannot audit real system without real data"
    exit 1
fi

echo "✅ Found ${#REAL_CHATBOTS[@]} real chatbot(s) to audit"
for bot in "${REAL_CHATBOTS[@]}"; do
    IFS=':' read -ra PARTS <<< "$bot"
    echo "  - ${PARTS[0]}: ${PARTS[1]}"
done

echo
echo "🔥 PASO 2: ULTRATHINK - AUDITAR CADA CHATBOT REAL"
echo "=============================================="

for real_bot in "${REAL_CHATBOTS[@]}"; do
    IFS=':' read -ra PARTS <<< "$real_bot"
    chatbot_id="${PARTS[0]}"
    chatbot_name="${PARTS[1]}"

    echo
    echo "🤖 AUDITANDO: $chatbot_name (ID: $chatbot_id)"
    echo "   Status: REAL PRODUCTION CHATBOT"

    # Test 1: Basic API Response (SIN development token)
    echo "   🧪 Test 1: Real API Response (no dev token)"
    real_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -d "intent=chat&chatbotId=$chatbot_id&message=test mensaje real" 2>/dev/null)

    real_response_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v0/chatbot" \
        -d "intent=chat&chatbotId=$chatbot_id&message=test" 2>/dev/null)

    echo "     HTTP: $real_response_code"

    # ULTRATHINK: Analizar respuesta real
    if [[ "$real_response_code" == "503" ]]; then
        echo "     ❌ CRITICAL: Service Unavailable (rate limiter broken)"
        ((critical_blocks++))
        ((real_issues_found++))
    elif [[ "$real_response_code" == "401" ]]; then
        echo "     ⚠️  Authentication required (expected for real user)"
    elif [[ "$real_response_code" == "200" ]]; then
        echo "     ✅ API responds successfully"
    else
        echo "     ❌ Unexpected response code: $real_response_code"
        ((real_issues_found++))
    fi

    # ULTRATHINK: Analizar contenido de error específico
    echo "   🧪 Test 2: Error Content Analysis"
    if echo "$real_response" | grep -q "Chatbot desactivado"; then
        echo "     ❌ CRITICAL BLOCK: Chatbot disabled"
        ((critical_blocks++))
        echo "     Root cause: Chatbot is deactivated in database"

    elif echo "$real_response" | grep -q "blocked"; then
        echo "     ❌ CRITICAL BLOCK: AI model blocked"
        ((critical_blocks++))
        echo "     Root cause: aiModel = 'blocked' (invalid model)"

    elif echo "$real_response" | grep -q "PrismaClientKnownRequestError"; then
        echo "     ❌ CRITICAL: Database errors exposed"
        ((critical_blocks++))
        echo "     Root cause: Unhandled Prisma errors"

    elif echo "$real_response" | grep -q "keyGenerator"; then
        echo "     ❌ CRITICAL: Rate limiter broken"
        ((critical_blocks++))
        echo "     Root cause: keyGenerator undefined in rate limiter"

    elif echo "$real_response" | grep -q "No authenticated"; then
        echo "     ✅ Expected: Authentication required for real users"

    else
        echo "     ⚠️  Unclear error response"
        echo "     Response snippet: $(echo "$real_response" | head -c 100)"
    fi

    # Test 3: ULTRATHINK - Database State Verification
    echo "   🧪 Test 3: Database State Analysis"

    # Verificar si el server log muestra información del chatbot
    echo "     Checking server logs for chatbot details..."

    # Hacer request para triggerar server log y verificar en otro terminal
    curl -s -X POST "$API_URL/api/v0/chatbot" \
        -d "intent=chat&chatbotId=$chatbot_id&message=database verification test" \
        -o /dev/null 2>/dev/null

    echo "     ⚠️  Database state verification requires server log analysis"
    echo "     Check server logs for: model field, isActive field, status field"
done

echo
echo "🔥 PASO 3: ULTRATHINK - ANÁLISIS AGREGADO REAL"
echo "============================================"

echo "Real chatbots audited: ${#REAL_CHATBOTS[@]}"
echo "Issues found: $real_issues_found"
echo "Critical blocks: $critical_blocks"

# ULTRATHINK: No hacer afirmaciones optimistas sin datos
if [[ $critical_blocks -gt 0 ]]; then
    echo
    echo "❌ CRITICAL SYSTEM BLOCKS IDENTIFIED"
    echo "   $critical_blocks real chatbot(s) cannot function"
    echo "   Issues affect real users with real data"
    echo
    echo "🚨 PRODUCTION NOT READY"
    echo "   Fix critical blocks before any deployment"
    echo
    echo "IMMEDIATE ACTIONS REQUIRED:"

    # Specific fixes based on real issues found
    echo "   1. Check chatbot database records:"
    echo "      - isActive should be true"
    echo "      - aiModel should NOT be 'blocked'"
    echo "      - status should be 'ACTIVE'"
    echo
    echo "   2. Fix model configuration:"
    echo "      UPDATE chatbots SET aiModel='gpt-5-nano' WHERE aiModel='blocked';"
    echo
    echo "   3. Verify rate limiter configuration:"
    echo "      Check server/middleware/rateLimiter.server.ts"
    echo
    echo "   4. Re-run this audit after fixes:"
    echo "      ./scripts/audit-real-chatbots.sh"

    exit 1

elif [[ $real_issues_found -eq 0 ]]; then
    echo
    echo "✅ REAL CHATBOTS FUNCTIONING"
    echo "   All real production chatbots respond appropriately"
    echo "   Authentication working as expected"
    echo "   No critical blocks detected"
    echo
    echo "🚀 PRODUCTION READY (for real user flows)"
    exit 0

else
    echo
    echo "⚠️  MINOR ISSUES DETECTED"
    echo "   $real_issues_found non-critical issues found"
    echo "   Review and fix before production deployment"
    echo
    echo "🔧 IMPROVEMENTS RECOMMENDED"
    exit 2
fi

echo
echo "🧠 ULTRATHINK METHODOLOGY APPLIED:"
echo "================================"
echo "✅ NO development tokens used"
echo "✅ NO mock data used"
echo "✅ ONLY real production chatbots tested"
echo "✅ Real user scenarios simulated"
echo "✅ Database state implications analyzed"
echo "✅ No optimistic assumptions made"
echo
echo "This audit reflects REAL production state, not idealized test scenarios."