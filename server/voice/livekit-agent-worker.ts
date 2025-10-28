/**
 * LiveKit Agent Worker
 * Worker que procesa conversaciones de voz usando LiveKit Inference Gateway
 */

import "dotenv/config";
import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  voice,
} from '@livekit/agents';
import * as silero from '@livekit/agents-plugin-silero';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import { fileURLToPath } from 'node:url';

if (!process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
  console.error("❌ Faltan LIVEKIT_API_KEY o LIVEKIT_API_SECRET");
  process.exit(1);
}

if (!process.env.OPENAI_API_KEY) {
  console.error("❌ Falta OPENAI_API_KEY");
  process.exit(1);
}

if (!process.env.ELEVEN_API_KEY) {
  console.error("❌ Falta ELEVEN_API_KEY (requerida para ElevenLabs plugin con voces custom)");
  process.exit(1);
}

console.log("🚀 LiveKit Agent Worker starting...");
console.log(`📡 LiveKit URL: ${process.env.LIVEKIT_URL || 'wss://webrtcblissmo-ughbu8uu.livekit.cloud'}`);

export default defineAgent({
  // Prewarm: cargar modelos antes de procesar jobs
  prewarm: async (proc: JobProcess) => {
    console.log("🔥 Prewarming: Cargando modelo Silero VAD...");
    proc.userData.vad = await silero.VAD.load();
    console.log("✅ Silero VAD cargado");
  },

  entry: async (ctx: JobContext) => {
    console.log(`🎙️ Nuevo job de voz: Room ${ctx.room.name}`);

    // Obtener VAD del prewarm
    const vad = ctx.proc.userData.vad! as silero.VAD;

    // 🔍 AUDITORÍA: Ver TODOS los lugares donde puede estar el metadata
    console.log(`\n${'🔍'.repeat(40)}`);
    console.log(`🔍 [AUDITORÍA] Buscando metadata en TODOS los lugares posibles:`);
    console.log(`   1. ctx.room.metadata: ${ctx.room.metadata}`);
    console.log(`   2. ctx.job disponible: ${!!ctx.job}`);

    // Intentar leer desde el job primero (donde SÍ viene en los logs)
    let roomMetadataString = ctx.room.metadata;

    if (!roomMetadataString && (ctx as any).job?.room?.metadata) {
      console.log(`   ✅ Metadata encontrado en ctx.job.room.metadata`);
      roomMetadataString = (ctx as any).job.room.metadata;
    }

    console.log(`   3. Metadata string final a parsear: ${roomMetadataString?.substring(0, 100)}...`);

    const metadata = roomMetadataString ? JSON.parse(roomMetadataString) : {};

    console.log(`\n   Metadata PARSEADO:`, JSON.stringify(metadata, null, 2));
    console.log(`${'🔍'.repeat(40)}\n`);

    const {
      instructions = "Eres un asistente de voz útil y profesional.",
      customInstructions = "",
      voiceWelcome = "Hola, ¿en qué puedo ayudarte hoy?",
      ttsVoiceId = "3l9iCMrNSRR0w51JvFB0", // Leo Moreno - ÚNICA voz nativa mexicana en nuestra cuenta ElevenLabs
    } = metadata;

    console.log(`📌 Valores extraídos del metadata:`);
    console.log(`   instructions: "${instructions}"`);
    console.log(`   customInstructions: "${customInstructions}"`);
    console.log(`   customInstructions.length: ${customInstructions.length}`);

    // 🎯 CONSTRUIR PROMPT CON PRIORIDAD A CUSTOM INSTRUCTIONS
    let systemPrompt = "";

    if (customInstructions && customInstructions.trim()) {
      // Si hay customInstructions, son PRIORIDAD MÁXIMA
      systemPrompt = `🎯 TU PERSONALIZACIÓN (PRIORIDAD MÁXIMA):

${customInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANTE PARA VOZ:
- Respuestas ULTRA CORTAS (1-2 oraciones máximo)
- Conversacional y natural
- Sin listas largas ni explicaciones extensas`;
    } else {
      // Fallback a instrucciones genéricas
      systemPrompt = `${instructions}

IMPORTANTE PARA VOZ:
- Respuestas ULTRA CORTAS (1-2 oraciones máximo)
- Conversacional y natural
- Sin listas largas ni explicaciones extensas`;
    }

    console.log(`\n${'📋'.repeat(40)}`);
    console.log(`📋 [VOICE WORKER] System prompt construido:`);
    console.log(`   customInstructions presente: ${!!customInstructions && !!customInstructions.trim()}`);
    if (customInstructions) {
      console.log(`   customInstructions: "${customInstructions}"`);
    }
    console.log(`\n   SYSTEM PROMPT COMPLETO:\n${systemPrompt}`);
    console.log(`${'📋'.repeat(40)}\n`);
    console.log(`🎤 Voice ID configurada: ${ttsVoiceId}`);

    // Crear el agente
    const assistant = new voice.Agent({
      instructions: systemPrompt,
    });

    // ⚠️ CRÍTICO: Usar ElevenLabs Plugin con configuración CORRECTA
    // Esto permite usar voces nativas en español (Leo Moreno)
    const tts = new elevenlabs.TTS({
      voice: { id: ttsVoiceId }, // ✅ Formato correcto según docs LiveKit
      model: "eleven_turbo_v2_5", // Modelo rápido y de alta calidad
      language: "es", // ✅ Español (código ISO-639-1)
      streaming_latency: 1, // ✅ Baja latencia (1 segundo, default es 3)
    });

    // Crear la sesión de voz con ElevenLabs Plugin + VAD
    // USANDO DEEPGRAM STT + ELEVENLABS PLUGIN TTS con voz nativa mexicana
    const session = new voice.AgentSession({
      vad, // ✅ Voice Activity Detection
      stt: "deepgram/nova-2-general:es", // ✅ Deepgram Nova-2 - ESPAÑOL (idioma ISO-639-1)
      llm: "openai/gpt-4o-mini",
      tts, // ✅ ElevenLabs Plugin con voz custom (Leo Moreno)
    });

    console.log(`🎙️ Configuración: VAD=Silero, STT=deepgram/nova-2:es, LLM=gpt-4o-mini, TTS=ElevenLabs Plugin (${ttsVoiceId})`);

    // Conectarse al room
    await ctx.connect();
    console.log(`✅ Conectado a room: ${ctx.room.name}`);

    // Iniciar sesión con mejores opciones de input
    await session.start({
      agent: assistant,
      room: ctx.room,
    });

    console.log("✅ Sesión de voz iniciada con VAD y turn-detection");

    // ⚠️ IMPORTANTE: Esperar a que el participante (usuario) se conecte antes de enviar saludo
    console.log("⏳ Esperando a que el usuario se conecte...");

    // Esperar a que haya al menos 1 participante remoto (el usuario)
    const waitForParticipant = new Promise<void>((resolve) => {
      const checkParticipants = () => {
        const remoteParticipants = Array.from(ctx.room.remoteParticipants.values());
        if (remoteParticipants.length > 0) {
          console.log(`✅ Usuario conectado: ${remoteParticipants[0].identity}`);
          resolve();
        } else {
          setTimeout(checkParticipants, 100); // Revisar cada 100ms
        }
      };
      checkParticipants();
    });

    await waitForParticipant;

    // ⚠️ CRÍTICO: Esperar más tiempo para que el cliente esté completamente listo
    // El cliente necesita tiempo para:
    // 1. Conectarse al room
    // 2. Configurar event listeners
    // 3. Estar listo para suscribirse a tracks del agente
    console.log("⏳ Esperando 2 segundos para que cliente esté listo...");
    await new Promise(r => setTimeout(r, 2000)); // Aumentado de 500ms a 2s

    // Ahora sí, enviar mensaje de bienvenida usando say() para TTS directo
    console.log(`💬 Enviando mensaje de bienvenida: "${voiceWelcome}"`);
    console.log(`🎤 Con voz: ${ttsVoiceId} (Leo Moreno - Voz nativa mexicana)`);

    try {
      await session.say(voiceWelcome, {
        allowInterruptions: true, // ✅ Permitir que el usuario interrumpa
      });
      console.log("✅ Mensaje de bienvenida enviado exitosamente");
    } catch (error) {
      console.error("❌ Error al enviar mensaje de bienvenida:", error);
    }

    // Auto-disconnect a los 10 minutos
    setTimeout(async () => {
      console.log("⏱️ Límite de 10 minutos alcanzado");
      await session.say("Hemos llegado al límite de tiempo. Fue un placer ayudarte. ¡Hasta luego!");
      await new Promise(r => setTimeout(r, 5000));
      await ctx.disconnect();
    }, 10 * 60 * 1000);

    console.log("✅ Agente de voz activo y escuchando con turn-taking...");
  },
});

// ⚠️ CRÍTICO: Pasar el path del archivo al WorkerOptions
cli.runApp(new WorkerOptions({ agent: fileURLToPath(import.meta.url) }));
