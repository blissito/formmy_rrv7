# LiveKit Voice Worker - Deployment a Fly.io

## Pre-requisitos

1. **LiveKit Cloud Account** (https://cloud.livekit.io)
   - API Key y API Secret
   - WebSocket URL de tu proyecto

2. **Fly.io CLI** instalado
   ```bash
   fly auth login
   ```

## Arquitectura Simplificada

El voice worker corre **EN LA MISMA MÁQUINA** que la app principal usando `[processes]` de Fly.io:
- **Proceso "app"**: Servidor web (puerto 3000)
- **Proceso "worker"**: LiveKit Agent Worker (puerto interno)

Esto reduce costos y simplifica deployment (una sola app, un solo deploy).

## Variables de Entorno Necesarias

Configurar secrets en `formmy-v2`:

```bash
# LiveKit Credentials (OBLIGATORIAS)
LIVEKIT_API_KEY=<tu_livekit_api_key>
LIVEKIT_API_SECRET=<tu_livekit_api_secret>
LIVEKIT_URL=wss://your-project.livekit.cloud

# OpenAI para LLM (OBLIGATORIA - ya configurada)
OPENAI_API_KEY=<tu_openai_api_key>

# Database (ya configurada)
DATABASE_URL=<tu_mongodb_connection_string>
```

## Paso 1: Configurar Secrets de LiveKit

```bash
# Configurar LiveKit credentials en formmy-v2
fly secrets set LIVEKIT_API_KEY="<tu_key>" -a formmy-v2
fly secrets set LIVEKIT_API_SECRET="<tu_secret>" -a formmy-v2
fly secrets set LIVEKIT_URL="wss://your-project.livekit.cloud" -a formmy-v2
```

**IMPORTANTE**: Obtén estas credenciales de https://cloud.livekit.io/settings

## Paso 2: Deploy Unificado

```bash
# Un solo deploy incluye app + worker
npm run deploy
```

El `fly.toml` ya está configurado para iniciar ambos procesos:
```toml
[processes]
  app = "npm start"              # App web
  worker = "npm run voice:start" # Voice worker
```

## Paso 3: Verificar que Ambos Procesos están Corriendo

```bash
# Ver logs de ambos procesos
fly logs -a formmy-v2

# Deberías ver:
# [app] ✅ Server listening on port 3000
# [worker] ✅ Silero VAD cargado
# [worker] ✅ registered worker
```

## Testing en Producción

1. Ve a tu dashboard en producción: https://formmy.app
2. Activa la integración de Voz en un chatbot
3. Crea una sesión de voz desde el frontend
4. Deberías ver en los logs del worker:
   ```
   🎙️ Nuevo job de voz: Room voice_xxx
   ✅ Conectado a room
   💬 Enviando mensaje de bienvenida
   ```

## Troubleshooting

### Worker no se conecta a LiveKit
- Verificar que `LIVEKIT_URL` sea correcto (debe empezar con `wss://`)
- Verificar que API Key y Secret sean válidos

### Error 403 de ElevenLabs
- Asegurarte que el voice ID sea válido de ElevenLabs
- El sistema usa LiveKit Inference, NO necesita ELEVEN_API_KEY

### Worker crashea al iniciar
- Ver logs: `fly logs -a formmy-voice-worker`
- Verificar que todas las env vars estén configuradas
- Verificar que `OPENAI_API_KEY` esté presente

## Monitoreo

```bash
# Ver estado del worker
fly status -a formmy-voice-worker

# Ver métricas
fly dashboard -a formmy-voice-worker

# Escalar si es necesario
fly scale count 2 -a formmy-voice-worker  # 2 instancias
fly scale vm shared-cpu-2x -a formmy-voice-worker  # CPU upgrade
```

## Arquitectura

```
┌─────────────────┐
│  formmy-v2      │  → Crea rooms y tokens en LiveKit
│  (App Principal)│  → API: /api/voice/v1
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ LiveKit Cloud   │  → Gestiona WebRTC rooms
│                 │  → Provee STT/TTS vía Inference
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ formmy-voice-   │  → Worker que procesa conversaciones
│ worker          │  → LiveKit Agents SDK
└─────────────────┘
```

## Costos Estimados

- **Fly.io Worker**: ~$10/mes (1 instancia shared-cpu-2x, 1GB RAM)
- **LiveKit Cloud**: Free tier hasta 100 participantes concurrentes
- **LiveKit Inference**: Pay-as-you-go (STT + TTS + LLM)

## Next Steps

- [ ] Configurar alertas de Fly.io para el worker
- [ ] Implementar health checks más robustos
- [ ] Agregar métricas de observabilidad
- [ ] Configurar auto-scaling basado en carga
