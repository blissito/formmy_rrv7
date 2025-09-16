/**
 * LlamaIndex V2 API Endpoint - Modularizado y limpio
 * Solo maneja chat con LlamaIndex V2, sin CRUD ni lógica compleja
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticateRequest, createAuthError } from "../../server/llamaindex-v2/auth";
import { handleChatRequest } from "../../server/llamaindex-v2/chat-handler";
import { createUnsupportedIntentError } from "../../server/llamaindex-v2/response-handler";

export function loader() {
  return new Response(JSON.stringify({ message: "GET not implemented" }), {
    headers: { "Content-Type": "application/json" },
  });
}

export async function action({ request }: ActionFunctionArgs) {
  console.log('🚀 LlamaIndex V2 API - Request received:', request.method, request.url);

  try {
    // 📝 Parsear request primero (solo una vez)
    const formData = await request.formData();

    // 🔑 Autenticación modular
    const { user, isTestUser } = await authenticateRequest(request, formData);

    if (!user) {
      return createAuthError();
    }
    const intent = formData.get("intent") as string;
    console.log('🎯 LlamaIndex V2 Intent:', intent);

    switch (intent) {
      case "chat": {
        // Parsear parámetros de chat
        const chatbotId = formData.get("chatbotId") as string;
        const message = formData.get("message") as string;
        const sessionId = formData.get("sessionId") as string;
        const conversationHistoryStr = formData.get("conversationHistory") as string;
        const requestedStream = formData.get("stream") === "true";

        // Parsear historial conversacional
        let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
        if (conversationHistoryStr) {
          try {
            conversationHistory = JSON.parse(conversationHistoryStr);
          } catch (e) {
            console.warn("Error parsing conversation history:", e);
          }
        }

        // 💬 Manejar chat con módulo dedicado
        return await handleChatRequest({
          chatbotId,
          message,
          sessionId,
          conversationHistory,
          requestedStream,
          userId: user.id,
          isTestUser
        });
      }

      default: {
        return createUnsupportedIntentError();
      }
    }

  } catch (error) {
    console.error('❌ LlamaIndex V2 API Error:', error);
    return new Response(
      JSON.stringify({
        error: "Error interno del servidor",
        details: error?.message || "Error desconocido"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}