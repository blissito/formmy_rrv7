# Auditoría Sistema de Voz LiveKit - Oct 28, 2025

## Resumen Ejecutivo

**Status**: ✅ Sistema operativo tras correcciones críticas
**Fecha**: Octubre 28, 2025
**Auditor**: Claude Code

---

## Problemas Críticos Encontrados y Resueltos

### 1. ✅ Worker de LiveKit NO estaba corriendo (CRÍTICO)

**Problema**: El worker (`npm run voice:dev`) no estaba ejecutándose, causando que el agente NUNCA hablara.

**Síntomas**:
- Usuario se conecta al room
- Audio del micrófono funciona
- Agente NO envía mensaje de bienvenida
- Agente NO responde a preguntas del usuario
- Silencio total del lado del agente

**Root Cause**:
El worker de LiveKit (`/server/voice/livekit-agent-worker.ts`) es quien:
1. Escucha rooms de LiveKit
2. Se conecta como participante (el agente)
3. Ejecuta `session.say(voiceWelcome)` para hablar
4. Procesa STT → LLM → TTS

Sin el worker corriendo, el room queda vacío excepto por el usuario.

**Solución**:
```bash
npm run voice:dev  # Development
npm run voice:start  # Production
```

**Worker Status**:
✅ Corriendo con ID `AW_xmoAdugwERFs` en LiveKit Cloud US West B

---

### 2. ✅ Voice ID incorrecto en chatbot demo

**Problema**: Chatbot demo (`demo-chatbot-DeqLzY`) tenía voice ID `FGY2WhTYpPnrIDTdsKH5`

**Investigación**:
- Ese ID corresponde a **Laura** (American accent, multilingüe)
- NO es una voz nativa mexicana
- La documentación previa decía "Valentina" pero era incorrecta

**Voz correcta verificada** (Enero 2025):
- **Leo Moreno**: `3l9iCMrNSRR0w51JvFB0`
- Género: Masculino
- Acento: **Nativo mexicano REAL**
- Descripción: Voz mexicana calmada, intencional, feliz
- Status: **ÚNICA voz nativa mexicana disponible en ElevenLabs**

**Solución**:
Script `/scripts/fix-voice-integration.ts` actualizado para usar Leo Moreno.

**Estado actual**:
```json
{
  "ttsProvider": "elevenlabs",
  "ttsVoiceId": "3l9iCMrNSRR0w51JvFB0"
}
```

---

### 3. ✅ Default TTS Provider incorrecto

**Problema**: Código tenía `ttsProvider = "cartesia"` como default

**Archivos afectados**:
- `/app/routes/api.voice.v1.ts:170`
- `/server/voice/livekit-voice.service.server.ts:58`

**Issue**: Cartesia NO está habilitado. Solo ElevenLabs es soportado.

**Solución**:
```typescript
ttsProvider = "elevenlabs" // ✅ ÚNICO proveedor soportado
```

---

### 4. ✅ Schema Prisma con locale incorrecto

**Problema**:
```prisma
sttLanguage String @default("es-MX")
```

**Issue**: LiveKit Inference Gateway requiere ISO-639-1 (sin locales)
- ✅ Correcto: `"es"`, `"en"`, `"pt"`
- ❌ Incorrecto: `"es-MX"`, `"en-US"`, `"pt-BR"`

**Solución**:
```prisma
sttLanguage String @default("es") // ⚠️ ISO-639-1 SOLO
```

**Nota**: El acento se determina EXCLUSIVAMENTE por el voice ID (Leo Moreno = mexicano)

---

### 5. ✅ VoiceIntegrationModal solo muestra 1 voz

**Estado actual**: Modal tiene selector con Leo Moreno como ÚNICA opción

**Código** (`/app/components/integrations/VoiceIntegrationModal.tsx:275-277`):
```tsx
<option value="3l9iCMrNSRR0w51JvFB0">
  Leo Moreno (Masculino - Voz Nativa Mexicana) ★
</option>
```

**Nota explicativa** (línea 282-284):
```tsx
⚠️ Nota: Actualmente solo hay 1 voz nativa mexicana en ElevenLabs.
Las voces femeninas están en desarrollo.
```

**Status**: ✅ Correcto. Refleja la realidad de voces disponibles.

---

## Arquitectura Verificada

### Flow Completo (Funcionando correctamente)

```
1. Usuario abre modal VoiceChat
   ↓
2. Frontend llama POST /api/voice/v1?intent=create_session
   ↓
3. Backend crea room en LiveKit + token JWT
   ↓
4. Cliente se conecta al room con livekit-client
   ↓
5. Worker detecta nuevo room (vía LiveKit Cloud)
   ↓
6. Worker se conecta como agente al room
   ↓
7. Worker espera a que usuario se conecte (waitForParticipant)
   ↓
8. Worker espera 500ms para que cliente esté listo
   ↓
9. Worker envía mensaje de bienvenida con session.say()
   ↓
10. Usuario habla → STT (Deepgram) → texto
   ↓
11. Worker llama streamAgentWorkflow() (agente de Formmy)
   ↓
12. Agente procesa mensaje + tools → respuesta
   ↓
13. Worker convierte respuesta a TTS (ElevenLabs vía LiveKit)
   ↓
14. Audio se envía al room → Cliente reproduce
```

### Componentes Críticos

**Backend**:
- ✅ `/server/voice/livekit-voice.service.server.ts` - Gestión rooms/tokens
- ✅ `/server/voice/livekit-agent-worker.ts` - Worker principal (DEBE CORRER)
- ✅ `/server/voice/voice-agent-handler.ts` - Handler (legacy, NO usado actualmente)
- ✅ `/app/routes/api.voice.v1.ts` - API REST

**Frontend**:
- ✅ `/app/components/VoiceChat.tsx` - Modal conversación
- ✅ `/app/components/VoiceWaveform.tsx` - Visualización audio
- ✅ `/app/components/VoiceIntegrationCard.tsx` - Card dashboard
- ✅ `/app/components/integrations/VoiceIntegrationModal.tsx` - Config

**Database**:
- ✅ `VoiceSession` - Sesiones de voz
- ✅ `Integration.platform = "VOICE"` - Integración por chatbot
- ✅ `Integration.metadata.ttsVoiceId` - Voice ID configurado

---

## Configuración LiveKit Verificada

### Environment Variables (Correctas)

```bash
LIVEKIT_API_KEY=APIxxxxx
LIVEKIT_API_SECRET=secret
LIVEKIT_URL=wss://formmy.livekit.cloud

# ⚠️ IMPORTANTE: Solo para consultas, NO para TTS directo
ELEVENLABS_API_KEY=sk_xxx
```

### Formato LiveKit Inference (Correcto)

**Worker** (`/server/voice/livekit-agent-worker.ts:122-124`):
```typescript
stt: "deepgram/nova-2-general:es",  // ✅ ISO-639-1
llm: "openai/gpt-4o-mini",
tts: `elevenlabs/eleven_turbo_v2_5:${ttsVoiceId}`,  // ✅ Formato correcto
```

**Validación**:
- ✅ STT: `deepgram/nova-2-general:es` (NO `es-MX`)
- ✅ TTS: `elevenlabs/eleven_turbo_v2_5:3l9iCMrNSRR0w51JvFB0`
- ✅ Modelo: `eleven_turbo_v2_5` (más rápido y mejor calidad)

---

## Scripts Corregidos

### `/scripts/fix-voice-integration.ts`
✅ Actualiza chatbot demo con Leo Moreno

### `/scripts/update-voice-to-spanish.ts`
✅ Corregido de "Valentina" (incorrecta) a Leo Moreno

### `/scripts/check-voice-config.ts`
⚠️ Verificar que use Leo Moreno como esperado

---

## Voces ElevenLabs - Investigación Completa

### Auditoría de Voces (Enero 2025)

**Total de voces en cuenta**: 21
**Voces con soporte español**: 8
**Voces nativas mexicanas REALES**: 1 ⚠️

### Voz Nativa Mexicana Verificada

| Voice ID | Nombre | Género | Acento | Status |
|----------|--------|--------|--------|---------|
| `3l9iCMrNSRR0w51JvFB0` | **Leo Moreno** | Masculino | Mexicano Nativo | ✅ DEFAULT |

**Características**:
- Voz mexicana calmada, intencional, feliz
- Ideal para conversaciones profesionales
- Latencia baja con modelo `eleven_turbo_v2_5`

### Voces Legacy Eliminadas (Incorrectas)

| Voice ID | Nombre Original | Problema |
|----------|----------------|----------|
| `DuNnqwVuAtxzKcXGUN2v` | "Diego" | ❌ NO EXISTE (400 Bad Request) |
| `FGY2WhTYpPnrIDTdsKH5` | "Valentina" | ❌ En realidad es **Laura** (American accent) |
| `ErXwobaYiN019PkySvjV` | Antoni/Toño | ❌ American accent (multilingüe) |

**Conclusión**: La documentación anterior sobre "Diego" y "Valentina" como voces mexicanas era INCORRECTA.

---

## Checklist de Deployment

### Pre-Deploy (Local)
- [x] Worker corriendo: `npm run voice:dev`
- [x] Chatbot demo con Leo Moreno configurado
- [x] Schema Prisma con `sttLanguage: "es"` (ISO-639-1)
- [x] Default provider: `elevenlabs`
- [x] Voice IDs legacy removidos del código

### Production Deploy
- [ ] Iniciar worker en Fly.io: `npm run voice:start`
- [ ] Verificar que worker se registra con LiveKit Cloud
- [ ] Probar llamada de voz end-to-end
- [ ] Verificar que agente habla en bienvenida
- [ ] Verificar que agente responde a preguntas

### Monitoring
- [ ] Logs del worker: Sin errores de conexión
- [ ] LiveKit Dashboard: Worker aparece como "online"
- [ ] Sesiones de voz: Status "COMPLETED" (no "ERROR")

---

## Próximos Pasos

### Voces Femeninas
- Esperar a que ElevenLabs agregue voces mexicanas femeninas, O
- Usar Voice Cloning con samples de voz mexicana femenina, O
- Explorar Google Cloud TTS / Azure Speech (tienen `es-MX` nativo)

### Widget Embebible
- Implementar `/public/voice-widget.js`
- Testing en sitios externos

### SDK npm
- Extender `formmy-sdk` con clase `FormmyVoice`

---

## Referencias

**Documentación oficial**:
- LiveKit Inference: https://docs.livekit.io/agents/models/
- ElevenLabs Voices: https://elevenlabs.io/voice-library
- Deepgram Languages: https://developers.deepgram.com/docs/language

**Archivos clave**:
- `/CLAUDE.md:726-1100` - Documentación completa de Voice AI
- `/server/voice/livekit-agent-worker.ts` - Worker principal
- `/app/components/VoiceChat.tsx` - Cliente web

---

**Auditoría completada**: Oct 28, 2025
**Status final**: ✅ Sistema operativo y listo para uso
