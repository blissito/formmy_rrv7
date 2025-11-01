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
import { Gemini } from "@llamaindex/google";
import { createMemory, staticBlock } from "llamaindex";
import { getToolsForPlan, type ToolContext } from "../tools";
import type { ResolvedChatbotConfig } from "../chatbot/configResolver.server";
import { getAgentPrompt, type AgentType } from "~/utils/agents/agentPrompts";
import { getOptimalTemperature } from "../config/model-temperatures";
import {
  startTrace,
  endTrace,
  failTrace,
  instrumentLLMCall,
  instrumentToolCall,
  estimateCost,
  type TraceContext,
} from "../tracing/instrumentation";

// Types para el workflow
interface WorkflowContext {
  userId: string;
  userPlan: string;
  chatbotId: string | null;
  message: string;
  integrations: Record<string, any>;
  resolvedConfig: ResolvedChatbotConfig;
  agentContext?: any; // Incluye conversationId para rate limiting
  chatbotOwnerPlan?: string; // ✅ NUEVO: Plan del dueño del chatbot (para usuarios anónimos)
}

/**
 * Create LLM instance with correct provider (from agent-engine-v0)
 */
function createLLM(model: string, temperature?: number) {
  const config: any = { model };

  // Use centralized temperature resolution
  // Si no se proporciona temperature, usar la óptima del modelo
  config.temperature = temperature !== undefined ? temperature : getOptimalTemperature(model);

  // 🛡️ Token limits (suficientes para tool calling + respuesta)
  if (model.startsWith("gpt-5") || model.startsWith("gpt-4")) {
    config.maxCompletionTokens = 2000; // Suficiente para tool calls + respuesta
  } else {
    config.maxTokens = 2000; // Suficiente para tool calls + respuesta
  }

  // Timeout and retries
  config.timeout = 60000;
  config.maxRetries = 3;

  // Log del modelo usado
  console.log(`🤖 Creating LLM: ${model} (temp: ${config.temperature})`);

  // Return appropriate provider based on model
  if (model.includes("claude")) {
    config.apiKey = process.env.ANTHROPIC_API_KEY;
    console.log(`   Provider: Anthropic (${model})`);
    return new Anthropic(config);
  } else if (model.includes("gemini")) {
    config.apiKey = process.env.GOOGLE_API_KEY;
    console.log(`   Provider: Google Gemini (${model})`);
    return new Gemini(config);
  } else {
    config.apiKey = process.env.OPENAI_API_KEY;
    console.log(`   Provider: OpenAI (${model})`);
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
 * Construye system prompt optimizado para Ghosty
 * Task-focused, examples-first, sin contradicciones
 */
function buildGhostySystemPrompt(): string {
  return `Eres Ghosty, asistente de soporte de Formmy. Usuario autenticado.

🔧 REGLAS DE HERRAMIENTAS:
1. Pregunta info de plan → RESPONDE directo (ya sabes: Starter $149, Pro $499, Enterprise $1499)
2. Usuario QUIERE upgrade/pagar → USA create_formmy_plan_payment({ planName: "STARTER" | "PRO" | "ENTERPRISE" })
3. Conversación casual → NO uses herramientas

Frases que requieren tool:
✅ "quiero el plan Pro", "dame link del Starter", "cómo pago Enterprise"
❌ "qué incluye Pro", "cuánto cuesta Starter", "diferencias entre planes"

🎯 PLANES FORMMY:
• Starter - $149 MXN/mes: Solo formularios (sin chatbots)
• Pro - $499 MXN/mes: 10 chatbots, 250 conversaciones, 30 min voz
• Enterprise - $2,490 MXN/mes: Chatbots ilimitados, 1000 conversaciones, 60 min voz

🚨 CRÍTICO - WIDGETS:
Si una tool retorna 🎨WIDGET:payment:abc123🎨:
✅ COPIA el mensaje EXACTO sin cambiar NADA
❌ NO cambies 🎨WIDGET:payment:abc123🎨 a [Pagar](payment:abc123)
❌ NO quites los emojis 🎨

Ejemplo:
Tool: "🎨WIDGET:payment:123🎨\n\nPlan PRO $499"
Tú: "🎨WIDGET:payment:123🎨\n\nPlan PRO $499" (EXACTO)`;
}

/**
 * Construye system prompt personalizado
 */
function buildSystemPrompt(
  config: ResolvedChatbotConfig,
  hasContextSearch: boolean,
  hasWebSearch: boolean,
  hasReportGeneration: boolean,
  hasGmailTools: boolean = false,
  isOfficialGhosty: boolean = false
): string {
  // 🎯 GHOSTY OFICIAL (de Formmy) usa prompt dedicado optimizado
  // Solo si es el Ghosty de Formmy (sin customInstructions) o si está marcado como oficial
  if (config.name === 'Ghosty' && (isOfficialGhosty || !config.customInstructions)) {
    return buildGhostySystemPrompt();
  }

  const personality = config.personality || "friendly";

  // Agent types válidos
  const agentTypes: AgentType[] = ['sales', 'customer_support', 'data_analyst', 'coach', 'medical_receptionist', 'educational_assistant'];

  // 🔍 Instrucciones de búsqueda para chatbots con RAG
  let searchInstructions = '';
  if (hasContextSearch) {
    searchInstructions = `
🔍 KNOWLEDGE BASE - YOUR PRIMARY SOURCE OF TRUTH:

You have access to uploaded documents containing specific information. When users ask questions, they EXPECT answers from these documents.

MANDATORY WORKFLOW:
1. User asks question
2. Extract 2-7 key terms from the question (preserve capitalization for names)
3. Call search_context("[key terms]")
4. Read the results returned by the tool
5. Answer EXCLUSIVELY using information from the results

CRITICAL - TOOL RESULTS ARE YOUR ANSWER:
When search_context() returns results, those results ARE the answer.
✅ COPY and PARAPHRASE the information from the tool output
✅ The tool returns formatted text - USE IT in your response
✅ If tool says "Encontré X resultados" - READ THEM and answer based on them
❌ NEVER respond "I don't have information" if the tool returned results
❌ NEVER ignore tool output - it contains the answer the user needs

AFTER TOOL EXECUTION:
1. Read the tool's output message carefully
2. Extract key information from the results
3. Write your response using ONLY that information
4. Be specific - use names, numbers, facts from the results

WHEN TO SEARCH:
- User mentions: company names, products, services, pricing, people, events
- User asks: "what is X?", "tell me about Y", "how much Z costs"
- ANY question that could be answered by your documents
- Skip ONLY for: pure greetings ("hi", "thanks"), meta questions ("what can you do?")

IF NO RESULTS FOUND:
- Explicitly say: "I don't have that information in my knowledge base"
${hasWebSearch ? `- Then try: web_search_google("[key terms]")` : ''}
- DO NOT guess or use general knowledge

EXAMPLE:
User: "What is Be the Nerd?"
You: Call search_context("Be the Nerd") → Results found about Fixter.Geek bootcamp
You: "Be the Nerd is [exact info from results]" ← Answer from results ONLY
`;
  }

  // 🚫 TOOL GROUNDING: Prevenir alucinaciones sobre capacidades
  const toolGroundingRules = `
IMPORTANT: Only promise actions you can actually perform with your available tools.

- If you don't have an email tool, don't promise to send emails
- If you don't have a PDF tool, don't promise to generate PDFs
- Be honest about your capabilities and offer realistic alternatives
`;

  // 📧 Instrucciones de Gmail si tiene acceso
  let gmailInstructions = '';
  if (hasGmailTools) {
    gmailInstructions = `
📧 GMAIL TOOLS AVAILABLE:
- send_gmail: Send emails (with HTML, CC, BCC support)
- read_gmail: Read and search inbox emails

When user asks to read emails, try using read_gmail() first. If it fails with authentication error, let them know they need to connect Gmail in their dashboard.
`;
  }

  // 🎯 CUSTOM INSTRUCTIONS PRIMERO (máxima prioridad)
  let customInstructionsBlock = '';
  if (config.customInstructions) {
    customInstructionsBlock = `🎯 TU PERSONALIZACIÓN (PRIORIDAD MÁXIMA):

${config.customInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  }

  // Construir prompt base con personalidad
  let basePrompt: string;

  // Si personality es un AgentType válido, usar prompt optimizado
  if (agentTypes.includes(personality as AgentType)) {
    // ⚡ ORDEN CRÍTICO: RAG instructions PRIMERO (máxima prioridad) → custom → persona
    basePrompt = `${searchInstructions}
${customInstructionsBlock}${config.name || "Asistente"} - ${getAgentPrompt(personality as AgentType)}

${toolGroundingRules}${gmailInstructions}`;
  } else {
    // Fallback a personalidades genéricas (friendly, professional)
    const personalityMap: Record<string, string> = {
      friendly: "asistente amigable y cercano",
      professional: "asistente profesional",
    };

    // ⚡ ORDEN CRÍTICO: RAG instructions PRIMERO (máxima prioridad) → custom → persona
    basePrompt = `${searchInstructions}
${customInstructionsBlock}Eres ${config.name || "asistente"}, ${personalityMap[personality] || "asistente amigable"}.

${config.instructions || "Asistente útil."}

Usa las herramientas disponibles cuando las necesites. Sé directo y mantén tu personalidad.

${toolGroundingRules}${gmailInstructions}`;
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

📄 PDF REPORTS: Use generate_chatbot_report when user asks for reports, PDFs, or document exports. Copy the exact message returned by the tool, including download links.`;
  }

  // 🎨 Instrucciones de widgets (SIEMPRE - aplica a todas las tools que generan widgets)
  basePrompt += `

🎨 WIDGET MARKERS: When a tool returns a message with 🎨WIDGET:type:id🎨, copy the exact message without modifications. These markers create interactive UI elements.`;

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
  conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
  toolContext?: ToolContext // Aceptar toolContext pre-construido (incluye onSourcesFound)
) {
  const { resolvedConfig, userPlan } = context;

  // Model selection con mapping transparente
  const selectedModel = mapModelForPerformance(
    resolvedConfig.aiModel || "gpt-5-nano"
  );

  // Create LLM with correct provider (OpenAI or Anthropic)
  // Use nullish coalescing to avoid overriding valid values like 0
  const llm = createLLM(selectedModel, resolvedConfig.temperature ?? getOptimalTemperature(selectedModel));

  // Usar el toolContext proporcionado o crear uno por defecto
  const finalToolContext: ToolContext = toolContext || {
    userId: context.userId,
    userPlan,
    chatbotId: context.chatbotId,
    conversationId: context.agentContext?.conversationId, // Para rate limiting
    message: context.message,
    integrations: context.integrations,
    isGhosty: context.agentContext?.isGhosty || false, // Ghosty tiene acceso a stats
  };


  // ✅ CRÍTICO: Pasar chatbotOwnerPlan para que usuarios anónimos tengan acceso a RAG
  const allTools = getToolsForPlan(userPlan, context.integrations, finalToolContext, context.chatbotOwnerPlan);

  // Detectar si tiene acceso a search_context, web_search_google, generate_chatbot_report, y Gmail tools
  const hasContextSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "search_context"
  );
  const hasWebSearch = allTools.some(
    (tool: any) => tool.metadata?.name === "web_search_google"
  );
  const hasReportGeneration = allTools.some(
    (tool: any) => tool.metadata?.name === "generate_chatbot_report"
  );
  const hasGmailTools = allTools.some(
    (tool: any) => tool.metadata?.name === "send_gmail" || tool.metadata?.name === "read_gmail"
  );

  // Determinar si es el Ghosty oficial de Formmy (isGhosty=true y chatbotId=null)
  const isOfficialGhosty = context.agentContext?.isGhosty === true && context.chatbotId === null;

  const systemPrompt = buildSystemPrompt(
    resolvedConfig,
    hasContextSearch,
    hasWebSearch,
    hasReportGeneration,
    hasGmailTools,
    isOfficialGhosty
  );

  // 🔍 DEBUG: Mostrar system prompt construido
  if (resolvedConfig.customInstructions) {
  }

  // ✅ Crear memoria conversacional según patrón oficial LlamaIndex
  let memory = undefined;


  if (conversationHistory && conversationHistory.length > 0) {

    // 🔧 Formatear historial como texto para staticBlock
    const historyText = conversationHistory.map((msg) => {
      const roleLabel = msg.role === 'user' ? 'Usuario' : msg.role === 'assistant' ? 'Asistente' : 'Sistema';
      return `${roleLabel}: ${msg.content}`;
    }).join('\n\n');


    // 🚀 Crear memoria con staticBlock (patrón oficial LlamaIndex)
    memory = createMemory({
      tokenLimit: 8000,
      memoryBlocks: [
        staticBlock({
          content: `Historial de la conversación:\n\n${historyText}`,
        }),
      ],
    });

  } else {
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
  } else {
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
  'create_formmy_plan_payment': 4,
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
async function* streamSingleAgent(
  agentInstance: any,
  message: string,
  availableTools: string[] = [],
  sourcesBuffer?: { value: any[] | null }, // Buffer compartido para fuentes
  traceCtx?: TraceContext | null, // 🔍 Trace context para observabilidad
  model?: string // 🔍 Modelo para instrumentación
) {
  const MAX_CHUNKS = 1000;
  const MAX_DURATION_MS = 45000; // 45 segundos
  const MAX_SAME_TOOL_CONSECUTIVE = 2; // Máximo 2 veces LA MISMA tool consecutivamente
  const startTime = Date.now();

  // 🔍 TRACING: Instrumentar LLM call principal
  let llmInstrumentation: Awaited<ReturnType<typeof instrumentLLMCall>> | null = null;
  if (traceCtx && model) {
    try {
      llmInstrumentation = await instrumentLLMCall(traceCtx, {
        model,
        temperature: undefined, // Se podría pasar si está disponible
      });
    } catch (err) {
      console.error("⚠️ [Tracing] Failed to instrument LLM call:", err);
    }
  }

  // El agente ya tiene memoria configurada con el historial, solo pasamos el mensaje actual
  const events = agentInstance.runStream(message);

  let hasStreamedContent = false;
  let toolsExecuted = 0;
  let toolsUsed: string[] = [];
  let chunkCount = 0;
  let totalChars = 0;
  let totalTokens = 0; // Tracking de tokens
  let creditsUsed = 0; // Tracking de créditos

  // 🆕 Buffer para detectar widgets
  let widgetBuffer = '';
  let detectedWidgets: Array<{type: string, id: string}> = [];

  // 🚨 Detección de loops infinitos
  let lastToolExecuted: string | null = null;
  let sameToolConsecutiveCount = 0;
  let shouldAbort = false; // Flag para salir del loop

  try {
    for await (const event of events as any) {
      // 🚨 Salir si detectamos loop infinito
      if (shouldAbort) {
        console.error('🛑 Abortando stream por loop infinito detectado');
        break;
      }
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

        // 🔍 TRACING: Instrumentar tool call
        if (traceCtx) {
          try {
            await instrumentToolCall(traceCtx, {
              toolName,
            });
          } catch (err) {
            console.error("⚠️ [Tracing] Failed to instrument tool call:", err);
          }
        }

        // 🚨 Detectar loop infinito: misma tool ejecutándose consecutivamente
        if (toolName === lastToolExecuted) {
          sameToolConsecutiveCount++;
          console.warn(`⚠️  Tool "${toolName}" ejecutada ${sameToolConsecutiveCount + 1} veces consecutivas`);

          if (sameToolConsecutiveCount >= MAX_SAME_TOOL_CONSECUTIVE) {
            console.error(`🚨 LOOP INFINITO DETECTADO: ${toolName} ejecutada ${sameToolConsecutiveCount + 1} veces consecutivas`);
            yield {
              type: "error",
              content: `Detuve un loop infinito. La herramienta "${toolName}" se ejecutó múltiples veces sin producir resultado útil. Intenta reformular tu pregunta o describe con más detalle lo que necesitas.`,
            };
            shouldAbort = true;
            continue;
          }
        } else {
          // Tool diferente, resetear contador
          sameToolConsecutiveCount = 0;
          lastToolExecuted = toolName;
        }


        // Calcular créditos consumidos por esta tool
        const toolCredits = TOOL_CREDITS[toolName] || 1; // Default 1 crédito
        creditsUsed += toolCredits;

        yield {
          type: "tool-start",
          tool: toolName,
          message: `🔧 ${toolName}`,
        };

        // 🔍 Emitir fuentes si search_context fue ejecutado y hay fuentes en el buffer
        if (toolName === 'search_context' && sourcesBuffer?.value) {

          yield {
            type: "sources",
            sources: sourcesBuffer.value.map((source: any) => ({
              id: source.id || source.metadata?.contextId || 'unknown',
              score: source.score || 0,
              text: source.content || source.text || '',
              metadata: {
                source: source.metadata?.contextType || 'Unknown', // ✅ FIXED: usar contextType en lugar de source
                fileName: source.metadata?.fileName || null,
                url: source.metadata?.url || null,
                title: source.metadata?.title || null,
                contextId: source.metadata?.contextId || null,
                chatbotId: source.metadata?.chatbotId || null,
                chunkIndex: source.metadata?.chunkIndex || 0
              }
            }))
          };

          // Limpiar buffer después de emitir
          sourcesBuffer.value = null;
        }
      }

      // Stream content events
      if (agentStreamEvent.include(event)) {
        if (event.data.delta) {
          chunkCount++;
          const chunk = event.data.delta;
          totalChars += chunk.length;

          // Estimar tokens basado en caracteres (regla aproximada: ~4 chars por token)
          totalTokens += Math.ceil(chunk.length / 4);

          // 🆕 Acumular en buffer para detectar widgets
          widgetBuffer += chunk;

          // 🎨 Detectar widget completo: 🎨WIDGET:tipo:id🎨
          // Soporta IDs con letras, números, guiones y guiones bajos (MongoDB ObjectIDs)
          // Case-insensitive por seguridad
          const widgetMatch = widgetBuffer.match(/🎨WIDGET:(\w+):([a-zA-Z0-9_-]+)🎨/i);
          if (widgetMatch) {
            const [fullMatch, widgetType, widgetId] = widgetMatch;


            // Emitir evento widget
            yield {
              type: "widget",
              widgetType,
              widgetId
            };

            detectedWidgets.push({ type: widgetType, id: widgetId });

            // Limpiar del buffer (ya procesado)
            widgetBuffer = widgetBuffer.replace(fullMatch, '');
          }

          // 🧹 Emitir chunk SIN el marcador emoji
          // Mismo regex que la detección pero con flag global para reemplazar todas las ocurrencias
          const cleanChunk = chunk.replace(/🎨WIDGET:\w+:[a-zA-Z0-9_-]+🎨/gi, '');

          if (cleanChunk) {
            // 🛡️ PROTECCIÓN 3: Detectar contenido corrupto (múltiples scripts)
            const hasMultipleScripts =
              /[\u0400-\u04FF].*[\u0E00-\u0E7F]|[\u0600-\u06FF].*[\u4E00-\u9FFF]|[\u0900-\u097F].*[\u0400-\u04FF]/.test(
                cleanChunk
              );
            if (hasMultipleScripts && cleanChunk.length > 100) {
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
              content: cleanChunk,
            };
          }
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

  // 🔍 TRACING: Completar LLM span
  const estimatedCostValue = model ? estimateCost(model, totalTokens) : (totalTokens / 1_000_000) * 0.375;
  if (llmInstrumentation && traceCtx) {
    try {
      await llmInstrumentation.complete({
        tokens: totalTokens,
        cost: estimatedCostValue,
      });
    } catch (err) {
      console.error("⚠️ [Tracing] Failed to complete LLM instrumentation:", err);
    }
  }

  yield {
    type: "done",
    metadata: {
      toolsExecuted,
      toolsUsed,
      availableTools, // 🔧 Lista de herramientas disponibles para el usuario
      tokensUsed: totalTokens,
      creditsUsed,
      detectedWidgets, // 🆕 Widgets detectados durante el streaming
      estimatedCost: {
        tokens: totalTokens,
        credits: creditsUsed,
        // Estimación aproximada: GPT-4o-mini = $0.15 input + $0.60 output por 1M tokens
        // Asumiendo 50/50 input/output para simplificar
        usdCost: estimatedCostValue.toFixed(6)
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
    chatbotOwnerPlan?: string; // ✅ NUEVO: Plan del dueño del chatbot
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
    chatbotOwnerPlan: options.chatbotOwnerPlan, // ✅ CRÍTICO: Pasar plan del dueño
  };

  // 🔍 TRACING: Iniciar trace para observabilidad
  let traceCtx: TraceContext | null = null;
  const selectedModel = mapModelForPerformance(
    options.resolvedConfig.aiModel || "gpt-5-nano"
  );

  try {
    traceCtx = await startTrace({
      userId: user.id,
      chatbotId: chatbotId || undefined,
      conversationId: options.agentContext?.conversationId,
      input: message,
      model: selectedModel, // 🔍 Guardar modelo usado
      metadata: {
        userPlan: user.plan,
        temperature: options.resolvedConfig.temperature,
      },
    });
  } catch (traceError) {
    console.error("⚠️ [Tracing] Failed to start trace:", traceError);
    // No fallar el request si tracing falla - tracing es opcional
  }

  try {
    // Extraer historial conversacional del agentContext
    const conversationHistory = options.agentContext?.conversationHistory || [];


    if (conversationHistory.length > 0) {
      conversationHistory.forEach((msg: any, i: number) => {
      });
    } else {
    }

    // 🔍 Crear buffer compartido para fuentes
    const sourcesBuffer = { value: null as any[] | null };

    // 🔧 Obtener lista de herramientas disponibles para el usuario con callback de fuentes
    const toolContext: ToolContext = {
      userId: context.userId,
      userPlan: context.userPlan,
      chatbotId: context.chatbotId,
      conversationId: context.agentContext?.conversationId,
      message: context.message,
      integrations: context.integrations,
      isGhosty: context.agentContext?.isGhosty || false,
      onSourcesFound: (sources: any[]) => {
        sourcesBuffer.value = sources;
      }
    };

    // Single agent con todas las tools + memoria conversacional
    const agentInstance = await createSingleAgent(context, conversationHistory, toolContext);

    const availableToolsObjects = getToolsForPlan(context.userPlan, context.integrations, toolContext);
    const availableTools = availableToolsObjects.map((tool: any) => tool.metadata?.name || 'unknown');

    // 🔍 Capturar modelo para tracing
    const selectedModel = mapModelForPerformance(
      context.resolvedConfig.aiModel || "gpt-5-nano"
    );

    // Stream con memoria ya configurada en el agente + lista de tools disponibles + buffer de fuentes + tracing
    let fullOutput = "";
    let finalMetadata: any = null;

    for await (const event of streamSingleAgent(
      agentInstance,
      message,
      availableTools,
      sourcesBuffer,
      traceCtx, // 🔍 Pasar trace context
      selectedModel // 🔍 Pasar modelo
    )) {
      // Capturar chunks para construir output completo
      if (event.type === "chunk" && event.content) {
        fullOutput += event.content;
      }
      if (event.type === "done" && event.metadata) {
        finalMetadata = event.metadata;
      }
      yield event;
    }

    // 🔍 TRACING: Completar trace con output y métricas finales
    if (traceCtx && finalMetadata) {
      try {
        await endTrace(traceCtx, {
          output: fullOutput || "Respuesta completada",
          totalTokens: finalMetadata.tokensUsed || 0,
          totalCost: parseFloat(finalMetadata.estimatedCost?.usdCost || "0"),
          creditsUsed: finalMetadata.creditsUsed || 0,
        });
      } catch (err) {
        console.error("⚠️ [Tracing] Failed to complete trace:", err);
      }
    }
  } catch (error) {
    console.error("❌ AgentWorkflow error:", error);

    // 🔍 TRACING: Marcar trace como error
    if (traceCtx) {
      try {
        await failTrace(traceCtx, error instanceof Error ? error.message : String(error));
      } catch (err) {
        console.error("⚠️ [Tracing] Failed to mark trace as error:", err);
      }
    }

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
