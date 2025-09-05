#!/bin/bash
# Script para habilitar cache de Docker en Fly.io

# Habilitar BuildKit y cache
export DOCKER_BUILDKIT=1

# Deploy con cache persistente
fly deploy --build-arg BUILDKIT_INLINE_CACHE=1 \
  --build-cache-from=type=registry,ref=registry.fly.io/formmy-v2:buildcache \
  --build-cache-to=type=registry,ref=registry.fly.io/formmy-v2:buildcache,mode=max