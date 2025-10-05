/**
 * AgentWorkflow - Pure LlamaIndex Pattern
 * Single agent with all tools, zero custom routing logic
 * Model decides which tools to use
 */

import {
  agent,
  agentToolCallEvent,
  agentStreamEvent,
} from "@llamaindex/workflow";
import { OpenAI } from "@llamaindex/openai";
import { Anthropic } from "@llamaindex/anthropic";
import { createMemory } from "llamaindex";
import { getToolsForPlan, type ToolContext } from "../tools";
import type { ResolvedChatbotConfig } from "../chatbot/configResolver.server";

// Types para el workflow
interface WorkflowContext {
  userId: string;
  userPlan: string;
  chatbotId: string | null;
  message: string;
  integrations: Record<string, any>;
  resolvedConfig: ResolvedChatbotConfig;
  agentContext?: any; // Incluye conversationId para rate limiting
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

  // 🛡️ Token limits ESTRICTOS (reducidos para evitar loops infinitos)
  if (model.startsWith("gpt-5") || model.startsWith("gpt-4")) {
    config.maxCompletionTokens = 500; // Reducido de 1000 a 500
  } else {
    config.maxTokens = 500; // Reducido de 1000 a 500
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
  if (model === "gpt-5-nano") {
    return "gpt-4o-mini";
  }
  return model;
}

/**
 * Construye system prompt personalizado
 */
function buildSystemPrompt(
  config: ResolvedChatbotConfig,
  hasContextSearch: boolean,
  hasWebSearch: boolean
): string {
  const personality = config.personality || "friendly";
  const personalityMap: Record<string, string> = {
    customer_support: "asistente de soporte profesional",
    sales: "asistente de ventas consultivo",
    friendly: "asistente amigable y cercano",
    professional: "asistente profesional",
  };

  let basePrompt = `Eres ${config.name || "asistente"}, ${personalityMap[personality] || "friendly"}.

${config.instructions || "Asistente útil."}

${config.customInstructions || ""}

Usa las herramientas disponibles cuando las necesites. Sé directo y mantén tu personalidad.`;

  // Agregar instrucciones específicas de RAG si tiene acceso a search_context
  if (hasContextSearch) {
    basePrompt += `

🔍 REGLA CRÍTICA - BÚSQUEDA OBLIGATORIA:
Tienes acceso a search_context, tu base de conocimiento principal.

⛔ PROHIBICIONES ABSOLUTAS:
1. NUNCA respondas preguntas sobre el negocio sin buscar PRIMERO
2. NUNCA digas "no sé" o "no tengo información" sin intentar search_context
3. NUNCA inventes o adivines datos específicos (precios, fechas, políticas, features)
4. NUNCA redirijas al usuario a "buscar en el sitio web" - ESA ES TU TAREA

✅ PROTOCOLO OBLIGATORIO:
Cuando el usuario pregunta CUALQUIER cosa sobre:
- Productos, servicios, características, actualizaciones
- Precios, planes, políticas, términos
- Información del negocio, empresa, equipo
- Documentación, tutoriales, guías

DEBES seguir estos pasos EN ORDEN:
1. EJECUTAR search_context con query específica
2. Si resultados insuficientes → AJUSTAR query y BUSCAR DE NUEVO (mínimo 2 intentos)
3. Para preguntas multi-tema → MÚLTIPLES búsquedas separadas
4. SOLO después de buscar exhaustivamente, si NO hay resultados → decir honestamente "Busqué pero no encontré información sobre [tema]"

📊 EJEMPLOS DE COMPORTAMIENTO OBLIGATORIO:
❌ MAL: "No tengo información sobre características nuevas"
✅ BIEN: search_context("características nuevas actualizaciones recientes") → responder

❌ MAL: "No sé los precios, revisa el sitio web"
✅ BIEN: search_context("precios planes") → si no encuentra → search_context("costos suscripción") → responder

❌ MAL: Una sola búsqueda genérica
✅ BIEN: search_context("plan starter") → search_context("plan pro") → comparar

🎯 Tu prioridad #1 es USAR la base de conocimiento antes de responder. Sé insistente.`;
  }

  // 🛡️ Agregar restricciones de seguridad para web_search_google
  if (hasWebSearch) {
    const businessDomain = config.name || "este negocio";
    basePrompt += `

🛡️ RESTRICCIONES CRÍTICAS PARA web_search_google:
Esta herramienta de búsqueda web está LIMITADA ESTRICTAMENTE al dominio de negocio: ${businessDomain}

REGLAS DE SEGURIDAD (NUNCA VIOLARLAS):
1. SOLO buscar si la pregunta está DIRECTAMENTE relacionada con: ${businessDomain}
2. PROHIBIDO buscar: noticias generales, deportes, entretenimiento, política, temas personales, chismes
3. Si el usuario pide buscar algo off-topic, responde: "Mi búsqueda web está limitada a temas relacionados con ${businessDomain}"

EJEMPLOS DE BÚSQUEDAS VÁLIDAS:
- "precios de la competencia en [industria]"
- "horarios de servicio actuales en [ciudad]"
- "reseñas de [producto específico del negocio]"
- "tendencias del mercado en [industria]"

EJEMPLOS PROHIBIDOS (NUNCA EJECUTAR):
- ❌ "quién ganó el partido de fútbol"
- ❌ "noticias del día"
- ❌ "cómo hacer [algo no relacionado al negocio]"
- ❌ "últimos chismes de celebridades"

Si detectas una solicitud fuera de alcance, RECHAZALA educadamente y redirige la conversación al negocio.`;
  }

  return basePrompt;
}

/**
 * Crea un agente con todas las herramientas del plan + memoria conversacional
 * El modelo AI decide qué tools usar - zero custom routing
 *
 * ✅ Patrón oficial LlamaIndex TypeScript Agent Workflows:
 * 1. Crear memoria con createMemory({})
 * 2. Agregar mensajes del historial con memory.add({ role, content })
 * 3. Pasar memoria al agente en la configuración
 *
 * Documentación oficial: https://developers.llamaindex.ai/typescript/framework/modules/data/memory
 */
async function createSingleAgent(
  context: WorkflowContext,
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>
) {
  const { resolvedConfig, userPlan } = context;

  // Model selection con mapping transparente
  const selectedModel = mapModelForPerformance(
    resolvedConfig.aiModel || "gpt-5-nano"
  );

  // Create LLM with correct provider (OpenAI or Anthropic)
  const llm = createLLM(selectedModel, resolvedConfig.temperature || 0.3);

  // Todas las herramientas del plan - modelo decide cuáles usar
  const toolContext: ToolContext = {
    userId: context.userId,
    userPlan,
    chatbotId: context.chatbotId,
    conversationId: context.agentContext?.conversationId, // Para rate limiting
    message: context.message,
    integrations: context.integrations,
    isGhosty: context.chatbotId === "ghosty-main", // Ghosty tiene acceso a stats
  };

  const allTools = getToolsForPlan(userPlan, context.integrations, toolContext);

  // Detectar si tiene acceso a search_context y web_search_google tools
  const hasContextSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "search_context"
  );
  const hasWebSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "web_search_google"
  );

  const systemPrompt = buildSystemPrompt(resolvedConfig, hasContextSearch, hasWebSearch);

  // ✅ Crear memoria conversacional según patrón oficial LlamaIndex
  let memory = undefined;

  if (conversationHistory && conversationHistory.length > 0) {
    // Crear memoria vacía (sin memoryBlocks por ahora, solo mensajes directos)
    memory = createMemory({
      tokenLimit: 8000, // Límite razonable para contexto conversacional
    });

    // Agregar cada mensaje del historial a la memoria
    for (const msg of conversationHistory) {
      await memory.add({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // ✅ Patrón oficial LlamaIndex TypeScript: pasar memoria en configuración del agente
  const agentConfig: any = {
    llm,
    tools: allTools,
    systemPrompt,
    verbose: true, // Para debugging de herramientas
  };

  // Solo agregar memoria si existe
  if (memory) {
    agentConfig.memory = memory;
  }

  return agent(agentConfig);
}

/**
 * Definición de créditos por herramienta según pricing CLAUDE.md
 */
const TOOL_CREDITS: Record<string, number> = {
  // Básicas (1 crédito)
  'save_contact_info': 1,
  'get_current_datetime': 1,

  // Intermedias (2-3 créditos)
  'schedule_reminder': 2,
  'list_reminders': 2,
  'update_reminder': 2,
  'cancel_reminder': 2,
  'delete_reminder': 2,
  'web_search_google': 3,
  'search_context': 2,

  // Avanzadas (4-6 créditos)
  'create_payment_link': 4,
  'get_usage_limits': 2,
  'query_chatbots': 3,
  'get_chatbot_stats': 5,
};

/**
 * Stream de un agente con tracking de eventos
 * El historial conversacional ya está en el agente via memoria (memory)
 *
 * ✅ Patrón oficial LlamaIndex: el agente mantiene el contexto completo automáticamente
 * mediante el sistema de memoria integrado
 *
 * 🛡️ PROTECCIONES DE SEGURIDAD:
 * - Timeout máximo: 45 segundos
 * - Máximo 1000 chunks
 * - Detección de contenido corrupto
 */
async function* streamSingleAgent(agentInstance: any, message: string, availableTools: string[] = []) {
  const MAX_CHUNKS = 1000;
  const MAX_DURATION_MS = 45000; // 45 segundos
  const startTime = Date.now();

  // El agente ya tiene memoria configurada con el historial, solo pasamos el mensaje actual
  const events = agentInstance.runStream(message);

  let hasStreamedContent = false;
  let toolsExecuted = 0;
  let toolsUsed: string[] = [];
  let chunkCount = 0;
  let totalChars = 0;
  let totalTokens = 0; // Tracking de tokens
  let creditsUsed = 0; // Tracking de créditos

  try {
    for await (const event of events as any) {
      // 🛡️ PROTECCIÓN 1: Timeout
      const elapsed = Date.now() - startTime;
      if (elapsed > MAX_DURATION_MS) {
        console.error(`⏱️ Stream timeout después de ${elapsed}ms`);
        yield {
          type: "error",
          content:
            "⏱️ Respuesta demasiado larga. Por favor intenta reformular tu pregunta.",
        };
        break;
      }

      // 🛡️ PROTECCIÓN 2: Máximo de chunks
      if (chunkCount >= MAX_CHUNKS) {
        console.error(`🚫 Máximo de chunks alcanzado: ${chunkCount}`);
        yield {
          type: "error",
          content:
            "La respuesta es demasiado extensa. Por favor sé más específico.",
        };
        break;
      }

      // Tool call events
      if (agentToolCallEvent.include(event)) {
        toolsExecuted++;
        const toolName = event.data.toolName || "unknown_tool";
        toolsUsed.push(toolName);

        // Calcular créditos consumidos por esta tool
        const toolCredits = TOOL_CREDITS[toolName] || 1; // Default 1 crédito
        creditsUsed += toolCredits;

        yield {
          type: "tool-start",
          tool: toolName,
          message: `🔧 ${toolName}`,
        };
      }

      // Stream content events
      if (agentStreamEvent.include(event)) {
        if (event.data.delta) {
          chunkCount++;
          totalChars += event.data.delta.length;

          // Estimar tokens basado en caracteres (regla aproximada: ~4 chars por token)
          totalTokens += Math.ceil(event.data.delta.length / 4);

          // 🛡️ PROTECCIÓN 3: Detectar contenido corrupto (múltiples scripts)
          const hasMultipleScripts =
            /[\u0400-\u04FF].*[\u0E00-\u0E7F]|[\u0600-\u06FF].*[\u4E00-\u9FFF]|[\u0900-\u097F].*[\u0400-\u04FF]/.test(
              event.data.delta
            );
          if (hasMultipleScripts && event.data.delta.length > 100) {
            console.error(
              `🚫 Contenido corrupto detectado en chunk ${chunkCount}`
            );
            yield {
              type: "error",
              content:
                "Error de generación detectado. Por favor intenta de nuevo.",
            };
            break;
          }

          hasStreamedContent = true;
          yield {
            type: "chunk",
            content: event.data.delta,
          };
        }
      }
    }
  } catch (streamError) {
    console.error(`❌ Error en streaming:`, streamError);
    yield {
      type: "error",
      content: "Error durante la generación de respuesta.",
    };
  }

  // Fallback para casos donde tools ejecutan pero no stream
  if (toolsExecuted > 0 && !hasStreamedContent) {
    yield {
      type: "chunk",
      content: "He ejecutado las herramientas solicitadas correctamente.",
    };
  }

  yield {
    type: "done",
    metadata: {
      toolsExecuted,
      toolsUsed,
      availableTools, // 🔧 Lista de herramientas disponibles para el usuario
      tokensUsed: totalTokens,
      creditsUsed,
      estimatedCost: {
        tokens: totalTokens,
        credits: creditsUsed,
        // Estimación aproximada: GPT-4o-mini = $0.15 input + $0.60 output por 1M tokens
        // Asumiendo 50/50 input/output para simplificar
        usdCost: ((totalTokens / 1_000_000) * 0.375).toFixed(6)
      }
    },
  };
}

/**
 * AgentWorkflow principal - Simplified con memoria conversacional
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
  const context: WorkflowContext = {
    userId: user.id,
    userPlan: user.plan || "FREE",
    chatbotId: chatbotId || null,
    message,
    integrations: options.agentContext?.integrations || {},
    resolvedConfig: options.resolvedConfig,
    agentContext: options.agentContext, // Incluir agentContext completo
  };

  try {
    // Extraer historial conversacional del agentContext
    const conversationHistory = options.agentContext?.conversationHistory || [];

    // Single agent con todas las tools + memoria conversacional
    const agentInstance = await createSingleAgent(context, conversationHistory);

    // 🔧 Obtener lista de herramientas disponibles para el usuario
    const toolContext: ToolContext = {
      userId: context.userId,
      userPlan: context.userPlan,
      chatbotId: context.chatbotId,
      conversationId: context.agentContext?.conversationId,
      message: context.message,
      integrations: context.integrations,
      isGhosty: context.chatbotId === "ghosty-main",
    };
    const availableToolsObjects = getToolsForPlan(context.userPlan, context.integrations, toolContext);
    const availableTools = availableToolsObjects.map((tool: any) => tool.metadata?.name || 'unknown');

    // Stream con memoria ya configurada en el agente + lista de tools disponibles
    yield* streamSingleAgent(agentInstance, message, availableTools);
  } catch (error) {
    console.error("❌ AgentWorkflow error:", error);
    yield {
      type: "error",
      content:
        "Lo siento, hubo un problema procesando tu mensaje. Por favor intenta de nuevo.",
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
    cachedAgents: agentCache.size,
  };
};
