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
    addAssistantMessage
  } = await import("../../server/chatbot-api.server");
  
  console.log('📝 API v1 chatbot - Request received:', request.method, request.url);
  try {

    const formData = await request.formData();
    const intent = formData.get("intent") as string;
    console.log('🎯 Intent received:', intent);
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
        const file = formData.get("file") as File | null;

        let content: string | undefined;

        if (file) {
          try {
            // Extraer contenido basado en el tipo de archivo
            if (
              fileType === "application/pdf" ||
              (fileName && fileName.toLowerCase().endsWith(".pdf"))
            ) {
              // Procesar PDF con unpdf
              const arrayBuffer = await file.arrayBuffer();

              try {
                const { extractText } = await import("unpdf");

                // unpdf es muy simple: solo necesita el arrayBuffer
                const result = await extractText(arrayBuffer);

                // Manejar diferentes posibles estructuras
                if (typeof result === "string") {
                  content = result.trim();
                } else if (result && typeof result.text === "string") {
                  content = result.text.trim();
                } else if (
                  result &&
                  Array.isArray(result.text) &&
                  result.text.length > 0
                ) {
                  // unpdf devuelve { totalPages: N, text: ["página1", "página2", ...] }
                  // Unir todas las páginas con doble salto de línea para separarlas claramente
                  content = result.text
                    .map(
                      (page: string, index: number) =>
                        `=== PÁGINA ${index + 1} ===\n${page.trim()}`
                    )
                    .join("\n\n")
                    .trim();
                } else if (result && Array.isArray(result)) {
                  content = result.join("\n\n").trim();
                } else if (result && typeof result === "object") {
                  // Si es un objeto, intentar encontrar el texto
                  content = JSON.stringify(result);
                } else {
                  content = String(result || "").trim();
                }
              } catch (pdfError) {
                // No hay fallback necesario con pdf2json
                content = `[ERROR_PDF: ${pdfError instanceof Error ? pdfError.message : "Error desconocido"} - archivo: ${fileName}]`;
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".docx")) {
              // Procesar DOCX con mammoth
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              try {
                const result = await mammoth.extractRawText({ buffer });
                content = result.value;
              } catch (docxError) {
                content = `[ERROR_DOCX: No se pudo extraer texto del archivo ${fileName}]`;
              }
            } else if (fileName && fileName.toLowerCase().endsWith(".xlsx")) {
              // Procesar XLSX con xlsx
              const arrayBuffer = await file.arrayBuffer();

              try {
                const workbook = XLSX.read(arrayBuffer, { type: "array" });
                let allText = "";

                workbook.SheetNames.forEach((sheetName) => {
                  const worksheet = workbook.Sheets[sheetName];
                  const csvData = XLSX.utils.sheet_to_csv(worksheet);
                  allText += `\n--- Hoja: ${sheetName} ---\n${csvData}\n`;
                });

                content = allText.trim();
              } catch (xlsxError) {
                content = `[ERROR_XLSX: No se pudo extraer datos del archivo ${fileName}]`;
              }
            } else if (
              fileType.includes("text") ||
              (fileName && fileName.toLowerCase().endsWith(".txt")) ||
              (fileName && fileName.toLowerCase().endsWith(".csv"))
            ) {
              // Archivos de texto plano
              content = await file.text();
            } else {
              // Fallback: intentar leer como texto
              try {
                content = await file.text();
              } catch (textError) {
                content = `[ERROR_TEXT: No se pudo leer el archivo ${fileName}]`;
              }
            }
          } catch (error) {
            content = `[ERROR: No se pudo procesar el archivo ${fileName}]`;
          }
        } else {
          // Fallback al contenido enviado directamente (compatibilidad)
          content = formData.get("content") as string | undefined;
        }

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
        const routesData = formData.get("routes") as string | undefined;
        const routes = routesData ? JSON.parse(routesData) : undefined;

        try {
          const chatbot = await addUrlContext(chatbotId, {
            url,
            title,
            content,
            sizeKB,
            routes,
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
      case "update_text_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const content = formData.get("content") as string;

        try {
          const chatbot = await updateTextContext(chatbotId, contextId, {
            title,
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
      case "add_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        try {
          const chatbot = await addQuestionContext(chatbotId, {
            title,
            questions,
            answer,
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
      case "update_question_context": {
        const chatbotId = formData.get("chatbotId") as string;
        const contextId = formData.get("contextId") as string;
        const title = formData.get("title") as string;
        const questions = formData.get("questions") as string;
        const answer = formData.get("answer") as string;

        try {
          const chatbot = await updateQuestionContext(chatbotId, contextId, {
            title,
            questions,
            answer,
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
        const platform = formData.get("platform") as IntegrationType;
        const token = formData.get("token") as string | undefined;
        
        // Manejar datos específicos según la plataforma
        let whatsappData, googleCalendarData, stripeData;
        
        if (platform === "STRIPE") {
          stripeData = {
            stripeApiKey: formData.get("stripeApiKey") as string,
            stripePublishableKey: formData.get("stripePublishableKey") as string,
            stripeWebhookSecret: formData.get("stripeWebhookSecret") as string,
          };
        }
        
        try {
          const integration = await upsertIntegration(
            chatbotId,
            platform,
            token,
            whatsappData,
            googleCalendarData,
            stripeData
          );
          
          // Si es Stripe y tiene API key, activarla inmediatamente
          let finalIntegration = integration;
          
          if (platform === "STRIPE" && stripeData?.stripeApiKey) {
            finalIntegration = await updateIntegration(integration.id, { isActive: true });
          }
          return new Response(JSON.stringify({ success: true, integration: finalIntegration }), {
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
        const platform = formData.get("platform") as IntegrationType;
        const isActive =
          formData.get("isActive") !== undefined
            ? formData.get("isActive") === "true"
            : undefined;
        
        // Manejar campos específicos de Stripe
        const updateData: any = { token, isActive };
        
        if (formData.get("stripeApiKey")) {
          updateData.stripeApiKey = formData.get("stripeApiKey") as string;
        }
        if (formData.get("stripePublishableKey")) {
          updateData.stripePublishableKey = formData.get("stripePublishableKey") as string;
        }
        if (formData.get("stripeWebhookSecret")) {
          updateData.stripeWebhookSecret = formData.get("stripeWebhookSecret") as string;
        }
        
        try {
          let integration = await updateIntegration(integrationId, updateData);
          
          // Si es Stripe y se proporciona API key, activar automáticamente
          if (platform === "STRIPE" && updateData.stripeApiKey) {
            integration = await updateIntegration(integrationId, { isActive: true });
          }
          
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
      case "update_notifications": {
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

        const weeklyDigest = formData.get("weeklyDigest") === "true";
        const usageLimit = formData.get("usageLimit") === "true";
        const configChanges = formData.get("configChanges") === "true";

        const updatedChatbot = await db.chatbot.update({
          where: { id: chatbotId },
          data: {
            settings: {
              notifications: {
                weeklyDigest,
                usageLimit,
                configChanges,
              },
              security: chatbot.settings?.security || {
                allowedDomains: [],
                rateLimit: 100,
                status: "public",
              },
            },
          },
        });

        return new Response(JSON.stringify(updatedChatbot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "add_chatbot_user": {
        const chatbotId = formData.get("chatbotId") as string;
        const email = formData.get("email") as string;
        const role = formData.get("role") as string;

        if (!chatbotId || !email || !role) {
          return new Response(
            JSON.stringify({ error: "Faltan parámetros requeridos" }),
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

        // Verificar si ya existe un permiso para este usuario
        const existingPermission = await db.permission.findFirst({
          where: {
            email,
            chatbotId,
            resourceType: "CHATBOT",
          },
        });

        if (existingPermission) {
          return new Response(
            JSON.stringify({
              error: "El usuario ya tiene acceso a este chatbot",
            }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Crear el nuevo permiso
        const permission = await db.permission.create({
          data: {
            email,
            chatbotId,
            resourceType: "CHATBOT",
            role: role as any,
            status: "pending",
            notifications: true,
          },
        });

        return new Response(JSON.stringify(permission), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "remove_chatbot_user": {
        const permissionId = formData.get("permissionId") as string;

        if (!permissionId) {
          return new Response(
            JSON.stringify({ error: "ID de permiso no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const permission = await db.permission.findUnique({
          where: { id: permissionId },
          include: { chatbot: true },
        });

        if (!permission || !permission.chatbot) {
          return new Response(
            JSON.stringify({ error: "Permiso no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (permission.chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        await db.permission.delete({
          where: { id: permissionId },
        });

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "toggle_chatbot_user_notifications": {
        const permissionId = formData.get("permissionId") as string;
        const value = formData.get("value") === "true";

        if (!permissionId) {
          return new Response(
            JSON.stringify({ error: "ID de permiso no proporcionado" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const permission = await db.permission.findUnique({
          where: { id: permissionId },
          include: { chatbot: true },
        });

        if (!permission || !permission.chatbot) {
          return new Response(
            JSON.stringify({ error: "Permiso no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (permission.chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({
              error: "No tienes permiso para modificar este chatbot",
            }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const updated = await db.permission.update({
          where: { id: permissionId },
          data: { notifications: value },
        });

        return new Response(JSON.stringify(updated), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "get_chatbot_users": {
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

        const permissions = await db.permission.findMany({
          where: {
            chatbotId,
            resourceType: "CHATBOT",
          },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                picture: true,
              },
            },
          },
        });

        return new Response(JSON.stringify(permissions), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update_security": {
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

        const allowedDomains = formData.get("allowedDomains") as string;
        const status = formData.get("status") as string;
        const rateLimit = parseInt(formData.get("rateLimit") as string) || 100;

        const domainsArray = allowedDomains
          ? allowedDomains
              .split(",")
              .map((d) => d.trim())
              .filter((d) => d)
          : [];

        const updatedChatbot = await db.chatbot.update({
          where: { id: chatbotId },
          data: {
            settings: {
              notifications: chatbot.settings?.notifications || {
                weeklyDigest: true,
                usageLimit: true,
                configChanges: false,
              },
              security: {
                allowedDomains: domainsArray,
                rateLimit,
                status: status || "public",
              },
            },
          },
        });

        return new Response(JSON.stringify(updatedChatbot), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      case "update_streaming": {
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

        const enableStreaming = formData.get("enableStreaming") === "true";
        const streamingSpeed = parseInt(formData.get("streamingSpeed") as string) || 50;

        const updatedChatbot = await db.chatbot.update({
          where: { id: chatbotId },
          data: {
            enableStreaming,
            streamingSpeed,
          },
        });

        return new Response(
          JSON.stringify({ 
            success: true, 
            chatbot: updatedChatbot,
            message: "Configuración de streaming actualizada" 
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      case "preview_chat": {
        
        // Chat de preview para el dashboard (no requiere API key del SDK)
        const chatbotId = formData.get("chatbotId") as string;
        const message = formData.get("message") as string;
        const sessionId = formData.get("sessionId") as string;
        const conversationHistoryStr = formData.get("conversationHistory") as string;
        const requestedStream = formData.get("stream") === "true";
        
        
        // Parsear el historial conversacional
        let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
        if (conversationHistoryStr) {
          try {
            conversationHistory = JSON.parse(conversationHistoryStr);
          } catch (e) {
            console.warn("Error parsing conversation history:", e);
          }
        }
        
        // Usar funciones de utilidad del archivo server correspondiente
        
        if (!chatbotId || !message) {
          return new Response(
            JSON.stringify({ error: "Faltan parámetros requeridos" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verificar que el chatbot pertenece al usuario
        const chatbot = await getChatbotById(chatbotId);
        if (!chatbot) {
          return new Response(
            JSON.stringify({ error: "Chatbot no encontrado" }),
            { status: 404, headers: { "Content-Type": "application/json" } }
          );
        }

        if (chatbot.userId !== userId) {
          return new Response(
            JSON.stringify({ error: "No tienes permiso para usar este chatbot" }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        // Detectar si el mensaje requiere herramientas (básico primero)
        const basicRequiresTools = (() => {
          const messageLC = message.toLowerCase();
          const toolIndicators = [
            // Indicadores de pago
            'link de pago',
            'link de stripe',
            'cobrar',
            'factura',
            'payment link',
            'generar pago',
            'crear cobro',
            'enviar factura',
            'stripe',
            'pago',
            'cobro',
            'invoice',
            'checkout',
            // Podemos agregar más herramientas aquí en el futuro
            'agendar cita',
            'calendario',
            'schedule',
            // Indicadores de cantidad de dinero con intención de cobro
            /\$\d+/,
            /\d+\s*(pesos|dolares|usd|mxn)/i,
            // Indicadores comerciales
            /servicio.*seo/i,
            /paquete.*seo/i,
            /optimizar.*sitio/i,
            // Indicadores comerciales específicos para generar pagos
            'quiero contratar',
            'necesito pagar',
            'como puedo pagar',
            'generar link',
            'crear link',
            'proceder con el pago'
          ];
          
          return toolIndicators.some(indicator => {
            if (typeof indicator === 'string') {
              return messageLC.includes(indicator);
            } else if (indicator instanceof RegExp) {
              return indicator.test(message);
            }
            return false;
          });
        })();
        
        
        // Obtener información de Stripe ANTES de todo para poder loggear correctamente
        let stripeIntegration = null;
        try {
          stripeIntegration = await db.integration.findFirst({
            where: {
              chatbotId: chatbot.id,
              platform: "STRIPE",
              isActive: true,
              stripeApiKey: {
                not: null
              }
            },
          });
        } catch (error) {
          console.warn("⚠️ Error checking Stripe integration for testing:", error);
        }

        // Si requiere herramientas, FORZAR non-streaming para garantizar funcionamiento correcto
        const stream = requestedStream && (chatbot.enableStreaming !== false) && !basicRequiresTools;
        

        // Obtener las API keys necesarias
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
        const openaiApiKey = process.env.CHATGPT_API_KEY;
        
        if (!openRouterApiKey && !anthropicApiKey && !openaiApiKey) {
          return new Response(
            JSON.stringify({ error: "No se encontraron API keys configuradas" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // (stripeIntegration ya obtenido al inicio para logging)

        // Usar función unificada para construir prompt optimizado
        let enrichedSystemPrompt = buildEnrichedSystemPrompt(chatbot, message, {
          maxContextTokens: 800, // Límite de emergencia
          enableLogging: false
        });
        
        // Agregar capacidades de Stripe si está disponible
        // Solo agregar capacidades de Stripe para planes TRIAL, PRO y ENTERPRISE
        const hasProPlan = user.plan === "PRO" || user.plan === "ENTERPRISE" || user.plan === "TRIAL";
        const allowToolsForTesting = true; // DEBUG: Need to see what's happening
          
        // Verificar acceso a herramientas (PRO/ENTERPRISE) 
        const hasToolAccess = hasProPlan || allowToolsForTesting;
        
        // Verificar si el modelo actual soporta herramientas
        const modelsWithToolSupport = ['gpt-5-nano', 'gpt-5-mini', 'gpt-4o', 'gpt-4o-mini', 'claude-3-haiku-20240307', 'claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022'];
        const modelSupportsTools = modelsWithToolSupport.includes(chatbot.aiModel);
        
        // PREPARAR HERRAMIENTAS DISPONIBLES
        const integrations = {
          stripe: stripeIntegration
        };
        const tools = getAvailableTools(user.plan, integrations, modelSupportsTools);
        
        if (hasToolAccess && modelSupportsTools && tools.length > 0) {
          enrichedSystemPrompt += "\n\n=== HERRAMIENTAS DISPONIBLES ===\n";
          enrichedSystemPrompt += generateToolPrompts(tools);
          
          // Si detectamos que requiere herramientas, ser más directivo
          if (basicRequiresTools) {
            enrichedSystemPrompt += "🚨 MODO HERRAMIENTAS ACTIVO - El usuario quiere generar un pago.\n";
            enrichedSystemPrompt += "⚡ INSTRUCCIÓN CRÍTICA: USA INMEDIATAMENTE la herramienta create_payment_link SIN PEDIR MÁS INFORMACIÓN.\n";
            enrichedSystemPrompt += "🎯 Si no hay descripción específica, usa 'Servicios profesionales' como descripción.\n";
            enrichedSystemPrompt += "🚫 PROHIBIDO: NO preguntes por más detalles, NO pidas confirmación, actúa INMEDIATAMENTE.\n";
            enrichedSystemPrompt += "💰 OPTIMIZACIÓN: Responde de forma CONCISA (máximo 2 párrafos) para minimizar costos.\n\n";
          }
            
          enrichedSystemPrompt += "**CONTEXTO IMPORTANTE DE ROLES:**\n";
          enrichedSystemPrompt += "- El usuario que te habla ES un CLIENTE potencial\n";
          enrichedSystemPrompt += "- Tú representas a la empresa/negocio dueño de este chatbot\n";
          enrichedSystemPrompt += "- Los links de pago son para que el cliente pague por NUESTROS servicios\n";
          enrichedSystemPrompt += "- Cuando generes un link, es para cobrarle AL USUARIO por nuestros servicios\n\n";
          enrichedSystemPrompt += "**Tienes acceso a la herramienta create_payment_link:**\n";
          enrichedSystemPrompt += "- Úsala cuando el cliente quiera pagar por nuestros servicios\n";
          enrichedSystemPrompt += "- Cuando mencionen interés en contratar o pagar algo\n";
          enrichedSystemPrompt += "- Para frases como: 'quiero pagar', 'genera un link', 'cómo puedo pagar'\n\n";
          enrichedSystemPrompt += "**Cómo responder correctamente:**\n";
          enrichedSystemPrompt += "1. Identifica qué servicio nuestro quiere contratar el cliente\n";
          enrichedSystemPrompt += "2. Determina el precio correspondiente (SIEMPRE en pesos mexicanos)\n";
          enrichedSystemPrompt += "3. Usa format de México: números con PUNTO decimal (ej: 1500.50, NO 1500,50)\n";
          enrichedSystemPrompt += "4. Genera el link con currency: 'mxn' (peso mexicano)\n";
          enrichedSystemPrompt += "5. Explica que puede proceder con el pago\n\n";
          enrichedSystemPrompt += "**Ejemplos CORRECTOS (USA LA HERRAMIENTA INMEDIATAMENTE):**\n";
          enrichedSystemPrompt += "Cliente: 'Genera un link de pago por $3400'\n";
          enrichedSystemPrompt += "Tu acción: [USA create_payment_link con amount: 3400, description: 'Servicios profesionales', currency: 'mxn']\n";
          enrichedSystemPrompt += "Cliente: 'Quiero pagar servicios de SEO por $1000'\n";
          enrichedSystemPrompt += "Tu acción: [USA create_payment_link con amount: 1000, description: 'Servicios de SEO', currency: 'mxn']\n";
          enrichedSystemPrompt += "🚫 INCORRECTO: Preguntar '¿qué servicio específico?' - ¡USA LA HERRAMIENTA DIRECTAMENTE!\n\n";
          enrichedSystemPrompt += "**Frases correctas a usar:**\n";
          enrichedSystemPrompt += "- 'nuestros servicios'\n";
          enrichedSystemPrompt += "- 'puedes proceder con el pago'\n";
          enrichedSystemPrompt += "- 'link para pagar'\n";
          enrichedSystemPrompt += "- 'pago por [servicio específico]'\n";
          
          enrichedSystemPrompt += "\n=== CAPACIDADES DE RECORDATORIOS ===\n";
          enrichedSystemPrompt += "🔥 TAMBIÉN tienes acceso a la herramienta schedule_reminder.\n";
          enrichedSystemPrompt += "ÚSALA cuando el usuario quiera:\n";
          enrichedSystemPrompt += "- Agendar una cita\n";
          enrichedSystemPrompt += "- Programar un recordatorio\n";
          enrichedSystemPrompt += "- Crear una nota en el calendario\n";
          enrichedSystemPrompt += "- Cualquier solicitud de agendamiento\n\n";
          enrichedSystemPrompt += "**Formato requerido:**\n";
          enrichedSystemPrompt += "- title: Descripción clara de la cita/recordatorio\n";
          enrichedSystemPrompt += "- date: Formato YYYY-MM-DD (ej: 2024-12-25)\n";
          enrichedSystemPrompt += "- time: Formato HH:MM en 24h (ej: 14:30)\n";
          enrichedSystemPrompt += "- email: Opcional, para enviar notificación\n\n";
          enrichedSystemPrompt += "=== FIN CAPACIDADES ESPECIALES ===\n";
        }
        
        // CRÍTICO: Advertencia sobre limitaciones reales
        enrichedSystemPrompt += "\n\n🚨 RESTRICCIONES CRÍTICAS:\n";
        if (hasToolAccess && modelSupportsTools) {
          const toolsList = [];
          if (stripeIntegration && stripeIntegration.stripeApiKey) toolsList.push("pagos (Stripe)");
          toolsList.push("recordatorios (Denik)");
          enrichedSystemPrompt += `- TIENES acceso a: ${toolsList.join(" y ")}\n`;
        } else if (hasToolAccess && !modelSupportsTools) {
          enrichedSystemPrompt += "- Herramientas disponibles pero modelo no compatible\n";
        } else {
          enrichedSystemPrompt += "- NO tienes acceso a herramientas (requiere plan PRO)\n";
        }
        enrichedSystemPrompt += "- NO tienes acceso a datos de usuarios externos o sistemas third-party\n";
        enrichedSystemPrompt += "- SOLO puedes usar las herramientas explícitamente listadas arriba\n";
        enrichedSystemPrompt += "- SI no tienes una herramienta específica, di claramente 'No tengo acceso a esa función'\n";
        enrichedSystemPrompt += "- NUNCA inventes datos, direcciones de email, o confirmes acciones que no puedes realizar\n";
        
        const systemMessage = {
          role: "system",
          content: enrichedSystemPrompt
        };
        
        // Función para llamar directamente a Anthropic
        const callAnthropicDirect = async (messages: Array<{role: string, content: string}>) => {
          const anthropicMessages = messages.filter(m => m.role !== 'system').map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }));
          
          // Validar y ajustar temperatura para Anthropic (debe estar entre 0-1)
          const rawTemperature = chatbot.temperature || 0.7;
          const validTemperature = Math.max(0, Math.min(1, rawTemperature));
          
          
          const requestBody = {
            model: chatbot.aiModel,
            max_tokens: 1000,
            temperature: validTemperature,
            system: enrichedSystemPrompt.substring(0, 4000), // Limitar system prompt para debug
            messages: anthropicMessages,
            ...(stream ? { stream: true } : {}) // Solo agregar stream si es true
          };
          
          // DEBUG: Log de la request
          
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': anthropicApiKey!,
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify(requestBody)
          });
          
          // DEBUG: Log de la response
          
          return response;
        };

        // ✅ NUEVO SISTEMA MODULAR DE PROVEEDORES
        const providerManager = createProviderManager(anthropicApiKey, openRouterApiKey, openaiApiKey);
        
        // Usar la información de Stripe ya obtenida para smart routing

        // (stripeIntegration ya obtenido anteriormente)

        // 💰 OPTIMIZACIÓN DE COSTOS: Si detectamos tools de Stripe, usar Haiku (económico y efectivo)
        const stripeToolsDetected = basicRequiresTools && stripeIntegration?.stripeApiKey;
        
        // (La lógica de prompt está ya incluida en la sección anterior)
        
        // Smart routing para usuarios PRO: Nano para chat básico, Haiku para integraciones
        let selectedModel = chatbot.aiModel;

        const fallbackModels = generateFallbackModels(selectedModel);

        // Preparar warning si el modelo no soporta tools
        let toolsDisabledWarning = null;
        if (hasToolAccess && !modelSupportsTools) {
          toolsDisabledWarning = `Las herramientas no están disponibles con ${selectedModel}. Usa GPT-5 Nano o Claude Haiku para acceder a integraciones.`;
        }

        // Preparar request para el sistema modular
        const chatRequest = {
          model: selectedModel,
          messages: [
            systemMessage,
            ...truncateConversationHistory(conversationHistory),
            { role: "user" as const, content: message }
          ],
          temperature: stripeToolsDetected ? 0.1 : (chatbot.temperature || 0.7), // Baja temperatura para herramientas = más obediente
          maxTokens: stripeToolsDetected ? 300 : 1000, // Reducir tokens para herramientas = menor costo
          stream: tools.length > 0 ? false : stream, // Forzar non-streaming cuando hay herramientas
          ...(tools.length > 0 ? { tools } : {}) // Solo agregar tools si hay alguna disponible
        };
        
        
        
        let apiResponse;
        let modelUsed = selectedModel;
        let providerUsed = 'unknown';
        let usedFallback = false;
        let lastError;
        
        try {
          if (chatRequest.stream) {
            // STREAMING con sistema modular
            const result = await providerManager.chatCompletionStreamWithFallback(
              chatRequest,
              fallbackModels.filter(m => !m.includes("deepseek"))
            );
            
            modelUsed = result.modelUsed;
            providerUsed = result.providerUsed;
            usedFallback = result.usedFallback;
            
            
            // Convertir el stream modular al formato esperado por el frontend
            const compatibleStream = new ReadableStream({
              async start(controller) {
                const reader = result.stream.getReader();
                let contentChunks = 0;
                let accumulatedContent = "";
                let warningAlreadySent = false;
                
                try {
                  while (true) {
                    const { done, value } = await reader.read();
                    
                    console.log('📨 Stream chunk received:', { done, value });
                    
                    if (done) {
                      console.log(`🏁 Stream completed. Total chunks sent: ${contentChunks}`);
                      
                      // ✨ GUARDAR MENSAJES EN BASE DE DATOS (STREAMING)
                      try {
                        // Crear o encontrar conversación usando sessionId
                        let conversation = await db.conversation.findFirst({
                          where: {
                            chatbotId: chatbot.id,
                            externalId: sessionId || `session-${userId}-${Date.now()}`
                          }
                        });
                        
                        if (!conversation) {
                          conversation = await db.conversation.create({
                            data: {
                              chatbotId: chatbot.id,
                              externalId: sessionId || `session-${userId}-${Date.now()}`
                            }
                          });
                        }

                        // Guardar mensaje del usuario
                        await addUserMessage(conversation.id, message);

                        // Guardar respuesta del asistente con tokens (streaming completado)
                        await addAssistantMessage(
                          conversation.id,
                          accumulatedContent,
                          result.usage?.totalTokens || result.usage?.total_tokens || 0, // Tokens del stream completo
                          undefined, // responseTime
                          undefined, // firstTokenLatency  
                          modelUsed,
                          'web-preview-stream' // canal
                        );
                        
                        console.log(`💾 Mensajes streaming guardados - Usuario: "${message.substring(0,50)}..." | AI: "${accumulatedContent.substring(0,50)}..." | Tokens: ${result.usage?.totalTokens || result.usage?.total_tokens || 0}`);
                        
                      } catch (dbError) {
                        console.error('❌ Error guardando mensajes streaming:', dbError);
                      }
                      
                      const doneMessage = 'data: [DONE]\n\n';
                      controller.enqueue(new TextEncoder().encode(doneMessage));
                      controller.close();
                      break;
                    }
                    
                    if (value.content && value.content.trim()) {
                      contentChunks++;
                      accumulatedContent += value.content;
                      
                      // Detectar si el modelo intentó usar herramientas pero no las tiene disponibles
                      if (!warningAlreadySent && !modelSupportsTools && /\[.*create_payment_link|\[STRIPE_PAYMENT_REQUEST/i.test(accumulatedContent)) {
                        const warningMsg = `> ⚠️ **Integración no disponible**
> 
> Las herramientas de pago no están disponibles con **${selectedModel}**. 
> Usa **GPT-5 Nano** o **Claude Haiku** para acceder a integraciones.

---

`;
                        const warningChunk = {
                          content: warningMsg
                        };
                        const warningData = `data: ${JSON.stringify(warningChunk)}\n\n`;
                        controller.enqueue(new TextEncoder().encode(warningData));
                        warningAlreadySent = true;
                      }
                      
                      // Enviar chunk al frontend en el formato que espera
                      const chunk = {
                        content: value.content  // Frontend espera content directamente
                      };
                      
                      const chunkData = `data: ${JSON.stringify(chunk)}\n\n`;
                      controller.enqueue(new TextEncoder().encode(chunkData));
                    }
                    
                    if (value.finishReason) {
                      // Stream completado por el modelo
                      const doneMessage = 'data: [DONE]\n\n';
                      controller.enqueue(new TextEncoder().encode(doneMessage));
                      controller.close();
                      break;
                    }
                  }
                } catch (error) {
                  console.error('❌ Stream error:', error);
                  controller.error(error);
                } finally {
                  reader.releaseLock();
                }
              }
            });
            
            return new Response(compatibleStream, {
              headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
              }
            });
            
          } else {
            // NON-STREAMING con sistema modular
            
            const result = await providerManager.chatCompletionWithFallback(
              chatRequest,
              fallbackModels.filter(m => !m.includes("deepseek"))
            );
            
            
            modelUsed = result.modelUsed;
            providerUsed = result.providerUsed;
            usedFallback = result.usedFallback;
            
            // Procesar la respuesta para detectar solicitudes de pago o tool calls
            let finalResponse = result.response.content;
            
            // Si el modelo solo hizo tool calls sin contenido, generar respuesta contextual
            if (finalResponse === 'Sin respuesta' && result.response.toolCalls && result.response.toolCalls.length > 0) {
              finalResponse = "Perfecto, procesando tu solicitud...";
            }
            
            // Agregar warning si las herramientas no están disponibles
            if (toolsDisabledWarning) {
              finalResponse = `⚠️ ${toolsDisabledWarning}\n\n${finalResponse}`;
            }
            
            // Detectar si el modelo intentó usar herramientas pero no las tiene disponibles
            
            if (!modelSupportsTools && /\[.*create_payment_link|\[STRIPE_PAYMENT_REQUEST/i.test(finalResponse)) {
              const warningMsg = `> ⚠️ **Integración no disponible**
> 
> Las herramientas de pago no están disponibles con **${selectedModel}**. 
> Usa **GPT-5 Nano** o **Claude Haiku** para acceder a integraciones.

---`;
              finalResponse = `${warningMsg}\n\n${finalResponse}`;
            }
            
            
            // SISTEMA CENTRALIZADO DE MANEJO DE HERRAMIENTAS
            if (result.response.toolCalls && result.response.toolCalls.length > 0) {
              const toolContext = {
                chatbotId: chatbot.id,
                userId: user.id,
                message: message,
                integrations: integrations
              };
              
              for (const toolCall of result.response.toolCalls) {
                const toolResult = await executeToolCall(
                  toolCall.name,
                  toolCall.input,
                  toolContext
                );
                
                // Agregar resultado a la respuesta
                finalResponse += `\n\n${toolResult.message}`;
              }
            } else {
              
              // Fallback: Detectar si hay un payment request en la respuesta (sistema anterior)
              const paymentRequestMatch = finalResponse.match(/\[STRIPE_PAYMENT_REQUEST:({.*?})\]/);
              
              if (paymentRequestMatch) {
                try {
                  const paymentData = JSON.parse(paymentRequestMatch[1]);
                  
                  // Usar la integración ya obtenida
                  if (stripeIntegration && stripeIntegration.stripeApiKey) {
                    // Generar el link de pago real
                    const paymentUrl = await createQuickPaymentLink(
                      stripeIntegration.stripeApiKey,
                      paymentData.amount,
                      paymentData.description || "Pago",
                      paymentData.currency || "mxn"
                    );
                    
                    // Formatear el monto con formato mexicano correcto
                    const formattedAmount = new Intl.NumberFormat('es-MX', {
                      style: 'currency',
                      currency: (paymentData.currency || 'mxn').toUpperCase(),
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2
                    }).format(paymentData.amount);
                    
                    // Reemplazar el marcador con el link real
                    finalResponse = finalResponse.replace(
                      paymentRequestMatch[0],
                      `\n\n✅ Link de pago generado por ${formattedAmount}:\n${paymentUrl}\n\n💳 Puedes proceder con el pago de forma segura usando este link.`
                    );
                  } else {
                    finalResponse = finalResponse.replace(
                      paymentRequestMatch[0],
                      "\n\n⚠️ No se pudo generar el link: Stripe no está configurado correctamente."
                    );
                  }
                } catch (error) {
                  console.error("Error generando link de pago:", error);
                  finalResponse = finalResponse.replace(
                    paymentRequestMatch[0],
                    "\n\n❌ Error al generar el link de pago. Verifica tu configuración de Stripe."
                  );
                }
              } else {
              }
            }
            
            // ✨ GUARDAR MENSAJES EN BASE DE DATOS
            try {
              // Crear o encontrar conversación usando sessionId
              let conversation = await db.conversation.findFirst({
                where: {
                  chatbotId: chatbot.id,
                  externalId: sessionId || `session-${userId}-${Date.now()}`
                }
              });
              
              if (!conversation) {
                conversation = await db.conversation.create({
                  data: {
                    chatbotId: chatbot.id,
                    externalId: sessionId || `session-${userId}-${Date.now()}`
                  }
                });
              }

              // Guardar mensaje del usuario
              await addUserMessage(conversation.id, message);

              // Guardar respuesta del asistente con tokens
              await addAssistantMessage(
                conversation.id,
                finalResponse,
                result.response.usage?.totalTokens || result.response.usage?.total_tokens || 0,
                undefined, // responseTime - podríamos medirlo
                undefined, // firstTokenLatency - podríamos medirlo  
                modelUsed,
                'web-preview' // canal
              );
              
              console.log(`💾 Mensajes guardados - Usuario: "${message.substring(0,50)}..." | AI: "${finalResponse.substring(0,50)}..." | Tokens: ${result.response.usage?.totalTokens || result.response.usage?.total_tokens || 0}`);
              
            } catch (dbError) {
              console.error('❌ Error guardando mensajes:', dbError);
              // No fallar la respuesta por error de BD, solo loggear
            }
            
            return new Response(
              JSON.stringify({
                success: true,
                response: finalResponse,
                // TRANSPARENCY: Incluir información del modelo usado
                modelInfo: {
                  used: modelUsed,
                  preferred: chatbot.aiModel,
                  provider: providerUsed,
                  wasFromFallback: usedFallback,
                  fallbackReason: usedFallback ? "Modelo preferido no disponible" : null,
                  usage: result.response.usage
                }
              }),
              { status: 200, headers: { "Content-Type": "application/json" } }
            );
          }
          
        } catch (error) {
          lastError = error;
          console.error('❌ All providers failed:', error);
        }

        // Si llegamos aquí, todos los proveedores fallaron
        return new Response(
          JSON.stringify({ 
            error: `All providers failed: ${lastError?.message || 'Unknown error'}`,
            triedModels: fallbackModels.filter(m => !m.includes("deepseek")),
            preferredModel: chatbot.aiModel,
            availableProviders: providerManager.getAvailableProviders()
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

      default:
        return new Response(
          JSON.stringify({ error: `Intent no reconocido: ${intent}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error:
          error instanceof Error ? error.message : "Error interno del servidor",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
