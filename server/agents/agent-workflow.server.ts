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
import { createMemory, staticBlock } from "llamaindex";
import { getToolsForPlan, type ToolContext } from "../tools";
import type { ResolvedChatbotConfig } from "../chatbot/configResolver.server";
import { getAgentPrompt, type AgentType } from "~/utils/agents/agentPrompts";
import { getOptimalTemperature } from "../config/model-temperatures";

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

  // Use centralized temperature resolution
  // Si no se proporciona temperature, usar la óptima del modelo
  config.temperature = temperature !== undefined ? temperature : getOptimalTemperature(model);

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
  hasWebSearch: boolean,
  hasReportGeneration: boolean
): string {
  const personality = config.personality || "friendly";

  // Agent types válidos
  const agentTypes: AgentType[] = ['sales', 'customer_support', 'content_seo', 'data_analyst', 'automation_ai', 'growth_hacker'];

  // 🔍 PRIORIDAD MÁXIMA: Instrucciones de búsqueda PRIMERO (antes de custom instructions)
  let searchInstructions = '';
  if (hasContextSearch) {
    searchInstructions = `⚠️ REGLA FUNDAMENTAL - SIEMPRE EJECUTAR PRIMERO:

CUANDO EL USUARIO PREGUNTA SOBRE:
- Productos, servicios, características, precios, planes, costos
- Información del negocio, empresa, documentación
- Políticas, términos, condiciones, FAQs
- CUALQUIER información específica del negocio

PROTOCOLO OBLIGATORIO:
1. EJECUTAR search_context("query específica") INMEDIATAMENTE - NO OPCIONAL
2. Si no encuentras: REFORMULAR query y BUSCAR DE NUEVO (mínimo 2 intentos)
3. Si múltiples temas: EJECUTAR MÚLTIPLES BÚSQUEDAS${hasWebSearch ? `
4. Si todo falla: EJECUTAR web_search_google("${config.name === 'Ghosty' ? 'Formmy' : config.name} [tema]")
5. Solo si todo falla: "Busqué pero no encontré información sobre [tema]"` : `
4. Solo si todo falla: "Busqué en la base de conocimiento pero no encontré información sobre [tema]"`}

❌ PROHIBIDO ABSOLUTAMENTE:
- Responder "no tengo información" SIN buscar primero
- Inventar o adivinar precios, fechas, features
- Decir "no sé" sin AGOTAR todas las búsquedas
- Dar información NO solicitada o irrelevante

📏 REGLA DE CONCISIÓN:
- Responde SOLO lo que se preguntó
- Si preguntan por UN servicio, NO enumeres TODOS
- Usa listas solo si el usuario pide múltiples opciones
- Prioriza relevancia sobre completitud

✅ EJEMPLO CORRECTO:
User: "¿Tienen planes más baratos que $5,000?"
→ EJECUTAR: search_context("precios planes baratos económicos")
→ LEER resultados
→ RESPONDER: "Sí, tenemos planes desde $3,500 para páginas web..." ✅
→ NO: "Te cuento sobre todos nuestros servicios: 1) Páginas web desde $3,500... 2) Apps desde..." ❌

`;
  }

  // Construir prompt base con personalidad
  let basePrompt: string;

  // Si personality es un AgentType válido, usar prompt optimizado
  if (agentTypes.includes(personality as AgentType)) {
    // NUEVO ORDEN: searchInstructions PRIMERO, luego personality y custom instructions
    basePrompt = `${searchInstructions}${config.name || "Asistente"} - ${getAgentPrompt(personality as AgentType)}${config.customInstructions ? '\n\n' + config.customInstructions : ''}`;
  } else {
    // Fallback a personalidades genéricas (friendly, professional)
    const personalityMap: Record<string, string> = {
      friendly: "asistente amigable y cercano",
      professional: "asistente profesional",
    };

    // NUEVO ORDEN: searchInstructions PRIMERO
    basePrompt = `${searchInstructions}Eres ${config.name || "asistente"}, ${personalityMap[personality] || "asistente amigable"}.

${config.instructions || "Asistente útil."}${config.customInstructions ? '\n\n' + config.customInstructions : ''}

Usa las herramientas disponibles cuando las necesites. Sé directo y mantén tu personalidad.`;
  }

  // 🛡️ Restricciones de seguridad para web_search_google
  if (hasWebSearch) {
    const businessDomain = config.name === 'Ghosty' ? 'Formmy' : (config.name || "este negocio");

    basePrompt += `

🛡️ WEB_SEARCH LIMITADO A: ${businessDomain}
SOLO búsquedas relacionadas con ${businessDomain}
PROHIBIDO: noticias generales, deportes, entretenimiento, temas off-topic

Válido: "${businessDomain} precios", "${businessDomain} features", "comparación ${businessDomain} vs competencia"
Inválido: noticias del día, deportes, celebridades

Si pregunta off-topic: "Mi búsqueda web está limitada a ${businessDomain}"`;
  }

  // 📄 Instrucciones de reportes PDF si tiene acceso
  if (hasReportGeneration) {
    basePrompt += `

📄 REPORTES PDF (generate_chatbot_report):
Usa cuando usuario pida: reporte, PDF, documento, descarga, exportar

CRÍTICO:
- COPIA EXACTA del mensaje que retorna la tool
- NO modifiques el link de descarga
- NO agregues prefijos al URL (sandbox:, http:, etc)

Correcto: "✅ Reporte generado... [DESCARGAR PDF](/api/ghosty/download_123)"
Incorrecto: "Descarga: sandbox:/api/ghosty/download_123"`;
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

  // Detectar si tiene acceso a search_context, web_search_google, y generate_chatbot_report tools
  const hasContextSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "search_context"
  );
  const hasWebSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "web_search_google"
  );
  const hasReportGeneration = allTools.some(
    (tool: any) => tool.metadata?.name === "generate_chatbot_report"
  );

  const systemPrompt = buildSystemPrompt(resolvedConfig, hasContextSearch, hasWebSearch, hasReportGeneration);

  // ✅ Crear memoria conversacional según patrón oficial LlamaIndex
  let memory = undefined;

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧠 [createSingleAgent] INICIANDO CREACIÓN DE MEMORIA`);
  console.log(`   Historial recibido: ${conversationHistory ? conversationHistory.length : 0} mensajes`);
  console.log(`${'='.repeat(80)}\n`);

  if (conversationHistory && conversationHistory.length > 0) {
    console.log(`🧠 Historial NO está vacío - procediendo a crear memoria con staticBlock`);

    // 🔧 Formatear historial como texto para staticBlock
    const historyText = conversationHistory.map((msg) => {
      const roleLabel = msg.role === 'user' ? 'Usuario' : msg.role === 'assistant' ? 'Asistente' : 'Sistema';
      return `${roleLabel}: ${msg.content}`;
    }).join('\n\n');

    console.log(`📝 Historial formateado para staticBlock:\n${historyText.substring(0, 200)}...\n`);

    // 🚀 Crear memoria con staticBlock (patrón oficial LlamaIndex)
    memory = createMemory({
      tokenLimit: 8000,
      memoryBlocks: [
        staticBlock({
          content: `Historial de la conversación:\n\n${historyText}`,
        }),
      ],
    });

    console.log(`✅ Memoria creada con staticBlock`);
    console.log(`   ${conversationHistory.length} mensajes en el bloque estático`);
  } else {
    console.log(`⚠️  [createSingleAgent] Sin historial - memoria NO creada`);
    console.log(`   conversationHistory: ${conversationHistory}`);
    console.log(`   length: ${conversationHistory?.length}`);
  }

  // ✅ Patrón oficial LlamaIndex TypeScript: pasar memoria en configuración del agente
  const agentConfig: any = {
    llm,
    tools: allTools,
    systemPrompt,
    verbose: true, // Para debugging de herramientas
  };

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🎯 [createSingleAgent] CONFIGURANDO AGENTE`);
  console.log(`   LLM: ${llm.model || llm.constructor.name}`);
  console.log(`   Tools: ${allTools.length}`);
  console.log(`   System prompt: ${systemPrompt.substring(0, 80)}...`);
  console.log(`${'='.repeat(80)}\n`);

  // Solo agregar memoria si existe
  if (memory) {
    agentConfig.memory = memory;
    console.log(`✅ MEMORIA AGREGADA A AGENT CONFIG (staticBlock)`);
  } else {
    console.log(`⚠️  SIN MEMORIA - agente NO recordará conversaciones previas`);
  }

  console.log(`\n${'='.repeat(80)}`);
  console.log(`🚀 Llamando a agent() con config...`);
  console.log(`${'='.repeat(80)}\n`);

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

    console.log(`\n${'🔥'.repeat(40)}`);
    console.log(`🚀 [streamAgentWorkflow] INICIO`);
    console.log(`   agentContext recibido: ${!!options.agentContext}`);
    console.log(`   conversationHistory extraído: ${conversationHistory.length} mensajes`);

    if (conversationHistory.length > 0) {
      console.log(`\n   📚 HISTORIAL EXTRAÍDO DEL AGENTCONTEXT:`);
      conversationHistory.forEach((msg, i) => {
        console.log(`   [${i + 1}] ${msg.role}: "${msg.content.substring(0, 60)}..."`);
      });
    } else {
      console.log(`   ⚠️  conversationHistory está VACÍO`);
      console.log(`   agentContext completo:`, JSON.stringify(options.agentContext, null, 2));
    }
    console.log(`${'🔥'.repeat(40)}\n`);

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
