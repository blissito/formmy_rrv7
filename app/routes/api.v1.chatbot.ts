import * as mammoth from "mammoth";
import * as XLSX from "xlsx";
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
import { validateChatbotCreationAccess } from "../../server/chatbot/chatbotAccess.server";
import { getChatbotBrandingConfigById } from "../../server/chatbot/brandingConfig.server";
import {
  getChatbotUsageStats,
  checkMonthlyUsageLimit,
} from "../../server/chatbot/usageTracking.server";
import {
  addFileContext,
  addUrlContext,
  addTextContext,
  addQuestionContext,
  updateQuestionContext,
  updateTextContext,
  getChatbotContexts,
} from "../../server/chatbot/contextManager.server";
import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
} from "../../server/chatbot/integrationModel.server";
import {
  validateUserAIModelAccess,
  getUserPlanFeatures,
  DEFAULT_CHATBOT_CONFIG,
  generateRandomChatbotName,
} from "~/utils/chatbot.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { generateFallbackModels } from "~/utils/aiModels";

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

        // Validate if user can create more chatbots (FREE users limited to 1 chatbot)
        const validation = await validateChatbotCreationAccess(user.id);
        if (!validation.canCreate) {
          return new Response(
            JSON.stringify({
              success: false,
              error: `Has alcanzado el límite de ${validation.maxAllowed} chatbot${validation.maxAllowed > 1 ? "s" : ""} para tu plan ${validation.plan.toLowerCase()}.`,
              currentCount: validation.currentOwnedCount,
              maxAllowed: validation.maxAllowed,
              isPro: validation.isPro,
              plan: validation.plan,
            }),
            { status: 402, headers: { "Content-Type": "application/json" } }
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
              fileName.toLowerCase().endsWith(".pdf")
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
            } else if (fileName.toLowerCase().endsWith(".docx")) {
              // Procesar DOCX con mammoth
              const arrayBuffer = await file.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);

              try {
                const result = await mammoth.extractRawText({ buffer });
                content = result.value;
              } catch (docxError) {
                content = `[ERROR_DOCX: No se pudo extraer texto del archivo ${fileName}]`;
              }
            } else if (fileName.toLowerCase().endsWith(".xlsx")) {
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
              fileName.toLowerCase().endsWith(".txt") ||
              fileName.toLowerCase().endsWith(".csv")
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

      case "preview_chat": {
        // Chat de preview para el dashboard (no requiere API key del SDK)
        const chatbotId = formData.get("chatbotId") as string;
        const message = formData.get("message") as string;
        const sessionId = formData.get("sessionId") as string;
        const stream = formData.get("stream") === "true";
        
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

        // Obtener la API key de OpenRouter del servidor
        const openRouterApiKey = process.env.OPENROUTER_API_KEY;
        if (!openRouterApiKey) {
          return new Response(
            JSON.stringify({ error: "API key de OpenRouter no configurada" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Preparar los mensajes con el contexto del chatbot
        const systemMessage = {
          role: "system",
          content: chatbot.instructions || "Eres un asistente útil."
        };

        // Lista de modelos fallback generada automáticamente desde la configuración central
        const fallbackModels = generateFallbackModels(chatbot.aiModel);

        let openRouterResponse;
        let lastError;
        
        // Función para validar si una respuesta es válida (no corrupta)
        const isValidResponse = (content: string): boolean => {
          if (!content || content.length < 5) return false;
          
          // Detectar respuestas corruptas por patrones más específicos
          const corruptPatterns = [
            // Mezcla de scripts diferentes en distancias cortas
            /[\u0900-\u097F][\u0041-\u005A\u0061-\u007A]{1,10}[\u0600-\u06FF]/g, // Hindi + Latino + Árabe mezclados
            /[\u4E00-\u9FFF][\u0041-\u005A\u0061-\u007A]{1,5}[\u0900-\u097F]/g, // Chino + Latino + Hindi mezclados  
            /[\u0400-\u04FF][\u0041-\u005A\u0061-\u007A]{1,5}[\u0600-\u06FF]/g, // Cirílico + Latino + Árabe
            /[\u0A80-\u0AFF][\u0041-\u005A\u0061-\u007A]{1,5}[\u30A0-\u30FF]/g, // Gujarati + Latino + Katakana
            
            // Patrones específicos del nuevo ejemplo corrupto
            /[\u0600-\u06FF]{2,}.*[a-zA-Z]{2,}.*[\u4E00-\u9FFF]/g, // Árabe + Latino + Chino (como "۱۰ مرکز...Rand")
            /\(\w*\d+\w*[=＝]+.*\)/g, // Paréntesis con números y símbolos extraños como "(»,68τεί＝"
            /\w+‑\w+/g, // Guiones Unicode extraños como "Quick‑burn"
            /\|\w*\|/g, // Pipe symbols con contenido extraño
            /\<\|\w+\|/g, // Tokens especiales como "<|reserved_200369|>"
            /reserved_\d+/g, // Tokens reserved específicos
            
            // Palabras truncadas con caracteres especiales pegados
            /\w+ิ+\w+/g, // Caracteres Thai mezclados
            /\w+ック+\w+/g, // Katakana mezclado
            /\w+्या+\w+/g, // Devanagari mezclado
            
            // Patrones específicos del primer ejemplo
            /flickित्र्याक/g, // Mezcla específica del ejemplo anterior
            /[a-zA-Z]+्[a-zA-Z]+/g, // Latino con diacríticos Devanagari
            /\w+ष्\w+/g, // Letras con caracteres Devanagari específicos
            
            // Strings muy largos sin espacios ni puntuación
            /[a-zA-Z]{40,}/g, // Strings de letras muy largos sin espacios
            /\w{50,}/g, // Cualquier carácter de palabra muy largo
            
            // Código mezclado con texto
            /\}\s*\{\s*\w+/g, // Patrones de código mezclado
            /\w+\.\w+\(\w+/g, // Llamadas de función mezcladas con texto normal
            /\w+_[A-Z]{3,}/g, // Variables como "_SHOWN", "_BAL" mezcladas
            
            // Emojis mezclados extrañamente
            /[a-zA-Z]+[😉🚀][a-zA-Z]+/g, // Emojis pegados a texto
            
            // Múltiples signos de interrogación seguidos
            /\?\?\?\?+/g, // 4 o más signos de interrogación seguidos
            
            // Paréntesis con contenido muy extraño
            /\([^)]{50,}\)/g, // Paréntesis con más de 50 caracteres dentro
          ];
          
          // Ratio de caracteres no-ASCII más estricto
          const nonAsciiChars = (content.match(/[^\x00-\x7F]/g) || []).length;
          const suspiciousRatio = nonAsciiChars / content.length;
          if (suspiciousRatio > 0.4) return false; // Más de 40% caracteres no ASCII
          
          // Detectar demasiadas palabras muy cortas mezcladas (como "y乐ش", "मुद्द")
          const shortMixedWords = (content.match(/\s[\w\u0080-\uFFFF]{1,3}\s/g) || []).length;
          if (shortMixedWords > 10) return false; // Más de 10 palabras muy cortas mezcladas
          
          // Detectar tokens especiales de modelos (muy sospechoso)
          if (/\<\|.*\|\>/g.test(content)) return false; // Tokens como <|reserved_200369|>
          if (/reserved_\d{6}/g.test(content)) return false; // Números reserved específicos
          
          // Detectar demasiados emojis mezclados en texto técnico
          const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || []).length;
          if (emojiCount > 5) return false; // Más de 5 emojis es sospechoso para respuestas normales
          
          // Detectar demasiados caracteres especiales Unicode mezclados
          const specialUnicodeCount = (content.match(/[‑–—""''…]/g) || []).length;
          if (specialUnicodeCount > 10) return false; // Más de 10 caracteres especiales Unicode
          
          // Detectar si hay demasiados scripts diferentes
          const hasDevanagari = /[\u0900-\u097F]/.test(content);
          const hasArabic = /[\u0600-\u06FF]/.test(content);
          const hasChinese = /[\u4E00-\u9FFF]/.test(content);
          const hasCyrillic = /[\u0400-\u04FF]/.test(content);
          const hasJapanese = /[\u30A0-\u30FF\u3040-\u309F]/.test(content);
          const hasThai = /[\u0E00-\u0E7F]/.test(content);
          const hasKorean = /[\uAC00-\uD7AF]/.test(content);
          const hasGreek = /[\u0370-\u03FF]/.test(content);
          
          const scriptCount = [hasDevanagari, hasArabic, hasChinese, hasCyrillic, hasJapanese, hasThai, hasKorean, hasGreek].filter(Boolean).length;
          if (scriptCount > 3) return false; // Más de 3 scripts diferentes es sospechoso
          
          // Detectar múltiples signos de interrogación o patrones repetitivos extraños
          if (/\?\?\?\?+/.test(content)) return false; // 4+ signos de interrogación seguidos
          if (/\.\.\.\.\.\.\.\.\.\.\.\./g.test(content)) return false; // Muchos puntos seguidos
          
          // Detectar tablas o estructuras de datos corruptas
          if (/\|.*\|.*\|.*\|.*\|/g.test(content) && !/\n/.test(content)) return false; // Pipes sin saltos de línea (tabla corrupta)
          
          return !corruptPatterns.some(pattern => pattern.test(content));
        };

        // Intentar con cada modelo hasta que uno funcione
        for (const model of fallbackModels) {
          // Saltar deepseek si aparece
          if (model.includes("deepseek")) continue;
          
          try {
            openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${openRouterApiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": request.headers.get("origin") || "https://formmy.app",
                "X-Title": "Formmy Chat Preview"
              },
              body: JSON.stringify({
                model: model,
                messages: [systemMessage, { role: "user", content: message }],
                temperature: chatbot.temperature || 0.7,
                stream: stream,
                max_tokens: 1000 // Limitar tokens para evitar respuestas muy largas
              })
            });
            
            if (openRouterResponse.ok) {
              // Si no es streaming, validar la respuesta
              if (!stream) {
                const testResult = await openRouterResponse.clone().json();
                const testContent = testResult.choices?.[0]?.message?.content || "";
                if (!isValidResponse(testContent)) {
                  lastError = `Modelo ${model} generó respuesta corrupta`;
                  console.log(`🚨 RESPUESTA CORRUPTA DETECTADA - Modelo: ${model}`);
                  console.log(`📝 Contenido corrupto (primeros 200 chars): ${testContent.substring(0, 200)}...`);
                  console.log(`📊 Longitud total: ${testContent.length} caracteres`);
                  continue;
                }
              }
              break; // Si funciona, salir del loop
            } else {
              lastError = await openRouterResponse.text();
              console.log(`Modelo ${model} falló, intentando con siguiente...`);
            }
          } catch (error) {
            lastError = error;
            console.log(`Error con modelo ${model}, intentando con siguiente...`);
          }
        }

        if (!openRouterResponse || !openRouterResponse.ok) {
          return new Response(
            JSON.stringify({ 
              error: `Error de OpenRouter: ${lastError || 'Todos los modelos fallaron'}`,
              triedModels: fallbackModels.filter(m => !m.includes("deepseek"))
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }

        // Si es streaming, procesar el stream de OpenRouter
        if (stream) {
          console.log(`🚀 Iniciando stream con modelo: ${fallbackModels[0]}`);
          const decoder = new TextDecoder();
          let accumulatedContent = "";
          let chunkCount = 0;
          let contentChunks = 0;
          
          // Crear un TransformStream para procesar el stream de OpenRouter
          const transformStream = new TransformStream({
            async transform(chunk, controller) {
              chunkCount++;
              const text = decoder.decode(chunk, { stream: true });
              console.log(`📦 Chunk ${chunkCount}: ${text.substring(0, 100)}...`);
              
              const lines = text.split('\n');
              
              for (const line of lines) {
                if (line.trim() === '') continue; // Saltar líneas vacías
                
                if (line.startsWith('data: ')) {
                  const data = line.slice(6).trim();
                  console.log(`📝 Data line: ${data.substring(0, 100)}...`);
                  
                  if (data === '[DONE]') {
                    console.log(`✅ Stream terminado. Total content chunks: ${contentChunks}, Total accumulated: ${accumulatedContent.length} chars`);
                    controller.enqueue('data: [DONE]\n\n');
                    continue;
                  }
                  
                  if (data === '') {
                    console.log('⚠️ Línea de data vacía, saltando...');
                    continue;
                  }
                  
                  try {
                    const parsed = JSON.parse(data);
                    const delta = parsed.choices?.[0]?.delta;
                    
                    // Intentar obtener contenido de diferentes campos según el tipo de modelo
                    let content = delta?.content || delta?.reasoning || "";
                    
                    // Para modelos de razonamiento, también revisar reasoning_details
                    if (!content && delta?.reasoning_details?.length > 0) {
                      content = delta.reasoning_details[0]?.text || "";
                    }
                    
                    if (content && content.trim()) {
                      contentChunks++;
                      console.log(`💬 Contenido ${contentChunks}: "${content}"`);
                      
                      // Acumular contenido para validar
                      accumulatedContent += content;
                      
                      // Validar contenido acumulado cada cierto número de caracteres
                      if (accumulatedContent.length > 50 && accumulatedContent.length % 50 === 0) {
                        if (!isValidResponse(accumulatedContent)) {
                          console.log("🚨 Contenido corrupto detectado en streaming, cerrando...");
                          controller.enqueue('data: {"error": "Respuesta corrupta detectada"}\n\n');
                          controller.enqueue('data: [DONE]\n\n');
                          return;
                        }
                      }
                      
                      // Enviar en el formato que espera el cliente
                      const encoder = new TextEncoder();
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
                    } else if (parsed.choices?.[0]?.finish_reason) {
                      console.log(`🏁 Stream finished with reason: ${parsed.choices[0].finish_reason}`);
                    } else {
                      console.log(`📄 Parsed but no content:`, JSON.stringify(parsed, null, 2));
                    }
                  } catch (e) {
                    console.log(`❌ Error parsing JSON: ${e.message}, data: ${data.substring(0, 100)}`);
                  }
                } else if (line.trim()) {
                  console.log(`❓ Non-data line: ${line}`);
                }
              }
            },
            
            flush(controller) {
              console.log(`🔚 Stream flush called. Final stats: ${chunkCount} chunks, ${contentChunks} content chunks, ${accumulatedContent.length} total chars`);
              if (contentChunks === 0) {
                console.log('⚠️ No content was sent! Stream was empty.');
              }
            }
          });
          
          // Pipe el stream original a través del transformador
          const transformedStream = openRouterResponse.body?.pipeThrough(transformStream);
          
          return new Response(transformedStream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              "Connection": "keep-alive"
            }
          });
        }

        // Si no es streaming, devolver la respuesta JSON
        const result = await openRouterResponse.json();
        return new Response(
          JSON.stringify({
            success: true,
            response: result.choices?.[0]?.message?.content || "No se pudo generar respuesta"
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
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
