/**
 * AgentV0 - LlamaIndex Agent Workflows Pure Implementation
 * 100% LlamaIndex patterns oficiales - Zero código custom
 */

import { agent, agentToolCallEvent, agentStreamEvent } from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { getToolsForPlan, type ToolContext } from '../tools';

// Reutilizar función existente para modelo según plan
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

  // Model configuration with GPT-5 Nano specific settings
  const selectedModel = getModelForUserPlan(user.plan || 'FREE');

  // GPT-5 Nano: Force temperature to 1 (the only supported value for GPT-5 nano)
  let llmConfig: any;
  if (selectedModel === 'gpt-5-nano') {
    llmConfig = {
      model: selectedModel,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 1 // Only value supported by GPT-5 nano per OpenAI error message
    };
  } else {
    llmConfig = {
      model: selectedModel,
      apiKey: process.env.OPENAI_API_KEY,
      temperature: 0.3
    };
  }

  // agent() function - pattern oficial LlamaIndex
  const agentInstance = agent({
    llm: new OpenAI(llmConfig),
    tools: getToolsForPlan(user.plan || 'FREE', integrations, toolContext),
    systemPrompt: `Eres Ghosty 👻, el asistente IA principal de Formmy.

**TU MISIÓN**: Ayudar a usuarios de Formmy con:
- Gestión de recordatorios y citas
- Links de pago con Stripe
- Captura de información de contactos
- Optimización y insights

**CONTEXTO DEL USUARIO**:
- Plan: ${user.plan || 'FREE'}
- ID: ${user.id}

**PERSONALIDAD**:
- Profesional pero amigable
- Proactivo en sugerir mejoras
- Enfocado en ROI y resultados

**REGLAS DE RESPUESTA**:
- Respuestas concisas y accionables
- USA herramientas INMEDIATAMENTE cuando sean relevantes
- NO pidas confirmación adicional para acciones obvias
- Incluye métricas cuando sea relevante
- Sugiere próximos pasos específicos

¡Listo para ayudar! 🚀`
  });

  console.log('🚀 AgentV0 iniciado:', {
    userId: user.id,
    plan: user.plan || 'FREE',
    model: getModelForUserPlan(user.plan || 'FREE'),
    toolsCount: getToolsForPlan(user.plan || 'FREE', integrations, toolContext).length
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
    try {
      // Cast to any to avoid TypeScript asyncIterator issues while maintaining functionality
      for await (const event of events as any) {
        // Tool call events - Pattern oficial
        if (agentToolCallEvent.include(event)) {
          console.log(`🔧 Tool llamado: ${event.data.toolName}`);
          yield {
            type: "tool-start",
            tool: event.data.toolName,
            message: `🔧 Ejecutando ${event.data.toolName}...`
          };
        }

        // Stream content events - Pattern oficial
        if (agentStreamEvent.include(event)) {
          yield {
            type: "status",
            status: "streaming",
            message: "✍️ Generando respuesta..."
          };
          yield {
            type: "chunk",
            content: event.data.delta
          };
        }
      }
    } catch (streamError) {
      console.error('❌ Stream iteration error:', streamError);
      console.error('Stream type:', typeof events);
      console.error('Stream constructor:', events?.constructor?.name);

      // Fallback con respuesta básica
      yield {
        type: "chunk",
        content: "AgentV0 respuesta básica mientras se arregla el streaming."
      };
    }

    // Completion signal
    yield {
      type: "done",
      metadata: {
        model: getModelForUserPlan(user.plan || 'FREE'),
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