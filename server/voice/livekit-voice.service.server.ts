import { AccessToken, RoomServiceClient } from "livekit-server-sdk";
import { db } from "~/utils/db.server";
import type { VoiceSessionStatus } from "@prisma/client";

/**
 * LiveKit Voice Service
 * Gestiona la creación de rooms, tokens y sesiones de voz para conversaciones bidireccionales
 */

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL || "wss://formmy.livekit.cloud";

if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET) {
  console.warn("⚠️ LiveKit credentials not configured. Voice AI features will be disabled.");
}

// Cliente para gestionar rooms
const roomClient = LIVEKIT_API_KEY && LIVEKIT_API_SECRET
  ? new RoomServiceClient(LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
  : null;

/**
 * Configuración de TTS Providers
 *
 * ⚠️ ARQUITECTURA IMPORTANTE:
 * - LiveKit maneja TODA la orquestación de voz (STT + LLM + TTS)
 * - ElevenLabs API Key es SOLO para consultar voces disponibles
 * - Los voice IDs se pasan a LiveKit, NO se usan directamente
 * - LiveKit usa su Inference Gateway para comunicarse con ElevenLabs
 *
 * ✅ VOZ VERIFICADA (Enero 2025):
 * - Leo Moreno: ÚNICA voz nativa mexicana disponible en ElevenLabs
 */
export const TTS_PROVIDERS = {
  elevenlabs: {
    name: "ElevenLabs",
    description: "Voz nativa mexicana - Leo Moreno (vía LiveKit Inference Gateway)",
    defaultVoice: "3l9iCMrNSRR0w51JvFB0", // Leo Moreno - Voz nativa mexicana masculina
    voices: {
      "leo_moreno": "3l9iCMrNSRR0w51JvFB0", // Male - Nativo mexicano, calmado, conversacional
    }
  },
} as const;

export type TTSProviderName = keyof typeof TTS_PROVIDERS;

/**
 * Crea una sesión de voz completa:
 * 1. Crea el room en LiveKit
 * 2. Genera token de acceso para el cliente
 * 3. Registra la sesión en BD
 */
export async function createVoiceSession({
  userId,
  chatbotId,
  conversationId,
  ttsProvider = "elevenlabs", // ✅ ÚNICO proveedor soportado - NO usar Cartesia/Inworld
  ttsVoiceId,
  sttLanguage = "es",
  metadata,
}: {
  userId: string;
  chatbotId: string;
  conversationId?: string;
  ttsProvider?: TTSProviderName;
  ttsVoiceId?: string;
  sttLanguage?: string;
  metadata?: Record<string, any>;
}) {
  if (!roomClient) {
    throw new Error("LiveKit not configured. Set LIVEKIT_API_KEY and LIVEKIT_API_SECRET");
  }

  // Generar nombres únicos
  const roomName = `voice_${chatbotId}_${Date.now()}`;
  const participantName = `user_${userId.substring(0, 8)}`;

  // Preparar metadata del room (lo lee el worker)
  const roomMetadata = JSON.stringify({
    chatbotId,
    userId,
    ttsVoiceId: ttsVoiceId || TTS_PROVIDERS[ttsProvider].defaultVoice,
    ...metadata, // personality, instructions, voiceWelcome, etc.
  });

  // 1. Crear room en LiveKit con metadata
  const room = await roomClient.createRoom({
    name: roomName,
    emptyTimeout: 60 * 5, // 5 minutos de timeout si está vacío
    maxParticipants: 2, // Usuario + Agente
    metadata: roomMetadata,
  });

  // 2. Generar token de acceso para el cliente
  const token = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: participantName,
    ttl: 60 * 60, // 1 hora de validez
  });

  token.addGrant({
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
  });

  const accessToken = await token.toJwt();

  // 3. Determinar voz a usar
  const voiceId = ttsVoiceId || TTS_PROVIDERS[ttsProvider].defaultVoice;

  // 4. Crear sesión en BD
  const session = await db.voiceSession.create({
    data: {
      userId,
      chatbotId,
      conversationId,
      roomId: room.sid,
      roomName: roomName,
      participantSid: null, // Se actualizará cuando el participante se conecte
      ttsProvider,
      ttsVoiceId: voiceId,
      sttLanguage,
      status: "ACTIVE",
      creditsUsed: 0,
      messageCount: 0,
    },
  });


  return {
    sessionId: session.id,
    roomId: room.sid,
    roomName,
    token: accessToken,
    wsUrl: LIVEKIT_URL,
    ttsProvider,
    ttsVoiceId: voiceId,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Obtiene el estado actual de una sesión de voz
 */
export async function getVoiceSessionStatus(sessionId: string) {
  const session = await db.voiceSession.findUnique({
    where: { id: sessionId },
    include: {
      chatbot: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
  });

  if (!session) {
    throw new Error("Voice session not found");
  }

  // Calcular duración si está activa
  let durationSeconds = 0;
  if (session.status === "ACTIVE") {
    durationSeconds = Math.floor((Date.now() - session.startTime.getTime()) / 1000);
  } else if (session.durationMinutes) {
    durationSeconds = Math.floor(session.durationMinutes * 60);
  }

  return {
    sessionId: session.id,
    chatbotId: session.chatbotId,
    chatbotName: session.chatbot.name,
    status: session.status,
    startTime: session.startTime.toISOString(),
    endTime: session.endTime?.toISOString(),
    durationSeconds,
    durationMinutes: session.durationMinutes,
    creditsUsed: session.creditsUsed,
    messageCount: session.messageCount,
    transcription: session.transcription,
    errorMessage: session.errorMessage,
  };
}

/**
 * Finaliza una sesión de voz:
 * 1. Calcula duración y créditos
 * 2. Cierra el room en LiveKit
 * 3. Actualiza estado en BD
 */
export async function endVoiceSession({
  sessionId,
  transcription,
}: {
  sessionId: string;
  transcription?: string;
}) {
  const session = await db.voiceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Voice session not found");
  }

  if (session.status !== "ACTIVE") {
    throw new Error(`Cannot end session with status: ${session.status}`);
  }

  // Calcular duración en minutos
  const endTime = new Date();
  const durationMs = endTime.getTime() - session.startTime.getTime();
  const durationMinutes = durationMs / 1000 / 60;

  // Calcular créditos (5 créditos por minuto, redondear hacia arriba)
  const creditsUsed = Math.ceil(durationMinutes * 5);

  // Cerrar room en LiveKit (opcional, se cerrará automáticamente por timeout)
  if (roomClient) {
    try {
      await roomClient.deleteRoom(session.roomName);
    } catch (error) {
      console.error(`⚠️ Failed to delete LiveKit room: ${error}`);
    }
  }

  // Actualizar sesión en BD
  const updatedSession = await db.voiceSession.update({
    where: { id: sessionId },
    data: {
      status: "COMPLETED",
      endTime,
      durationMinutes,
      creditsUsed,
      transcription: transcription || session.transcription,
    },
  });


  return {
    sessionId: updatedSession.id,
    durationMinutes: updatedSession.durationMinutes!,
    creditsUsed: updatedSession.creditsUsed,
    transcription: updatedSession.transcription,
  };
}

/**
 * Marca una sesión como error
 */
export async function failVoiceSession(sessionId: string, errorMessage: string) {
  const session = await db.voiceSession.findUnique({
    where: { id: sessionId },
  });

  if (!session) {
    throw new Error("Voice session not found");
  }

  // Calcular duración hasta el momento del error
  const endTime = new Date();
  const durationMs = endTime.getTime() - session.startTime.getTime();
  const durationMinutes = durationMs / 1000 / 60;
  const creditsUsed = Math.ceil(durationMinutes * 5);

  await db.voiceSession.update({
    where: { id: sessionId },
    data: {
      status: "ERROR",
      endTime,
      durationMinutes,
      creditsUsed,
      errorMessage,
    },
  });

  console.error(`❌ Voice session failed: ${sessionId} - ${errorMessage}`);
}

/**
 * Lista sesiones de voz de un usuario
 */
export async function listVoiceSessions({
  userId,
  chatbotId,
  limit = 50,
  offset = 0,
  status,
}: {
  userId: string;
  chatbotId?: string;
  limit?: number;
  offset?: number;
  status?: VoiceSessionStatus;
}) {
  const where: any = { userId };
  if (chatbotId) where.chatbotId = chatbotId;
  if (status) where.status = status;

  const sessions = await db.voiceSession.findMany({
    where,
    include: {
      chatbot: {
        select: {
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { startTime: "desc" },
    take: limit,
    skip: offset,
  });

  const total = await db.voiceSession.count({ where });

  return {
    sessions: sessions.map((s: any) => ({
      sessionId: s.id,
      chatbotId: s.chatbotId,
      chatbotName: s.chatbot.name,
      status: s.status,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime?.toISOString(),
      durationMinutes: s.durationMinutes,
      creditsUsed: s.creditsUsed,
      messageCount: s.messageCount,
    })),
    total,
    hasMore: total > offset + limit,
  };
}

/**
 * Actualiza el contador de mensajes de una sesión
 */
export async function incrementMessageCount(sessionId: string) {
  await db.voiceSession.update({
    where: { id: sessionId },
    data: {
      messageCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Actualiza la transcripción parcial de una sesión
 */
export async function updateTranscription(sessionId: string, transcription: string) {
  await db.voiceSession.update({
    where: { id: sessionId },
    data: { transcription },
  });
}
