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
• Starter - $149 MXN/mes: 2 chatbots, 50 conversaciones
• Pro - $499 MXN/mes: 10 chatbots, 250 conversaciones
• Enterprise - $1,499 MXN/mes: chatbots ilimitados, 1000 conversaciones

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
  hasGmailTools: boolean = false
): string {
  // 🎯 GHOSTY usa prompt dedicado optimizado
  if (config.name === 'Ghosty') {
    return buildGhostySystemPrompt();
  }

  const personality = config.personality || "friendly";

  // Agent types válidos
  const agentTypes: AgentType[] = ['sales', 'customer_support', 'data_analyst', 'coach', 'medical_receptionist', 'educational_assistant'];

  // 🔍 Instrucciones de búsqueda para chatbots con RAG
  let searchInstructions = '';
  if (hasContextSearch) {
    searchInstructions = `⚠️ REGLA CRÍTICA - REVISAR HISTORIAL PRIMERO:

Si el usuario pregunta sobre información que ÉL MISMO mencionó en esta conversación:
- Su nombre, empresa, rol, preferencias
- Problemas o necesidades que ya comentó
- Cualquier dato personal que compartió
→ RESPONDE DIRECTAMENTE usando esa información del historial
→ NO uses search_context (esa herramienta es para info del NEGOCIO, no del USUARIO)

Ejemplo:
Usuario: "me llamo Juan y trabajo en marketing"
Usuario: "cómo me llamo?"
→ CORRECTO: "Te llamas Juan" ✅
→ INCORRECTO: search_context("Juan cliente") ❌

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ REGLA FUNDAMENTAL - BÚSQUEDA EN BASE DE CONOCIMIENTO:

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

  // 🚫 TOOL GROUNDING: Prevenir alucinaciones sobre capacidades
  const toolGroundingRules = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚫 REGLA CRÍTICA - HONESTIDAD SOBRE CAPACIDADES:

NUNCA prometas acciones que tus herramientas NO pueden ejecutar:

❌ Si NO tienes tool de email: NO digas "te enviaré", "recibirás un email", "te contactaré"
❌ Si NO tienes tool de PDF: NO digas "preparé el PDF", "generé el documento", "te mando el archivo"
❌ Si NO tienes tool X: NO prometas hacer X

✅ SÉ HONESTO sobre tus limitaciones reales:

CORRECTO: "Puedo guardar tu email para que el equipo te contacte"
CORRECTO: "Te comparto la información aquí mismo. ¿Quieres que guarde tu email para seguimiento?"
CORRECTO: "No tengo capacidad de enviar emails, pero puedo [alternativa real]"

INCORRECTO: "He preparado el PDF y te lo envío por email" ← MENTIRA si no tienes esas tools

📋 PROTOCOLO ANTE SOLICITUDES IMPOSIBLES:

User: "Envíame el reporte por email"

Si NO tienes email tool:
→ "No puedo enviar emails directamente, pero tengo estas alternativas:
   1) Te doy la información aquí mismo
   2) Guardo tu email para que el equipo te la envíe
   ¿Cuál prefieres?"

Si SÍ tienes email tool:
→ Usa la tool y confirma: "✅ Email enviado a [dirección]"

REGLA DE ORO: Solo promete lo que tus tools pueden cumplir. La confianza del usuario es sagrada.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  // 📧 Instrucciones de Gmail si tiene acceso
  let gmailInstructions = '';
  if (hasGmailTools) {
    gmailInstructions = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 CAPACIDADES DE GMAIL:

🔧 HERRAMIENTAS DISPONIBLES:
- send_gmail: Enviar emails con HTML, CC, BCC
- read_gmail: Leer y buscar emails en inbox

⚠️ PROTOCOLO CRÍTICO - HONESTIDAD ANTE TODO:

Cuando el usuario pregunta "¿Puedes leer mi correo?":
1. INTENTA ejecutar read_gmail() PRIMERO
2. SI la tool ejecuta exitosamente: "Sí, aquí están tus emails..."
3. SI la tool falla con "not connected" o "authentication": "Necesitas conectar Gmail primero en tu dashboard"

❌ PROHIBIDO:
- Decir "Sí, puedo leer emails" SIN intentar leer primero
- Prometer capacidades sin verificar conexión

✅ CORRECTO:
User: "¿Puedes leer mi correo?"
→ EJECUTAR read_gmail(max_results: 5)
→ Si funciona: "Sí, aquí están tus últimos emails: [lista]"
→ Si falla: "Necesitas conectar tu Gmail desde el dashboard para que pueda leer tus correos"

User: "Lee mis emails"
→ EJECUTAR read_gmail(max_results: 10)

User: "Busca emails de Juan"
→ EJECUTAR read_gmail(query: "from:juan@example.com")

User: "Envía un email a maria@empresa.com"
→ EJECUTAR send_gmail(recipient_email: "maria@empresa.com", subject: "...", body: "...")

REGLA DE ORO: Deja que las tools determinen si puedes o no. NO prometas hasta verificar con la tool.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
  }

  // Construir prompt base con personalidad
  let basePrompt: string;

  // Si personality es un AgentType válido, usar prompt optimizado
  if (agentTypes.includes(personality as AgentType)) {
    // ORDEN: searchInstructions → toolGroundingRules → gmailInstructions → personality → custom instructions
    basePrompt = `${searchInstructions}${toolGroundingRules}${gmailInstructions}${config.name || "Asistente"} - ${getAgentPrompt(personality as AgentType)}${config.customInstructions ? '\n\n' + config.customInstructions : ''}`;
  } else {
    // Fallback a personalidades genéricas (friendly, professional)
    const personalityMap: Record<string, string> = {
      friendly: "asistente amigable y cercano",
      professional: "asistente profesional",
    };

    // ORDEN: searchInstructions → toolGroundingRules → gmailInstructions → personalidad
    basePrompt = `${searchInstructions}${toolGroundingRules}${gmailInstructions}Eres ${config.name || "asistente"}, ${personalityMap[personality] || "asistente amigable"}.

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

  // 🎨 Instrucciones de widgets (SIEMPRE - aplica a todas las tools que generan widgets)
  basePrompt += `

🎨 REGLA CRÍTICA DE WIDGETS INTERACTIVOS:

Cuando una herramienta retorna un marcador 🎨WIDGET:tipo:id🎨:

✅ HACER (OBLIGATORIO):
1. COPIAR EXACTO el mensaje de la herramienta (incluye el marcador 🎨WIDGET:tipo:id🎨)
2. NO modificar NADA del mensaje
3. NO agregar texto antes/después del marcador
4. NO reformular si contiene el marcador

❌ NO HACER (PROHIBIDO):
- NO remover los emojis 🎨
- NO cambiar el formato WIDGET:tipo:id
- NO agregar explicaciones dentro del marcador
- NO mover el marcador a otra posición

📋 EJEMPLOS:

✅ CORRECTO:
Tool retorna: "🎨WIDGET:payment:abc123🎨\\n\\nLink generado por $499 MXN"
→ Copias EXACTO ese texto

❌ INCORRECTO:
"He preparado tu pago 🎨WIDGET:payment:abc123🎨 para que procedas"
"Link de pago: 🎨WIDGET:payment:abc123🎨 ← usa este botón"
"🎨 WIDGET: payment: abc123 🎨" (espacios incorrectos)

⚠️ IMPORTANTE: El marcador es TÉCNICO y el sistema lo detecta automáticamente para mostrar widgets interactivos. Si lo modificas, el widget NO se mostrará.`;

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

  console.log(`\n${'🔍'.repeat(40)}`);
  console.log(`🔍 [ToolContext Debug] CONSTRUYENDO TOOL CONTEXT`);
  console.log(`   context.agentContext:`, context.agentContext);
  console.log(`   context.agentContext?.isGhosty:`, context.agentContext?.isGhosty);
  console.log(`   finalToolContext.isGhosty:`, finalToolContext.isGhosty);
  console.log(`   finalToolContext.onSourcesFound:`, !!finalToolContext.onSourcesFound);
  console.log(`   userPlan:`, userPlan);
  console.log(`${'🔍'.repeat(40)}\n`);

  const allTools = getToolsForPlan(userPlan, context.integrations, finalToolContext);

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

  const systemPrompt = buildSystemPrompt(resolvedConfig, hasContextSearch, hasWebSearch, hasReportGeneration, hasGmailTools);

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

        console.log(`\n${'🔧'.repeat(40)}`);
        console.log(`🔧 [Tool Call] HERRAMIENTA EJECUTADA`);
        console.log(`   Nombre: ${toolName}`);
        console.log(`   Consecutivas: ${sameToolConsecutiveCount + 1}`);
        console.log(`   Total ejecutadas: ${toolsExecuted}`);
        console.log(`${'🔧'.repeat(40)}\n`);

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
          console.log(`\n${'📚'.repeat(40)}`);
          console.log(`📚 [Sources] EMITIENDO FUENTES AL STREAM`);
          console.log(`   Fuentes encontradas: ${sourcesBuffer.value.length}`);
          console.log(`${'📚'.repeat(40)}\n`);

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

            console.log(`\n${'🎨'.repeat(40)}`);
            console.log(`🎨 [Widget Detected] WIDGET ENCONTRADO EN STREAMING`);
            console.log(`   Tipo: ${widgetType}`);
            console.log(`   ID: ${widgetId}`);
            console.log(`   Match completo: ${fullMatch}`);
            console.log(`${'🎨'.repeat(40)}\n`);

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

    console.log(`\n${'🔥'.repeat(40)}`);
    console.log(`🚀 [streamAgentWorkflow] INICIO`);
    console.log(`   agentContext recibido: ${!!options.agentContext}`);
    console.log(`   conversationHistory extraído: ${conversationHistory.length} mensajes`);

    if (conversationHistory.length > 0) {
      console.log(`\n   📚 HISTORIAL EXTRAÍDO DEL AGENTCONTEXT:`);
      conversationHistory.forEach((msg: any, i: number) => {
        console.log(`   [${i + 1}] ${msg.role}: "${msg.content.substring(0, 60)}..."`);
      });
    } else {
      console.log(`   ⚠️  conversationHistory está VACÍO`);
      console.log(`   agentContext completo:`, JSON.stringify(options.agentContext, null, 2));
    }
    console.log(`${'🔥'.repeat(40)}\n`);

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
        console.log(`\n${'🔔'.repeat(40)}`);
        console.log(`🔔 [onSourcesFound] CALLBACK EJECUTADO`);
        console.log(`   Fuentes recibidas: ${sources.length}`);
        console.log(`${'🔔'.repeat(40)}\n`);
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
