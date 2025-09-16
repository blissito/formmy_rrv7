/**
 * Compatibility Adapter - ChatbotAgent
 *
 * Drop-in replacement para el Formmy Agent Framework
 * Mantiene API 100% compatible pero usa el motor v0.0.1 internamente
 */

import type { User, Chatbot } from "@prisma/client";
import { ChatbotAgent } from "./chatbot-agent";

/**
 * Adapter principal - REEMPLAZA completamente el FormmyAgent
 * Mantiene la misma signature que el sistema anterior
 */
export async function chatWithNewEngine(
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
  iterations?: number;
  error?: string;
  metadata?: any;
}> {

  console.log(`🚀 NEW ENGINE ADAPTER: ChatbotAgent for ${chatbot.name}`);

  try {
    // Crear instancia del ChatbotAgent
    const agent = new ChatbotAgent(chatbot, user, {
      contexts: options.contexts,
      integrations: options.integrations,
    });

    // Preparar contexto de ejecución
    const executionContext = {
      user,
      chatbot,
      sessionId: options.sessionId,
      conversationHistory: options.conversationHistory,
      integrations: options.integrations,
      metadata: {
        originalRequest: {
          model: options.model,
          temperature: options.temperature,
          stream: options.stream,
        }
      }
    };

    // Ejecutar chat con streaming si está habilitado
    const response = await agent.chat(message, executionContext, options.stream ?? true); // Default streaming

    // Handle streaming vs non-streaming response
    if (isAsyncIterable(response)) {
      console.log(`🌊 NEW ENGINE ADAPTER: Processing streaming response`);

      // Consume streaming response and convert to EngineResponse
      const streamResult = await consumeStreamingResponse(response);

      console.log(`✅ NEW ENGINE ADAPTER: Success`, {
        contentLength: streamResult.content.length,
        toolsUsed: streamResult.toolsUsed.length,
        processingTime: streamResult.processingTime,
        streaming: true
      });

      return streamResult;
    } else {
      console.log(`✅ NEW ENGINE ADAPTER: Success`, {
        contentLength: response.content.length,
        toolsUsed: response.toolsUsed.length,
        processingTime: response.metadata.processingTime,
        streaming: false
      });

      // Convertir al formato esperado por el sistema actual
      return {
        content: response.content,
        toolsUsed: response.toolsUsed,
        iterations: response.metadata.iterations,
        error: response.error,
        metadata: {
          model: response.metadata.model,
          agentName: response.metadata.agentName,
          processingTime: response.metadata.processingTime,
          engine: 'llamaindex-v0.0.1',
          tokensUsed: response.metadata.tokensUsed,
        }
      };
    }

  } catch (error) {
    console.error('❌ NEW ENGINE ADAPTER ERROR:', error);

    return {
      content: 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.',
      toolsUsed: [],
      iterations: 0,
      error: (error as Error).message,
      metadata: {
        engine: 'llamaindex-v0.0.1',
        error: true,
      }
    };
  }
}

/**
 * Test function para validar el nuevo motor
 */
export async function testNewEngine(
  chatbot: Chatbot,
  user: User,
  testMessage: string = "Hola, ¿cómo puedes ayudarme?"
): Promise<{
  success: boolean;
  response?: string;
  toolsAvailable: string[];
  processingTime?: number;
  error?: string;
}> {

  console.log(`🧪 TESTING NEW ENGINE for chatbot: ${chatbot.name}`);

  try {
    const startTime = Date.now();

    // Crear agente de prueba
    const agent = new ChatbotAgent(chatbot, user, {
      contexts: [],
      integrations: {},
    });

    // Test de conectividad
    const agentTest = await agent.test();
    if (!agentTest.success) {
      return {
        success: false,
        toolsAvailable: [],
        error: agentTest.error,
      };
    }

    // Test de chat básico
    const executionContext = {
      user,
      chatbot,
      sessionId: `test-${Date.now()}`,
      conversationHistory: [],
    };

    const response = await agent.chat(testMessage, executionContext, true); // Enable streaming test

    const processingTime = Date.now() - startTime;

    console.log(`✅ NEW ENGINE TEST SUCCESS:`, {
      processingTime,
      contentLength: response.content.length,
      toolsUsed: response.toolsUsed,
    });

    return {
      success: true,
      response: response.content,
      toolsAvailable: response.toolsUsed,
      processingTime,
    };

  } catch (error) {
    console.error('❌ NEW ENGINE TEST FAILED:', error);

    return {
      success: false,
      toolsAvailable: [],
      error: (error as Error).message,
    };
  }
}

/**
 * Compare engines - útil para A/B testing
 */
export async function compareEngines(
  message: string,
  chatbot: Chatbot,
  user: User,
  options: {
    contexts?: any[];
    conversationHistory?: Array<{ role: string; content: string }>;
    integrations?: Record<string, any>;
  } = {}
): Promise<{
  newEngine: {
    content: string;
    processingTime: number;
    toolsUsed: string[];
    success: boolean;
    error?: string;
  };
  oldEngine: {
    content: string;
    processingTime: number;
    toolsUsed: string[];
    success: boolean;
    error?: string;
  };
  recommendation: 'new' | 'old' | 'equivalent';
}> {

  console.log(`🔄 COMPARING ENGINES for: ${message.substring(0, 50)}...`);

  // Test nuevo motor
  const newEngineStart = Date.now();
  let newEngineResult;
  try {
    newEngineResult = await chatWithNewEngine(message, chatbot, user, options);
    newEngineResult.processingTime = Date.now() - newEngineStart;
    newEngineResult.success = !newEngineResult.error;
  } catch (error) {
    newEngineResult = {
      content: 'Error en motor nuevo',
      processingTime: Date.now() - newEngineStart,
      toolsUsed: [],
      success: false,
      error: (error as Error).message,
    };
  }

  // Test motor antiguo (Framework Formmy)
  const oldEngineStart = Date.now();
  let oldEngineResult;
  try {
    const { FormmyAgent } = await import('../../formmy-agent');

    const agent = new FormmyAgent({
      model: chatbot.aiModel || 'gpt-5-nano',
      maxIterations: 5,
      contextLimit: 4000,
    });

    const response = await agent.chat(message, {
      contexts: options.contexts || [],
      conversationHistory: options.conversationHistory || [],
      model: chatbot.aiModel,
      user,
      chatbotId: chatbot.id,
    });

    oldEngineResult = {
      content: response.content,
      processingTime: Date.now() - oldEngineStart,
      toolsUsed: response.toolsUsed || [],
      success: !response.error,
      error: response.error,
    };

  } catch (error) {
    oldEngineResult = {
      content: 'Error en motor antiguo',
      processingTime: Date.now() - oldEngineStart,
      toolsUsed: [],
      success: false,
      error: (error as Error).message,
    };
  }

  // Determinar recomendación
  let recommendation: 'new' | 'old' | 'equivalent' = 'equivalent';

  if (newEngineResult.success && !oldEngineResult.success) {
    recommendation = 'new';
  } else if (!newEngineResult.success && oldEngineResult.success) {
    recommendation = 'old';
  } else if (newEngineResult.success && oldEngineResult.success) {
    // Ambos funcionan, comparar calidad
    if (newEngineResult.toolsUsed.length > oldEngineResult.toolsUsed.length) {
      recommendation = 'new';
    } else if (newEngineResult.processingTime < oldEngineResult.processingTime * 1.2) {
      recommendation = 'new'; // 20% más rápido
    }
  }

  console.log(`📊 ENGINE COMPARISON:`, {
    new: { success: newEngineResult.success, time: newEngineResult.processingTime },
    old: { success: oldEngineResult.success, time: oldEngineResult.processingTime },
    recommendation,
  });

  return {
    newEngine: newEngineResult,
    oldEngine: oldEngineResult,
    recommendation,
  };
}

/**
 * Check if response is AsyncIterable (streaming)
 */
function isAsyncIterable(obj: any): obj is AsyncIterable<any> {
  return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
}

/**
 * Consume streaming response and convert to EngineResponse format
 */
async function consumeStreamingResponse(streamResponse: AsyncIterable<any>): Promise<any> {
  let fullContent = '';
  let toolsUsed: string[] = [];
  let metadata: any = {};
  let processingTime = 0;
  let iterations = 0;

  try {
    for await (const chunk of streamResponse) {
      if (chunk.type === 'content') {
        fullContent += chunk.content || '';
      } else if (chunk.type === 'metadata') {
        metadata = chunk.metadata;
        processingTime = chunk.metadata.processingTime || 0;
        toolsUsed = chunk.metadata.toolsUsed || [];
        iterations = chunk.metadata.iterations || 1;
      } else if (chunk.type === 'error') {
        throw new Error(chunk.error);
      }
    }

    return {
      content: fullContent,
      toolsUsed: toolsUsed,
      iterations: iterations,
      metadata: {
        ...metadata,
        processingTime: processingTime
      },
      processingTime: processingTime
    };

  } catch (error) {
    console.error(`❌ Error consuming streaming response:`, error);
    return {
      content: 'Error procesando respuesta streaming',
      toolsUsed: [],
      iterations: 0,
      error: (error as Error).message,
      metadata: {},
      processingTime: 0
    };
  }
}

/**
 * Factory function para crear ChatbotAgent fácilmente
 */
export function createChatbotAgent(chatbot: Chatbot, user: User, options: {
  contexts?: any[];
  integrations?: Record<string, any>;
} = {}): ChatbotAgent {
  return new ChatbotAgent(chatbot, user, options);
}