/**
 * ❌ DEPRECATED - API v1 Chatbot Endpoint
 *
 * @deprecated Este endpoint está DEPRECADO y será removido en versiones futuras.
 *
 * STATUS: ⚠️ LEGACY ONLY - Mantener solo para compatibilidad con chatbots existentes
 *
 * PROBLEMA CRÍTICO: Streaming mode no detecta/ejecuta herramientas correctamente
 * - Cuando está en streaming, no usa tools y responde solo con texto
 * - Lógica de tool detection está desconectada del streaming
 *
 * MIGRATION PATH:
 * - USAR: `/dashboard/ghosty` con AgentEngine_v0
 * - USAR: Arquitectura multi-agente especializada
 * - NO USAR: Este endpoint para nuevas implementaciones
 *
 * RAZONES DE DEPRECACIÓN:
 * 1. Framework formmy-agent deprecado → LlamaIndex 2025 nativo
 * 2. Tools + Streaming incompatible en esta implementación
 * 3. Memory management manual → Automático en workflows
 * 4. Mantenimiento complejo vs solución oficial LlamaIndex
 *
 * FECHA DEPRECACIÓN: Septiembre 2025
 * FECHA REMOCIÓN PLANEADA: Diciembre 2025
 */

// This file will only export the loader and action functions


export async function loader({ request }: any) {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

// Imports moved inside functions to avoid client-side processing

export async function action({ request }: any) {
  // Imports dentro de la función para evitar problemas client-side
  const {
    mammoth,
    XLSX,
    IntegrationType,
    createChatbot,
    updateChatbot,
    getChatbotById,
    getChatbotBySlug,
    getChatbotsByUserId,
    removeContextItem,
    activateChatbot,
    deactivateChatbot,
    setToDraftMode,
    markChatbotAsDeleted,
    getChatbotState,
    validateChatbotCreationAccess,
    getChatbotBrandingConfigById,
    getChatbotUsageStats,
    checkMonthlyUsageLimit,
    addFileContext,
    addUrlContext,
    addTextContext,
    addQuestionContext,
    updateQuestionContext,
    updateTextContext,
    getChatbotContexts,
    createIntegration,
    upsertIntegration,
    getIntegrationsByChatbotId,
    updateIntegration,
    toggleIntegrationStatus,
    deleteIntegration,
    getActiveStripeIntegration,
    createQuickPaymentLink,
    ReminderService,
    getAvailableTools,
    executeToolCall,
    generateToolPrompts,
    validateUserAIModelAccess,
    getUserPlanFeatures,
    DEFAULT_CHATBOT_CONFIG,
    generateRandomChatbotName,
    getDefaultAIModelForUser,
    getUserOrRedirect,
    db,
    generateFallbackModels,
    isAnthropicDirectModel,
    buildEnrichedSystemPrompt,
    estimateTokens,
    AIProviderManager,
    truncateConversationHistory,
    createProviderManager,
    addUserMessage,
    addAssistantMessage,
    performanceMonitor
  } = await import("../../server/chatbot-api.server");

  const { calculateCost } = await import("../../server/chatbot/pricing.server");

  // Framework temporalmente deshabilitado durante refactor

  console.log('📝 API v1 chatbot - Request received:', request.method, request.url);
  try {
    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    console.log('🎯 Intent received:', intent);

    const { getUserOrNull } = await import("server/getUserUtils.server");

    // 🔑 Soporte para API Key (testing y futuras integraciones REST)
    const apiKey = request.headers.get("X-API-Key") || formData.get("apiKey") as string;
    const testApiKey = "formmy-test-2024"; // Para testing y debugging

    let user = await getUserOrNull(request);

    // Si no hay usuario autenticado, verificar API key
    if (!user && apiKey === testApiKey) {
      console.log('🔑 Using test API key for authentication');
      // Usuario de testing - fixtergeek@gmail.com con plan TRIAL para testing real
      user = {
        id: '687d43b46e2021a1de9d6ed3',
        email: 'fixtergeek@gmail.com',
        plan: 'TRIAL',
        name: 'Test User (fixtergeek)'
      } as any;
    }

    if (!user) {
      return new Response(
        JSON.stringify({
          error: "Usuario no autenticado",
          hint: "Usa header 'X-API-Key: formmy-test-2024' para testing"
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    switch (intent) {
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
        const avatarUrl = formData.get("avatarUrl") as string;
        if (
          avatarUrl &&
          avatarUrl !== "null" &&
          avatarUrl !== "undefined" &&
          avatarUrl.trim() !== ""
        ) {
          updateData.avatarUrl = avatarUrl;
        }
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
        const customInstructions = formData.get("customInstructions") as string;
        if (customInstructions !== null && customInstructions !== undefined) {
          updateData.customInstructions = customInstructions;
        }
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
      case "get_user_chatbots": {
        const chatbots = await getChatbotsByUserId(userId);
        return new Response(JSON.stringify({ success: true, chatbots }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Context operations - Delegación modular
      case "add_file_context":
      case "add_url_context":
      case "add_text_context":
      case "update_text_context":
      case "add_question_context":
      case "update_question_context":
      case "remove_context":
      case "get_contexts": {
        const { handleContextOperation } = await import("../../server/chatbot/context-handler.server");
        return await handleContextOperation(intent, formData, userId);
      }

      // Chatbot management - Delegación modular
      case "create_chatbot":
      case "get_chatbot_by_slug":
      case "delete_chatbot":
      case "activate_chatbot":
      case "deactivate_chatbot":
      case "set_to_draft":
      case "get_chatbot_state": {
        const { handleChatbotManagement } = await import("../../server/chatbot/management-handler.server");
        return await handleChatbotManagement(intent, formData, userId, user);
      }

      // Integration management - Delegación modular
      case "create_integration":
      case "get_integrations":
      case "update_integration":
      case "toggle_integration_status":
      case "delete_integration": {
        const { handleIntegrationManagement } = await import("../../server/chatbot/integration-handler.server");
        return await handleIntegrationManagement(intent, formData, userId);
      }

      default: {
        return new Response(
          JSON.stringify({ error: "Intent no soportado" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error) {
    console.error('❌ API v1 chatbot error:', error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error?.message || "Error desconocido"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}