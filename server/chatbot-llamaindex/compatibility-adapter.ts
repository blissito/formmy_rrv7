/**
 * COMPATIBILITY ADAPTER
 *
 * Drop-in replacement para el API actual que usa LlamaIndex internamente
 * Mantiene compatibilidad completa con la API existente
 */

import { ChatbotLlamaIndex } from "./index";
import type { User, Chatbot } from "@prisma/client";

/**
 * ADAPTER FUNCTION - Drop-in replacement para el sistema actual
 *
 * Reemplaza directamente las llamadas existentes sin cambiar la API
 */
export async function chatWithLlamaIndex(
  message: string,
  chatbot: Chatbot,
  user: User,
  options: {
    contexts?: any[];
    conversationHistory?: Array<{ role: string; content: string }>;
    integrations?: Record<string, any>;
    model?: string;
    temperature?: number;
    sessionId?: string;
    stream?: boolean;
  } = {}
): Promise<{
  content: string;
  toolsUsed: string[];
  sources?: any[];
  iterations?: number;
  error?: string;
}> {


  try {
    // Crear instancia de ChatbotLlamaIndex
    const llamaIndexChatbot = new ChatbotLlamaIndex({
      chatbot,
      user,
      model: options.model || chatbot.aiModel || "gpt-5-nano",
      temperature: options.temperature ?? chatbot.temperature ?? undefined,
      contexts: options.contexts || [],
      integrations: options.integrations || {},
    });

    // Ejecutar chat usando LlamaIndex
    const response = await llamaIndexChatbot.chat(message, {
      conversationHistory: options.conversationHistory,
      sessionId: options.sessionId,
      stream: options.stream,
    });


    return response;

  } catch (error) {
    console.error("❌ LLAMAINDEX ADAPTER ERROR:", error);

    return {
      content: "Lo siento, ha ocurrido un error inesperado. Por favor, intenta de nuevo.",
      toolsUsed: [],
      iterations: 0,
      error: (error as Error).message,
    };
  }
}

/**
 * TEST FUNCTION - Para verificar que las herramientas funcionan
 */
export async function testLlamaIndexTools(
  chatbot: Chatbot,
  user: User,
  integrations: Record<string, any> = {}
): Promise<{
  success: boolean;
  availableTools: string[];
  error?: string;
}> {

  try {

    const llamaIndexChatbot = new ChatbotLlamaIndex({
      chatbot,
      user,
      model: "gpt-5-nano",
      integrations,
    });

    // Get available tools
    const availableTools = llamaIndexChatbot.getAvailableTools();


    return {
      success: true,
      availableTools,
    };

  } catch (error) {
    console.error("❌ Test failed:", error);

    return {
      success: false,
      availableTools: [],
      error: (error as Error).message,
    };
  }
}