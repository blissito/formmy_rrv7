import { ActionArgs, data as json } from "react-router";
import { db } from "~/utils/db.server";
import {
  createChatbot,
  updateChatbot,
  getChatbotById,
  getChatbotBySlug,
  getChatbotsByUserId,
} from "~/.server/chatbot/chatbotModel";
import {
  activateChatbot,
  deactivateChatbot,
  setToDraftMode,
  markChatbotAsDeleted,
  getChatbotState,
} from "~/.server/chatbot/chatbotStateManager";
import {
  validateUserChatbotCreation,
  validateUserAIModelAccess,
  getUserPlanFeatures,
} from "~/.server/chatbot/userModel";
import { getChatbotBrandingConfigById } from "~/.server/chatbot/brandingConfig";
import {
  getChatbotUsageStats,
  checkMonthlyUsageLimit,
} from "~/.server/chatbot/usageTracking";

/**
 * API endpoint para operaciones de chatbot
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

    // Árbol de intents para operaciones de chatbot
    switch (intent) {
      case "create_chatbot": {
        const name = formData.get("name") as string;
        const description =
          (formData.get("description") as string) || undefined;
        const personality =
          (formData.get("personality") as string) || undefined;
        const welcomeMessage =
          (formData.get("welcomeMessage") as string) || undefined;
        const aiModel = (formData.get("aiModel") as string) || undefined;
        const primaryColor =
          (formData.get("primaryColor") as string) || undefined;
        const theme = (formData.get("theme") as string) || undefined;

        if (!name) {
          return json(
            { error: "El nombre del chatbot es obligatorio" },
            { status: 400 }
          );
        }

        // Validar si el usuario puede crear más chatbots según su plan
        const validation = await validateUserChatbotCreation(userId);
        if (!validation.canCreate) {
          return json(
            {
              error: `Has alcanzado el límite de ${validation.maxAllowed} chatbots para tu plan actual.`,
              currentCount: validation.currentCount,
              maxAllowed: validation.maxAllowed,
              isPro: validation.isPro,
            },
            { status: 403 }
          );
        }

        // Validar si el modelo de IA está disponible para el plan del usuario
        if (aiModel) {
          const modelAccess = await validateUserAIModelAccess(userId);
          if (!modelAccess.availableModels.includes(aiModel)) {
            return json(
              {
                error: `El modelo ${aiModel} no está disponible en tu plan actual.`,
                availableModels: modelAccess.availableModels,
              },
              { status: 403 }
            );
          }
        }

        const chatbot = await createChatbot({
          name,
          description,
          userId,
          personality,
          welcomeMessage,
          aiModel,
          primaryColor,
          theme,
        });

        return json({ success: true, chatbot });
      }

      case "update_chatbot": {
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

        // Recopilar campos a actualizar
        const updateData: any = {};

        const name = formData.get("name") as string;
        if (name) updateData.name = name;

        const description = formData.get("description") as string;
        if (description) updateData.description = description;

        const personality = formData.get("personality") as string;
        if (personality) updateData.personality = personality;

        const welcomeMessage = formData.get("welcomeMessage") as string;
        if (welcomeMessage) updateData.welcomeMessage = welcomeMessage;

        const aiModel = formData.get("aiModel") as string;
        if (aiModel) {
          // Validar si el modelo de IA está disponible para el plan del usuario
          const modelAccess = await validateUserAIModelAccess(userId);
          if (!modelAccess.availableModels.includes(aiModel)) {
            return json(
              {
                error: `El modelo ${aiModel} no está disponible en tu plan actual.`,
                availableModels: modelAccess.availableModels,
              },
              { status: 403 }
            );
          }
          updateData.aiModel = aiModel;
        }

        const primaryColor = formData.get("primaryColor") as string;
        if (primaryColor) updateData.primaryColor = primaryColor;

        const theme = formData.get("theme") as string;
        if (theme) updateData.theme = theme;

        // Actualizar el chatbot
        const updatedChatbot = await updateChatbot(chatbotId, updateData);
        return json({ success: true, chatbot: updatedChatbot });
      }

      case "get_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return json(
            { error: "ID de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }

        // Verificar que el chatbot pertenece al usuario o es público
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return json(
            { error: "No tienes permiso para ver este chatbot" },
            { status: 403 }
          );
        }

        return json({ success: true, chatbot });
      }

      case "get_chatbot_by_slug": {
        const slug = formData.get("slug") as string;
        if (!slug) {
          return json(
            { error: "Slug de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        const chatbot = await getChatbotBySlug(slug);
        if (!chatbot) {
          return json({ error: "Chatbot no encontrado" }, { status: 404 });
        }

        // Solo devolver chatbots activos para acceso público
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return json(
            { error: "Este chatbot no está disponible actualmente" },
            { status: 403 }
          );
        }

        return json({ success: true, chatbot });
      }

      case "get_user_chatbots": {
        const chatbots = await getChatbotsByUserId(userId);
        return json({ success: true, chatbots });
      }

      case "delete_chatbot": {
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
            { error: "No tienes permiso para eliminar este chatbot" },
            { status: 403 }
          );
        }

        // Marcar como eliminado (soft delete)
        const deletedChatbot = await markChatbotAsDeleted(chatbotId);
        return json({ success: true, chatbot: deletedChatbot });
      }

      case "activate_chatbot": {
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

        // Activar el chatbot
        const activatedChatbot = await activateChatbot(chatbotId);
        return json({ success: true, chatbot: activatedChatbot });
      }

      case "deactivate_chatbot": {
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

        // Desactivar el chatbot
        const deactivatedChatbot = await deactivateChatbot(chatbotId);
        return json({ success: true, chatbot: deactivatedChatbot });
      }

      case "set_to_draft": {
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

        // Establecer en modo borrador
        const draftChatbot = await setToDraftMode(chatbotId);
        return json({ success: true, chatbot: draftChatbot });
      }

      case "get_chatbot_state": {
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

        const state = await getChatbotState(chatbotId);
        return json({ success: true, state });
      }

      case "get_usage_stats": {
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
                "No tienes permiso para ver las estadísticas de este chatbot",
            },
            { status: 403 }
          );
        }

        const stats = await getChatbotUsageStats(chatbotId);
        return json({ success: true, stats });
      }

      case "check_monthly_limit": {
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
            { error: "No tienes permiso para ver los límites de este chatbot" },
            { status: 403 }
          );
        }

        const limitInfo = await checkMonthlyUsageLimit(chatbotId);
        return json({ success: true, limitInfo });
      }

      case "get_plan_features": {
        const planFeatures = await getUserPlanFeatures(userId);
        return json({ success: true, planFeatures });
      }

      case "get_branding_config": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return json(
            { error: "ID de chatbot no proporcionado" },
            { status: 400 }
          );
        }

        try {
          const brandingConfig = await getChatbotBrandingConfigById(chatbotId);
          return json({ success: true, brandingConfig });
        } catch (error) {
          return json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Error al obtener configuración de branding",
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
    console.error("Error en API de chatbot:", error);
    return json(
      {
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      },
      { status: 500 }
    );
  }
};
