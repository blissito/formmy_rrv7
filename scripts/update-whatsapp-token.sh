#!/bin/bash

# Script para actualizar WhatsApp token rápidamente
# Uso: ./scripts/update-whatsapp-token.sh "nuevo_token_aqui"

if [ -z "$1" ]; then
    echo "❌ Error: Proporciona el nuevo token"
    echo "Uso: ./scripts/update-whatsapp-token.sh 'EAAQCKJq...'"
    exit 1
fi

NEW_TOKEN="$1"
ENV_FILE=".env"

echo "🔄 Actualizando WhatsApp token..."

# Backup del .env actual
cp "$ENV_FILE" "$ENV_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Actualizar token en .env
if grep -q "WHATSAPP_TOKEN=" "$ENV_FILE"; then
    # Reemplazar línea existente
    sed -i.tmp "s|WHATSAPP_TOKEN=.*|WHATSAPP_TOKEN=$NEW_TOKEN|" "$ENV_FILE"
    rm "$ENV_FILE.tmp"
    echo "✅ Token actualizado en .env"
else
    # Agregar nueva línea
    echo "WHATSAPP_TOKEN=$NEW_TOKEN" >> "$ENV_FILE"
    echo "✅ Token agregado a .env"
fi

# Sincronizar con Fly.io
echo "🚀 Sincronizando con producción..."
fly secrets import < "$ENV_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Token actualizado en producción"
    echo "🎯 Verificando..."
    fly secrets list | grep WHATSAPP_TOKEN
else
    echo "❌ Error al actualizar en producción"
    exit 1
fi

echo "🎉 ¡Token actualizado exitosamente!"