#!/bin/bash

# Script para ejecutar test de Gmail integration con Composio
#
# Uso:
#   bash scripts/run-gmail-test.sh

echo "📧 Ejecutando test de Gmail + Composio..."
echo ""

# Verificar que .env existe
if [ ! -f .env ]; then
    echo "❌ Error: No se encontró el archivo .env"
    echo "   Copia .env.example a .env y configura las variables"
    exit 1
fi

# Cargar variables de entorno
export $(grep -v '^#' .env | xargs)

# Pedir chatbot ID si no está configurado
if [ -z "$TEST_CHATBOT_ID" ]; then
    echo "ℹ️  TEST_CHATBOT_ID no está configurado"
    echo ""
    echo "Ingresa el ID de un chatbot de prueba que tenga Gmail conectado:"
    read -p "> " TEST_CHATBOT_ID
    export TEST_CHATBOT_ID
fi

# Pedir email de prueba si no está configurado
if [ -z "$TEST_RECIPIENT_EMAIL" ]; then
    echo ""
    echo "Ingresa el email de prueba (puede ser el tuyo):"
    read -p "> " TEST_RECIPIENT_EMAIL
    export TEST_RECIPIENT_EMAIL
fi

echo ""
echo "=========================================="
echo "Configuración:"
echo "  Chatbot ID: $TEST_CHATBOT_ID"
echo "  Email de prueba: $TEST_RECIPIENT_EMAIL"
echo "=========================================="
echo ""

# Ejecutar test
npx tsx scripts/test-composio-gmail.ts

# Capturar código de salida
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Test completado exitosamente"
    echo ""
    echo "Próximos pasos:"
    echo "  1. Verifica tu bandeja de entrada ($TEST_RECIPIENT_EMAIL)"
    echo "  2. Deberías ver un email con asunto '[Formmy Test] Email de prueba desde Composio'"
    echo "  3. Si Gmail tools funcionan, puedes habilitar la integración en producción"
else
    echo ""
    echo "❌ Test falló con código de salida: $EXIT_CODE"
    echo ""
    echo "Troubleshooting:"
    echo "  1. Verifica que COMPOSIO_API_KEY esté configurado en .env"
    echo "  2. Verifica que COMPOSIO_GMAIL_AUTH_CONFIG_ID esté configurado"
    echo "  3. Asegúrate de que el chatbot tenga Gmail conectado (OAuth2)"
    echo "  4. Revisa los logs arriba para más detalles"
fi

exit $EXIT_CODE
