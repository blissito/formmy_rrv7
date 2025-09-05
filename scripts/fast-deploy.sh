#!/bin/bash
set -e

echo "🚀 Iniciando deploy optimizado de Formmy..."

# Verificar si hay cambios solo en código vs dependencias
if git diff --name-only HEAD~1 | grep -E "(package\.json|package-lock\.json)" > /dev/null; then
    echo "📦 Detectados cambios en dependencias - deploy completo"
    CACHE_STRATEGY="--no-cache"
else
    echo "⚡ Solo cambios de código - usando cache"
    CACHE_STRATEGY=""
fi

# Deploy con estrategia de cache inteligente
fly deploy $CACHE_STRATEGY \
    --build-arg BUILDKIT_INLINE_CACHE=1 \
    --build-cache-from=type=registry,ref=registry.fly.io/formmy-v2:buildcache \
    --build-cache-to=type=registry,ref=registry.fly.io/formmy-v2:buildcache,mode=max \
    --strategy immediate \
    --wait-timeout 600

echo "✅ Deploy completado!"