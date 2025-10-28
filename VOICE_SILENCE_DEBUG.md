# Debug: Silencio en Llamadas de Voz - Oct 28, 2025

## Estado Actual

**Síntoma**: Usuario se conecta a la llamada pero NO escucha al agente

**Logs del Worker** (✅ Funcionando correctamente):
```
✅ Usuario conectado: user_68f456db
💬 Enviando mensaje de bienvenida: "Hola, ¿en qué puedo ayudarte hoy?"
✅ Agente de voz activo y escuchando con turn-taking...
```

**Logs del Cliente** (❌ Problema detectado):
- NO hay logs de `TrackPublished` del agente
- NO hay logs de `TrackSubscribed` del agente
- Usuario se desconecta después de 7 segundos (posiblemente frustrado por el silencio)

## Análisis del Problema

### Flow Esperado

```
1. Cliente conecta → LiveKit Room
2. Worker detecta room → Se conecta como agente
3. Worker espera al usuario (✅ FUNCIONA)
4. Worker espera 2s adicionales (✅ FUNCIONA)
5. Worker llama session.say(voiceWelcome) (✅ FUNCIONA)
6. ❌ AQUÍ FALLA: Track de audio NO llega al cliente
7. Cliente debería suscribirse al track
8. Cliente debería reproducir audio
```

### Problema Identificado

El `session.say()` del worker **SÍ se ejecuta** (sin errores en logs), pero el track de audio del TTS **NO llega al cliente**.

**Posibles causas**:

1. **Track Publishing Issue**: El agente genera el audio pero no lo publica correctamente al room
2. **Client Subscription Issue**: El cliente no se está suscribiendo automáticamente a los tracks del agente
3. **Timing Issue**: El delay de 2s no es suficiente
4. **LiveKit Inference Gateway Issue**: El gateway no está conectando correctamente con ElevenLabs

## Cambios Aplicados

### Worker (`livekit-agent-worker.ts`)

```typescript
// Aumentado delay de 500ms → 2000ms
await new Promise(r => setTimeout(r, 2000));

// Agregado try-catch y logs detallados
try {
  await session.say(voiceWelcome, {
    allowInterruptions: true,
  });
  console.log("✅ Mensaje de bienvenida enviado exitosamente");
} catch (error) {
  console.error("❌ Error al enviar mensaje de bienvenida:", error);
}
```

### Cliente (`VoiceChat.tsx`)

Agregados logs detallados:
```typescript
room.on(RoomEvent.Connected, () => {
  console.log("✅ Connected to LiveKit room");
  console.log("👤 Local participant:", room.localParticipant.identity);
  console.log("👥 Remote participants count:", room.remoteParticipants.size);
});

room.on(RoomEvent.TrackPublished, (publication, participant) => {
  console.log("📡 TrackPublished:", publication.kind, "by", participant.identity);
  console.log("   Publication details:", {
    trackSid: publication.trackSid,
    trackName: publication.trackName,
    source: publication.source,
    muted: publication.isMuted,
  });
});
```

## Próximos Pasos

### 1. Capturar logs del cliente

Ejecutar una nueva llamada y revisar:
- ¿Aparece "TrackPublished" del agente?
- ¿Aparece "TrackSubscribed" del agente?
- ¿Qué identity tiene el agente cuando se conecta?

### 2. Verificar configuración de LiveKit Inference

Posible issue: El formato del TTS podría ser incorrecto.

**Formato actual**:
```typescript
tts: `elevenlabs/eleven_turbo_v2_5:${ttsVoiceId}`
```

**Alternativas a probar**:
```typescript
// Opción 1: Sin modelo específico
tts: `elevenlabs:${ttsVoiceId}`

// Opción 2: Con parámetros de idioma
tts: `elevenlabs/eleven_turbo_v2_5:${ttsVoiceId}?language=es`
```

### 3. Verificar track auto-subscribe

El cliente podría necesitar suscribirse manualmente a los tracks del agente:

```typescript
room.on(RoomEvent.TrackPublished, async (publication, participant) => {
  if (participant.identity !== room.localParticipant.identity) {
    // Forzar suscripción manual
    await publication.setSubscribed(true);
    console.log("✅ Forced subscription to agent track");
  }
});
```

### 4. Verificar que el agente publica audio tracks

Agregar logs al worker para confirmar que el track se está publicando:

```typescript
// Después de session.say()
const audioTracks = Array.from(ctx.room.localParticipant.audioTracks.values());
console.log(`📊 Local audio tracks count: ${audioTracks.length}`);
audioTracks.forEach(track => {
  console.log(`   Track: ${track.trackName}, Muted: ${track.isMuted}`);
});
```

### 5. Simplificar el test

Crear una versión minimal del worker que:
1. Se conecta
2. Publica un track de audio simple (sin TTS)
3. Verifica que el cliente lo recibe

## Referencias

**LiveKit Voice Agents Docs**:
- https://docs.livekit.io/agents/voice/overview/
- https://docs.livekit.io/agents/voice/tts/

**LiveKit Client SDK**:
- https://docs.livekit.io/client-sdk-js/track-subscription/

**Issue similar en GitHub**:
- https://github.com/livekit/agents/issues (buscar "TTS not playing" o "audio not heard")

## Hipótesis Principal

**El agente está generando el audio TTS internamente pero NO está publicando el track al room**.

Esto explicaría por qué:
- `session.say()` se ejecuta sin errores
- El cliente nunca recibe `TrackPublished` del agente
- El usuario solo escucha silencio

**Solución probable**:
Verificar que el `Agent` y `AgentSession` están correctamente configurados para publicar audio tracks al room.

## Testing Script Sugerido

```typescript
// scripts/test-voice-simple.ts
import { Room } from 'livekit-server-sdk';

async function testVoiceSimple() {
  // 1. Crear room
  // 2. Conectar como agente
  // 3. Publicar un beep de audio simple (no TTS)
  // 4. Verificar que se publica correctamente
  // 5. Conectar como cliente
  // 6. Verificar que cliente recibe el track
}
```

---

**Última actualización**: Oct 28, 2025 - 10:40 AM
**Status**: Investigando por qué tracks de audio del agente no llegan al cliente
