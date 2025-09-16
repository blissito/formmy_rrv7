/**
 * Módulo de chat principal para LlamaIndex V2
 * Maneja toda la lógica de chat de forma limpia
 */

import { getChatbotOrMock, createChatbotNotFoundError, createChatbotPermissionError } from './chatbot-mock';
import { createStreamingResponse, createRegularResponse, createErrorResponse, createValidationError, type ResponseMetadata } from './response-handler';

export interface ChatRequest {
  chatbotId: string;
  message: string;
  sessionId?: string;
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
  requestedStream: boolean;
  userId: string;
  isTestUser: boolean;
}

export async function handleChatRequest(chatRequest: ChatRequest): Promise<Response> {
  const { chatbotId, message, sessionId, conversationHistory = [], requestedStream, userId, isTestUser } = chatRequest;

  // Validar parámetros requeridos
  if (!chatbotId || !message) {
    return createValidationError("Faltan parámetros requeridos: chatbotId, message");
  }

  // Verificar que el chatbot pertenece al usuario
  const chatbot = await getChatbotOrMock(chatbotId, userId, isTestUser);

  if (!chatbot) {
    return createChatbotNotFoundError();
  }

  if (chatbot.userId !== userId) {
    return createChatbotPermissionError();
  }

  console.log('🎯 LlamaIndex V2 Chat Request:', {
    chatbotId,
    messageLength: message.length,
    sessionId,
    historyLength: conversationHistory.length,
    requestedStream,
    model: chatbot.aiModel
  });

  try {
    // ✨ LLAMAINDEX V2 ENGINE - Solo motor, sin lógica adicional
    const { chatWithLlamaIndexV2 } = await import("../llamaindex-engine-v2");

    const v2Response = await chatWithLlamaIndexV2(
      message,
      chatbot,
      { id: userId, plan: 'PRO' }, // Usuario simplificado
      {
        contexts: [], // Simplificado para v2
        conversationHistory: conversationHistory,
        integrations: {
          stripe: null // Simplificado para v2
        },
        model: chatbot.aiModel,
        temperature: chatbot.temperature,
        sessionId: sessionId,
        stream: requestedStream, // Respetar directamente el parámetro
      }
    );

    console.log('✅ LlamaIndex v2.0 response received');

    // Metadata para la respuesta
    const metadata: ResponseMetadata = {
      chatbotId,
      sessionId,
      model: chatbot.aiModel,
      streaming: requestedStream,
      timestamp: new Date().toISOString()
    };

    // Handle streaming vs regular response
    if (requestedStream && typeof v2Response === 'object' && v2Response[Symbol.asyncIterator]) {
      return createStreamingResponse(v2Response);
    } else {
      return createRegularResponse(v2Response, metadata);
    }

  } catch (error) {
    return createErrorResponse(error);
  }
}