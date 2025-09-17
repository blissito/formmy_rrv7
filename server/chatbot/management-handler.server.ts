/**
 * Management Handler - Maneja todas las operaciones de gestión de chatbots
 * Modularización de operaciones CRUD desde API v1
 */

export async function handleChatbotManagement(
  intent: string,
  formData: FormData,
  userId: string,
  user: any
): Promise<Response> {
  // Imports dinámicos para optimización
  const {
    createChatbot,
    updateChatbot,
    getChatbotById,
    getChatbotBySlug,
    getChatbotsByUserId,
    activateChatbot,
    deactivateChatbot,
    setToDraftMode,
    markChatbotAsDeleted,
    getChatbotState,
    validateChatbotCreationAccess,
    validateUserAIModelAccess,
    getUserPlanFeatures,
    DEFAULT_CHATBOT_CONFIG,
    generateRandomChatbotName,
    getDefaultAIModelForUser,
  } = await import("../chatbot-api.server");

  try {
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
          (formData.get("aiModel") as string) || await getDefaultAIModelForUser(user.id);
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

        // Validate if user can create more chatbots (FREE users limited to 1 chatbot)
        const validation = await validateChatbotCreationAccess(user.id);
        if (!validation.canCreate) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Has alcanzado el límite de ${validation.maxAllowed} chatbot${validation.maxAllowed > 1 ? "s" : ""} para tu plan ${validation.plan?.toLowerCase() || 'actual'}.`,
              currentCount: validation.currentOwnedCount,
              maxAllowed: validation.maxAllowed,
              isPro: validation.isPro,
              plan: validation.plan,
            }),
            { status: 402, headers: { "Content-Type": "application/json" } }
          );
        }

        // Validar modelo de IA si no es null
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

        // Solo permitir acceso si es el dueño o si el chatbot está activo
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

        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para eliminar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const deletedChatbot = await markChatbotAsDeleted(chatbotId);
        return new Response(JSON.stringify({ success: true, chatbot: deletedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
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
              error: "No tienes permiso para activar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const activatedChatbot = await activateChatbot(chatbotId);
        return new Response(JSON.stringify({ success: true, chatbot: activatedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
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
              error: "No tienes permiso para desactivar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const deactivatedChatbot = await deactivateChatbot(chatbotId);
        return new Response(JSON.stringify({ success: true, chatbot: deactivatedChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
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
        return new Response(JSON.stringify({ success: true, chatbot: draftChatbot }), {
          headers: { "Content-Type": "application/json" },
        });
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

        if (chatbot.userId !== userId) {
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

      default:
        return new Response(
          JSON.stringify({ error: "Intent de gestión no soportado" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error(`❌ Error en ${intent}:`, error);
    return new Response(
      JSON.stringify({
        error: error.message || "Error interno del servidor",
        intent
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}