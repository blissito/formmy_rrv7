/**
 * API Chatbot V0 - Endpoint específico para AgentEngine_v0
 * Solo maneja chat, no CRUD
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticateRequest, createAuthError, createUnsupportedIntentError } from "../../server/chatbot-v0/auth";

export function loader() {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  console.log('🚀 Chatbot V0 API - Request received:', request.method, request.url);

  try {
    // 📝 Parsear request
    const formData = await request.formData();

    // 🔑 Autenticación
    const { user, isTestUser } = await authenticateRequest(request, formData);

    if (!user) {
      return createAuthError();
    }

    const intent = formData.get("intent") as string;
    console.log('🎯 Chatbot V0 Intent:', intent);

    switch (intent) {
      case "chat": {
        // 💬 Solo manejar chat con AgentEngine_v0
        return await handleChatV0({
          chatbotId: formData.get("chatbotId") as string,
          message: formData.get("message") as string,
          sessionId: formData.get("sessionId") as string,
          conversationHistory: formData.get("conversationHistory") as string,
          requestedStream: formData.get("stream") === "true",
          userId: user.id,
          user: user
        });
      }

      default: {
        return createUnsupportedIntentError();
      }
    }

  } catch (error) {
    console.error('❌ Chatbot V0 API Error:', error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error?.message || "Error desconocido"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

/**
 * Manejar chat específicamente con AgentEngine_v0
 */
async function handleChatV0(params: {
  chatbotId: string;
  message: string;
  sessionId?: string;
  conversationHistory?: string;
  requestedStream: boolean;
  userId: string;
  user: { id: string; plan: string };
}): Promise<Response> {

  const { chatbotId, message, sessionId, conversationHistory, requestedStream, userId, user } = params;

  // Validar parámetros requeridos
  if (!chatbotId || !message) {
    return new Response(
      JSON.stringify({ error: "Faltan parámetros requeridos: chatbotId, message" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Obtener chatbot
  const { getChatbot } = await import("../../server/chatbot-v0/chatbot");
  const chatbot = await getChatbot(chatbotId, userId);

  if (!chatbot) {
    return new Response(
      JSON.stringify({ error: "Chatbot no encontrado" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (chatbot.userId !== userId) {
    return new Response(
      JSON.stringify({ error: "Sin permisos para este chatbot" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parsear historial conversacional
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (conversationHistory) {
    try {
      history = JSON.parse(conversationHistory);
    } catch (e) {
      console.warn("Error parsing conversation history:", e);
    }
  }

  console.log('🎯 Chatbot V0 Chat Request:', {
    chatbotId,
    messageLength: message.length,
    sessionId,
    historyLength: history.length,
    requestedStream,
    model: chatbot.aiModel
  });

  try {
    // 🚀 AGENTENGINE_V0 - Usando motor funcional con herramientas
    console.log('🚀 Usando AgentEngine_v0 (motor funcional con herramientas)...');

    const { chatWithAgentEngineV0 } = await import("../../server/agent-engine-v0");

    // Usuario ya disponible desde auth

    // Usar motor funcional con auto-herramientas
    const options = {
      conversationHistory: history,
      streaming: false,
      sessionId
    };

    // Crear stream y colectar resultado
    try {
      const streamGenerator = await chatWithAgentEngineV0(message, chatbot, user, options);

      let fullResponse = '';
      for await (const chunk of streamGenerator) {
        fullResponse += chunk;
      }

      if (!fullResponse.trim()) {
        fullResponse = "Hola, ¿en qué puedo ayudarte?";
      }

      const v0Response = {
        content: fullResponse.trim() || "Hola, ¿en qué puedo ayudarte?",
        toolsUsed: [], // Los tools se manejan automáticamente en el stream
        metadata: {
          model: chatbot.aiModel,
          agent: `${chatbot.name}_Agent`
        }
      };

      console.log('✅ AgentEngine_v0 response received:', {
        hasContent: !!v0Response.content,
        contentLength: v0Response.content?.length || 0
      });

      return new Response(JSON.stringify({
        success: true,
        message: v0Response.content,
        response: v0Response.content, // Compatibilidad con frontend
        toolsUsed: v0Response.toolsUsed || [],
        engine: "agentengine-v0",
        model: chatbot.aiModel,
        streaming: false,
        sessionId,
        metadata: {
          chatbotId,
          sessionId,
          timestamp: new Date().toISOString(),
          tokensUsed: v0Response.metadata?.tokensUsed
        }
      }), {
        headers: { "Content-Type": "application/json" }
      });

    } catch (innerError) {
      console.error('❌ AgentEngine_v0 inner error:', innerError);
      return new Response(
        JSON.stringify({
          error: "Error en AgentEngine_v0",
          details: innerError?.message || "Error interno del agente"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error('❌ AgentEngine_v0 error:', error);
    return new Response(
      JSON.stringify({
        error: "Error en AgentEngine_v0",
        details: error?.message || "Motor simple no disponible"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}