/**
 * LlamaIndex Native Tools - Zero Registry, Pure Functional
 * Siguiendo patterns oficiales de LlamaIndex TypeScript
 */

import { tool } from "llamaindex";
import { z } from "zod";

// ===== TOOL CONTEXT TYPE =====
export interface ToolContext {
  userId: string;
  userPlan: string;
  chatbotId: string | null;
  conversationId?: string; // Para rate limiting y tracking
  message: string;
  integrations: Record<string, any>;
  isGhosty?: boolean; // Flag para distinguir Ghosty de chatbots públicos
}

// ===== TOOL FACTORIES WITH CONTEXT INJECTION =====

export const createScheduleReminderTool = (context: ToolContext) => tool(
  async ({ title, date, time, email }: any) => {
    const { scheduleReminderHandler } = await import('./handlers/denik');
    const result = await scheduleReminderHandler({ title, date, time, email }, context);
    return result.message;
  },
  {
    name: "schedule_reminder",
    description: "Crear un nuevo recordatorio o cita en el calendario",
    parameters: z.object({
      title: z.string().describe("Título del recordatorio o cita"),
      date: z.string().describe("Fecha en formato YYYY-MM-DD (ej: 2025-08-23)"),
      time: z.string().describe("Hora en formato HH:MM (24 horas)"),
      email: z.string().describe("Email para enviar notificación - REQUERIDO")
    })
  }
);

export const createListRemindersTool = (context: ToolContext) => tool(
  async () => {
    const { listRemindersHandler } = await import('./handlers/reminder-management');
    const result = await listRemindersHandler({}, context);
    return result.message;
  },
  {
    name: "list_reminders",
    description: "Consultar todos los recordatorios pendientes del usuario",
    parameters: z.object({})
  }
);

export const createUpdateReminderTool = (context: ToolContext) => tool(
  async ({ id, title, date, time, email }) => {
    const { updateReminderHandler } = await import('./handlers/reminder-management');
    const result = await updateReminderHandler({ id, title, date, time, email }, context);
    return result.message;
  },
  {
    name: "update_reminder",
    description: "Modificar un recordatorio existente (fecha, hora, título, email)",
    parameters: z.object({
      id: z.string().describe("ID del recordatorio a actualizar"),
      title: z.string().optional().describe("Nuevo título del recordatorio"),
      date: z.string().optional().describe("Nueva fecha en formato YYYY-MM-DD"),
      time: z.string().optional().describe("Nueva hora en formato HH:MM"),
      email: z.string().optional().describe("Nuevo email para notificación")
    })
  }
);

export const createCancelReminderTool = (context: ToolContext) => tool(
  async ({ id }) => {
    const { cancelReminderHandler } = await import('./handlers/reminder-management');
    const result = await cancelReminderHandler({ id }, context);
    return result.message;
  },
  {
    name: "cancel_reminder",
    description: "Cancelar un recordatorio (mantiene en DB como 'cancelled')",
    parameters: z.object({
      id: z.string().describe("ID del recordatorio a cancelar")
    })
  }
);

export const createDeleteReminderTool = (context: ToolContext) => tool(
  async ({ id }) => {
    const { deleteReminderHandler } = await import('./handlers/reminder-management');
    const result = await deleteReminderHandler({ id }, context);
    return result.message;
  },
  {
    name: "delete_reminder",
    description: "Eliminar permanentemente un recordatorio de la base de datos",
    parameters: z.object({
      id: z.string().describe("ID del recordatorio a eliminar permanentemente")
    })
  }
);

// ===== PAYMENT TOOLS =====

export const createPaymentLinkTool = (context: ToolContext) => tool(
  async ({ amount, description, currency = "mxn" }) => {
    const { createPaymentLinkHandler } = await import('./handlers/stripe');
    const result = await createPaymentLinkHandler({ amount, description, currency }, context);
    return result.message;
  },
  {
    name: "create_payment_link",
    description: "Crear un link de pago de Stripe para cobrar al cliente",
    parameters: z.object({
      amount: z.number().describe("Cantidad a cobrar en números (ej: 500, 1000)"),
      description: z.string().describe("Descripción del pago o servicio"),
      currency: z.string().default("mxn").describe("Moneda del pago (default: 'mxn' para pesos mexicanos)")
    })
  }
);

// ===== CONTACT TOOLS =====

export const createSaveContactTool = (context: ToolContext) => tool(
  async ({ name, email, phone, company, position, website, notes }) => {
    const { saveContactInfoHandler } = await import('./handlers/contact');
    const result = await saveContactInfoHandler({ name, email, phone, company, position, website, notes }, context);
    return result.message;
  },
  {
    name: "save_contact_info",
    description: "Guardar información de contacto de leads/prospectos",
    parameters: z.object({
      name: z.string().optional().describe("Nombre completo de la persona"),
      email: z.string().optional().describe("Dirección de correo electrónico"),
      phone: z.string().optional().describe("Número de teléfono"),
      company: z.string().optional().describe("Nombre de la empresa u organización"),
      position: z.string().optional().describe("Cargo o posición en la empresa"),
      website: z.string().optional().describe("Sitio web de la persona o empresa"),
      notes: z.string().optional().describe("Notas adicionales o contexto sobre el contacto")
    })
  }
);

// ===== DATETIME TOOLS =====

export const createGetCurrentDateTimeTool = (context: ToolContext) => tool(
  async () => {
    const { getCurrentDateTimeHandler } = await import('./handlers/datetime');
    const result = await getCurrentDateTimeHandler({}, context);
    return result.message;
  },
  {
    name: "get_current_datetime",
    description: "Obtener la fecha y hora actual (timezone México GMT-6) para contextualizar respuestas",
    parameters: z.object({})
  }
);

// ===== WEB SEARCH TOOLS =====

export const createGoogleSearchTool = (context: ToolContext) => tool(
  async ({ query, numResults = 5 }) => {
    const { googleSearchHandler } = await import('./handlers/google-search');
    const result = await googleSearchHandler({ query, numResults }, context);
    return result.message;
  },
  {
    name: "web_search_google",
    description: "Buscar información actualizada en Google. Útil para responder preguntas sobre eventos actuales, noticias, datos recientes o información que no está en el contexto del chatbot",
    parameters: z.object({
      query: z.string().describe("Consulta de búsqueda en Google (keywords o pregunta)"),
      numResults: z.number().optional().default(5).describe("Número de resultados a obtener (1-10, default: 5)")
    })
  }
);

// ===== CONTEXT SEARCH TOOLS (RAG) =====

export const createContextSearchTool = (context: ToolContext) => tool(
  async ({ query, topK = 5 }) => {
    const { contextSearchHandler } = await import('./handlers/context-search');
    const result = await contextSearchHandler({ query, topK }, context);
    return result.message;
  },
  {
    name: "search_context",
    description: `🔍 HERRAMIENTA PRINCIPAL - Búsqueda semántica en la base de conocimiento del chatbot.

⚠️ REGLA CRÍTICA: Esta herramienta debe ser tu PRIMERA OPCIÓN para responder preguntas sobre el negocio.

📋 USAR OBLIGATORIAMENTE cuando el usuario pregunta sobre:
- Productos, servicios, características, actualizaciones, roadmap
- Precios, planes, costos, políticas de pago
- Documentación, tutoriales, guías, FAQs
- Políticas de la empresa, términos, condiciones
- Información del equipo, empresa, historia
- CUALQUIER dato específico del negocio

🚫 PROHIBIDO responder SIN buscar sobre estos temas. Si no buscas, fallas.

🎯 ESTRATEGIA AGÉNTICA (OBLIGATORIA):
1. Ejecuta search_context ANTES de formular respuesta
2. Si pregunta compleja → DIVIDE en sub-preguntas → BUSCA CADA UNA
3. Si resultados insuficientes → REFORMULA query → BUSCA DE NUEVO
4. Haz MÍNIMO 2 búsquedas para preguntas multi-tema
5. Combina resultados para respuesta completa

📊 EJEMPLOS CORRECTOS:
✅ User: "características nuevas" → search_context("características nuevas actualizaciones features")
✅ User: "planes y precios" → search_context("planes") + search_context("precios") → combinar
✅ User: "compara X vs Y" → search_context("X") + search_context("Y") → tabla comparativa

❌ ERRORES CRÍTICOS A EVITAR:
- No buscar antes de responder sobre el negocio
- Decir "no tengo información" sin intentar buscar
- Una sola búsqueda genérica para pregunta compleja
- Redirigir al usuario a "buscar en el sitio" en lugar de buscar tú mismo`,
    parameters: z.object({
      query: z.string().describe("Consulta específica y precisa. Usa keywords relevantes. Ejemplo: 'características nuevas actualizaciones 2025' mejor que solo 'novedades'"),
      topK: z.number().optional().default(5).describe("Resultados a obtener (1-10). Usa 3 para búsqueda específica, 5-7 para tema amplio, 10 para investigación exhaustiva.")
    })
  }
);

// ===== USAGE LIMITS TOOLS =====

export const createGetUsageLimitsTool = (context: ToolContext) => tool(
  async () => {
    const { getUsageLimitsHandler } = await import('./handlers/usage-limits');
    const result = await getUsageLimitsHandler({}, context);
    return result.message;
  },
  {
    name: "get_usage_limits",
    description: "Consultar límites del plan y uso actual (conversaciones restantes, créditos, fecha de reset). Útil cuando el usuario pregunta cuántas conversaciones le quedan, cuál es su límite mensual, o cuándo se reinicia su contador.",
    parameters: z.object({})
  }
);

// ===== CHATBOT TOOLS =====

export const createQueryChatbotsTool = (context: ToolContext) => tool(
  async ({ status, orderBy, limit, includeStats }) => {
    const { queryChatbotsHandler } = await import('./handlers/chatbot-query');
    const result = await queryChatbotsHandler({ status, orderBy, limit, includeStats }, context);
    return result.message;
  },
  {
    name: "query_chatbots",
    description: "Consultar y listar los chatbots del usuario con filtros y estadísticas",
    parameters: z.object({
      status: z.enum(['all', 'active', 'inactive', 'draft']).optional().default('all').describe("Filtrar por estado del chatbot"),
      orderBy: z.enum(['name', 'conversations', 'created', 'updated']).optional().default('updated').describe("Ordenar por campo"),
      limit: z.number().optional().default(10).describe("Límite de resultados (máximo 20)"),
      includeStats: z.boolean().optional().default(true).describe("Incluir estadísticas básicas")
    })
  }
);

export const createGetChatbotStatsTool = (context: ToolContext) => tool(
  async ({ chatbotId, period, compareWithPrevious, includeHourlyBreakdown }) => {
    const { getChatbotStatsHandler } = await import('./handlers/chatbot-stats');
    const result = await getChatbotStatsHandler({ chatbotId, period, compareWithPrevious, includeHourlyBreakdown }, context);
    return result.message;
  },
  {
    name: "get_chatbot_stats",
    description: "Obtener estadísticas detalladas de conversaciones de chatbots (métricas, comparaciones, análisis)",
    parameters: z.object({
      chatbotId: z.string().optional().describe("ID específico del chatbot (si no se provee, analiza todos)"),
      period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('week').describe("Período de análisis"),
      compareWithPrevious: z.boolean().optional().default(true).describe("Comparar con período anterior"),
      includeHourlyBreakdown: z.boolean().optional().default(false).describe("Incluir breakdown por horas del día")
    })
  }
);

/**
 * Función para obtener tools según plan del usuario con context injection
 * Plan-aware tool selection funcional
 */
export const getToolsForPlan = (
  userPlan: string,
  integrations: Record<string, any> = {},
  context: ToolContext
) => {
  const tools = [];

  // Reminder tools - SOLO para Ghosty (gestión de agenda privada)
  // ❌ Chatbots públicos NO deben acceder a la agenda personal del dueño
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(
      createScheduleReminderTool(context),
      createListRemindersTool(context),
      createUpdateReminderTool(context),
      createCancelReminderTool(context),
      createDeleteReminderTool(context)
    );
  }

  // Payment tools - PRO+ con Stripe habilitado
  if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.stripe) {
    tools.push(createPaymentLinkTool(context));
  }

  // Contact tools - disponibles para ANONYMOUS/STARTER+
  if (['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(createSaveContactTool(context));
  }

  // DateTime tools - disponibles para ANONYMOUS/STARTER+
  if (['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(createGetCurrentDateTimeTool(context));
  }

  // Google Search tools - disponibles para ANONYMOUS/STARTER+ con API configurada
  if (['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) &&
      process.env.GOOGLE_SEARCH_API_KEY &&
      process.env.GOOGLE_SEARCH_ENGINE_ID) {
    tools.push(createGoogleSearchTool(context));
  }

  // Context Search (RAG) - disponible para PRO/ENTERPRISE/TRIAL con embeddings configurados
  // Requiere vector search index en MongoDB Atlas
  if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && context.chatbotId) {
    tools.push(createContextSearchTool(context));
  }

  // Usage Limits - SOLO para Ghosty (información del plan del usuario)
  if (context.isGhosty && ['FREE', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(createGetUsageLimitsTool(context));
  }

  // Chatbot tools - SOLO para Ghosty (asistente interno)
  // ❌ Chatbots públicos NO deben tener acceso a estadísticas privadas
  if (context.isGhosty && ['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(
      createQueryChatbotsTool(context),
      createGetChatbotStatsTool(context)
    );
  }

  return tools;
};

/**
 * Debug: Lista de todas las tools disponibles
 */
export const getAllToolNames = () => [
  'schedule_reminder',
  'list_reminders',
  'update_reminder',
  'cancel_reminder',
  'delete_reminder',
  'create_payment_link',
  'save_contact_info',
  'get_usage_limits',
  'query_chatbots',
  'get_chatbot_stats',
  'get_current_datetime',
  'web_search_google',
  'search_context'
];