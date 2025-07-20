import { ActionArgs, data as json } from "react-router";
import { getChatbotById } from "~/.server/chatbot/chatbotModel";
import { getConversationById } from "~/.server/chatbot/conversationModel";
import {
  addUserMessage,
  addAssistantMessage,
  getMessagesByConversationId,
} from "~/.server/chatbot/messageModel";
import { ConversationStatus } from "@prisma/client";

/**
 * API endpoint para operaciones de mensajes
 */
export const action = async ({ request }: ActionArgs) => {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;

    // Verificar que el usuario está autenticado
    const userId = formData.get("userId") as string;
    if (!userId) {
      return json({ error: "Usuario no autenticado" }, { status: 401 });
    }

    // Árbol de intents para operaciones de mensajes
    switch (intent) {
      case "add_user_message": {
        const conversationId = formData.get("conversationId") as string;
        const content = formData.get("content") as string;
        const visitorIp = (formData.get("visitorIp") as string) || undefined;

        if (!conversationId || !content) {
          return json(
            { error: "ID de conversación o contenido no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la conversación existe
        const conversation = await getConversationById(conversationId);
        if (!conversation) {
          return json({ error: "Conversación no encontrada" }, { status: 404 });
        }

        // Verificar que la conversación está activa
        if (conversation.status !== ConversationStatus.ACTIVE) {
          return json(
            {
              error: `No se pueden añadir mensajes a una conversación ${conversation.status.toLowerCase()}`,
            },
            { status: 400 }
          );
        }

        try {
          const message = await addUserMessage(
            conversationId,
            content,
            visitorIp
          );
          return json({ success: true, message });
        } catch (error) {
          if (error instanceof Error && error.name === "RateLimitError") {
            return json({ error: error.message }, { status: 429 });
          }
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al añadir mensaje",
            },
            { status: 400 }
          );
        }
      }

      case "add_assistant_message": {
        const conversationId = formData.get("conversationId") as string;
        const content = formData.get("content") as string;
        const tokens = formData.get("tokens")
          ? parseInt(formData.get("tokens") as string, 10)
          : undefined;
        const responseTime = formData.get("responseTime")
          ? parseInt(formData.get("responseTime") as string, 10)
          : undefined;

        if (!conversationId || !content) {
          return json(
            { error: "ID de conversación o contenido no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la conversación existe
        const conversation = await getConversationById(conversationId);
        if (!conversation) {
          return json({ error: "Conversación no encontrada" }, { status: 404 });
        }

        // Verificar que la conversación pertenece a un chatbot del usuario
        const chatbot = await getChatbotById(conversation.chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }
        if (chatbot.userId !== userId) {
          return json(
            { error: "No tienes permiso para modificar esta conversación" },
            { status: 403 }
          );
        }

        // Verificar que la conversación está activa
        if (conversation.status !== ConversationStatus.ACTIVE) {
          return json(
            {
              error: `No se pueden añadir mensajes a una conversación ${conversation.status.toLowerCase()}`,
            },
            { status: 400 }
          );
        }

        try {
          const message = await addAssistantMessage(
            conversationId,
            content,
            tokens,
            responseTime
          );
          return json({ success: true, message });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al añadir mensaje",
            },
            { status: 400 }
          );
        }
      }

      case "get_messages": {
        const conversationId = formData.get("conversationId") as string;
        if (!conversationId) {
          return json(
            { error: "ID de conversación no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la conversación existe
        const conversation = await getConversationById(conversationId);
        if (!conversation) {
          return json({ error: "Conversación no encontrada" }, { status: 404 });
        }

        // Verificar permisos para ver los mensajes
        const chatbot = await getChatbotById(conversation.chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }

        // Si no es el dueño, solo permitir acceso si el chatbot está activo
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return json(
            { error: "No tienes permiso para ver estos mensajes" },
            { status: 403 }
          );
        }

        const messages = await getMessagesByConversationId(conversationId);
        return json({ success: true, messages });
      }

      default:
        return json(
          { error: `Intent no reconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en API de mensajes:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
