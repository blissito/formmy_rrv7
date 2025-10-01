/**
 * AgentWorkflow - Pure LlamaIndex Pattern
 * Single agent with all tools, zero custom routing logic
 * Model decides which tools to use
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
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

/**
 * Create LLM instance with correct provider (from agent-engine-v0)
 */
function createLLM(model: string, temperature?: number) {
  const config: any = { model };

  // Handle temperature based on model
  if (model === "gpt-5-nano" || model === "gpt-4o-mini") {
    // GPT-5 nano and 4o-mini work best with specific temperature
    config.temperature = temperature !== undefined ? temperature : 0.3;
  } else if (temperature !== undefined) {
    config.temperature = temperature;
  }

  // Token limits
  if (model.startsWith("gpt-5") || model.startsWith("gpt-4")) {
    config.maxCompletionTokens = 1000;
  } else {
    config.maxTokens = 1000;
  }

  // Timeout and retries
  config.timeout = 60000;
  config.maxRetries = 3;

  // Return appropriate provider based on model
  if (model.includes("claude")) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
    return new Anthropic(config);
  } else {
    config.apiKey = process.env.OPENAI_API_KEY;
    return new OpenAI(config);
  }
}

/**
 * Mapeo transparente de modelos para performance
 */
function mapModelForPerformance(model: string): string {
  if (model === 'gpt-5-nano') {
    console.log('🔄 Model mapping: gpt-5-nano → gpt-4o-mini (performance optimization)');
    return 'gpt-4o-mini';
  }
  return model;
}

/**
 * Construye system prompt personalizado
 */
function buildSystemPrompt(config: ResolvedChatbotConfig): string {
  const personality = config.personality || 'professional';
  const personalityMap: Record<string, string> = {
    'customer_support': 'asistente de soporte profesional',
    'sales': 'asistente de ventas consultivo',
    'friendly': 'asistente amigable y cercano',
    'professional': 'asistente profesional'
  };

  return `Eres ${config.name || 'asistente'}, ${personalityMap[personality] || 'profesional'}.

${config.instructions || 'Asistente útil.'}

${config.customInstructions || ''}

Usa las herramientas disponibles cuando las necesites. Sé directo y mantén tu personalidad.`;
}

/**
 * Crea un agente con todas las herramientas del plan
 * El modelo AI decide qué tools usar - zero custom routing
 */
function createSingleAgent(context: WorkflowContext) {
  const { resolvedConfig, userPlan } = context;

  // Model selection con mapping transparente
  const selectedModel = mapModelForPerformance(resolvedConfig.aiModel || 'gpt-5-nano');

  // Create LLM with correct provider (OpenAI or Anthropic)
  const llm = createLLM(selectedModel, resolvedConfig.temperature || 0.3);

  // Todas las herramientas del plan - modelo decide cuáles usar
  const toolContext: ToolContext = {
    userId: context.userId,
    userPlan,
    chatbotId: context.chatbotId,
    message: context.message,
    integrations: context.integrations
  };

  const allTools = getToolsForPlan(userPlan, context.integrations, toolContext);
  const systemPrompt = buildSystemPrompt(resolvedConfig);

  console.log('🤖 Creating single agent:', {
    model: selectedModel,
    plan: userPlan,
    toolsCount: allTools.length
  });

  return agent({
    llm,
    tools: allTools,
    systemPrompt
  });
}

/**
 * Stream de un agente con tracking de eventos
 */
async function* streamSingleAgent(agentInstance: any, message: string) {
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

  // Fallback para casos donde tools ejecutan pero no stream
  if (toolsExecuted > 0 && !hasStreamedContent) {
    yield {
      type: "chunk",
      content: "He ejecutado las herramientas solicitadas correctamente."
    };
  }

  yield {
    type: "done",
    metadata: {
      toolsExecuted,
      toolsUsed
    }
  };
}

/**
 * AgentWorkflow principal - Simplified
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

  try {
    // Single agent con todas las tools - modelo decide
    const agent = createSingleAgent(context);
    yield* streamSingleAgent(agent, message);

    console.log('✅ AgentWorkflow completed:', Date.now() - workflowStart + 'ms');
  } catch (error) {
    console.error('❌ AgentWorkflow error:', error);
    yield {
      type: "error",
      content: "Lo siento, hubo un problema procesando tu mensaje. Por favor intenta de nuevo."
    };
  }
};

/**
 * Cache management (placeholder para futuro)
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