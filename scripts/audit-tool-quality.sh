#!/bin/bash

# 🔍 Auditoría de Calidad de Herramientas - Enfoque en Confiabilidad
# Detecta herramientas que fallan frecuentemente y por qué

API_URL="${API_URL:-http://localhost:3000}"
DEVELOPMENT_TOKEN="${DEVELOPMENT_TOKEN:-FORMMY_DEV_TOKEN_2025}"

echo "🔍 AUDITORÍA DE CALIDAD - HERRAMIENTAS CONFIABLES"
echo "API: $API_URL"
echo "Fecha: $(date)"
echo

# Lista de herramientas a auditar
TOOLS=(
    "schedule_reminder"
    "list_reminders"
    "update_reminder"
    "cancel_reminder"
    "delete_reminder"
    "create_payment_link"
    "save_contact_info"
    "query_chatbots"
    "get_chatbot_stats"
)

# Contadores
total_tests=0
failed_tests=0
db_error_count=0
timeout_count=0
success_count=0

echo "🧪 TESTING HERRAMIENTAS INDIVIDUALMENTE"
echo "======================================"

for tool in "${TOOLS[@]}"; do
    echo
    echo "🔧 Testing: $tool"

    # Test 1: Uso básico de la herramienta
    echo "  📝 Test básico..."
    start_time=$(date +%s)

    response=$(timeout 10s curl -s -X POST "$API_URL/api/v0/chatbot" \
        -H "X-Dev-Token: $DEVELOPMENT_TOKEN" \
        -d "intent=chat&chatbotId=audit-test&message=usa $tool para hacer un test básico" 2>/dev/null)

    end_time=$(date +%s)
    response_time=$((end_time - start_time))

    ((total_tests++))

    # Análisis de la respuesta
    tool_status="🟢 OK"
    issues=""

    # Detectar errores críticos
    if echo "$response" | grep -q "PrismaClientKnownRequestError"; then
        tool_status="🔴 DB_ERROR"
        issues="$issues DATABASE_ERROR_EXPOSED "
        ((db_error_count++))
        ((failed_tests++))
    elif echo "$response" | grep -q "ObjectID\|malformed"; then
        tool_status="🔴 OBJECTID_ERROR"
        issues="$issues INVALID_OBJECTID_HANDLING "
        ((failed_tests++))
    elif echo "$response" | grep -q "timeout\|Connection reset"; then
        tool_status="🟡 TIMEOUT"
        issues="$issues TIMEOUT_ISSUE "
        ((timeout_count++))
    elif [[ $response_time -gt 5 ]]; then
        tool_status="🟡 SLOW"
        issues="$issues SLOW_RESPONSE "
    elif echo "$response" | grep -q "error interno\|fallo interno"; then
        tool_status="🟡 INTERNAL_ERROR"
        issues="$issues GENERIC_ERROR "
    elif echo "$response" | grep -q "éxito\|completado\|creado\|encontr"; then
        tool_status="🟢 SUCCESS"
        ((success_count++))
    elif echo "$response" | grep -q "no disponible\|intenta.*nuevo\|reintentar"; then
        tool_status="🟢 GRACEFUL_ERROR"
        ((success_count++))
    else
        tool_status="🟡 UNKNOWN"
    fi

    echo "    Status: $tool_status (${response_time}s)"
    if [[ -n "$issues" ]]; then
        echo "    Issues: $issues"
    fi

    # Mostrar snippet de respuesta para debug
    if [[ "$tool_status" =~ ^🔴 ]]; then
        echo "    Response snippet:"
        echo "$response" | head -c 150 | tr '\n' ' ' | sed 's/  */ /g'
        echo "..."
    fi
done

echo
echo "📊 RESULTADOS AGREGADOS"
echo "====================="
echo "Total tests: $total_tests"
echo "✅ Exitosos/Manejados: $success_count ($((success_count * 100 / total_tests))%)"
echo "❌ Fallaron: $failed_tests ($((failed_tests * 100 / total_tests))%)"
echo "🔥 Errores DB expuestos: $db_error_count"
echo "⏱️  Timeouts: $timeout_count"

# ===== ANÁLISIS DE CÓDIGO FUENTE =====

echo
echo "📋 ANÁLISIS DE CÓDIGO FUENTE - VALIDATION PATTERNS"
echo "=================================================="

# Revisar patrones de validación en handlers
echo "🔍 Checking ObjectId Validation in Handlers:"

validation_issues=0
for handler_file in server/tools/handlers/*.ts; do
    if [[ -f "$handler_file" ]]; then
        handler_name=$(basename "$handler_file" .ts)

        # Check for ObjectId validation
        if grep -q "chatbotId.*ObjectId\|isValidObjectId\|ObjectId.*chatbotId" "$handler_file"; then
            echo "  ✅ $handler_name: ObjectId validation found"
        else
            echo "  ❌ $handler_name: Missing ObjectId validation"
            ((validation_issues++))
        fi

        # Check for specific Prisma error handling
        if grep -q "PrismaClientKnownRequestError\|catch.*Prisma" "$handler_file"; then
            echo "  ✅ $handler_name: Specific Prisma error handling"
        else
            echo "  ❌ $handler_name: Generic error handling only"
            ((validation_issues++))
        fi
    fi
done

echo
echo "📝 DESCRIPTION QUALITY CHECK:"
echo "============================"

description_issues=0
for tool in "${TOOLS[@]}"; do
    description=$(grep -A 2 "name: \"$tool\"" server/tools/index.ts | grep "description:" | sed 's/.*description: "//' | sed 's/".*//')

    if [[ -n "$description" ]]; then
        desc_length=${#description}

        echo "📝 $tool:"
        echo "    \"$description\""

        # Análisis de calidad de descripción
        issues=""

        if [[ $desc_length -lt 20 ]]; then
            issues="$issues TOO_SHORT "
        fi

        if [[ $desc_length -gt 100 ]]; then
            issues="$issues TOO_LONG "
        fi

        if ! echo "$description" | grep -qE "(crear|listar|consultar|obtener|generar|guardar|programar|cancelar|actualizar|eliminar)"; then
            issues="$issues NO_ACTION_VERB "
        fi

        if [[ -n "$issues" ]]; then
            echo "    ⚠️  Issues: $issues"
            ((description_issues++))
        else
            echo "    ✅ Good description"
        fi
    else
        echo "❌ $tool: Missing description"
        ((description_issues++))
    fi
done

# ===== RECOMENDACIONES ESPECÍFICAS =====

echo
echo "💡 RECOMENDACIONES ESPECÍFICAS"
echo "============================"

if [[ $db_error_count -gt 0 ]]; then
    echo "🚨 CRÍTICO - Database Errors Expuestos ($db_error_count tools):"
    echo "  1. Agregar ObjectId validation ANTES de DB queries:"
    echo "     if (!ObjectId.isValid(chatbotId)) {"
    echo "       return { success: false, message: 'ID inválido' };"
    echo "     }"
    echo
    echo "  2. Manejar PrismaClientKnownRequestError específicamente:"
    echo "     catch (error) {"
    echo "       if (error instanceof PrismaClientKnownRequestError) {"
    echo "         return { success: false, message: 'Datos no disponibles ahora' };"
    echo "       }"
    echo "     }"
    echo
fi

if [[ $validation_issues -gt 0 ]]; then
    echo "⚠️  MEJORAS EN VALIDACIÓN ($validation_issues handlers):"
    echo "  1. Implementar validation utilities centralizadas"
    echo "  2. Usar Zod schemas para validar inputs before processing"
    echo "  3. Agregar input sanitization para strings"
    echo
fi

if [[ $description_issues -gt 0 ]]; then
    echo "📝 MEJORAR DESCRIPTIONS ($description_issues tools):"
    echo "  1. Usar formato: [VERBO] + [OBJETO] + [CONTEXTO]"
    echo "  2. Ejemplos: 'Crear recordatorio en calendario', 'Listar chatbots con estadísticas'"
    echo "  3. Longitud óptima: 30-80 caracteres"
    echo
fi

# ===== TOOL QUALITY SCORE =====

total_possible_issues=$((total_tests + validation_issues + description_issues))
total_actual_issues=$((failed_tests + validation_issues + description_issues))

if [[ $total_possible_issues -gt 0 ]]; then
    quality_score=$(((total_possible_issues - total_actual_issues) * 100 / total_possible_issues))
else
    quality_score=0
fi

echo "🎯 TOOL QUALITY SCORE: $quality_score/100"
echo

if [[ $quality_score -ge 80 ]]; then
    echo "✅ CALIDAD EXCELENTE - Sistema confiable"
elif [[ $quality_score -ge 60 ]]; then
    echo "⚠️  CALIDAD BUENA - Algunas mejoras necesarias"
elif [[ $quality_score -ge 40 ]]; then
    echo "🔶 CALIDAD REGULAR - Mejoras importantes requeridas"
else
    echo "❌ CALIDAD CRÍTICA - Refactoring urgente necesario"
fi

echo
echo "🔧 PRÓXIMOS PASOS:"
if [[ $db_error_count -gt 0 ]]; then
    echo "  1. PRIORIDAD ALTA: Fix database error handling"
fi
if [[ $validation_issues -gt 0 ]]; then
    echo "  2. PRIORIDAD MEDIA: Agregar input validation"
fi
if [[ $description_issues -gt 0 ]]; then
    echo "  3. PRIORIDAD BAJA: Mejorar descriptions"
fi

echo
echo "Para fix específicos:"
echo "  - Crear validation utilities en server/tools/validation.ts"
echo "  - Implementar error handling patterns en server/tools/error-handling.ts"
echo "  - Usar ObjectId.isValid() antes de todas las DB queries"