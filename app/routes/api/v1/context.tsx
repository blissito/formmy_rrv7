import { ActionArgs, data as json } from "react-router";
import { getChatbotById } from "~/.server/chatbot/chatbotModel";
import {
  addFileContext,
  addUrlContext,
  addTextContext,
  getChatbotContexts,
} from "~/.server/chatbot/contextManager";
import { removeContextItem } from "~/.server/chatbot/chatbotModel";

/**
 * API endpoint para operaciones de contexto
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

    // Árbol de intents para operaciones de contexto
    switch (intent) {
      case "add_file_context": {
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
            { error: "No tienes permiso para modificar este chatbot" },
            { status: 403 }
          );
        }

        const fileName = formData.get("fileName") as string;
        const fileType = formData.get("fileType") as string;
        const fileUrl = formData.get("fileUrl") as string;
        const sizeKB = parseInt(formData.get("sizeKB") as string, 10);
        const content = (formData.get("content") as string) || undefined;

        if (!fileName || !fileType || !fileUrl || isNaN(sizeKB)) {
          return json(
            { error: "Faltan datos requeridos para el archivo" },
            { status: 400 }
          );
        }

        try {
          const updatedChatbot = await addFileContext(chatbotId, {
            fileName,
            fileType,
            fileUrl,
            sizeKB,
            content,
          });
          return json({ success: true, chatbot: updatedChatbot });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al añadir contexto de archivo",
            },
            { status: 400 }
          );
        }
      }

      case "add_url_context": {
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
            { error: "No tienes permiso para modificar este chatbot" },
            { status: 403 }
          );
        }

        const url = formData.get("url") as string;
        const title = (formData.get("title") as string) || undefined;
        const content = (formData.get("content") as string) || undefined;
        const sizeKB = formData.get("sizeKB")
          ? parseInt(formData.get("sizeKB") as string, 10)
          : undefined;

        if (!url) {
          return json({ error: "URL no proporcionada" }, { status: 400 });
        }

        try {
          const updatedChatbot = await addUrlContext(chatbotId, {
            url,
            title,
            content,
            sizeKB,
          });
          return json({ success: true, chatbot: updatedChatbot });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al añadir contexto de URL",
            },
            { status: 400 }
          );
        }
      }

      case "add_text_context": {
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
            { error: "No tienes permiso para modificar este chatbot" },
            { status: 403 }
          );
        }

        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        if (!title || !content) {
          return json(
            { error: "Faltan datos requeridos para el texto" },
            { status: 400 }
          );
        }

        try {
          const updatedChatbot = await addTextContext(chatbotId, {
            title,
            content,
          });
          return json({ success: true, chatbot: updatedChatbot });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al añadir contexto de texto",
            },
            { status: 400 }
          );
        }
      }

      case "remove_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;

        if (!chatbotId || !contextId) {
          return json(
            { error: "ID de chatbot o contexto no proporcionado" },
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
            { error: "No tienes permiso para modificar este chatbot" },
            { status: 403 }
          );
        }

        try {
          const updatedChatbot = await removeContextItem(chatbotId, contextId);
          return json({ success: true, chatbot: updatedChatbot });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al eliminar contexto",
            },
            { status: 400 }
          );
        }
      }

      case "get_contexts": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return json(
            { error: "ID de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que el chatbot pertenece al usuario o es público
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return json(
            { error: "No tienes permiso para ver este chatbot" },
            { status: 403 }
          );
        }

        const contexts = await getChatbotContexts(chatbotId);
        return json({ success: true, contexts });
      }

      default:
        return json(
          { error: `Intent no reconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en API de contexto:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
