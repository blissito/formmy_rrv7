/**
 * GET /api/v0/chatbot/conversations/:sessionId - Cargar historial
 * POST /api/v0/chatbot/conversations/:sessionId - Acciones (end_conversation)
 */

import type { LoaderFunctionArgs, ActionFunctionArgs } from "react-router";
import { authenticateRequest } from "../../server/chatbot-v0/auth";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { sessionId } = params;

  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: "sessionId requerido",
        userMessage: "No se proporcionó un ID de sesión."
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
          error: "No autorizado",
          userMessage: "Debes iniciar sesión para ver el historial."
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cargar conversación desde DB
    const { getConversationBySessionId } = await import("../../server/chatbot/conversationModel.server");
    const { getMessagesByConversationId } = await import("../../server/chatbot/messageModel.server");

    const conversation = await getConversationBySessionId(sessionId);

    if (!conversation) {
      // Si no existe la conversación, retornar array vacío (no es error)
      return new Response(
        JSON.stringify({
          messages: [],
          sessionId,
          conversationId: null
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Cargar mensajes de la conversación
    const allMessages = await getMessagesByConversationId(conversation.id);

    // Filtrar mensajes system (solo para backend, no para UI)
    const userVisibleMessages = allMessages.filter(msg => msg.role.toLowerCase() !== 'system');

    // Truncar a últimos 50 mensajes (suficiente para contexto)
    const recentMessages = userVisibleMessages.slice(-50);

    // Formatear mensajes para el frontend
    const formattedMessages = recentMessages.map(msg => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
      tokens: msg.tokens,
      aiModel: msg.aiModel
    }));

    return new Response(
      JSON.stringify({
        messages: formattedMessages,
        sessionId: conversation.sessionId,
        conversationId: conversation.id,
        totalMessages: allMessages.length,
        truncated: allMessages.length > 50
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
    console.error("❌ Error cargando historial de conversación:", error);

    return new Response(
      JSON.stringify({
        error: "Error del servidor",
        userMessage: "No se pudo cargar el historial de la conversación."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * POST action para terminar conversación
 */
export async function action({ request, params }: ActionFunctionArgs) {
  const { sessionId } = params;

  if (!sessionId) {
    return new Response(
      JSON.stringify({
        error: "sessionId requerido",
        userMessage: "No se proporcionó un ID de sesión."
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    // Autenticación
    const { user } = await authenticateRequest(request, formData);

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "No autorizado",
          userMessage: "Debes iniciar sesión."
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    switch (intent) {
      case "end_conversation": {
        // Terminar conversación (marcar como COMPLETED)
        const {
          getConversationBySessionId,
          updateConversationStatus
        } = await import("../../server/chatbot/conversationModel.server");

        const conversation = await getConversationBySessionId(sessionId);

        if (!conversation) {
          return new Response(
            JSON.stringify({
              error: "Conversación no encontrada",
              userMessage: "No se encontró la conversación."
            }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        // Marcar como COMPLETED
        await updateConversationStatus(conversation.id, "COMPLETED");

        return new Response(
          JSON.stringify({
            success: true,
            message: "Conversación terminada exitosamente",
            sessionId
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default: {
        return new Response(
          JSON.stringify({
            error: "Intent no soportado",
            userMessage: `El intent '${intent}' no es válido.`
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }

  } catch (error) {
    console.error("❌ Error en action de conversación:", error);

    return new Response(
      JSON.stringify({
        error: "Error del servidor",
        userMessage: "No se pudo procesar la acción."
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
