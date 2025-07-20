import { ActionArgs, data as json } from "react-router";
import { getChatbotById } from "~/.server/chatbot/chatbotModel";
import {
  exportConversations,
  type ConversationExportOptions,
} from "~/.server/chatbot/conversationExport";

/**
 * API endpoint para operaciones de exportación
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

    // Árbol de intents para operaciones de exportación
    switch (intent) {
      case "export_conversations": {
        const chatbotId = formData.get("chatbotId") as string;
        const format = formData.get("format") as "csv" | "json";
        const startDateStr = (formData.get("startDate") as string) || undefined;
        const endDateStr = (formData.get("endDate") as string) || undefined;
        const includeMessages = formData.get("includeMessages") !== "false";

        if (!chatbotId || !format) {
          return json(
            { error: "ID de chatbot o formato no proporcionado" },
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
                "No tienes permiso para exportar conversaciones de este chatbot",
            },
            { status: 403 }
          );
        }

        // Convertir fechas si se proporcionan
        const startDate = startDateStr ? new Date(startDateStr) : undefined;
        const endDate = endDateStr ? new Date(endDateStr) : undefined;

        try {
          const exportOptions: ConversationExportOptions = {
            chatbotId,
            format,
            startDate,
            endDate,
            includeMessages,
          };

          const exportData = await exportConversations(exportOptions);
          return json({ success: true, data: exportData, format });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al exportar conversaciones",
            },
            { status: 400 }
          );
        }
      }

      default:
        return json(
          { error: `Intent no reconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en API de exportación:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
