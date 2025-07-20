import { ActionArgs, data as json } from "react-router";
import { db } from "~/utils/db.server";
import { getChatbotById } from "~/.server/chatbot/chatbotModel";
import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
} from "~/.server/chatbot/integrationModel";
import { IntegrationType } from "@prisma/client";

/**
 * API endpoint para operaciones de integración
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

    // Árbol de intents para operaciones de integración
    switch (intent) {
      case "create_integration": {
        const chatbotId = formData.get("chatbotId") as string;
        const platform = formData.get("platform") as IntegrationType;
        const token = (formData.get("token") as string) || undefined;

        if (!chatbotId || !platform) {
          return json(
            { error: "ID de chatbot o plataforma no proporcionado" },
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
          const integration = await createIntegration(
            chatbotId,
            platform,
            token
          );
          return json({ success: true, integration });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al crear integración",
            },
            { status: 400 }
          );
        }
      }

      case "get_integrations": {
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
                "No tienes permiso para ver las integraciones de este chatbot",
            },
            { status: 403 }
          );
        }

        const integrations = await getIntegrationsByChatbotId(chatbotId);
        return json({ success: true, integrations });
      }

      case "update_integration": {
        const integrationId = formData.get("integrationId") as string;
        const token = (formData.get("token") as string) || undefined;
        const isActive = formData.has("isActive")
          ? formData.get("isActive") === "true"
          : undefined;

        if (!integrationId) {
          return json(
            { error: "ID de integración no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la integración existe y pertenece a un chatbot del usuario
        const integration = await db.integration.findUnique({
          where: { id: integrationId },
          include: { chatbot: true },
        });

        if (!integration) {
          return json({ error: "Integración no encontrada" }, { status: 404 });
        }
        if (integration.chatbot.userId !== userId) {
          return json(
            { error: "No tienes permiso para modificar esta integración" },
            { status: 403 }
          );
        }

        const updatedIntegration = await updateIntegration(integrationId, {
          token,
          isActive,
        });
        return json({ success: true, integration: updatedIntegration });
      }

      case "toggle_integration": {
        const integrationId = formData.get("integrationId") as string;
        const isActive = formData.get("isActive") === "true";

        if (!integrationId) {
          return json(
            { error: "ID de integración no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la integración existe y pertenece a un chatbot del usuario
        const integration = await db.integration.findUnique({
          where: { id: integrationId },
          include: { chatbot: true },
        });

        if (!integration) {
          return json({ error: "Integración no encontrada" }, { status: 404 });
        }
        if (integration.chatbot.userId !== userId) {
          return json(
            { error: "No tienes permiso para modificar esta integración" },
            { status: 403 }
          );
        }

        const updatedIntegration = await toggleIntegrationStatus(
          integrationId,
          isActive
        );
        return json({ success: true, integration: updatedIntegration });
      }

      case "delete_integration": {
        const integrationId = formData.get("integrationId") as string;
        if (!integrationId) {
          return json(
            { error: "ID de integración no proporcionado" },
            { status: 400 }
          );
        }

        // Verificar que la integración existe y pertenece a un chatbot del usuario
        const integration = await db.integration.findUnique({
          where: { id: integrationId },
          include: { chatbot: true },
        });

        if (!integration) {
          return json({ error: "Integración no encontrada" }, { status: 404 });
        }
        if (integration.chatbot.userId !== userId) {
          return json(
            { error: "No tienes permiso para eliminar esta integración" },
            { status: 403 }
          );
        }

        const deletedIntegration = await deleteIntegration(integrationId);
        return json({ success: true, integration: deletedIntegration });
      }

      default:
        return json(
          { error: `Intent no reconocido: ${intent}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Error en API de integración:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
