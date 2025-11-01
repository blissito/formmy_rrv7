/**
 * Voice API v1
 * API REST para gestionar sesiones de voz con LiveKit
 *
 * Endpoints:
 * - POST ?intent=create_session - Crear sesión de voz
 * - GET ?intent=status&sessionId=xxx - Estado de sesión
 * - POST ?intent=end_session&sessionId=xxx - Finalizar sesión
 * - GET ?intent=list - Listar sesiones del usuario
 * - GET ?intent=credits - Obtener créditos de voz disponibles
 */

import { type LoaderFunctionArgs, type ActionFunctionArgs } from "react-router";
import { extractApiKeyFromRequest, authenticateApiKey } from "../../server/chatbot/apiKeyAuth.server";
import { getSession } from "~/sessions";
import {
  createVoiceSession,
  getVoiceSessionStatus,
  endVoiceSession,
  listVoiceSessions,
  type TTSProviderName,
} from "server/voice/livekit-voice.service.server";
import {
  validateVoiceCredits,
  consumeVoiceCredits,
  getVoiceCreditsStats,
} from "server/llamaparse/credits.service";
import { db } from "~/utils/db.server";

/**
 * Dual Authentication Helper
 * Soporta tanto session-based auth (dashboard interno) como API key auth (externo)
 */
async function authenticateRequest(request: Request): Promise<string | null> {
  // 1. Intentar autenticación por sesión (dashboard interno)
  try {
    const session = await getSession(request.headers.get("Cookie"));
    const userIdOrEmail = session.get("userId");

    if (userIdOrEmail) {
      // Buscar por email (ya que session guarda email)
      const user = await db.user.findFirst({
        where: { email: userIdOrEmail },
        select: { id: true },
      });

      if (user) {
        return user.id;
      }
    }
  } catch (err) {
  }

  // 2. Intentar autenticación por API key (externo)
  try {
    const apiKey = await extractApiKeyFromRequest(request);
    if (apiKey) {
      const authResult = await authenticateApiKey(apiKey);
      return authResult.apiKey.user.id;
    }
  } catch (err) {
  }

  return null;
}

/**
 * GET Requests
 */
export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  try {
    // Autenticar (session o API key)
    const userId = await authenticateRequest(request);
    if (!userId) {
      return Response.json(
        { error: "Authentication required. Login to dashboard or use API key (Authorization: Bearer sk_live_xxx)" },
        { status: 401 }
      );
    }

    // GET ?intent=status&sessionId=xxx
    if (intent === "status") {
      const sessionId = url.searchParams.get("sessionId");

      if (!sessionId) {
        return Response.json({ error: "sessionId is required" }, { status: 400 });
      }

      // Verificar que la sesión pertenece al usuario
      const session = await db.voiceSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        return Response.json({ error: "Voice session not found" }, { status: 404 });
      }

      const status = await getVoiceSessionStatus(sessionId);
      return Response.json(status);
    }

    // GET ?intent=list
    if (intent === "list") {
      const chatbotId = url.searchParams.get("chatbotId") || undefined;
      const limit = parseInt(url.searchParams.get("limit") || "50");
      const offset = parseInt(url.searchParams.get("offset") || "0");
      const status = url.searchParams.get("status") as any || undefined;

      const result = await listVoiceSessions({
        userId,
        chatbotId,
        limit,
        offset,
        status,
      });

      return Response.json(result);
    }

    // GET ?intent=credits
    if (intent === "credits") {
      const stats = await getVoiceCreditsStats(userId);
      return Response.json(stats);
    }

    return Response.json({ error: "Invalid intent" }, { status: 400 });
  } catch (error: any) {
    console.error(`❌ Voice API error (GET ${intent}):`, error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST Requests
 */
export async function action({ request }: ActionFunctionArgs) {
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  try {
    // Autenticar (session o API key)
    const userId = await authenticateRequest(request);
    if (!userId) {
      return Response.json(
        { error: "Authentication required. Login to dashboard or use API key (Authorization: Bearer sk_live_xxx)" },
        { status: 401 }
      );
    }

    // POST ?intent=create_session
    if (intent === "create_session") {
      const body = await request.json();
      const {
        chatbotId,
        conversationId,
        ttsProvider = "elevenlabs", // ✅ ElevenLabs es el único proveedor soportado
        ttsVoiceId,
        sttLanguage = "es",
      } = body;

      if (!chatbotId) {
        return Response.json({ error: "chatbotId is required" }, { status: 400 });
      }

      // 🔒 VALIDACIÓN 1: Verificar plan del usuario
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { plan: true },
      });

      if (!user) {
        return Response.json({ error: "User not found" }, { status: 404 });
      }

      // Bloquear FREE y STARTER (sin acceso a voz)
      if (user.plan === "FREE" || user.plan === "STARTER") {
        return Response.json(
          {
            error: "Voice AI requires PRO plan or higher",
            details: {
              currentPlan: user.plan,
              requiredPlan: "PRO",
              message: "Upgrade to PRO to use voice conversations with your chatbots"
            }
          },
          { status: 403 }
        );
      }

      // Validar que el chatbot pertenece al usuario
      const chatbot = await db.chatbot.findFirst({
        where: {
          id: chatbotId,
          userId,
        },
      });

      if (!chatbot) {
        return Response.json({ error: "Chatbot not found or unauthorized" }, { status: 404 });
      }

      // ✅ Verificar que el chatbot tiene integración de VOICE activa
      const voiceIntegration = await db.integration.findFirst({
        where: {
          chatbotId,
          platform: "VOICE",
          isActive: true,
        },
      });

      if (!voiceIntegration) {
        return Response.json(
          { error: "Voice is not enabled for this chatbot. Enable it in dashboard settings." },
          { status: 403 }
        );
      }

      // 🎤 Obtener ttsVoiceId de la integración (configurado en el modal)
      const integrationMetadata = (voiceIntegration.metadata as any) || {};
      // Default: Leo Moreno (ÚNICA voz nativa mexicana disponible en ElevenLabs)
      // ⚠️ IMPORTANTE: Este voice ID se pasa a LiveKit, que maneja la orquestación completa
      const voiceId = ttsVoiceId || integrationMetadata.ttsVoiceId || "3l9iCMrNSRR0w51JvFB0";

      // Validar proveedor TTS (solo ElevenLabs es soportado)
      if (!["elevenlabs"].includes(ttsProvider)) {
        return Response.json(
          { error: "Invalid ttsProvider. Currently only 'elevenlabs' is supported" },
          { status: 400 }
        );
      }

      // Validar créditos de voz (estimado: 5 minutos)
      const creditCheck = await validateVoiceCredits(userId, 5);
      if (!creditCheck.available) {
        return Response.json(
          {
            error: "Insufficient voice credits",
            details: {
              creditsAvailable: creditCheck.creditsAvailable,
              creditsRequired: creditCheck.creditsRequired,
              minutesAvailable: creditCheck.minutesAvailable,
            },
          },
          { status: 402 } // Payment Required
        );
      }

      // 📦 Preparar metadata del chatbot para el worker
      const chatbotMetadata = {
        personality: chatbot.agentType || "customer_support",
        instructions: chatbot.instructions || "Eres un asistente de voz útil y profesional.",
        customInstructions: chatbot.customInstructions || "",
        voiceWelcome: chatbot.voiceWelcome || "Hola, ¿en qué puedo ayudarte hoy?",
      };

      // Crear sesión de voz
      const session = await createVoiceSession({
        userId,
        chatbotId,
        conversationId,
        ttsProvider: ttsProvider as TTSProviderName,
        ttsVoiceId: voiceId, // ✅ Usar la voz configurada en la integración
        sttLanguage: sttLanguage || chatbot.sttLanguage,
        metadata: chatbotMetadata,
      });

      return Response.json(
        {
          sessionId: session.sessionId,
          token: session.token,
          wsUrl: session.wsUrl,
          roomName: session.roomName,
          ttsProvider: session.ttsProvider,
          ttsVoiceId: session.ttsVoiceId,
          expiresAt: session.expiresAt,
          creditsPerMinute: 5,
          estimatedMinutesAvailable: creditCheck.minutesAvailable,
        },
        { status: 201 }
      );
    }

    // POST ?intent=end_session&sessionId=xxx
    if (intent === "end_session") {
      const sessionId = url.searchParams.get("sessionId");

      if (!sessionId) {
        return Response.json({ error: "sessionId is required" }, { status: 400 });
      }

      // Verificar que la sesión pertenece al usuario
      const session = await db.voiceSession.findFirst({
        where: {
          id: sessionId,
          userId,
        },
      });

      if (!session) {
        return Response.json({ error: "Voice session not found" }, { status: 404 });
      }

      // Obtener transcripción del body (opcional)
      const body = await request.json().catch(() => ({}));
      const { transcription } = body;

      // Finalizar sesión
      const result = await endVoiceSession({
        sessionId,
        transcription,
      });

      // Consumir créditos
      if (result.durationMinutes > 0) {
        const creditResult = await consumeVoiceCredits(userId, result.durationMinutes);
      }

      return Response.json({
        sessionId: result.sessionId,
        durationMinutes: result.durationMinutes,
        creditsUsed: result.creditsUsed,
        transcription: result.transcription,
      });
    }

    return Response.json({ error: "Invalid intent" }, { status: 400 });
  } catch (error: any) {
    console.error(`❌ Voice API error (POST ${intent}):`, error);
    return Response.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
