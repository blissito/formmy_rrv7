import { nanoid } from "nanoid";
import {
  createChatbot,
  updateChatbot,
  getChatbotById,
  getChatbotBySlug,
  getChatbotsByUserId,
  removeContextItem,
} from "../../server/chatbot/chatbotModel.server";
import {
  activateChatbot,
  deactivateChatbot,
  setToDraftMode,
  markChatbotAsDeleted,
  getChatbotState,
} from "../../server/chatbot/chatbotStateManager.server";
import {
  validateUserChatbotCreation,
  validateUserAIModelAccess,
  getUserPlanFeatures,
} from "../../server/chatbot/userModel.server";
import { getChatbotBrandingConfigById } from "../../server/chatbot/brandingConfig.server";
import {
  getChatbotUsageStats,
  checkMonthlyUsageLimit,
} from "../../server/chatbot/usageTracking.server";
import {
  addFileContext,
  addUrlContext,
  addTextContext,
  getChatbotContexts,
} from "../../server/chatbot/contextManager.server";
import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
} from "../../server/chatbot/integrationModel.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";

// Arrays para generar nombres aleatorios
const ANIMALS = [
  "leon",
  "tigre",
  "oso",
  "lobo",
  "aguila",
  "halcon",
  "delfin",
  "ballena",
  "elefante",
  "jirafa",
  "panda",
  "koala",
  "zorro",
  "conejo",
  "gato",
  "perro",
  "caballo",
  "unicornio",
  "dragon",
  "fenix",
  "buho",
  "colibri",
  "mariposa",
  "abeja",
];

const ADJECTIVES = [
  "valiente",
  "potente",
  "bernaculo",
  "fuerte",
  "inteligente",
  "amigable",
  "entrañable",
  "brillante",
  "audaz",
  "gentil",
  "noble",
  "magico",
  "poderoso",
  "elegante",
  "gracioso",
  "curioso",
  "satírico",
  "pacifico",
  "energico",
  "luminoso",
  "fluorecente",
];

// Configuración por defecto para nuevos chatbots
const DEFAULT_CHATBOT_CONFIG = {
  description: "Un asistente virtual inteligente y amigable",
  personality:
    "Eres un asistente virtual amigable, profesional y servicial. Respondes de manera clara y concisa, siempre tratando de ser útil.",
  welcomeMessage:
    "¡Hola! Soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
  aiModel: "google/gemini-2.0-flash-exp:free",
  primaryColor: "#3B82F6",
  theme: "light",
  temperature: 0.7,
  instructions:
    "Eres un asistente virtual útil y amigable. Responde de manera profesional y clara a las preguntas de los usuarios.",
};

// Función para generar nombre aleatorio
function generateRandomChatbotName(): string {
  const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const id = nanoid(3);
  return `${animal}-${adjective}-${id}`;
}

export async function loader({ request }: any) {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: any) {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    const user = await getUserOrRedirect(request);
    const userId = user.id;
    switch (intent) {
      case "create_chatbot": {
        // Usar nombre aleatorio si no se proporciona uno
        const name =
          (formData.get("name") as string) || generateRandomChatbotName();

        // Usar configuración por defecto para todos los campos opcionales
        const description =
          (formData.get("description") as string) ||
          DEFAULT_CHATBOT_CONFIG.description;
        const personality =
          (formData.get("personality") as string) ||
          DEFAULT_CHATBOT_CONFIG.personality;
        const welcomeMessage =
          (formData.get("welcomeMessage") as string) ||
          DEFAULT_CHATBOT_CONFIG.welcomeMessage;
        const aiModel =
          (formData.get("aiModel") as string) || DEFAULT_CHATBOT_CONFIG.aiModel;
        const primaryColor =
          (formData.get("primaryColor") as string) ||
          DEFAULT_CHATBOT_CONFIG.primaryColor;
        const theme =
          (formData.get("theme") as string) || DEFAULT_CHATBOT_CONFIG.theme;
        const temperature = formData.get("temperature")
          ? Number(formData.get("temperature"))
          : DEFAULT_CHATBOT_CONFIG.temperature;
        const instructions =
          (formData.get("instructions") as string) ||
          DEFAULT_CHATBOT_CONFIG.instructions;

        const validation = await validateUserChatbotCreation(user);
        if (!validation.canCreate) {
          return new Response(
            JSON.stringify({
              error: `Haz alcanzado el límite de ${validation.maxAllowed} chatbots para tu plan actual.`,
              currentCount: validation.currentCount,
              maxAllowed: validation.maxAllowed,
              isPro: validation.isPro,
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // Validar modelo de IA si se especifica uno diferente al por defecto
        if (aiModel !== DEFAULT_CHATBOT_CONFIG.aiModel) {
          const modelAccess = await validateUserAIModelAccess(user.id);
          if (!modelAccess.availableModels.includes(aiModel)) {
            return new Response(
              JSON.stringify({
                error: `El modelo ${aiModel} no está disponible en tu plan actual.`,
                availableModels: modelAccess.availableModels,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        }

        const chatbot = await createChatbot({
          name,
          description,
          userId: user.id,
          personality,
          welcomeMessage,
          aiModel,
          primaryColor,
          theme,
          temperature,
          instructions,
        });

        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "update_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const updateData: any = {};
        const name = formData.get("name") as string;
        if (name) updateData.name = name;
        const description = formData.get("description") as string;
        if (description) updateData.description = description;
        const personality = formData.get("personality") as string;
        if (personality) updateData.personality = personality;
        const welcomeMessage = formData.get("welcomeMessage") as string;
        if (welcomeMessage !== null && welcomeMessage !== undefined) {
          updateData.welcomeMessage = welcomeMessage;
        }
        const goodbyeMessage = formData.get("goodbyeMessage") as string;
        if (goodbyeMessage !== null && goodbyeMessage !== undefined) {
          updateData.goodbyeMessage = goodbyeMessage;
        }
        const aiModel = formData.get("aiModel") as string;
        if (aiModel) {
          const modelAccess = await validateUserAIModelAccess(user.id);
          if (!modelAccess.availableModels.includes(aiModel)) {
            return new Response(
              JSON.stringify({
                error: `El modelo ${aiModel} no está disponible en tu plan actual.`,
                availableModels: modelAccess.availableModels,
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
          updateData.aiModel = aiModel;
        }
        const primaryColor = formData.get("primaryColor") as string;
        if (primaryColor) updateData.primaryColor = primaryColor;
        const theme = formData.get("theme") as string;
        if (theme) updateData.theme = theme;
        const temperature = formData.get("temperature");
        if (
          temperature !== null &&
          temperature !== undefined &&
          temperature !== ""
        ) {
          updateData.temperature = Number(temperature);
        }
        const instructions = formData.get("instructions") as string;
        if (instructions) updateData.instructions = instructions;
        const isActive = formData.get("isActive");
        if (isActive !== null && isActive !== undefined && isActive !== "") {
          updateData.isActive = isActive === "true" || isActive === true;
        }
        const updatedChatbot = await updateChatbot(chatbotId, updateData);
        return new Response(
          JSON.stringify({ success: true, chatbot: updatedChatbot }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      case "get_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para ver este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "get_chatbot_by_slug": {
        const slug = formData.get("slug") as string;
        if (!slug) {
          return new Response(
            JSON.stringify({ error: "Slug de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotBySlug(slug);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return new Response(
            JSON.stringify({
              error: "Este chatbot no está disponible actualmente",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(JSON.stringify({ success: true, chatbot }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "get_user_chatbots": {
        const chatbots = await getChatbotsByUserId(userId);
        return new Response(JSON.stringify({ success: true, chatbots }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "delete_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== user.id) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para eliminar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const deletedChatbot = await markChatbotAsDeleted(chatbotId);
        return new Response(
          JSON.stringify({ success: true, chatbot: deletedChatbot }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      case "activate_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const activatedChatbot = await activateChatbot(chatbotId);
        return new Response(
          JSON.stringify({ success: true, chatbot: activatedChatbot }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      case "deactivate_chatbot": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const deactivatedChatbot = await deactivateChatbot(chatbotId);
        return new Response(
          JSON.stringify({ success: true, chatbot: deactivatedChatbot }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      case "set_to_draft": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const draftChatbot = await setToDraftMode(chatbotId);
        return new Response(
          JSON.stringify({ success: true, chatbot: draftChatbot }),
          { headers: { "Content-Type": "application/json" } }
        );
      }
      case "get_chatbot_state": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId && !chatbot.isActive) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para ver este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const state = await getChatbotState(chatbotId);
        return new Response(JSON.stringify({ success: true, state }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "get_conversations_count": {
        const chatbotId = formData.get("chatbotId") as string;
        const count = await db.conversation.count({
          where: {
            chatbotId,
            status: { not: "DELETED" },
          },
        });
        return new Response(JSON.stringify({ success: true, count }));
      }
      case "get_usage_stats": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error:
                "No tienes permiso para ver las estadísticas de este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const stats = await getChatbotUsageStats(chatbotId);
        return new Response(JSON.stringify({ success: true, stats }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "check_monthly_limit": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }
        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para ver los límites de este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }
        const limitInfo = await checkMonthlyUsageLimit(chatbotId);
        return new Response(JSON.stringify({ success: true, limitInfo }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "get_plan_features": {
        const planFeatures = await getUserPlanFeatures(userId);
        return new Response(JSON.stringify({ success: true, planFeatures }), {
          headers: { "Content-Type": "application/json" },
        });
      }
      case "get_branding_config": {
        const chatbotId = formData.get("chatbotId") as string;
        if (!chatbotId) {
          return new Response(
            JSON.stringify({ error: "ID de chatbot no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
        try {
          const brandingConfig = await getChatbotBrandingConfigById(chatbotId);
          return new Response(
            JSON.stringify({ success: true, brandingConfig }),
            { headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({
              error:
                error instanceof Error
                  ? error.message
                  : "Error al obtener configuración de branding",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }
      }
      case "add_file_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const fileName = formData.get("fileName") as string;
        const fileType = formData.get("fileType") as string;
        const fileUrl = formData.get("fileUrl") as string;
        const sizeKB = Number(formData.get("sizeKB"));
        const content = formData.get("content") as string | undefined;
        try {
          const chatbot = await addFileContext(chatbotId, {
            fileName,
            fileType,
            fileUrl,
            sizeKB,
            content,
          });
          return new Response(JSON.stringify({ success: true, chatbot }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "add_url_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const url = formData.get("url") as string;
        const title = formData.get("title") as string | undefined;
        const content = formData.get("content") as string | undefined;
        const sizeKB = formData.get("sizeKB")
          ? Number(formData.get("sizeKB"))
          : undefined;
        try {
          const chatbot = await addUrlContext(chatbotId, {
            url,
            title,
            content,
            sizeKB,
          });
          return new Response(JSON.stringify({ success: true, chatbot }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "add_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;
        try {
          const chatbot = await addTextContext(chatbotId, { title, content });
          return new Response(JSON.stringify({ success: true, chatbot }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "remove_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextItemId = formData.get("contextItemId") as string;
        try {
          const chatbot = await removeContextItem(chatbotId, contextItemId);
          return new Response(JSON.stringify({ success: true, chatbot }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "get_contexts": {
        const chatbotId = formData.get("chatbotId") as string;
        try {
          const contexts = await getChatbotContexts(chatbotId);
          return new Response(JSON.stringify({ success: true, contexts }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      // Integraciones
      case "create_integration": {
        const chatbotId = formData.get("chatbotId") as string;
        const platform = formData.get("platform") as any;
        const token = formData.get("token") as string | undefined;
        try {
          const integration = await createIntegration(
            chatbotId,
            platform,
            token
          );
          return new Response(JSON.stringify({ success: true, integration }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "get_integrations": {
        const chatbotId = formData.get("chatbotId") as string;
        try {
          const integrations = await getIntegrationsByChatbotId(chatbotId);
          return new Response(JSON.stringify({ success: true, integrations }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "update_integration": {
        const integrationId = formData.get("integrationId") as string;
        const token = formData.get("token") as string | undefined;
        const isActive =
          formData.get("isActive") !== undefined
            ? formData.get("isActive") === "true"
            : undefined;
        try {
          const integration = await updateIntegration(integrationId, {
            token,
            isActive,
          });
          return new Response(JSON.stringify({ success: true, integration }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "toggle_integration_status": {
        const integrationId = formData.get("integrationId") as string;
        const isActive = formData.get("isActive") === "true";
        try {
          const integration = await toggleIntegrationStatus(
            integrationId,
            isActive
          );
          return new Response(JSON.stringify({ success: true, integration }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      case "delete_integration": {
        const integrationId = formData.get("integrationId") as string;
        try {
          const integration = await deleteIntegration(integrationId);
          return new Response(JSON.stringify({ success: true, integration }), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error: any) {
          return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      default:
        return new Response(
          JSON.stringify({ error: `Intent no reconocido: ${intent}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error en API de chatbot:", error);
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
