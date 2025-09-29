/**
 * AgentWorkflow - Patrón oficial LlamaIndex con handoff inteligente
 * Mantiene personalidad del usuario en todos los agentes
 * Streaming 100% y performance optimizado
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { getToolsForPlan, type ToolContext } from '../tools';
import type { ResolvedChatbotConfig } from '../chatbot/configResolver.server';

// Types para el workflow
interface WorkflowContext {
  userId: string;
  userPlan: string;
  chatbotId: string | null;
  message: string;
  integrations: Record<string, any>;
  resolvedConfig: ResolvedChatbotConfig;
}

interface AgentResponse {
  type: "response" | "handoff" | "error";
  content?: string;
  handoffTo?: string;
  context?: any;
}

/**
 * Determina si un mensaje necesita herramientas avanzadas
 */
function needsAdvancedTools(message: string): boolean {
  const lowerMessage = message.toLowerCase();

  // Keywords que requieren herramientas avanzadas
  const advancedKeywords = [
    // Recordatorios
    'recordatorio', 'recordar', 'agendar', 'cita', 'programar',
    'alarma', 'avisar', 'notificar', 'listar recordatorios',
    // Pagos
    'pago', 'cobrar', 'link', 'stripe', 'pagar',
    // Contactos
    'guardar contacto', 'contacto', 'email', 'teléfono', 'empresa',
    // Stats y reports
    'estadísticas', 'stats', 'análisis', 'métricas', 'reporte',
    'chatbots', 'conversaciones', 'usuarios'
  ];

  return advancedKeywords.some(keyword => lowerMessage.includes(keyword));
}

/**
 * Crea el agente principal personalizado
 */
function createMainAgent(context: WorkflowContext) {
  const agentStart = Date.now();
  console.log('🤖 Creating main agent...');

  const { resolvedConfig, userPlan } = context;

  // 🚀 OPTIMIZACIÓN: Mapeo transparente GPT-5 nano → GPT-4o-mini para performance
  const mapModelForPerformance = (model: string): string => {
    if (model === 'gpt-5-nano') {
      console.log('🔄 Transparent model mapping: gpt-5-nano → gpt-4o-mini (performance optimization)');
      return 'gpt-4o-mini';
    }
    return model;
  };

  const selectedModel = mapModelForPerformance(resolvedConfig.aiModel || 'gpt-5-nano');
  console.log('🧠 Model selected:', selectedModel, 'for plan:', userPlan);

  console.log('🔧 Creating OpenAI client...');
  const llmInstance = new OpenAI({
    model: selectedModel,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: selectedModel === 'gpt-4o-mini' ? 0.3 : (resolvedConfig.temperature || 0.3),
    timeout: 30000, // Timeout más agresivo para main agent
    maxRetries: 2
  });
  console.log('✅ OpenAI client created');

  // Solo herramientas básicas para el main agent
  const basicToolContext: ToolContext = {
    userId: context.userId,
    userPlan,
    chatbotId: context.chatbotId,
    message: context.message,
    integrations: context.integrations
  };

  // Solo datetime tool para respuestas básicas
  console.log('🛠️ Loading basic tools...');
  const basicTools = getToolsForPlan(userPlan, context.integrations, basicToolContext)
    .filter(tool => tool.metadata?.name === 'get_current_datetime');
  console.log('✅ Basic tools loaded:', basicTools.length);

  // System prompt personalizado
  const personality = resolvedConfig.personality || 'professional';
  const personalityMap = {
    'customer_support': 'asistente de soporte profesional',
    'sales': 'asistente de ventas consultivo',
    'friendly': 'asistente amigable y cercano',
    'professional': 'asistente profesional'
  };

  // 🚀 OPTIMIZACIÓN: System prompt ultracompacto para performance
  const systemPrompt = `Eres ${resolvedConfig.name || 'asistente'}, ${personalityMap[personality] || 'profesional'}.

${resolvedConfig.instructions || 'Asistente útil.'}

${resolvedConfig.customInstructions || ''}

Para herramientas avanzadas (recordatorios, pagos, stats), responde: "HANDOFF_TO_TOOLS"
Sé conciso y mantén tu personalidad.`;

  console.log('📝 System prompt length:', systemPrompt.length, 'characters');
  console.log('📋 System prompt preview:', systemPrompt.substring(0, 200) + '...');

  console.log('🏗️ Creating LlamaIndex agent...');
  const agentInstance = agent({
    llm: llmInstance,
    tools: basicTools,
    systemPrompt
  });
  console.log('✅ Main agent created:', Date.now() - agentStart + 'ms');
  return agentInstance;
}

/**
 * Crea el agente de herramientas personalizado
 */
function createToolAgent(context: WorkflowContext) {
  const { resolvedConfig, userPlan } = context;

  // 🚀 OPTIMIZACIÓN: Mismo mapeo transparente para tool agent
  const mapModelForPerformance = (model: string): string => {
    if (model === 'gpt-5-nano') {
      console.log('🔄 Tool agent model mapping: gpt-5-nano → gpt-4o-mini');
      return 'gpt-4o-mini';
    }
    return model;
  };

  const selectedModel = mapModelForPerformance(resolvedConfig.aiModel || 'gpt-5-nano');

  const llmInstance = new OpenAI({
    model: selectedModel,
    apiKey: process.env.OPENAI_API_KEY,
    temperature: selectedModel === 'gpt-4o-mini' ? 0.3 : (resolvedConfig.temperature || 0.3),
    timeout: 60000, // Más tiempo para herramientas
    maxRetries: 3
  });

  // Herramientas completas para el tool agent
  const toolContext: ToolContext = {
    userId: context.userId,
    userPlan,
    chatbotId: context.chatbotId,
    message: context.message,
    integrations: context.integrations
  };

  const allTools = getToolsForPlan(userPlan, context.integrations, toolContext);
  const toolNames = allTools.map(tool => tool.metadata?.name || 'unknown').join(', ');

  // Mantener MISMA personalidad que main agent
  const personality = resolvedConfig.personality || 'professional';
  const personalityMap = {
    'customer_support': 'asistente de soporte profesional',
    'sales': 'asistente de ventas consultivo',
    'friendly': 'asistente amigable y cercano',
    'professional': 'asistente profesional'
  };

  const systemPrompt = `Eres ${resolvedConfig.name || 'un asistente'}, ${personalityMap[personality] || 'un asistente profesional'}.

${resolvedConfig.instructions || 'Eres un asistente útil y profesional.'}

${resolvedConfig.customInstructions || ''}

HERRAMIENTAS DISPONIBLES: ${toolNames}

INSTRUCCIONES CON HERRAMIENTAS:
- Mantén tu personalidad ${personality} en todas las respuestas
- USA las herramientas apropiadas para completar las tareas del usuario
- Para recordatorios: schedule_reminder, list_reminders, etc.
- Para pagos: create_payment_link
- Para contactos: save_contact_info
- Para estadísticas: query_chatbots, get_chatbot_stats
- Sé directo y útil, manteniendo siempre tu personalidad
- Proporciona resultados claros de las herramientas ejecutadas`;

  return agent({
    llm: llmInstance,
    tools: allTools,
    systemPrompt
  });
}

/**
 * AgentWorkflow principal que maneja handoff inteligente
 */
export const streamAgentWorkflow = async function* (
  user: any,
  message: string,
  chatbotId?: string,
  options: {
    resolvedConfig: ResolvedChatbotConfig;
    agentContext: any;
  } = {} as any
) {
  const workflowStart = Date.now();
  console.log('🚀 AgentWorkflow started:', { chatbotId, messageLength: message.length });

  const context: WorkflowContext = {
    userId: user.id,
    userPlan: user.plan || 'FREE',
    chatbotId: chatbotId || null,
    message,
    integrations: options.agentContext?.integrations || {},
    resolvedConfig: options.resolvedConfig
  };

  // Determinar estrategia de agente
  const useAdvancedTools = needsAdvancedTools(message);
  console.log('🎯 Agent strategy determined:', { useAdvancedTools, timeSinceStart: Date.now() - workflowStart + 'ms' });

  try {
    if (useAdvancedTools) {
      // Usar tool agent directamente para eficiencia
      yield* streamWithAgent(createToolAgent(context), message, 'ToolAgent');
    } else {
      // Usar main agent y manejar posible handoff
      yield* streamWithMainAgent(context, message);
    }
  } catch (error) {
    console.error('❌ AgentWorkflow error:', error);
    yield {
      type: "error",
      content: "Lo siento, hubo un problema procesando tu mensaje. Por favor intenta de nuevo."
    };
  }
};

/**
 * Stream con main agent y handoff handling
 */
async function* streamWithMainAgent(context: WorkflowContext, message: string) {
  console.log('🎬 Creating main agent for streaming...');
  const mainAgent = createMainAgent(context);

  console.log('🎭 Starting main agent stream...');
  const events = mainAgent.runStream(message);

  let fullResponse = '';
  let hasContent = false;
  let firstEventReceived = false;

  for await (const event of events as any) {
    if (!firstEventReceived) {
      console.log('🎉 First event received from LlamaIndex agent!');
      firstEventReceived = true;
    }
    if (agentStreamEvent.include(event)) {
      if (event.data.delta) {
        fullResponse += event.data.delta;
        hasContent = true;
        yield {
          type: "chunk",
          content: event.data.delta
        };
      }
    }
  }

  // Verificar si necesita handoff
  if (fullResponse.includes('HANDOFF_TO_TOOLS')) {
    // Hacer handoff transparente al tool agent
    yield* streamWithAgent(createToolAgent(context), message, 'ToolAgent');
  } else if (!hasContent) {
    // Fallback si no hay contenido
    yield {
      type: "chunk",
      content: "¿En qué puedo ayudarte?"
    };
  }
}

/**
 * Stream con cualquier agente
 */
async function* streamWithAgent(agentInstance: any, message: string, agentType: string) {
  const events = agentInstance.runStream(message);

  let hasStreamedContent = false;
  let toolsExecuted = 0;
  let toolsUsed: string[] = [];

  for await (const event of events as any) {
    // Tool call events
    if (agentToolCallEvent.include(event)) {
      toolsExecuted++;
      toolsUsed.push(event.data.toolName);
      yield {
        type: "tool-start",
        tool: event.data.toolName,
        message: `🔧 ${event.data.toolName}`
      };
    }

    // Stream content events
    if (agentStreamEvent.include(event)) {
      if (event.data.delta) {
        hasStreamedContent = true;
        yield {
          type: "chunk",
          content: event.data.delta
        };
      }
    }
  }

  // Recovery para GPT-5 Nano stalls
  if (toolsExecuted > 0 && !hasStreamedContent) {
    yield {
      type: "chunk",
      content: "He ejecutado las herramientas solicitadas correctamente."
    };
  }

  yield {
    type: "done",
    metadata: {
      agent: agentType,
      toolsExecuted,
      toolsUsed
    }
  };
}

/**
 * Cache management para agents
 */
const agentCache = new Map<string, any>();

export const clearAgentWorkflowCache = () => {
  agentCache.clear();
};

export const getAgentWorkflowStats = () => {
  return {
    cachedAgents: agentCache.size
  };
};