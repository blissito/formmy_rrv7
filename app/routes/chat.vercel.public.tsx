/**
 * 🌍 Chat Público - Vercel AI SDK
 *
 * Endpoint para chatbots embebibles con soporte de usuarios anónimos.
 *
 * Features:
 * - Usuarios anónimos con tracking de sessionId
 * - Validación de límites del plan del OWNER (no del visitor)
 * - Persistencia de conversaciones y mensajes
 * - Configuración dinámica desde chatbot (model, instructions, personality)
 * - Tools por plan del owner (RAG, web search, save contact, datetime)
 * - Streaming con onFinish callback
 *
 * 🔒 SEGURIDAD:
 * - Validación de formato ObjectId
 * - Filtrado de chatbots por status ACTIVE
 * - Tools con closure (chatbotId capturado, no modificable por modelo)
 * - Validación de límites ANTES de generar respuesta
 */

import { streamText, convertToModelMessages } from "ai";
import type { Route } from "./+types/chat.vercel.public";
import { db } from "~/utils/db.server";
import { mapModel, createPublicTools } from "@/server/config/vercel.model.providers";

export async function action({ request }: Route.ActionArgs) {
  const url = new URL(request.url);
  const { messages, sessionId } = await request.json();
  const chatbotId = url.searchParams.get("chatbotId");

  // 🔒 VALIDAR FORMATO OBJECTID
  if (!chatbotId || !/^[0-9a-fA-F]{24}$/.test(chatbotId)) {
    return Response.json(
      { error: "chatbotId inválido o faltante" },
      { status: 400 }
    );
  }

  // 🔐 AUTENTICACIÓN ANONYMOUS
  // Los usuarios públicos usan un visitorId o userId temporal
  const { authenticateAnonymous } = await import("@/server/chatbot-v0/auth");
  const { user, isAnonymous } = await authenticateAnonymous(request);
  const visitorId = isAnonymous ? user.id : null;

  // 📦 FETCH CHATBOT CON RELACIONES
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId, status: "ACTIVE" },
    include: {
      User: {
        select: { id: true, plan: true },
      },
      integrations: true,
      contexts: {
        select: { id: true }, // Solo para detectar si tiene RAG
      },
    },
  });

  if (!chatbot) {
    return Response.json(
      { error: "Chatbot no encontrado o inactivo" },
      { status: 404 }
    );
  }

  // 🛑 VALIDAR LÍMITES DEL OWNER (NO del visitor)
  const { validateMonthlyConversationLimit } = await import(
    "@/server/chatbot/planLimits.server"
  );
  const limitCheck = await validateMonthlyConversationLimit(chatbotId);

  if (!limitCheck.canCreate) {
    return Response.json(
      {
        error: `Este chatbot ha alcanzado su límite mensual de conversaciones (${limitCheck.maxAllowed}). Por favor contacta al propietario.`,
      },
      { status: 429 }
    );
  }

  // 💬 GET/CREATE CONVERSATION
  const {
    getConversationBySessionId,
    createConversation,
    addUserMessage,
    addAssistantMessage,
    getMessagesByConversationId,
    incrementConversationCount,
  } = await import("@/server/chatbot/conversationModel.server");

  let conversation = sessionId
    ? await getConversationBySessionId(sessionId)
    : null;

  if (!conversation) {
    conversation = await createConversation({
      chatbotId,
      visitorId: visitorId || user.id,
      visitorIp: request.headers.get("x-forwarded-for") || undefined,
      sessionId,
    });
  }

  // 📜 CARGAR HISTORIAL
  const history = await getMessagesByConversationId(conversation.id);

  // 💾 GUARDAR MENSAJE USER
  const userMessage = messages[messages.length - 1];
  await addUserMessage(conversation.id, userMessage.content);

  // 🤖 MODEL CORRECTION POR PLAN DEL OWNER
  const { applyModelCorrection } = await import(
    "@/server/chatbot/modelValidator.server"
  );
  const { finalModel } = applyModelCorrection(
    chatbot.User.plan,
    chatbot.aiModel,
    true // allowCorrection
  );

  // 📝 BUILD SYSTEM PROMPT DINÁMICO
  const hasRAG = chatbot.contexts.length > 0;
  const ownerPlan = chatbot.User.plan;
  const hasWebSearch = ["PRO", "ENTERPRISE"].includes(ownerPlan);

  const { buildSystemPrompt } = await import(
    "@/server/agents/agent-workflow.server"
  );

  const systemPrompt = buildSystemPrompt(
    {
      aiModel: finalModel,
      instructions: chatbot.instructions || undefined,
      customInstructions: chatbot.customInstructions || undefined,
      personality: chatbot.personality || undefined,
      name: chatbot.name,
    },
    hasRAG,
    hasWebSearch,
    false, // hasReportGeneration
    false, // hasGmailTools
    false, // isOfficialGhosty
    "web" // channel
  );

  // 🛠️ BUILD TOOLS (chatbotId en closure)
  const tools = createPublicTools({
    chatbotId, // ⭐ CAPTURADO EN CLOSURE - No modificable por modelo
    ownerPlan,
    hasRAG,
  });

  // 🌊 STREAMING CON CALLBACK
  const result = streamText({
    model: mapModel(finalModel),
    messages: convertToModelMessages([...history, userMessage]),
    system: systemPrompt,
    tools,
    maxSteps: 5, // Stop condition
    onFinish: async (event) => {
      try {
        // 💾 Guardar respuesta ASSISTANT
        await addAssistantMessage(conversation.id, event.text);

        // 📊 Incrementar contador del OWNER
        await incrementConversationCount(chatbotId);
      } catch (error) {
        console.error("[Chat Public] Error in onFinish callback:", error);
        // No fallar el stream por error en callback
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
