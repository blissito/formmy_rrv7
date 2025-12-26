import { db } from "~/utils/db.server";

/**
 * SSE Endpoint para streaming de mensajes nuevos en tiempo real
 *
 * Implementación minimalista:
 * - Polling interno cada 1 segundo para detectar mensajes nuevos
 * - Push real-time via SSE cuando hay mensajes nuevos del ASSISTANT
 * - Heartbeat cada 30s para mantener conexión viva
 * - Auto-cleanup después de 10 minutos
 *
 * Escalabilidad futura: Reemplazar polling interno con Redis pub/sub
 */

export async function loader({ request, params }: Route.LoaderArgs) {
  const { conversationId: sessionIdOrConversationId } = params;

  if (!sessionIdOrConversationId) {
    return new Response("Session ID or Conversation ID required", { status: 400 });
  }

  // Buscar conversación por ID directo o por sessionId
  let conversation = await db.conversation.findUnique({
    where: { id: sessionIdOrConversationId }
  }).catch(() => null);

  // Si no se encuentra por ID, buscar por sessionId
  if (!conversation) {
    conversation = await db.conversation.findUnique({
      where: { sessionId: sessionIdOrConversationId }
    });
  }

  if (!conversation) {
    return new Response("Conversation not found", { status: 404 });
  }

  const conversationId = conversation.id;

  // Crear stream SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      let lastCheck = new Date();
      let isActive = true;


      // Helper para enviar eventos SSE
      const sendEvent = (data: any) => {
        try {
          const payload = JSON.stringify(data);
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch (error) {
          console.error("❌ Error encoding SSE event:", error);
        }
      };

      // Enviar mensaje inicial de conexión
      sendEvent({
        type: "connected",
        conversationId,
        timestamp: new Date().toISOString()
      });

      // Polling interno cada 1 segundo para detectar mensajes nuevos
      const pollingInterval = setInterval(async () => {
        if (!isActive) return;

        try {
          // ✅ FIX: Buscar TODOS los mensajes nuevos (USER y ASSISTANT)
          const newMessages = await db.message.findMany({
            where: {
              conversationId,
              createdAt: { gt: lastCheck }
            },
            orderBy: { createdAt: "asc" }
          });

          if (newMessages.length > 0) {

            // Enviar mensajes nuevos al cliente (USER y ASSISTANT)
            sendEvent({
              type: "new_messages",
              messages: newMessages.map(msg => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                createdAt: msg.createdAt,
                channel: msg.channel
              }))
            });

            // Actualizar timestamp de última verificación
            lastCheck = new Date();
          }
        } catch (error) {
          console.error("❌ Error polling for new messages:", error);
          sendEvent({
            type: "error",
            message: "Error checking for new messages"
          });
        }
      }, 1000); // Verificar cada 1 segundo

      // Heartbeat cada 30 segundos para mantener conexión viva
      const heartbeatInterval = setInterval(() => {
        if (isActive) {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`));
          } catch (error) {
            console.error("❌ Error sending heartbeat:", error);
          }
        }
      }, 30000); // 30 segundos

      // Auto-cleanup después de 10 minutos
      const cleanupTimeout = setTimeout(() => {
        isActive = false;
        clearInterval(pollingInterval);
        clearInterval(heartbeatInterval);

        try {
          sendEvent({
            type: "timeout",
            message: "Connection closed after 10 minutes"
          });
          controller.close();
        } catch (error) {
          console.error("❌ Error closing stream:", error);
        }
      }, 600000); // 10 minutos

      // Cleanup cuando el cliente cierra la conexión
      request.signal.addEventListener("abort", () => {
        isActive = false;
        clearInterval(pollingInterval);
        clearInterval(heartbeatInterval);
        clearTimeout(cleanupTimeout);

        try {
          controller.close();
        } catch (error) {
          // Stream ya cerrado, ignorar error
        }
      });
    }
  });

  // Retornar respuesta con headers SSE apropiados
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no" // Disable nginx buffering
    }
  });
}
