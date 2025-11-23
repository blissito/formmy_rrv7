/**
 * Voice Agent Handler
 * Maneja conversaciones de voz en tiempo real integrando LiveKit con agentes de Formmy
 */

// TODO: MIGRAR A VERCEL AI SDK
// Este archivo usa LlamaIndex Agent Workflows que fue eliminado.
// Voice AI requiere reimplementación completa con Vercel AI SDK.

throw new Error("Voice Agent Handler requiere migración a Vercel AI SDK");

/**
 * Evento de transcripción del STT (Speech-to-Text)
 */
interface TranscriptionEvent {
  text: string;
  isFinal: boolean; // Si es transcripción final o parcial
  timestamp: number;
}

/**
 * Handler principal para una sesión de voz
 * Se ejecuta cuando un usuario se conecta a un room de LiveKit
 */
export class VoiceAgentHandler {
  private sessionId: string;
  private room: Room | null = null;
  private transcriptionBuffer: string[] = [];
  private conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
  private isProcessing = false;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Inicializa el handler y se conecta al room
   */
  async start() {
    const session = await db.voiceSession.findUnique({
      where: { id: this.sessionId },
      include: {
        chatbot: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error(`Voice session not found: ${this.sessionId}`);
    }


    // Conectar al room de LiveKit como agente
    // NOTA: En producción, este handler correría como un servidor separado
    // que escucha eventos de LiveKit vía webhooks o conexión directa

    // Por ahora, este es el esqueleto de la lógica
    // La implementación completa requeriría:
    // 1. LiveKit Agent SDK (livekit-agents)
    // 2. Plugins de STT (AssemblyAI, Deepgram)
    // 3. Plugins de TTS (Cartesia, ElevenLabs)

  }

  /**
   * Procesa un evento de transcripción del usuario
   */
  async handleTranscription(event: TranscriptionEvent) {
    // Solo procesar transcripciones finales
    if (!event.isFinal) {
      return;
    }

    const userMessage = event.text.trim();
    if (!userMessage) {
      return;
    }

    // ✅ Si el usuario interrumpe mientras procesamos, registrar interrupción
    // pero NO ignorar el mensaje (las interrupciones son naturales en voz)
    if (this.isProcessing) {
      // En una implementación completa, aquí podríamos cancelar el procesamiento actual
      // Por ahora, simplemente dejamos que termine y procesamos el nuevo mensaje después
      return;
    }

    this.isProcessing = true;

    try {
      // Agregar a historial
      this.conversationHistory.push({
        role: "user",
        content: userMessage,
      });

      // Obtener datos de sesión
      const session = await db.voiceSession.findUnique({
        where: { id: this.sessionId },
        include: {
          chatbot: {
            include: {
              user: true,
              integrations: true,
            },
          },
        },
      });

      if (!session) {
        throw new Error("Session not found");
      }

      // Construir user object
      const user = {
        id: session.userId,
        plan: session.chatbot.user.plan,
      };

      // Construir integrations object
      const integrations = session.chatbot.integrations.reduce((acc: any, integration: any) => {
        acc[integration.platform] = {
          isActive: integration.isActive,
          ...integration,
        };
        return acc;
      }, {});

      // Construir resolvedConfig
      const resolvedConfig = {
        name: session.chatbot.name,
        personality: session.chatbot.personality || "friendly",
        instructions: session.chatbot.instructions,
        customInstructions: session.chatbot.customInstructions,
        aiModel: session.chatbot.aiModel,
        temperature: session.chatbot.temperature,
      };

      // Construir agentContext con historial conversacional
      const agentContext = {
        conversationId: session.conversationId,
        isGhosty: false,
        conversationHistory: this.conversationHistory, // ✅ Pasar historial completo aquí
        integrations,
      };


      // Llamar al agente de Formmy con streaming (firma correcta)
      let agentResponse = "";

      for await (const chunk of streamAgentWorkflow(
        user,
        userMessage,
        session.chatbotId,
        {
          resolvedConfig,
          agentContext,
        }
      )) {
        if (chunk.type === "text") {
          agentResponse += chunk.content;
        } else if (chunk.type === "tool_call") {
        }
      }


      // Agregar respuesta al historial
      this.conversationHistory.push({
        role: "assistant",
        content: agentResponse,
      });

      // Incrementar contador de mensajes
      await incrementMessageCount(this.sessionId);

      // Actualizar transcripción
      const fullTranscription = this.conversationHistory
        .map((msg) => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
        .join("\n\n");
      await updateTranscription(this.sessionId, fullTranscription);

      // Convertir respuesta a TTS y enviar de vuelta al usuario
      await this.sendVoiceResponse(agentResponse, session.ttsProvider, session.ttsVoiceId);

    } catch (error) {
      console.error(`❌ Error processing transcription: ${error}`);
      await failVoiceSession(this.sessionId, String(error));
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Convierte texto a voz y lo envía al usuario
   */
  private async sendVoiceResponse(
    text: string,
    ttsProvider: string,
    ttsVoiceId: string | null
  ) {
    // NOTA: Esta es una implementación simplificada
    // En producción, usaríamos LiveKit Inference API o plugins de TTS


    // TODO: Implementar TTS con LiveKit Inference API
    // const ttsUrl = `https://api.livekit.io/inference/tts`;
    // const audioBuffer = await fetch(ttsUrl, {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${LIVEKIT_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     text,
    //     provider: ttsProvider, // "cartesia" | "elevenlabs" | "inworld"
    //     voice: ttsVoiceId,
    //     language: "es-MX",
    //   }),
    // });

    // En producción, el audio se enviaría al room de LiveKit
    // y se reproduciría automáticamente en el cliente
  }

  /**
   * Limpia recursos cuando la sesión termina
   */
  async cleanup() {

    if (this.room) {
      // Desconectar del room
      this.room = null;
    }

    // Guardar transcripción final
    const fullTranscription = this.conversationHistory
      .map((msg) => `${msg.role === "user" ? "Usuario" : "Asistente"}: ${msg.content}`)
      .join("\n\n");

    if (fullTranscription) {
      await updateTranscription(this.sessionId, fullTranscription);
    }
  }
}

/**
 * Crea y arranca un handler para una sesión de voz
 */
export async function startVoiceAgentHandler(sessionId: string): Promise<VoiceAgentHandler> {
  const handler = new VoiceAgentHandler(sessionId);
  await handler.start();
  return handler;
}

/**
 * Simula el procesamiento de una transcripción (para testing)
 */
export async function processVoiceTranscription(
  sessionId: string,
  transcription: string
): Promise<string> {
  const handler = new VoiceAgentHandler(sessionId);

  // Procesar transcripción
  await handler.handleTranscription({
    text: transcription,
    isFinal: true,
    timestamp: Date.now(),
  });

  // Retornar el último mensaje del asistente
  const session = await db.voiceSession.findUnique({
    where: { id: sessionId },
  });

  return session?.transcription || "";
}
