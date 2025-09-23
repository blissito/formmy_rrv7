/**
 * AgentV0 - LlamaIndex Agent Workflows Pure Implementation
 * 100% LlamaIndex patterns oficiales - Zero código custom
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { getToolsForPlan, type ToolContext } from '../tools';

// TEMPORARY FIX: Use Claude 3 Haiku for tool workflows until GPT-5 Nano issues resolved
const getModelForUserPlan = (plan: string): string => {
  switch (plan) {
    case 'ENTERPRISE':
      return 'claude-3-5-haiku-20241022'; // Premium model for Enterprise
    case 'PRO':
    case 'TRIAL':
      return 'claude-3-haiku-20240307'; // Stable model with excellent tool support
    case 'STARTER':
      return 'claude-3-haiku-20240307'; // Reliable for tool workflows
    case 'FREE':
    default:
      return 'claude-3-haiku-20240307'; // Default fallback
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

  // Model configuration - Using Claude 3 Haiku for reliable tool workflows
  const selectedModel = getModelForUserPlan(user.plan || 'FREE');

  // Use Anthropic for Claude models, OpenAI for GPT models
  let llmInstance: any;
  if (selectedModel.startsWith('claude-')) {
    llmInstance = new Anthropic({
      model: selectedModel,
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7
    });
  } else {
    // Fallback to OpenAI if needed
    llmInstance = new OpenAI({
      model: selectedModel,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: selectedModel === 'gpt-5-nano' ? 1 : 0.3
    });
  }

  // agent() function - pattern oficial LlamaIndex
  const availableTools = getToolsForPlan(user.plan || 'FREE', integrations, toolContext);
  const toolNames = availableTools.map(tool => tool.metadata?.name || 'unknown').join(', ');

  const agentInstance = agent({
    llm: llmInstance,
    tools: availableTools,
    systemPrompt: `Eres Ghosty 👻, el asistente IA EXPERTO de Formmy.

🎯 **PRIORIDAD ABSOLUTA: USA HERRAMIENTAS INMEDIATAMENTE**

**REGLA CRÍTICA**: NUNCA respondas sin usar herramientas relevantes primero.

**HERRAMIENTAS DISPONIBLES**: ${toolNames}

**PARA REPORTES/ESTADÍSTICAS**:
- SIEMPRE usa query_chatbots + get_chatbot_stats
- NUNCA inventes datos ni des plantillas
- Proporciona números reales, tendencias, insights específicos

**PARA RECORDATORIOS/CITAS**:
- USA schedule_reminder inmediatamente
- NO pidas confirmación adicional

**PARA PAGOS**:
- USA create_payment_link con datos exactos
- Cantidad en números (ej: 500, 1000)

**CONTEXTO USUARIO**:
- Plan: ${user.plan || 'FREE'}
- ID: ${user.id}

**PERSONALIDAD**:
- Directo y eficiente
- Orientado a datos reales
- Proactivo con insights específicos

**FORMATO RESPUESTA**:
1. USAR HERRAMIENTAS PRIMERO
2. Analizar resultados
3. Respuesta concisa con números reales
4. Insights accionables
5. Próximos pasos específicos

❌ PROHIBIDO: Respuestas genéricas, plantillas, "no tengo acceso a datos"
✅ OBLIGATORIO: Datos reales, métricas específicas, análisis profundo

🚀 **ACTÚA COMO EXPERTO CON ACCESO TOTAL A FORMMY**`
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
      for await (const event of events as any) {
        lastEventTime = Date.now();
        console.log(`📋 Event received:`, event.type || 'unknown', event.data?.toolName || '');

        // Tool call events - Pattern oficial
        if (agentToolCallEvent.include(event)) {
          toolsExecuted++;
          console.log(`🔧 Tool llamado: ${event.data.toolName} (total: ${toolsExecuted})`);
          yield {
            type: "tool-start",
            tool: event.data.toolName,
            message: `🔧 Ejecutando ${event.data.toolName}...`
          };
        }

        // Stream content events - Pattern oficial
        if (agentStreamEvent.include(event)) {
          if (!hasStreamedContent) {
            console.log('✍️ Starting content streaming...');
            yield {
              type: "status",
              status: "streaming",
              message: "✍️ Generando respuesta..."
            };
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

    // If tools were executed but no content was streamed, something went wrong
    if (toolsExecuted > 0 && !hasStreamedContent) {
      console.warn('⚠️ Tools were executed but no content was streamed. Possible AgentV0 stall.');

      yield {
        type: "error",
        content: "Las herramientas se ejecutaron pero no se generó respuesta. Intenta de nuevo.",
        error: "Agent stalled after tool execution"
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