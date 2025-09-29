/**
 * AgentV0 - Multi-Agent Architecture with LlamaIndex Workflows
 * Optimized performance using orchestrator pattern
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { getToolsForPlan, type ToolContext } from '../tools';
import { getCachedRouterAgent, analyzeRouterResponse, quickRouteCheck } from './agent-router.server';

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
 * Cache for tool agents to avoid recreation
 */
const toolAgentCache = new Map<string, ReturnType<typeof agent>>();

/**
 * Create or get cached tool agent
 */
const getOrCreateToolAgent = (
  user: any,
  message: string,
  chatbotId: string | undefined,
  integrations: Record<string, any>
): ReturnType<typeof agent> => {
  const cacheKey = `${user.id}_${user.plan}`;

  if (!toolAgentCache.has(cacheKey)) {
    const toolContext: ToolContext = {
      userId: user.id,
      userPlan: user.plan || 'FREE',
      chatbotId: chatbotId || null,
      message,
      integrations
    };

    const selectedModel = getModelForUserPlan(user.plan || 'FREE');
    const llmInstance = new OpenAI({
      model: selectedModel,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: selectedModel === 'gpt-5-nano' ? 1 : 0.3,
      timeout: 60000,
      maxRetries: 3
    });

    const availableTools = getToolsForPlan(user.plan || 'FREE', integrations, toolContext);
    const toolNames = availableTools.map(tool => tool.metadata?.name || 'unknown').join(', ');

    const toolAgent = agent({
      llm: llmInstance,
      tools: availableTools,
      systemPrompt: `Eres Ghosty 👻, asistente de Formmy con herramientas.

HERRAMIENTAS DISPONIBLES: ${toolNames}

INSTRUCCIONES:
- USA las herramientas apropiadas para responder
- Para reportes: query_chatbots + get_chatbot_stats
- Para recordatorios: schedule_reminder, list_reminders, etc.
- Para pagos: create_payment_link
- Sé conciso y directo con los resultados`
    });

    toolAgentCache.set(cacheKey, toolAgent);
  }

  return toolAgentCache.get(cacheKey)!;
};

/**
 * Create personalized router agent using chatbot configuration
 */
const createPersonalizedRouterAgent = (user: any, resolvedConfig?: any): ReturnType<typeof agent> => {
  const selectedModel = getModelForUserPlan(user.plan || 'FREE');

  // Build personalized system prompt
  let systemPrompt = "Eres un router inteligente";

  if (resolvedConfig) {
    // Use chatbot's personality and instructions
    const chatbotName = resolvedConfig.name || "asistente";
    const personality = resolvedConfig.personality || "professional";
    const instructions = resolvedConfig.instructions || "";
    const customInstructions = resolvedConfig.customInstructions || "";

    systemPrompt = `Eres ${chatbotName}, un ${personality === 'customer_support' ? 'asistente de soporte' :
      personality === 'sales' ? 'asistente de ventas' :
      personality === 'friendly' ? 'asistente amigable' : 'asistente profesional'}.

${instructions}
${customInstructions}

COMO ROUTER: Analiza RÁPIDAMENTE el mensaje del usuario y decide si necesita herramientas.

NECESITA HERRAMIENTAS si pide:
- Crear/programar recordatorios o citas
- Listar/ver/modificar recordatorios
- Generar links de pago
- Guardar información de contacto
- Estadísticas o análisis de chatbots
- Información sobre fecha/hora actual

Si SÍ necesita herramientas, responde EXACTAMENTE: "DELEGATE_TO_TOOLS"
Si NO necesita herramientas, responde directamente manteniendo tu personalidad.`;
  } else {
    // Fallback to generic router
    systemPrompt = `Eres un router inteligente para el chatbot Formmy.
Tu trabajo es analizar RÁPIDAMENTE el mensaje del usuario y decidir si necesita herramientas.

REGLAS DE DECISIÓN:

1. NECESITA HERRAMIENTAS si el usuario:
   - Pide crear/programar un recordatorio o cita
   - Solicita listar/ver/modificar/cancelar recordatorios
   - Pide generar un link de pago o cobro
   - Solicita guardar información de contacto
   - Pide estadísticas o análisis de chatbots
   - Solicita información sobre fecha/hora actual

2. NO NECESITA HERRAMIENTAS si el usuario:
   - Hace preguntas generales o de conversación
   - Saluda o se despide
   - Pide información sobre Formmy
   - Hace consultas conceptuales
   - Pide ayuda o explicaciones

FORMATO DE RESPUESTA:
- Si NO necesita herramientas, responde directamente al usuario de forma natural.
- Si SÍ necesita herramientas, responde EXACTAMENTE: "DELEGATE_TO_TOOLS"

IMPORTANTE: Sé EXTREMADAMENTE conciso y rápido en tu decisión.`;
  }

  const llmInstance = new OpenAI({
    model: selectedModel,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: selectedModel === 'gpt-5-nano' ? 1 : 0.1,
    timeout: 15000,
    maxRetries: 2
  });

  return agent({
    llm: llmInstance,
    tools: [],
    systemPrompt
  });
};

/**
 * Create personalized tool agent using chatbot configuration
 */
const getOrCreatePersonalizedToolAgent = (
  user: any,
  message: string,
  chatbotId: string | undefined,
  integrations: Record<string, any>,
  resolvedConfig?: any
): ReturnType<typeof agent> => {
  // Include chatbot config in cache key for personalization
  const configHash = resolvedConfig ? JSON.stringify({
    name: resolvedConfig.name,
    personality: resolvedConfig.personality,
    instructions: resolvedConfig.instructions?.substring(0, 100), // First 100 chars for cache
    customInstructions: resolvedConfig.customInstructions?.substring(0, 100)
  }).slice(0, 50) : 'default';

  const cacheKey = `${user.id}_${user.plan}_${configHash}`;

  if (!toolAgentCache.has(cacheKey)) {
    const toolContext: ToolContext = {
      userId: user.id,
      userPlan: user.plan || 'FREE',
      chatbotId: chatbotId || null,
      message,
      integrations
    };

    const selectedModel = getModelForUserPlan(user.plan || 'FREE');
    const llmInstance = new OpenAI({
      model: selectedModel,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: resolvedConfig?.temperature || (selectedModel === 'gpt-5-nano' ? 1 : 0.3),
      timeout: 60000,
      maxRetries: 3
    });

    const availableTools = getToolsForPlan(user.plan || 'FREE', integrations, toolContext);
    const toolNames = availableTools.map(tool => tool.metadata?.name || 'unknown').join(', ');

    // Build personalized system prompt
    let systemPrompt = `Eres un asistente con herramientas.

HERRAMIENTAS DISPONIBLES: ${toolNames}

INSTRUCCIONES:
- USA las herramientas apropiadas para responder
- Para reportes: query_chatbots + get_chatbot_stats
- Para recordatorios: schedule_reminder, list_reminders, etc.
- Para pagos: create_payment_link
- Sé conciso y directo con los resultados`;

    if (resolvedConfig) {
      const chatbotName = resolvedConfig.name || "asistente";
      const personality = resolvedConfig.personality || "professional";
      const instructions = resolvedConfig.instructions || "";
      const customInstructions = resolvedConfig.customInstructions || "";
      const welcomeMessage = resolvedConfig.welcomeMessage || "";

      systemPrompt = `Eres ${chatbotName}, un ${personality === 'customer_support' ? 'asistente de soporte' :
        personality === 'sales' ? 'asistente de ventas' :
        personality === 'friendly' ? 'asistente amigable' : 'asistente profesional'}.

${instructions}
${customInstructions}

HERRAMIENTAS DISPONIBLES: ${toolNames}

INSTRUCCIONES CON HERRAMIENTAS:
- USA las herramientas apropiadas según tu rol y las instrucciones
- Para recordatorios: schedule_reminder, list_reminders, etc.
- Para pagos: create_payment_link
- Para reportes: query_chatbots + get_chatbot_stats
- Para contactos: save_contact_info
- Mantén tu personalidad ${personality} en todas las respuestas
- Sé útil y directo con los resultados de las herramientas`;
    }

    const toolAgent = agent({
      llm: llmInstance,
      tools: availableTools,
      systemPrompt
    });

    toolAgentCache.set(cacheKey, toolAgent);
  }

  return toolAgentCache.get(cacheKey)!;
};

/**
 * Multi-Agent Orchestrated Stream - Optimized for performance
 * Uses router agent for quick responses, delegates to tool agent when needed
 */
export const streamAgentV0 = async function* (user: any, message: string, chatbotId?: string, options: {
  resolvedConfig?: any;
  agentContext?: any;
} = {}) {
  const integrations = options.agentContext?.integrations || {};
  const startTime = Date.now();

  // Step 1: Quick keyword-based pre-routing (no LLM call)
  const quickCheck = quickRouteCheck(message);

  // Step 2: If high confidence in routing decision, skip router agent
  if (quickCheck.confidence > 0.7) {
    if (quickCheck.needsTools) {
      // Direct to tool agent
      yield* streamWithToolAgent(user, message, chatbotId, integrations, options.resolvedConfig);
      return;
    } else {
      // Use router for simple response (with chatbot configuration)
      yield* streamWithRouterAgent(user, message, options.resolvedConfig);
      return;
    }
  }

  // Step 3: Use router agent for uncertain cases
  const routerAgent = getCachedRouterAgent(getModelForUserPlan(user.plan || 'FREE'));

  try {
    const routerDecision = analyzeRouterResponse(routerAgent, message);

    for await (const decision of routerDecision) {
      if (decision.needsTools) {
        // Delegate to tool agent
        yield* streamWithToolAgent(user, message, chatbotId, integrations, options.resolvedConfig);
      } else {
        // Router already generated the response
        if (decision.response) {
          yield { type: "chunk", content: decision.response };
        }
      }
    }
  } catch (error) {
    console.error('❌ Multi-agent orchestration error:', error);
    yield {
      type: "error",
      content: "Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo."
    };
  }
};

/**
 * Stream response using lightweight router agent
 */
async function* streamWithRouterAgent(user: any, message: string, resolvedConfig?: any) {
  // Use chatbot configuration for personalized router
  const routerAgent = createPersonalizedRouterAgent(user, resolvedConfig);
  const events = routerAgent.runStream(message);

  for await (const event of events as any) {
    if (agentStreamEvent.include(event)) {
      if (event.data.delta) {
        yield { type: "chunk", content: event.data.delta };
      }
    }
  }

  yield { type: "done", metadata: { agent: 'RouterAgent' } };
}

/**
 * Stream response using tool agent
 */
async function* streamWithToolAgent(user: any, message: string, chatbotId?: string, integrations: Record<string, any> = {}, resolvedConfig?: any) {
  // Get or create cached tool agent with personalization
  const toolAgent = getOrCreatePersonalizedToolAgent(user, message, chatbotId, integrations, resolvedConfig);

  // Thinking status inicial
  yield {
    type: "status",
    status: "thinking",
    message: "🤔 Procesando con herramientas..."
  };

  try {
    // runStream() - Pattern oficial LlamaIndex Agent Workflows
    const events = toolAgent.runStream(message);
    const selectedModel = getModelForUserPlan(user.plan || 'FREE');

    // Event-driven streaming siguiendo documentación oficial LlamaIndex
    let hasStreamedContent = false;
    let toolsExecuted = 0;
    let toolsUsed: string[] = [];

    for await (const event of events as any) {
      // Tool call events - Pattern oficial
      if (agentToolCallEvent.include(event)) {
        toolsExecuted++;
        toolsUsed.push(event.data.toolName);
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

    // GPT-5 Nano specific: If tools were executed but no content was streamed
    if (toolsExecuted > 0 && !hasStreamedContent) {

      yield {
        type: "chunk",
        content: "He ejecutado las herramientas solicitadas. Los datos están disponibles."
      };

      yield {
        type: "done",
        metadata: {
          model: selectedModel,
          agent: 'ToolAgent-Recovery',
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
        agent: 'ToolAgent',
        toolsExecuted
      }
    };

  } catch (error) {
    console.error('❌ Tool agent error:', error);

    yield {
      type: "error",
      content: "Error al procesar con herramientas. Por favor intenta de nuevo.",
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
  return tools.length;
};

/**
 * Utility funcional para verificar si un usuario tiene acceso a tools
 */
export const userHasTools = (userPlan: string): boolean => {
  return ['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan);
};

/**
 * Cache management functions for performance optimization
 */
export const clearToolAgentCache = () => {
  toolAgentCache.clear();
};

export const getCacheStats = () => {
  return {
    toolAgents: toolAgentCache.size,
    totalCached: toolAgentCache.size
  };
};