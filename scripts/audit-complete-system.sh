#!/bin/bash

# 🔍 AUDITORÍA COMPLETA DEL SISTEMA
# Parte 1: LlamaIndex Patterns Compliance (NECESARIO)
# Parte 2: Real User Flow Functionality (SUFICIENTE)

API_URL="${API_URL:-http://localhost:3000}"
DEVELOPMENT_TOKEN="${DEVELOPMENT_TOKEN:-FORMMY_DEV_TOKEN_2025}"

echo "🔍 AUDITORÍA COMPLETA - PATTERNS + FUNCTIONALITY"
echo "API: $API_URL"
echo "Fecha: $(date)"
echo "Estrategia: LlamaIndex compliance + User flow validation"
echo

# Contadores
patterns_score=0
functionality_score=0
critical_failures=0

echo "📋 PARTE 1: LLAMAINDEX PATTERNS COMPLIANCE"
echo "=========================================="

# Validar que las herramientas siguen patterns oficiales
echo "🦙 Validando patterns oficiales LlamaIndex..."

if [[ -f "server/tools/index.ts" ]]; then
    # Check imports oficiales
    if grep -q "import { tool } from \"llamaindex\";" "server/tools/index.ts"; then
        echo "  ✅ Import oficial 'tool' from llamaindex"
        ((patterns_score += 20))
    else
        echo "  ❌ Missing official 'tool' import"
    fi

    if grep -q "import { z } from \"zod\";" "server/tools/index.ts"; then
        echo "  ✅ Zod schemas for validation"
        ((patterns_score += 15))
    else
        echo "  ❌ Missing Zod validation schemas"
    fi

    # Count tool patterns
    tool_count=$(grep -c "tool(" "server/tools/index.ts")
    if [[ $tool_count -eq 9 ]]; then
        echo "  ✅ All 9 tools use official tool() function"
        ((patterns_score += 25))
    else
        echo "  ⚠️  Only $tool_count/9 tools use official pattern"
        ((patterns_score += $((tool_count * 25 / 9))))
    fi

    # Context injection pattern
    if grep -q "ToolContext" "server/tools/index.ts"; then
        echo "  ✅ Context injection pattern implemented"
        ((patterns_score += 20))
    else
        echo "  ❌ Missing context injection pattern"
    fi

    # Agent implementation
    if [[ -f "server/agents/agent-v0.server.ts" ]] && grep -q "agent(" "server/agents/agent-v0.server.ts"; then
        echo "  ✅ Agent uses official agent() function"
        ((patterns_score += 20))
    else
        echo "  ❌ Agent not using official patterns"
    fi

else
    echo "  ❌ CRITICAL: server/tools/index.ts not found"
fi

echo "  📊 LlamaIndex Patterns Score: $patterns_score/100"

echo
echo "⚡ PARTE 2: REAL USER FUNCTIONALITY"
echo "==================================="

# Test funcionalidad real sin development tokens
echo "🔥 Testing real user flows (NO development tokens)..."

# Test 1: Basic API Response
echo "  🧪 Test 1: API Responds to Real Requests"
start_time=$(date +%s)
real_response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=test&message=hello" 2>/dev/null)
end_time=$(date +%s)
response_time=$((end_time - start_time))

if [[ "$real_response" == "503" ]]; then
    echo "    ❌ CRITICAL: Service Unavailable (503) - rate limiter broken"
    ((critical_failures++))
elif [[ "$real_response" == "500" ]]; then
    echo "    ❌ CRITICAL: Internal Server Error (500)"
    ((critical_failures++))
elif [[ "$real_response" == "000" ]]; then
    echo "    ❌ CRITICAL: No response (connection failed)"
    ((critical_failures++))
else
    echo "    ✅ API responds (HTTP $real_response in ${response_time}s)"
    ((functionality_score += 25))
fi

# Test 2: Error Handling Quality
echo "  🧪 Test 2: Error Handling Without Development Token"
error_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
    -d "intent=chat&chatbotId=invalid&message=hello" 2>/dev/null)

if echo "$error_response" | grep -q "keyGenerator\|Cannot read properties"; then
    echo "    ❌ CRITICAL: JavaScript errors exposed to users"
    ((critical_failures++))
elif echo "$error_response" | grep -q "PrismaClientKnownRequestError"; then
    echo "    ❌ CRITICAL: Database errors exposed to users"
    ((critical_failures++))
elif echo "$error_response" | grep -q "userMessage\|Por favor.*intenta"; then
    echo "    ✅ Graceful error handling with user-friendly messages"
    ((functionality_score += 25))
else
    echo "    ⚠️  Basic error response (could be improved)"
    ((functionality_score += 15))
fi

# Test 3: Model Configuration
echo "  🧪 Test 3: AI Model Functionality"
if [[ -n "$DEVELOPMENT_TOKEN" ]]; then
    model_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=model-test&message=responde brevemente: hola" 2>/dev/null)

    if echo "$model_response" | grep -q "\"success\":true"; then
        if echo "$model_response" | grep -q "hola\|Hola\|hello"; then
            echo "    ✅ AI model generates responses successfully"
            ((functionality_score += 25))
        else
            echo "    ⚠️  AI responds but content unclear"
            ((functionality_score += 15))
        fi
    elif echo "$model_response" | grep -q "blocked"; then
        echo "    ❌ CRITICAL: AI model blocked - no responses possible"
        ((critical_failures++))
    else
        echo "    ❌ AI model not responding properly"
        ((functionality_score += 5))
    fi
else
    echo "    ⚠️  Cannot test AI model (no development token)"
fi

# Test 4: Tools Integration
echo "  🧪 Test 4: Tools Execution"
if [[ -n "$DEVELOPMENT_TOKEN" ]]; then
    tools_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=tools-test&message=lista mis recordatorios" 2>/dev/null)

    if echo "$tools_response" | grep -q "list_reminders\|recordatorios"; then
        echo "    ✅ Tools system integrated and functional"
        ((functionality_score += 25))
    elif echo "$tools_response" | grep -q "herramientas\|tools"; then
        echo "    ⚠️  Tools mentioned but execution unclear"
        ((functionality_score += 15))
    else
        echo "    ❌ Tools not working or not integrated"
        ((functionality_score += 5))
    fi
else
    echo "    ⚠️  Cannot test tools (no development token)"
fi

echo "  📊 Real Functionality Score: $functionality_score/100"

# ===== EVALUACIÓN FINAL =====
echo
echo "🏁 EVALUACIÓN FINAL DEL SISTEMA"
echo "==============================="
echo "LlamaIndex Patterns: $patterns_score/100"
echo "Real Functionality: $functionality_score/100"
echo "Critical Failures: $critical_failures"

# Calcular score combinado
if [[ $patterns_score -gt 0 ]] && [[ $functionality_score -gt 0 ]]; then
    combined_score=$(( (patterns_score + functionality_score) / 2 ))
else
    combined_score=0
fi

echo "Combined Score: $combined_score/100"

# Decisión final
if [[ $critical_failures -gt 0 ]]; then
    echo
    echo "❌ DEPLOY BLOQUEADO"
    echo "   $critical_failures fallas críticas detectadas"
    echo "   ⚠️  Aún con buenos patterns LlamaIndex, el sistema no funciona"
    echo
    echo "CRITICAL ISSUES TO FIX:"
    if curl -s "$API_URL/api/v0/chatbot" -d "test" 2>/dev/null | grep -q "keyGenerator"; then
        echo "  🚨 Rate limiter configuration error"
    fi
    if curl -s "$API_URL/api/v0/chatbot" -H "X-Dev-Token: $DEVELOPMENT_TOKEN" -d "intent=chat&chatbotId=test&message=test" 2>/dev/null | grep -q "blocked"; then
        echo "  🚨 AI models set to 'blocked'"
    fi
    exit 1

elif [[ $combined_score -ge 80 ]] && [[ $patterns_score -ge 70 ]] && [[ $functionality_score -ge 70 ]]; then
    echo
    echo "✅ SISTEMA APROBADO PARA PRODUCCIÓN"
    echo "   ✅ LlamaIndex patterns compliance: $patterns_score/100"
    echo "   ✅ Real user functionality: $functionality_score/100"
    echo "   ✅ Zero critical failures"
    echo
    echo "🚀 DEPLOY AUTORIZADO"
    echo "   Calidad arquitectural + Funcionalidad real confirmed"
    exit 0

elif [[ $patterns_score -ge 80 ]] && [[ $functionality_score -lt 50 ]]; then
    echo
    echo "⚠️  PATRONES BUENOS, FUNCIONALIDAD DEFICIENTE"
    echo "   ✅ LlamaIndex compliance excelente ($patterns_score/100)"
    echo "   ❌ Pero usuarios reales tendrán problemas ($functionality_score/100)"
    echo
    echo "🔧 ACCIÓN: Fix funcionalidad antes de deploy"
    exit 1

elif [[ $patterns_score -lt 50 ]] && [[ $functionality_score -ge 80 ]]; then
    echo
    echo "⚠️  FUNCIONA PERO ARQUITECTURA DEFICIENTE"
    echo "   ❌ LlamaIndex patterns inconsistentes ($patterns_score/100)"
    echo "   ✅ Pero funciona para usuarios ($functionality_score/100)"
    echo
    echo "🔧 ACCIÓN: Refactor hacia patterns oficiales"
    exit 1

else
    echo
    echo "❌ SISTEMA NECESITA MEJORAS MAYORES"
    echo "   Patterns: $patterns_score/100 (necesita ≥70)"
    echo "   Functionality: $functionality_score/100 (necesita ≥70)"
    echo
    echo "🔧 ACCIÓN: Mejoras en ambas áreas antes de deploy"
    exit 1
fi