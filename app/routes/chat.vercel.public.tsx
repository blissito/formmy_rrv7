import type { Route } from "./+types/chat.vercel.public";
import { validateMonthlyConversationLimit } from "@/server/chatbot/planLimits.server";
import {
  streamText,
  convertToModelMessages,
  stepCountIs,
  type UIMessage,
} from "ai";
import { db } from "~/utils/db.server";
import {
  mapModel,
  getModelInfo,
} from "@/server/config/vercel.model.providers";
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
import { calculateCost } from "@/server/chatbot/pricing.server";

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
        parts: [{ type: "text" as const, text: msg.content }],
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
     `;

  // ⏱️ Start time para medir responseTime
  const startTime = Date.now();

  // ✅ PATRÓN 2025: streamText con TODOS los mensajes (históricos + nuevos)
  const result = streamText({
    model: mapModel(chatbot.aiModel),
    messages: convertToModelMessages(allMessages), // ⬅️ TODOS los mensajes
    system: systemPrompt,
    tools: {
      getContextTool: createGetContextTool(chatbotId),
      saveLeadTool: createSaveLeadTool(chatbotId),
    },
    stopWhen: stepCountIs(5),
    // 📊 TRACKING: onFinish de streamText (recibe totalUsage)
    onFinish: async ({ text, totalUsage, finishReason }) => {
      try {
        // 📊 TRACKING: Extraer métricas de tokens
        const inputTokens = totalUsage?.promptTokens || 0;
        const outputTokens = totalUsage?.completionTokens || 0;
        const totalTokens = totalUsage?.totalTokens || inputTokens + outputTokens;

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
