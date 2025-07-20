import { ActionArgs, data as json } from "react-router";
import { getChatbotById } from "~/.server/chatbot/chatbotModel";
import {
  createConversation,
  getConversationById,
  getConversationBySessionId,
  getConversationsByChatbotId,
  updateConversationStatus,
} from "~/.server/chatbot/conversationModel";
import { ConversationStatus } from "@prisma/client";

/**
 * API endpoint para operaciones de conversación
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

    // Árbol de intents para operaciones de conversación
    switch (intent) {
      case "create_conversation": {
        const chatbotId = formData.get("chatbotId") as string;
        const visitorIp = (formData.get("visitorIp") as string) || undefined;
        const visitorId = (formData.get("visitorId") as string) || undefined;

        if (!chatbotId) {
          return json(
            { error: "ID de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que el chatbot existe y está activo
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }
        if (!chatbot.isActive && chatbot.userId !== userId) {
          return json(
            { error: "Este chatbot no está disponible actualmente" },
            { status: 403 }
          );
        }

        try {
          const conversation = await createConversation({
            chatbotId,
            visitorIp,
            visitorId,
          });
          return json({ success: true, conversation });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al crear conversación",
            },
            { status: 400 }
          );
        }
      }

      case "get_conversation": {
        const conversationId = formData.get("conversationId") as string;
        if (!conversationId) {
          return json(
            { error: "ID de conversación no proporcionado" },
            { status: 400 }
          );
        }

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
            { error: "No tienes permiso para ver esta conversación" },
            { status: 403 }
          );
        }

        return json({ success: true, conversation });
      }

      case "get_conversation_by_session": {
        const sessionId = formData.get("sessionId") as string;
        if (!sessionId) {
          return json(
            { error: "ID de sesión no proporcionado" },
            { status: 400 }
          );
        }

        const conversation = await getConversationBySessionId(sessionId);
        if (!conversation) {
          return json({ error: "Conversación no encontrada" }, { status: 404 });
        }

        // Para sesiones públicas, permitir acceso si el chatbot está activo
        const chatbot = await getChatbotById(conversation.chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }

        // Si no es el dueño, solo permitir acceso si el chatbot está activo
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return json(
            { error: "No tienes permiso para ver esta conversación" },
            { status: 403 }
          );
        }

        return json({ success: true, conversation });
      }

      case "get_chatbot_conversations": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return json(
            { error: "ID de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }
        if (chatbot.userId !== userId) {
          return json(
            {
              error:
                "No tienes permiso para ver las conversaciones de este chatbot",
            },
            { status: 403 }
          );
        }

        const conversations = await getConversationsByChatbotId(chatbotId);
        return json({ success: true, conversations });
      }

      case "update_conversation_status": {
        const conversationId = formData.get("conversationId") as string;
        const status = formData.get("status") as ConversationStatus;

        if (!conversationId || !status) {
          return json(
            { error: "ID de conversación o estado no proporcionado" },
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

        const updatedConversation = await updateConversationStatus(
          conversationId,
          status
        );
        return json({ success: true, conversation: updatedConversation });
      }

      default:
        return json(
          { error: `Intent no reconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en API de conversación:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
