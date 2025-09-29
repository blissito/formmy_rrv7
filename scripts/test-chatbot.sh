#!/bin/bash

# 🤖 Script de Testing Completo para Sistema de Chatbot
# Verifica funcionalidad, rendimiento y robustez del sistema

set -e

# Configuración
API_URL="${API_URL:-http://localhost:3000}"
CHATBOT_ID="${CHATBOT_ID:-}"
TEST_USER_ID="${TEST_USER_ID:-test-user-123}"
VERBOSE="${VERBOSE:-false}"
OUTPUT_DIR="${OUTPUT_DIR:-./test-results}"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Contadores
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

log() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

error() {
    echo -e "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Función para hacer requests con timeout y logging
make_request() {
    local method="$1"
    local endpoint="$2"
    local data="$3"
    local expected_status="${4:-200}"
    local test_name="$5"

    ((TESTS_TOTAL++))

    if [[ "$VERBOSE" == "true" ]]; then
        log "Testing: $test_name"
        log "Request: $method $endpoint"
    fi

    local start_time=$(date +%s%N)
    local response
    local status_code

    if [[ "$method" == "GET" ]]; then
        response=$(curl -s -w "\n%{http_code}" --max-time 30 "$API_URL$endpoint" || echo -e "\n000")
    else
        response=$(curl -s -w "\n%{http_code}" --max-time 30 -X "$method" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -H "User-Agent: Formmy-Test-CLI/1.0" \
            -d "$data" "$API_URL$endpoint" || echo -e "\n000")
    fi

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 )) # ms

    status_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | head -n -1)

    # Guardar resultado si hay directorio de output
    if [[ -d "$OUTPUT_DIR" ]]; then
        local filename="$OUTPUT_DIR/$(echo "$test_name" | tr ' ' '_' | tr '[:upper:]' '[:lower:]').json"
        echo "{
            \"test\": \"$test_name\",
            \"method\": \"$method\",
            \"endpoint\": \"$endpoint\",
            \"status_code\": $status_code,
            \"expected_status\": $expected_status,
            \"duration_ms\": $duration,
            \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
            \"response_body\": $(echo "$body" | jq -R .)
        }" > "$filename"
    fi

    if [[ "$status_code" == "$expected_status" ]]; then
        success "$test_name (${duration}ms, status: $status_code)"
        if [[ "$VERBOSE" == "true" && ${#body} -lt 500 ]]; then
            echo "Response: $body" | head -c 200
            echo
        fi
    else
        error "$test_name (${duration}ms, expected: $expected_status, got: $status_code)"
        if [[ ${#body} -lt 500 ]]; then
            echo "Response: $body"
        fi
    fi

    # Guardar response body para tests que lo necesiten
    echo "$body" > /tmp/last_response.json
    echo "$status_code" > /tmp/last_status.txt
}

# Verificar dependencias
check_dependencies() {
    log "🔍 Verificando dependencias..."

    which curl > /dev/null || { error "curl no está instalado"; exit 1; }
    which jq > /dev/null || { warning "jq no está instalado - el formato JSON será limitado"; }

    # Crear directorio de resultados
    if [[ ! -d "$OUTPUT_DIR" ]]; then
        mkdir -p "$OUTPUT_DIR"
        log "📁 Creado directorio de resultados: $OUTPUT_DIR"
    fi

    success "Dependencias verificadas"
}

# Test de conectividad básica
test_connectivity() {
    log "🌐 Testing conectividad básica..."

    make_request "GET" "/api/health/chatbot" "" "200" "Health Check Basic"

    # Verificar que el health check devuelve JSON válido
    if command -v jq &> /dev/null; then
        if jq empty < /tmp/last_response.json 2>/dev/null; then
            success "Health check devuelve JSON válido"
        else
            error "Health check no devuelve JSON válido"
        fi
    fi
}

# Test de health checks específicos
test_health_checks() {
    log "🏥 Testing health checks específicos..."

    make_request "POST" "/api/health/chatbot" "component=agent" "200" "Health Check Agent"
    make_request "POST" "/api/health/chatbot" "component=database" "200" "Health Check Database"
    make_request "POST" "/api/health/chatbot" "component=tools" "200" "Health Check Tools"
    make_request "POST" "/api/health/chatbot" "component=invalid" "400" "Health Check Invalid Component"
}

# Test de rate limiting
test_rate_limiting() {
    log "🚦 Testing rate limiting..."

    # Hacer múltiples requests rápidos para trigger rate limit
    for i in {1..25}; do
        make_request "POST" "/api/v0/chatbot" "intent=chat&chatbotId=test&message=rate-test-$i&stream=false" "429" "Rate Limit Test $i"

        # Si obtenemos 429, parar
        if [[ $(cat /tmp/last_status.txt) == "429" ]]; then
            success "Rate limiting funcionando correctamente (triggered en request $i)"
            break
        fi

        # Si llegamos al final sin 429, es un problema
        if [[ $i == 25 ]]; then
            warning "Rate limiting puede estar mal configurado (no se triggeró en 25 requests)"
        fi
    done
}

# Test de validación de input
test_input_validation() {
    log "🔍 Testing validación de input..."

    # Request sin parámetros requeridos
    make_request "POST" "/api/v0/chatbot" "" "400" "Empty Request"

    # Request con intent inválido
    make_request "POST" "/api/v0/chatbot" "intent=invalid" "400" "Invalid Intent"

    # Request con chatbotId inválido
    make_request "POST" "/api/v0/chatbot" "intent=chat&chatbotId=invalid&message=test" "404" "Invalid Chatbot ID"

    # Request con mensaje muy largo
    local long_message=$(printf 'a%.0s' {1..5000})
    make_request "POST" "/api/v0/chatbot" "intent=chat&chatbotId=test&message=$long_message" "400" "Message Too Long"
}

# Test de chatbot funcional (si se proporciona CHATBOT_ID)
test_chatbot_functionality() {
    if [[ -z "$CHATBOT_ID" ]]; then
        warning "CHATBOT_ID no configurado - saltando tests funcionales"
        return
    fi

    log "🤖 Testing funcionalidad del chatbot..."

    # Test básico de chat
    make_request "POST" "/api/v0/chatbot" \
        "intent=chat&chatbotId=$CHATBOT_ID&message=Hola, %c3%b3mo est%c3%a1s?&stream=false" \
        "200" "Basic Chat Test"

    # Verificar que la respuesta contiene content
    if command -v jq &> /dev/null; then
        local content=$(jq -r '.message // .response // .content' < /tmp/last_response.json 2>/dev/null)
        if [[ "$content" != "null" && "$content" != "" ]]; then
            success "Chat response contiene contenido válido"
        else
            error "Chat response no contiene contenido válido"
        fi
    fi

    # Test con streaming
    log "🌊 Testing streaming..."
    local response=$(timeout 30s curl -s -X POST \
        -H "Accept: text/event-stream" \
        -H "User-Agent: Formmy-Test-CLI/1.0" \
        -d "intent=chat&chatbotId=$CHATBOT_ID&message=Cuéntame sobre tus capacidades&stream=true" \
        "$API_URL/api/v0/chatbot" | head -n 20)

    if [[ "$response" == *"data:"* ]]; then
        success "Streaming SSE funcionando"
    else
        error "Streaming SSE no funcionando"
    fi
}

# Test de carga
test_load() {
    log "📊 Testing carga del sistema..."

    local concurrent_requests=5
    local pids=()

    # Lanzar requests concurrentes
    for i in $(seq 1 $concurrent_requests); do
        (
            make_request "GET" "/api/health/chatbot" "" "200" "Load Test $i"
        ) &
        pids+=($!)
    done

    # Esperar a que terminen
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait $pid; then
            ((failed++))
        fi
    done

    if [[ $failed -eq 0 ]]; then
        success "Load test con $concurrent_requests requests concurrentes"
    else
        error "Load test falló ($failed/$concurrent_requests requests fallaron)"
    fi
}

# Test de recovery/fallback
test_recovery() {
    log "🔄 Testing recovery y fallback..."

    # Test con timeout simulado (mensaje muy largo que podría causar timeout)
    local complex_message="Analiza detalladamente todos los aspectos técnicos de la implementación de sistemas de inteligencia artificial en aplicaciones web modernas, considerando aspectos de performance, escalabilidad, seguridad y experiencia de usuario"

    make_request "POST" "/api/v0/chatbot" \
        "intent=chat&chatbotId=${CHATBOT_ID:-test}&message=$complex_message&stream=false" \
        "200" "Complex Query Recovery Test"
}

# Generar reporte final
generate_report() {
    log "📋 Generando reporte final..."

    local success_rate=0
    if [[ $TESTS_TOTAL -gt 0 ]]; then
        success_rate=$(( (TESTS_PASSED * 100) / TESTS_TOTAL ))
    fi

    echo
    echo "🎯 REPORTE FINAL DE TESTING"
    echo "=========================="
    echo "Total tests ejecutados: $TESTS_TOTAL"
    echo "Tests exitosos: $TESTS_PASSED"
    echo "Tests fallidos: $TESTS_FAILED"
    echo "Tasa de éxito: $success_rate%"
    echo

    if [[ -d "$OUTPUT_DIR" ]]; then
        echo "📁 Resultados detallados en: $OUTPUT_DIR"

        # Crear reporte JSON
        cat > "$OUTPUT_DIR/summary.json" << EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "total_tests": $TESTS_TOTAL,
    "passed": $TESTS_PASSED,
    "failed": $TESTS_FAILED,
    "success_rate": $success_rate,
    "api_url": "$API_URL",
    "chatbot_id": "$CHATBOT_ID"
}
EOF
    fi

    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo "❌ Algunos tests fallaron. Revisa los logs para más detalles."
        exit 1
    else
        echo "✅ Todos los tests pasaron exitosamente!"
    fi
}

# Función principal
main() {
    echo "🚀 INICIANDO TESTING DEL SISTEMA DE CHATBOT"
    echo "API URL: $API_URL"
    echo "Chatbot ID: ${CHATBOT_ID:-'No configurado'}"
    echo "Output dir: $OUTPUT_DIR"
    echo "Verbose: $VERBOSE"
    echo

    check_dependencies
    test_connectivity
    test_health_checks
    test_input_validation
    test_rate_limiting
    test_chatbot_functionality
    test_load
    test_recovery
    generate_report
}

# Manejo de argumentos
while [[ $# -gt 0 ]]; do
    case $1 in
        --api-url)
            API_URL="$2"
            shift 2
            ;;
        --chatbot-id)
            CHATBOT_ID="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --output-dir)
            OUTPUT_DIR="$2"
            shift 2
            ;;
        --help)
            echo "Uso: $0 [opciones]"
            echo "Opciones:"
            echo "  --api-url URL       URL base de la API (default: http://localhost:3000)"
            echo "  --chatbot-id ID     ID del chatbot para tests funcionales"
            echo "  --verbose           Output detallado"
            echo "  --output-dir DIR    Directorio para resultados (default: ./test-results)"
            echo "  --help              Mostrar esta ayuda"
            echo
            echo "Variables de entorno:"
            echo "  API_URL             URL base de la API"
            echo "  CHATBOT_ID          ID del chatbot para testing"
            echo "  VERBOSE             true/false para output detallado"
            echo "  OUTPUT_DIR          Directorio para resultados"
            exit 0
            ;;
        *)
            error "Opción desconocida: $1"
            echo "Usa --help para ver las opciones disponibles"
            exit 1
            ;;
    esac
done

# Ejecutar tests
main