import type { Route } from "./+types/chat.vercel.public";
import { validateMonthlyConversationLimit } from "@/server/chatbot/planLimits.server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { db } from "~/utils/db.server";
import { mapModel, getModelInfo } from "@/server/config/vercel.model.providers";
import { nanoid } from "nanoid";
import {
  createConversation,
  getConversationBySessionId,
} from "@/server/chatbot/conversationModel.server";
import {
  addAssistantMessage,
  addUserMessage,
  getMessagesByConversationId,
} from "@/server/chatbot/messageModel.server";
import { createGetContextTool } from "@/server/tools/vercel/vectorSearch";
import { createSaveLeadTool } from "@/server/tools/vercel/saveLead";
import {
  createOpenArtifactTool,
  createConfirmArtifactTool,
  getInstalledArtifactsForPrompt,
} from "@/server/tools/vercel/artifactTool";
import { loadCustomToolsForChatbot } from "@/server/tools/vercel/customHttpTool";
import { calculateCost } from "@/server/chatbot/pricing.server";
import { validateDomainAccess } from "@/server/utils/domain-validator.server";
import { getRequestOrigin } from "@/server/utils/request-origin.server";

/**
 * ✅ Loader para cargar mensajes históricos (GET request)
 * El cliente usa esto para restaurar conversaciones al recargar
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("sessionId");
  const chatbotId = url.searchParams.get("chatbotId");

  if (!sessionId || !chatbotId) {
    return Response.json({ messages: [] });
  }

  // 🔒 VALIDACIÓN DE DOMINIO - Cargar chatbot para obtener allowedDomains
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { settings: true },
  });

  if (chatbot) {
    const allowedDomains = chatbot.settings?.security?.allowedDomains || [];
    const origin = getRequestOrigin(request);
    const validation = validateDomainAccess(origin, allowedDomains);

    if (!validation.allowed) {
      console.warn(
        `[Chat Loader] ❌ Domain blocked: ${origin || "no-origin"} -> ${chatbotId}`
      );
      return Response.json({ error: "Dominio no autorizado" }, { status: 403 });
    }
  }

  // Buscar conversación por sessionId
  const conversation = await getConversationBySessionId(sessionId, chatbotId);

  if (!conversation) {
    return Response.json({ messages: [] });
  }

  // Cargar mensajes históricos
  const dbMessages = await getMessagesByConversationId(conversation.id);
  const messages: UIMessage[] = dbMessages
    .filter((msg) => msg.role !== "SYSTEM")
    .map((msg) => ({
      id: msg.id,
      role: msg.role.toLowerCase() as "user" | "assistant",
      parts: [{ type: "text" as const, text: msg.content }],
    }));

  return Response.json({ messages });
}

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  // ✅ Patrón "Last Message Only" - recibir solo el nuevo mensaje
  const { message, id: sessionId } = await request.json();
  const chatbotId = url.searchParams.get("chatbotId");

  // 🔒 VALIDAR FORMATO OBJECTID
  if (!chatbotId) {
    return Response.json(
      { error: "chatbotId inválido o faltante" },
      { status: 404 }
    );
  }

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId, status: "ACTIVE" },
  });

  if (!chatbot) {
    return Response.json(
      { error: "Chatbot no encontrado o inactivo" },
      { status: 404 }
    );
  }

  // 🔒 VALIDACIÓN DE DOMINIO
  const allowedDomains = chatbot.settings?.security?.allowedDomains || [];
  const origin = getRequestOrigin(request);
  const validation = validateDomainAccess(origin, allowedDomains);

  if (!validation.allowed) {
    console.warn(
      `[Chat Action] ❌ Domain blocked: ${origin || "no-origin"} -> ${chatbot.slug}`,
      validation.reason
    );
    return Response.json(
      { error: "Dominio no autorizado para este chatbot" },
      { status: 403 }
    );
  }

  // ✅ BUSCAR conversación existente ANTES de validar límites
  let conversation = await getConversationBySessionId(sessionId, chatbotId);

  // ✅ CARGAR MENSAJES HISTÓRICOS DE LA DB (patrón 2025)
  let historicalMessages: UIMessage[] = [];
  if (conversation) {
    const dbMessages = await getMessagesByConversationId(conversation.id);
    historicalMessages = dbMessages
      .filter((msg) => msg.role !== "SYSTEM")
      .map((msg) => ({
        id: msg.id,
        role: msg.role.toLowerCase() as "user" | "assistant",
        parts: [{ type: "text" as const, text: msg.content }], // UIMessage
      }));
  }

  // Si la conversación no existe, validar límites y crear nueva
  if (!conversation) {
    const limitCheck = await validateMonthlyConversationLimit(chatbotId);

    if (!limitCheck.canCreate) {
      return Response.json(
        {
          error: `Este chatbot ha alcanzado su límite mensual de conversaciones (${limitCheck.maxAllowed}). Por favor contacta al propietario.`,
        },
        { status: 429 }
      );
    }

    conversation = await createConversation({
      chatbotId,
      visitorId: nanoid(),
      visitorIp: request.headers.get("x-forwarded-for") || undefined,
      sessionId,
    });
  }

  // ✅ COMBINAR mensajes históricos + mensaje nuevo (patrón "Last Message Only")
  const allMessages = [...historicalMessages, message];
  const textContent = message.parts
    .filter((p: any) => p.type === "text")
    .map((p: any) => p.text)
    .join("");

  await addUserMessage(conversation.id, textContent);

  // 🎨 Cargar lista de artefactos instalados para el prompt
  const installedArtifacts = await getInstalledArtifactsForPrompt(chatbotId);

  // System prompt con instrucciones para artefactos (patrón HITL)
  const systemPrompt = `
    # Sigue estas instrucciones:
    ${chatbot.instructions}

    # Usa esta personalidad:
    ${chatbot.personality}

    # Considera, además, estas instrucciones:
    ${chatbot.customInstructions}

    # ⚠️ CRÍTICO - Uso de Knowledge Base:
    Tienes acceso a una base de conocimiento con información específica sobre este negocio.
    - SIEMPRE usa la herramienta de búsqueda cuando el usuario haga preguntas específicas
    - La información en la base de conocimiento es tu fuente de verdad
    - Si encuentras información relevante, úsala para responder
    - Si no encuentras información, indica claramente que no tienes esa información específica

    # 🎨 ARTEFACTOS INTERACTIVOS (IMPORTANTE):
    Tienes acceso a componentes interactivos llamados "artefactos" que puedes mostrar al usuario.

    ## Artefactos disponibles:
    ${installedArtifacts}

    ## Cómo usar artefactos:
    1. Llama openArtifactTool con el nombre y los DATOS necesarios
    2. INMEDIATAMENTE después, llama confirmArtifactTool para esperar la respuesta
    3. Cuando el usuario confirme/cancele, responde apropiadamente

    ## CRÍTICO - Pasar datos a los artefactos:
    Debes pasar los datos en initialDataJson como JSON string. Ejemplos:

    - gallery-card: {"images": ["url1", "url2", "url3"], "title": "Título"}
    - product-card: {"imageUrl": "url", "name": "Producto", "price": 100, "currency": "MXN"}
    - payment-card: {"items": [{"name": "Item", "quantity": 1}], "total": 100}
    - date-picker: {"minDate": "2025-01-01", "availableSlots": ["9:00", "10:00"]}

    ## ⚠️ GALERÍA DE IMÁGENES - CRÍTICO:
    La gallery-card SOLO muestra contenido. NO requiere confirmArtifactTool.

    PROCESO OBLIGATORIO para gallery-card:
    1. PRIMERO llama getContextTool para buscar "imágenes" o "galería"
    2. Del resultado, EXTRAE todas las URLs (busca patrones https://...jpg, https://...jpeg, https://...png)
    3. LUEGO llama openArtifactTool con initialDataJson que contenga esas URLs

    EJEMPLO CONCRETO:
    Si getContextTool retorna: "Imagen 1: https://example.com/foto1.jpg, Imagen 2: https://example.com/foto2.jpg"
    Entonces llamas: openArtifactTool({ artifactName: "gallery-card", initialDataJson: '{"images":["https://example.com/foto1.jpg","https://example.com/foto2.jpg"],"title":"Galería"}' })

    ⛔ PROHIBIDO: Abrir gallery-card con initialDataJson vacío o sin images
    ⛔ PROHIBIDO: Inventar URLs - solo usa las que encuentres en la base de conocimiento
    `;

  // ⏱️ Start time para medir responseTime
  const startTime = Date.now();

  // 🔧 Cargar custom tools del chatbot (herramientas HTTP personalizadas)
  const customTools = await loadCustomToolsForChatbot(chatbotId);

  // ✅ PATRÓN 2025: streamText con TODOS los mensajes (históricos + nuevos)
  const result = streamText({
    model: mapModel(chatbot.aiModel),
    messages: convertToModelMessages(allMessages), // ⬅️ TODOS los mensajes
    system: systemPrompt,
    tools: {
      getContextTool: createGetContextTool(chatbotId),
      saveLeadTool: createSaveLeadTool(chatbotId, conversation.id),
      openArtifactTool: createOpenArtifactTool(chatbotId),
      confirmArtifactTool: createConfirmArtifactTool(), // HITL pattern
      ...customTools, // 🔧 Herramientas HTTP personalizadas
    },
    stopWhen: stepCountIs(5),
    // 📊 TRACKING: onFinish de streamText (recibe totalUsage)
    onFinish: async ({ text, totalUsage }) => {
      try {
        // 📊 TRACKING: Extraer métricas de tokens (AI SDK 5.x uses inputTokens/outputTokens)
        const inputTokens = totalUsage?.inputTokens || 0;
        const outputTokens = totalUsage?.outputTokens || 0;
        const totalTokens = inputTokens + outputTokens;

        // 🔍 Detectar provider y modelo
        const { provider, model } = getModelInfo(chatbot.aiModel);

        // 💰 Calcular costo
        const costResult = calculateCost(provider, model, {
          inputTokens,
          outputTokens,
          cachedTokens: 0, // TODO: Vercel AI SDK no expone cached tokens aún
        });

        // ⏱️ Calcular tiempo de respuesta
        const responseTime = Date.now() - startTime;

        // 💾 Guardar mensaje con tracking completo
        await addAssistantMessage(
          conversation.id,
          text, // texto completo generado
          totalTokens, // tokens (legacy)
          responseTime, // responseTime en ms
          undefined, // firstTokenLatency (no disponible en Vercel AI SDK)
          model, // aiModel
          "web", // channel
          undefined, // externalMessageId
          inputTokens, // inputTokens
          outputTokens, // outputTokens
          costResult.totalCost, // totalCost en USD
          provider, // provider
          0 // cachedTokens
        );

        console.log(
          `[Chat Public] ✅ Message tracked: ${totalTokens} tokens, $${costResult.totalCost.toFixed(6)} (${provider}/${model})`
        );
      } catch (error) {
        console.error("[Chat Public Action] ❌ Error saving message:", error);
      }
    },
  });

  // ✅ PATRÓN OFICIAL: toUIMessageStreamResponse CON originalMessages
  return result.toUIMessageStreamResponse({
    originalMessages: allMessages, // ⬅️ Envía mensajes históricos + nuevos al cliente
  });
}
