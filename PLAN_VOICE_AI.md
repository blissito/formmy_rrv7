# Plan de Implementación: LiveKit Voice AI para Formmy

**Fecha**: Enero 27, 2025
**Estado**: Backend completo ✅ | Frontend pendiente ⏳
**Objetivo**: Demo funcional de conversaciones de voz bidireccionales en español mexicano

---

## Decisiones Estratégicas Confirmadas

### Proveedores TTS
- **USAR**: Cartesia Sonic-2 ($50/1M chars) - Español MX confirmado, latencia 40ms
- **NO USAR**: ElevenLabs (3x-6x más caro, bloqueado completamente)
- **NO USAR**: Inworld (sin confirmación de es-MX)

### Planes con Acceso a Voz
| Plan | Acceso Chatbots | Voz | Minutos/mes | Créditos | Costo Real (Cartesia) | Margen |
|------|-----------------|-----|-------------|----------|----------------------|--------|
| FREE | ❌ | ❌ | 0 | 0 | $0 | - |
| TRIAL | ✅ | ✅ | 15 | 150 | ~$10 MXN | 99%+ |
| **STARTER** | ❌ | ❌ | 0 | 0 | - | - |
| PRO ($499) | ✅ | ✅ | 30 | 300 | ~$19 MXN | **96%** |
| ENTERPRISE ($2,490) | ✅ | ✅ | 60 | 600 | ~$38 MXN | **98%** |

**IMPORTANTE**: STARTER NO tiene chatbots, por lo tanto NO tiene acceso a voz.

### Límites Técnicos
- **Máximo por sesión**: 10 minutos (auto-disconnect)
- **Costo por minuto**: 10 créditos
- **Reset**: Primer día de cada mes

---

## Arquitectura CORRECTA (LiveKit Agents JS)

### ❌ Arquitectura Inicial INCORRECTA
- API REST creaba rooms
- Handler simulaba procesamiento de voz
- No había worker real de LiveKit
- **PROBLEMA**: No es así como funciona LiveKit Agents

### ✅ Arquitectura CORRECTA
```
1. Usuario abre modal de voz en burbuja del chatbot
2. Frontend llama API REST: POST /api/voice/v1?intent=create_session
3. API crea LiveKit room con metadata del chatbot
4. LiveKit notifica al Worker (proceso Node.js separado)
5. Worker acepta job y se une al room como participante
6. Worker usa plugins:
   - STT: AssemblyAI (transcribe español MX a texto)
   - LLM: OpenAI GPT-4o-mini (procesa con tools de Formmy)
   - TTS: Cartesia Sonic-2 (genera audio en español MX)
7. Audio se envía de vuelta al usuario via WebRTC
```

**Clave**: El Worker es un **proceso separado** que ejecuta `@livekit/agents`, NO parte del servidor web de Formmy.

---

## Estado Actual del Backend

### ✅ Completado
1. Dependencias instaladas: `livekit-server-sdk`, `livekit-client`
2. Schema Prisma: `VoiceSession`, campos en `User` y `Chatbot`
3. Servicio: `/server/voice/livekit-voice.service.ts` (gestión de rooms/tokens)
4. API REST: `/app/routes/api.voice.v1.ts` (endpoints funcionales)
5. Sistema de créditos: Funciones en `credits.service.ts`
6. Documentación: Sección completa en `CLAUDE.md`

### ⚠️ Necesita Ajustes
1. **livekit-voice.service.ts**: Cambiar default provider a Cartesia, remover Inworld
2. **credits.service.ts**: Actualizar límites (STARTER = 0)
3. **api.voice.v1.ts**: Validar plan, bloquear ElevenLabs, agregar metadata del chatbot al room

---

## Tareas Pendientes

### 1. Instalar Dependencias de LiveKit Agents
**Paquetes necesarios**:
- `@livekit/agents` (core framework)
- `@livekit/agents-plugin-silero` (Voice Activity Detection)

**Proveedores incluidos en core**:
- STT: AssemblyAI
- LLM: OpenAI
- TTS: Cartesia

### 2. Crear LiveKit Agent Worker
**Archivo**: `/server/voice/livekit-agent-worker.ts`

**Responsabilidades**:
- Pre-cargar modelo Silero VAD
- Escuchar notificaciones de jobs de LiveKit
- Al recibir job: leer metadata del room (chatbotId, userId, personality, instructions)
- Crear `voice.Agent` con instrucciones del chatbot
- Crear `voice.AgentSession` con:
  - STT: `assemblyai/universal-streaming:es` (español)
  - LLM: `openai/gpt-4o-mini` (mismo que Formmy usa)
  - TTS: `cartesia/sonic-2:mateo` (voz masculina en español MX)
  - VAD: Silero
  - Turn Detection: MultilingualModel de LiveKit
- Definir **tools LLM** que llamen APIs de Formmy:
  - `saveContact`: POST a `/api/v1/contacts`
  - `searchContext`: POST a `/api/rag/v1?intent=query`
  - (agregar más tools según necesidad)
- Saludo inicial usando `voiceWelcome` del chatbot
- Auto-disconnect a los 10 minutos con mensaje de despedida

**Scripts en package.json**:
- `"voice:dev": "tsx server/voice/livekit-agent-worker.ts dev"`
- `"voice:start": "tsx server/voice/livekit-agent-worker.ts start"`

### 3. Ajustar Backend Existente

#### `/server/llamaparse/credits.service.ts`
- Actualizar límites en `validateVoiceCredits()` y `consumeVoiceCredits()`:
  - FREE: 0
  - TRIAL: 75 (15 min)
  - **STARTER: 0** (sin chatbots)
  - PRO: 500 (100 min)
  - ENTERPRISE: 2000 (400 min)

#### `/app/routes/api.voice.v1.ts`
- **Validación 1**: Bloquear FREE y STARTER (HTTP 403)
- **Validación 2**: Si ttsProvider === "elevenlabs" → error (HTTP 400)
- **Al crear sesión**: Obtener datos del chatbot y pasarlos como metadata del room:
  - chatbotId
  - userId
  - personality
  - instructions
  - customInstructions
  - ttsVoiceId (default: "mateo")
  - voiceWelcome (mensaje de bienvenida)

#### `/server/voice/livekit-voice.service.ts`
- Cambiar `DEFAULT_TTS_PROVIDER = "cartesia"`
- Actualizar `TTS_PROVIDERS`:
  - Mantener Cartesia con voces: mateo (masculino), elena (femenino)
  - Remover Inworld
  - Dejar ElevenLabs pero con flag `disabled: true` (para documentación)

### 4. Dashboard UI - Voice Integration Card

#### `/app/routes/dashboard.chatbots.$id.tsx`

**Ubicación**: Card de integración en sección de integraciones del chatbot (similar a WhatsApp, Gmail)

**Flow de la Card**:

1. **Estado Desconectado** (voiceEnabled = false):
   - Icono de teléfono + "Conversaciones de Voz" + Badge "Beta"
   - Descripción breve: "Permite a usuarios hablar con el chatbot en tiempo real"
   - Botón principal: "Habilitar Voz"
   - Si plan es FREE/STARTER: Botón deshabilitado + tooltip "Requiere plan PRO"

2. **Estado Conectado** (voiceEnabled = true):
   - Icono verde + "Conversaciones de Voz activas"
   - Stats rápidas: "{X} minutos usados este mes"
   - Botones:
     - "Configurar" (abre modal de settings)
     - "Deshabilitar" (toggle off)

3. **Modal de Configuración** (se abre al hacer click en "Configurar"):
   - Título: "Configuración de Voz"
   - Sección "Proveedor":
     - Label: "Proveedor: Cartesia Sonic-2 (Español MX)" (solo informativo)
   - Sección "Voz":
     - Select: Mateo (Masculino) o Elena (Femenino)
     - Botón "Escuchar preview" (reproduce sample de audio)
   - Sección "Mensajes":
     - Input: Mensaje de bienvenida (opcional)
     - Placeholder: "Ej: Hola, ¿en qué puedo ayudarte hoy?"
   - Sección "Uso":
     - Card de estadísticas:
       - "{X} / {Y} minutos usados este mes"
       - Progress bar
       - Texto pequeño: "Límite: 10 min por sesión"
   - Botones del modal:
     - "Guardar cambios" (primary)
     - "Cancelar" (secondary)

**Datos a mostrar**:
- Obtener stats con `getVoiceCreditsStats(userId)`
- Convertir créditos a minutos (÷ 5)

### 5. Frontend: Componente VoiceChat

#### `/app/components/VoiceChat.tsx`

**Props**:
- `chatbotId: string`
- `isOpen: boolean`
- `onClose: () => void`

**Estados**:
- idle: No conectado
- connecting: Creando sesión
- ready: Conectado, esperando
- listening: Usuario hablando
- thinking: Agente procesando
- speaking: Agente respondiendo
- error: Error de conexión

**Funcionalidad**:
- Modal overlay que se abre desde botón en burbuja
- Al abrir:
  1. Llamar a `POST /api/voice/v1?intent=create_session`
  2. Conectar a LiveKit room con token recibido
  3. Habilitar micrófono del usuario
- Mostrar:
  - Waveform animado (componente VoiceWaveform)
  - Estado actual ("Te escucho...", "Pensando...", etc.)
  - Timer de duración (MM:SS)
  - Advertencia de límite (10:00 max)
  - Botones: Mute/Unmute, Colgar
- Al colgar:
  1. Desconectar del room
  2. Llamar a `POST /api/voice/v1?intent=end_session`
  3. Cerrar modal

**Integración con LiveKit**:
- Usar `livekit-client` SDK
- `Room.connect(wsUrl, token)`
- `room.localParticipant.setMicrophoneEnabled(true)`
- Escuchar eventos de audio del agente

### 6. Frontend: Componente VoiceWaveform

#### `/app/components/VoiceWaveform.tsx`

**Props**:
- `isActive: boolean`

**Funcionalidad**:
- Renderizar 12 barras verticales
- Animación tipo Siri (altura variable, pulse)
- Cuando `isActive=true`: barras animadas
- Cuando `isActive=false`: barras estáticas pequeñas

### 7. Integrar Botón en Burbuja del Chatbot

**Archivo**: Donde esté la burbuja embebida (probablemente `/app/routes/chat_.embed.tsx`)

**Agregar**:
- Botón de teléfono (react-icons `FiPhone`)
- Posición: Esquina superior derecha, junto a otros controles
- Solo visible si `chatbot.voiceEnabled === true`
- Al hacer click: Abrir modal `<VoiceChat />`

### 8. Script de Testing

#### `/scripts/test-voice-integration.ts`

**Flujo de prueba**:
1. Verificar que worker está corriendo
2. Crear sesión via API con API key de testing
3. Verificar que se retorna token y wsUrl
4. Simular conexión (opcional, puede ser manual en navegador)
5. Esperar 2 minutos simulados
6. Finalizar sesión
7. Verificar que se cobraron ~10 créditos (2 min × 5)
8. Verificar stats de créditos de voz

**Ejecución**:
```bash
FORMMY_TEST_API_KEY=sk_live_xxx npx tsx scripts/test-voice-integration.ts
```

### 9. Actualizar Documentación

#### `/CLAUDE.md`

**Actualizar sección "LiveKit Voice AI"**:
- Arquitectura correcta (Worker separado)
- Solo Cartesia (remover Inworld y ElevenLabs)
- Límites sin STARTER
- Precio ENTERPRISE correcto ($2,490)
- Márgenes actualizados
- Instrucciones para ejecutar worker
- Comandos: `npm run voice:dev` y `npm run voice:start`

---

## Deployment

### Worker de LiveKit Agents

**Opciones**:

1. **Fly.io** (recomendado si ya está ahí Formmy):
   - Crear app separada: `formmy-voice-worker`
   - Dockerfile específico para el worker
   - Variables de entorno LiveKit configuradas
   - Comando: `npm run voice:start`

2. **Railway/Render**:
   - Servicio separado del backend principal
   - Más simple si no quieres gestionar Dockerfiles

3. **Local (testing)**:
   - `npm run voice:dev`
   - Solo para desarrollo

**IMPORTANTE**: El worker debe estar corriendo 24/7 para aceptar jobs cuando se creen rooms.

---

## Orden de Implementación Recomendado

1. ✅ Instalar dependencias: `@livekit/agents`, plugin Silero
2. ✅ Ajustar backend existente (límites, validaciones, metadata)
3. ✅ Crear worker de LiveKit Agents
4. ✅ Agregar scripts a package.json
5. ✅ Dashboard UI (Voice Settings card)
6. ✅ Componente VoiceChat (modal)
7. ✅ Componente VoiceWaveform (visualización)
8. ✅ Integrar botón en burbuja
9. ✅ Script de testing
10. ✅ Testing local (worker + frontend)
11. ✅ Actualizar CLAUDE.md
12. ✅ Deploy worker a producción

---

## Archivos a Crear (4)

1. `/server/voice/livekit-agent-worker.ts` - Worker principal (~200 líneas)
2. `/app/components/VoiceChat.tsx` - Modal de llamada (~200 líneas)
3. `/app/components/VoiceWaveform.tsx` - Visualización (~50 líneas)
4. `/scripts/test-voice-integration.ts` - Testing (~100 líneas)

## Archivos a Modificar (5)

1. `/server/voice/livekit-voice.service.ts` - Config de proveedores
2. `/server/llamaparse/credits.service.ts` - Límites sin STARTER
3. `/app/routes/api.voice.v1.ts` - Metadata + validaciones
4. `/app/routes/dashboard.chatbots.$id.tsx` - Voice Settings UI
5. `/CLAUDE.md` - Docs actualizadas
6. `/package.json` - Scripts de worker

---

## Estimación de Tiempo

- **Backend ajustes**: 2-3 horas
- **Worker de LiveKit**: 4-6 horas (incluyendo testing de tools)
- **Frontend (UI + componentes)**: 6-8 horas
- **Testing e integración**: 3-4 horas
- **Deploy del worker**: 2-3 horas

**Total**: 2-3 días de desarrollo para demo funcional completo

---

## Notas Importantes

1. **NO implementar SDK npm** - Solo para producción, no para demo
2. **NO implementar widget embebible** - Solo para producción
3. **Enfocarse en la integración funcional** - Botón en burbuja + modal + worker
4. **Testing exhaustivo de costos** - Verificar que cálculo de créditos sea exacto
5. **Monitoreo de márgenes** - Con Cartesia márgenes son saludables (91-95%)
6. **El worker ES CRÍTICO** - Sin él, nada funciona. Debe estar corriendo siempre.

---

## Próximos Pasos (Post-Demo)

Una vez que el demo funcione:

1. **Optimización de costos**: Monitorear uso real, ajustar límites si es necesario
2. **Métricas avanzadas**: Dashboard de analytics de llamadas de voz
3. **Más voces de Cartesia**: Explorar catálogo completo
4. **Transcripciones exportables**: Permitir descargar conversaciones
5. **SDK npm**: Solo si hay demanda de clientes vía API
6. **Widget embebible**: Solo si clientes lo piden para sus sitios
7. **Integración con WhatsApp**: Llamadas de voz via WhatsApp (futuro lejano)
