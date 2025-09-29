#!/bin/bash

# 🔍 Auditoría Avanzada de Calidad de Herramientas
# Mide confiabilidad, robustez, y performance de tools

API_URL="${API_URL:-http://localhost:3000}"
DEVELOPMENT_TOKEN="${DEVELOPMENT_TOKEN:-FORMMY_DEV_TOKEN_2025}"

echo "🔍 AUDITORÍA AVANZADA - CALIDAD DE HERRAMIENTAS"
echo "API: $API_URL"
echo "Fecha: $(date)"
echo

# ===== CONFIGURACIÓN DE TESTS =====

# Tests de calidad por herramienta
declare -A QUALITY_TESTS=(
    ["schedule_reminder"]="input_validation error_handling description_clarity"
    ["list_reminders"]="db_resilience error_handling performance"
    ["update_reminder"]="input_validation db_resilience error_handling"
    ["cancel_reminder"]="input_validation db_resilience error_handling"
    ["delete_reminder"]="input_validation db_resilience error_handling"
    ["create_payment_link"]="input_validation error_handling integration_dependency"
    ["save_contact_info"]="input_validation flexible_params error_handling"
    ["query_chatbots"]="db_resilience performance error_handling complex_queries"
    ["get_chatbot_stats"]="db_resilience performance error_handling analytics_accuracy"
)

# Métricas de calidad
declare -A QUALITY_SCORES=()
declare -A ERROR_PATTERNS=()
declare -A PERFORMANCE_METRICS=()

# ===== FUNCIONES DE TESTING =====

test_input_validation() {
    local tool_name="$1"
    echo "    🧪 Testing Input Validation..."

    # Test 1: Parámetros faltantes
    missing_params_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=audit-$tool_name&message=usa $tool_name sin parámetros" 2>/dev/null)

    # Test 2: Parámetros inválidos
    invalid_params_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=audit-$tool_name&message=usa $tool_name con fecha 'invalid-date'" 2>/dev/null)

    # Análisis de respuestas
    local validation_score=0

    if echo "$missing_params_response" | grep -q "requerido\|necesario\|falta"; then
        ((validation_score += 30))
    fi

    if echo "$invalid_params_response" | grep -q "inválido\|formato\|error"; then
        ((validation_score += 30))
    fi

    # Bonus: Respuesta constructiva (sugiere formato correcto)
    if echo "$invalid_params_response" | grep -q "ejemplo\|formato.*YYYY\|YYYY-MM-DD"; then
        ((validation_score += 40))
    fi

    echo "      📊 Input Validation Score: $validation_score/100"
    QUALITY_SCORES["${tool_name}_input_validation"]=$validation_score
}

test_error_handling() {
    local tool_name="$1"
    echo "    🛡️ Testing Error Handling..."

    # Test con ObjectId inválido (caso común que falla)
    local start_time=$(date +%s%N)
    error_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=invalid-objectid-123&message=usa $tool_name" 2>/dev/null)
    local end_time=$(date +%s%N)

    local response_time=$(( (end_time - start_time) / 1000000 )) # ms

    local error_score=0

    # ❌ Respuestas que indican falla grave
    if echo "$error_response" | grep -q "PrismaClientKnownRequestError\|ObjectID\|malformed"; then
        error_score=0  # Falla crítica
        ERROR_PATTERNS["${tool_name}"]="DATABASE_ERROR_EXPOSED"
    # ⚠️ Respuestas que indican manejo parcial
    elif echo "$error_response" | grep -q "error interno\|fallo\|problema"; then
        error_score=50  # Error manejado pero no optimal
        ERROR_PATTERNS["${tool_name}"]="GENERIC_ERROR_HANDLED"
    # ✅ Respuestas que indican manejo robusto
    elif echo "$error_response" | grep -q "no disponible\|intenta.*nuevo\|reintentar"; then
        error_score=80  # Buen manejo con recovery suggestions
        ERROR_PATTERNS["${tool_name}"]="GRACEFUL_ERROR_HANDLING"
    # 🎯 Respuestas que indican manejo excelente
    elif echo "$error_response" | grep -q "alternativa\|puedo hacer\|mientras tanto"; then
        error_score=100  # Manejo excepcional con alternativas
        ERROR_PATTERNS["${tool_name}"]="EXCEPTIONAL_ERROR_HANDLING"
    else
        error_score=25  # Respuesta genérica
        ERROR_PATTERNS["${tool_name}"]="BASIC_RESPONSE"
    fi

    # Penalización por timeout o respuesta muy lenta (>5s)
    if [[ $response_time -gt 5000 ]]; then
        ((error_score -= 20))
        ERROR_PATTERNS["${tool_name}"]+="_SLOW_RESPONSE"
    fi

    echo "      📊 Error Handling Score: $error_score/100"
    echo "      ⏱️ Response Time: ${response_time}ms"
    QUALITY_SCORES["${tool_name}_error_handling"]=$error_score
    PERFORMANCE_METRICS["${tool_name}_response_time"]=$response_time
}

test_description_clarity() {
    local tool_name="$1"
    echo "    📝 Testing Description Clarity..."

    # Leer la descripción desde el código fuente
    local description=$(grep -A 5 "name: \"$tool_name\"" server/tools/index.ts | grep "description:" | sed 's/.*description: "//' | sed 's/".*//')

    local clarity_score=0
    local description_length=${#description}

    # Longitud óptima (30-100 caracteres)
    if [[ $description_length -gt 30 ]] && [[ $description_length -lt 100 ]]; then
        ((clarity_score += 25))
    fi

    # Contiene verbo de acción
    if echo "$description" | grep -qE "(crear|listar|consultar|obtener|generar|guardar|programar|cancelar|actualizar|eliminar)"; then
        ((clarity_score += 25))
    fi

    # Especifica el objeto/resultado
    if echo "$description" | grep -qE "(recordatorio|chatbot|contacto|estadística|pago|link)"; then
        ((clarity_score += 25))
    fi

    # Contexto/beneficio claro
    if echo "$description" | grep -qE "(del usuario|en el sistema|con filtros|detalladas|automático)"; then
        ((clarity_score += 25))
    fi

    echo "      📊 Description Clarity Score: $clarity_score/100"
    echo "      📝 Description: \"$description\""
    QUALITY_SCORES["${tool_name}_description_clarity"]=$clarity_score
}

test_db_resilience() {
    local tool_name="$1"
    echo "    🗄️ Testing Database Resilience..."

    # Test múltiples escenarios de DB que pueden fallar
    local resilience_score=0

    # Test 1: ObjectId inválido
    invalid_objectid_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=invalid-123&message=usa $tool_name" 2>/dev/null)

    # Test 2: ObjectId válido pero inexistente
    nonexistent_objectid_response=$(curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=507f1f77bcf86cd799439011&message=usa $tool_name" 2>/dev/null)

    # Análisis de resilience
    # ❌ Si expone errores de Prisma/MongoDB
    if echo "$invalid_objectid_response" | grep -q "PrismaClientKnownRequestError\|ObjectID"; then
        resilience_score=0
    # ⚠️ Si maneja el error pero sin context específico
    elif echo "$invalid_objectid_response" | grep -q "error\|fallo"; then
        resilience_score=40
    # ✅ Si maneja gracefully con mensaje útil
    elif echo "$invalid_objectid_response" | grep -q "no disponible\|no encontrado"; then
        resilience_score=70
    # 🎯 Si ofrece alternativas o recovery
    elif echo "$invalid_objectid_response" | grep -q "intenta\|reintentar\|alternativa"; then
        resilience_score=100
    fi

    echo "      📊 DB Resilience Score: $resilience_score/100"
    QUALITY_SCORES["${tool_name}_db_resilience"]=$resilience_score
}

# ===== EJECUCIÓN DE AUDITORÍA AVANZADA =====

echo "🏁 INICIANDO TESTS DE CALIDAD POR HERRAMIENTA"
echo "============================================="

total_tools=0
total_quality_score=0

for tool_name in "${!QUALITY_TESTS[@]}"; do
    echo
    echo "🔧 TESTING TOOL: $tool_name"
    echo "  Tests configurados: ${QUALITY_TESTS[$tool_name]}"

    tool_quality_score=0
    test_count=0

    # Ejecutar tests según configuración
    for test_type in ${QUALITY_TESTS[$tool_name]}; do
        case $test_type in
            "input_validation")
                test_input_validation "$tool_name"
                ((tool_quality_score += QUALITY_SCORES["${tool_name}_input_validation"]))
                ((test_count++))
                ;;
            "error_handling")
                test_error_handling "$tool_name"
                ((tool_quality_score += QUALITY_SCORES["${tool_name}_error_handling"]))
                ((test_count++))
                ;;
            "description_clarity")
                test_description_clarity "$tool_name"
                ((tool_quality_score += QUALITY_SCORES["${tool_name}_description_clarity"]))
                ((test_count++))
                ;;
            "db_resilience")
                test_db_resilience "$tool_name"
                ((tool_quality_score += QUALITY_SCORES["${tool_name}_db_resilience"]))
                ((test_count++))
                ;;
        esac
    done

    # Promedio de calidad para esta tool
    if [[ $test_count -gt 0 ]]; then
        local avg_score=$((tool_quality_score / test_count))
        echo "  🎯 SCORE PROMEDIO: $avg_score/100"

        # Clasificación de calidad
        if [[ $avg_score -ge 80 ]]; then
            echo "  ✅ CALIDAD: EXCELENTE"
        elif [[ $avg_score -ge 60 ]]; then
            echo "  ⚠️  CALIDAD: BUENA (needs improvement)"
        elif [[ $avg_score -ge 40 ]]; then
            echo "  🔶 CALIDAD: REGULAR (requires attention)"
        else
            echo "  ❌ CALIDAD: CRÍTICA (urgent fixes needed)"
        fi

        ((total_quality_score += avg_score))
        ((total_tools++))
    fi
done

# ===== ANÁLISIS AGREGADO =====

echo
echo "📊 ANÁLISIS AGREGADO DE CALIDAD"
echo "================================"

if [[ $total_tools -gt 0 ]]; then
    overall_quality=$((total_quality_score / total_tools))
    echo "🎯 SCORE GLOBAL: $overall_quality/100"
    echo

    # Herramientas por categoría de calidad
    excellent_tools=0
    good_tools=0
    regular_tools=0
    critical_tools=0

    for tool_name in "${!QUALITY_TESTS[@]}"; do
        # Calcular score promedio de la tool
        tool_total=0
        tool_tests=0

        for metric in input_validation error_handling description_clarity db_resilience; do
            if [[ -n "${QUALITY_SCORES["${tool_name}_${metric}"]}" ]]; then
                ((tool_total += QUALITY_SCORES["${tool_name}_${metric}"]))
                ((tool_tests++))
            fi
        done

        if [[ $tool_tests -gt 0 ]]; then
            tool_avg=$((tool_total / tool_tests))

            if [[ $tool_avg -ge 80 ]]; then
                ((excellent_tools++))
            elif [[ $tool_avg -ge 60 ]]; then
                ((good_tools++))
            elif [[ $tool_avg -ge 40 ]]; then
                ((regular_tools++))
            else
                ((critical_tools++))
            fi
        fi
    done

    echo "📈 DISTRIBUCIÓN DE CALIDAD:"
    echo "  ✅ Excelentes: $excellent_tools tools"
    echo "  ⚠️  Buenas: $good_tools tools"
    echo "  🔶 Regulares: $regular_tools tools"
    echo "  ❌ Críticas: $critical_tools tools"
fi

echo
echo "🔧 PATRONES DE ERROR DETECTADOS:"
for tool in "${!ERROR_PATTERNS[@]}"; do
    echo "  $tool: ${ERROR_PATTERNS[$tool]}"
done

echo
echo "⏱️  PERFORMANCE METRICS:"
for tool in "${!PERFORMANCE_METRICS[@]}"; do
    response_time="${PERFORMANCE_METRICS[$tool]}"
    if [[ $response_time -gt 3000 ]]; then
        echo "  ⚠️  $tool: ${response_time}ms (SLOW)"
    elif [[ $response_time -gt 1000 ]]; then
        echo "  🔶 $tool: ${response_time}ms (MODERATE)"
    else
        echo "  ✅ $tool: ${response_time}ms (FAST)"
    fi
done

# ===== RECOMENDACIONES ESPECÍFICAS =====

echo
echo "💡 RECOMENDACIONES DE MEJORA:"
echo "============================="

if [[ $critical_tools -gt 0 ]]; then
    echo "🚨 PRIORIDAD CRÍTICA:"
    echo "  - Implementar input validation robusta en tools críticas"
    echo "  - Agregar ObjectId validation antes de queries DB"
    echo "  - Implementar error handling específico para PrismaErrors"
    echo "  - Agregar fallback responses cuando DB falla"
fi

if [[ $regular_tools -gt 0 ]]; then
    echo "⚠️  MEJORAS RECOMENDADAS:"
    echo "  - Mejorar mensajes de error con contexto específico"
    echo "  - Agregar suggestions/alternatives en error responses"
    echo "  - Optimizar queries DB para mejor performance"
    echo "  - Clarificar descriptions con verbs + objects + context"
fi

echo "🎯 MEJORES PRÁCTICAS PARA TOOLS DE CALIDAD:"
echo "  1. Validate inputs BEFORE DB queries"
echo "  2. Handle PrismaErrors specifically with user-friendly messages"
echo "  3. Offer alternatives/recovery options in error responses"
echo "  4. Use clear, actionable descriptions"
echo "  5. Test with invalid ObjectIds and empty datasets"

# ===== CONCLUSIÓN =====

echo
echo "📋 RESUMEN EJECUTIVO:"
echo "===================="

if [[ $overall_quality -ge 70 ]]; then
    echo "✅ Sistema de herramientas con calidad ACEPTABLE"
    echo "   Continue mejorando tools específicas identificadas"
elif [[ $overall_quality -ge 50 ]]; then
    echo "⚠️  Sistema de herramientas NECESITA MEJORAS"
    echo "   Focus en error handling y input validation"
else
    echo "❌ Sistema de herramientas REQUIERE ATENCIÓN URGENTE"
    echo "   Revisar todas las tools críticas identificadas"
fi

echo "   Score Global: $overall_quality/100"
echo "   Tools Críticas: $critical_tools/$total_tools"
echo
echo "Para resolver problemas específicos:"
echo "  ./scripts/fix-tool-quality.sh [tool_name]"