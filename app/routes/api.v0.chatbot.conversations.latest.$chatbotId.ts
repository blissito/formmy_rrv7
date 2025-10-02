/**
 * GET /api/v0/chatbot/conversations/latest/:chatbotId
 * Devuelve la última conversación ACTIVA del usuario para un chatbot específico
 */

import type { LoaderFunctionArgs } from "react-router";
import { authenticateRequest } from "../../server/chatbot-v0/auth";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { chatbotId } = params;

  if (!chatbotId) {
    return new Response(
      JSON.stringify({
        messages: [],
        error: "chatbotId requerido"
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    // Autenticación
    const { user } = await authenticateRequest(request);

    if (!user) {
      return new Response(
        JSON.stringify({
          messages: [],
          error: "No autorizado"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Buscar última conversación ACTIVA del usuario para este chatbot
    const { findLastActiveConversation } = await import("../../server/chatbot/conversationModel.server");
    const { getMessagesByConversationId } = await import("../../server/chatbot/messageModel.server");

    const conversation = await findLastActiveConversation({
      chatbotId,
      visitorId: user.id
    });

    if (!conversation) {
      // No hay conversación previa - retornar array vacío
      return new Response(
        JSON.stringify({
          messages: [],
          sessionId: null
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cargar mensajes de la conversación
    const allMessages = await getMessagesByConversationId(conversation.id);

    // Formatear mensajes para el frontend (FILTRAR mensajes SYSTEM - solo para backend)
    const formattedMessages = allMessages
      .filter(msg => msg.role.toLowerCase() !== 'system') // ✅ Excluir system messages del UI
      .map(msg => ({
        role: msg.role.toLowerCase() as "user" | "assistant",
        content: msg.content
      }));

    return new Response(
      JSON.stringify({
        messages: formattedMessages,
        sessionId: conversation.sessionId,
        conversationId: conversation.id
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
        }
      }
    );

  } catch (error) {
    console.error("❌ Error cargando última conversación:", error);

    return new Response(
      JSON.stringify({
        messages: [],
        error: "Error del servidor"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
