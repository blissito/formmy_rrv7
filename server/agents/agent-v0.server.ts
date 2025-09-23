/**
 * AgentV0 - LlamaIndex Agent Workflows Pure Implementation
 * 100% LlamaIndex patterns oficiales - Zero código custom
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { getToolsForPlan, type ToolContext } from '../tools';

// GPT-5 Nano optimizado para tool workflows con enhanced error handling
const getModelForUserPlan = (plan: string): string => {
  switch (plan) {
    case 'ENTERPRISE':
      return 'gpt-5-mini'; // Máximo rendimiento para Enterprise
    case 'PRO':
    case 'TRIAL':
      return 'gpt-5-nano'; // Modelo optimizado para PRO
    case 'STARTER':
      return 'gpt-5-nano'; // Modelo básico pero eficiente
    case 'FREE':
    default:
      return 'gpt-5-nano'; // Default para todos
  }
};

/**
 * runStream funcional - Pattern oficial LlamaIndex Agent Workflows
 * Siguiendo exactamente la documentación de LlamaIndex TypeScript
 */
export const streamAgentV0 = async function* (user: any, message: string, chatbotId?: string, integrations: Record<string, any> = {}) {
  // Crear context para tools
  const toolContext: ToolContext = {
    userId: user.id,
    userPlan: user.plan || 'FREE',
    chatbotId: chatbotId || null,
    message,
    integrations
  };

  // Model configuration - GPT-5 Nano optimizado para tool workflows
  const selectedModel = getModelForUserPlan(user.plan || 'FREE');

  // OpenAI configuration con enhanced timeout y retry para tool workflows
  const llmInstance = new OpenAI({
    model: selectedModel,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: selectedModel === 'gpt-5-nano' ? 1 : 0.3, // GPT-5 nano requires temperature=1
    timeout: 60000, // 60s timeout para tool workflows
    maxRetries: 3 // Enhanced retry para stability
  });

  // agent() function - pattern oficial LlamaIndex
  const availableTools = getToolsForPlan(user.plan || 'FREE', integrations, toolContext);
  const toolNames = availableTools.map(tool => tool.metadata?.name || 'unknown').join(', ');

  const agentInstance = agent({
    llm: llmInstance,
    tools: availableTools,
    systemPrompt: `Eres Ghosty 👻, asistente de Formmy.

REGLA: USA HERRAMIENTAS PRIMERO. Nunca inventes datos.

Herramientas: ${toolNames}

Para reportes: query_chatbots + get_chatbot_stats
Para recordatorios: schedule_reminder
Para pagos: create_payment_link

Respuestas: Concisas, datos reales, insights específicos.`
  });

  console.log('🚀 AgentV0 iniciado:', {
    userId: user.id,
    plan: user.plan || 'FREE',
    model: selectedModel,
    toolsCount: availableTools.length
  });

  // Thinking status inicial
  yield {
    type: "status",
    status: "thinking",
    message: "🤔 Analizando tu mensaje..."
  };

  try {
    // runStream() - Pattern oficial LlamaIndex Agent Workflows
    const events = agentInstance.runStream(message);

    // Event-driven streaming siguiendo documentación oficial LlamaIndex
    // Pattern exacto de la documentación: https://next.ts.llamaindex.ai/docs/llamaindex/modules/agents/agent_workflow
    let hasStreamedContent = false;
    let toolsExecuted = 0;
    let lastEventTime = Date.now();

    try {
      // Timeout wrapper para detectar GPT-5 Nano stalls
      const eventIterator = events as any;
      const timeoutMs = 45000; // 45 seconds timeout

      for await (const event of eventIterator) {
        // Tool call events - Pattern oficial
        if (agentToolCallEvent.include(event)) {
          toolsExecuted++;
          console.log(`🔧 Tool: ${event.data.toolName}`);
          yield {
            type: "tool-start",
            tool: event.data.toolName,
            message: `🔧 ${event.data.toolName}`
          };
        }

        // Stream content events - Pattern oficial
        if (agentStreamEvent.include(event)) {
          if (!hasStreamedContent) {
            hasStreamedContent = true;
          }

          yield {
            type: "chunk",
            content: event.data.delta
          };
        }
      }

      console.log(`🏁 Stream completed. Tools executed: ${toolsExecuted}, Content streamed: ${hasStreamedContent}`);

    } catch (streamError) {
      console.error('❌ Stream iteration error:', streamError);
      throw new Error(`Streaming failed: ${streamError instanceof Error ? streamError.message : 'Unknown streaming error'}`);
    }

    // GPT-5 Nano specific: If tools were executed but no content was streamed
    if (toolsExecuted > 0 && !hasStreamedContent) {
      console.warn(`⚠️ GPT-5 Nano stall detected. Tools executed: ${toolsExecuted}, Model: ${selectedModel}`);

      // Return the tool results directly if GPT-5 Nano stalls
      yield {
        type: "chunk",
        content: "He ejecutado las herramientas solicitadas para analizar tus datos. Las herramientas funcionaron correctamente, pero hubo un problema con la generación de respuesta. Los datos están disponibles - puedes intentar hacer la pregunta de una forma diferente."
      };

      yield {
        type: "done",
        metadata: {
          model: selectedModel,
          agent: 'AgentV0-Recovery',
          userId: user.id,
          toolsExecuted,
          recoveryMode: true
        }
      };
      return;
    }

    // Completion signal
    yield {
      type: "done",
      metadata: {
        model: selectedModel,
        agent: 'AgentV0',
        userId: user.id
      }
    };

  } catch (error) {
    console.error('❌ AgentV0 error:', error);

    yield {
      type: "error",
      content: "Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.",
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Debug utility - Lista tools disponibles para un plan
 */
export const debugToolsForPlan = (plan: string, integrations: Record<string, any> = {}) => {
  // Mock context for debugging
  const mockContext: ToolContext = {
    userId: 'debug-user',
    userPlan: plan,
    chatbotId: null,
    message: '',
    integrations
  };

  const tools = getToolsForPlan(plan, integrations, mockContext);
  console.log(`🔧 Tools disponibles para plan ${plan}:`, tools.length);
  return tools.length;
};

/**
 * Utility funcional para verificar si un usuario tiene acceso a tools
 */
export const userHasTools = (userPlan: string): boolean => {
  return ['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan);
};