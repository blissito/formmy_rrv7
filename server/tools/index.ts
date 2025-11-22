/**
 * LlamaIndex Native Tools - Zero Registry, Pure Functional
 * Siguiendo patterns oficiales de LlamaIndex TypeScript
 */

import { tool } from "llamaindex";
import { z } from "zod";

// ===== TOOL CONTEXT TYPE (imported from types.ts) =====
import type { ToolContext, ToolResponse } from './types';
export type { ToolContext, ToolResponse };

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

// Tool para planes de Formmy (Ghosty cobra upgrades/planes)
export const createFormmyPlanPaymentTool = (context: ToolContext) => tool(
  async ({ planName }) => {
    const { createFormmyPlanPaymentHandler } = await import('./handlers/formmy-plans');
    const result = await createFormmyPlanPaymentHandler({ planName }, context);
    return result.message;
  },
  {
    name: "create_formmy_plan_payment",
    description: `Genera un link de pago para que el usuario mejore su plan de Formmy (STARTER, PRO o ENTERPRISE).

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario quiere upgrade: "quiero el plan Pro", "cámbieme a STARTER", "necesito más conversaciones"
- Usuario pide link de pago: "dame el link para pagar Pro", "cómo compro Enterprise"
- Usuario pregunta por compra: "¿puedo pagar el plan Starter?", "quiero comprar PRO"
- Frases clave: plan, upgrade, mejorar, comprar, pagar, STARTER, PRO, ENTERPRISE

**PLANES DISPONIBLES:**
• **STARTER** - $149 MXN/mes: Solo formularios (sin chatbots)
• **PRO** - $499 MXN/mes: 10 chatbots, 250 conversaciones, 1000 créditos, 30 min voz
• **ENTERPRISE** - $2,490 MXN/mes: Chatbots ilimitados, 1000 conversaciones, 5000 créditos, 60 min voz

**EJEMPLOS DE USO:**
✅ "Quiero el plan Pro" → planName: "PRO"
✅ "Dame el link para pagar Starter" → planName: "STARTER"
✅ "¿Puedo comprar Enterprise?" → planName: "ENTERPRISE"
✅ "Cámbieme a PRO" → planName: "PRO"

**IMPORTANTE:**
- Solo acepta planName: "STARTER", "PRO" o "ENTERPRISE" (case-insensitive)
- Usa Stripe de Formmy automáticamente (NO requiere configuración del usuario)
- Disponible para TODOS los usuarios (FREE, STARTER, PRO)`,
    parameters: z.object({
      planName: z.string().describe("Nombre del plan: 'STARTER', 'PRO' o 'ENTERPRISE' (case-insensitive)")
    })
  }
);

// Tool para pagos del usuario (chatbots cobran a SUS clientes) - PENDIENTE
export const createPaymentLinkTool = (context: ToolContext) => tool(
  async ({ amount, description, currency = "mxn" }) => {
    const { createPaymentLinkHandler } = await import('./handlers/stripe');
    const result = await createPaymentLinkHandler({ amount, description, currency }, context);
    return result.message;
  },
  {
    name: "create_payment_link",
    description: `Genera un link de pago seguro con Stripe para que el cliente pueda pagar con tarjeta de crédito/débito.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario solicita explícitamente: "crea un link de pago", "genera un link de pago", "quiero cobrar"
- Usuario pregunta: "¿puedo pagar con tarjeta?", "¿cómo pago?", "necesito un payment link"
- Usuario menciona montos: "quiero pagar $500", "cuánto cuesta el plan Pro"
- Frases clave: link de pago, payment link, cobrar, pagar, tarjeta, stripe, checkout

**QUÉ GENERA:**
- Link de pago de Stripe seguro y listo para compartir
- Widget interactivo con botón "Pagar ahora"
- Válido indefinidamente (no expira)
- Acepta tarjetas de crédito/débito

**EJEMPLOS DE USO:**
✅ "Crea un link de pago de $500 MXN para el plan Pro" → USAR ESTA TOOL
✅ "Necesito cobrar $1,000 por consultoría" → USAR ESTA TOOL
✅ "¿Puedo pagar con tarjeta?" → USAR ESTA TOOL (generar link para que el usuario pague)
✅ "Genera un payment link de $299 USD" → USAR ESTA TOOL

**IMPORTANTE:** Después de generar el link, COPIA EXACTA del mensaje que retorna la herramienta (incluye el marcador de widget 🎨).`,
    parameters: z.object({
      amount: z.number().describe("Cantidad a cobrar en números enteros (ej: 500, 1000, 299)"),
      description: z.string().describe("Descripción clara del pago o servicio (ej: 'Plan Pro mensual', 'Consultoría 1 hora')"),
      currency: z.string().default("mxn").describe("Moneda del pago: 'mxn' para pesos mexicanos, 'usd' para dólares (default: 'mxn')")
    })
  }
);

// ===== CONTACT TOOLS =====

export const createSaveContactTool = (context: ToolContext) => tool(
  async ({ name, email, phone, productInterest, position, website, notes }) => {
    const { saveContactInfoHandler } = await import('./handlers/contact');
    const result = await saveContactInfoHandler({ name, email, phone, productInterest, position, website, notes }, context);
    return result.message;
  },
  {
    name: "save_contact_info",
    description: `Guardar información de contacto de leads/prospectos que muestran interés en productos o servicios.

CUÁNDO USAR:
✅ Usuario proporciona email/teléfono en contexto de interés comercial
✅ Usuario solicita cotización, información o seguimiento
✅ Usuario comparte datos para recibir propuesta o demo
✅ Usuario pregunta precios y deja contacto

EJEMPLOS VÁLIDOS CON productInterest:
✅ "Me interesa el plan Pro, mi email es juan@empresa.com" → productInterest: "Plan Pro"
✅ "Envíame cotización de consultoría a este WhatsApp" → productInterest: "Consultoría"
✅ "Quiero saber más de automatización WhatsApp" → productInterest: "Automatización WhatsApp"
✅ "Necesito ayuda con mi chatbot" → productInterest: "Soporte chatbot"

NO USAR:
❌ Usuario solo pregunta información SIN proporcionar contacto
❌ Usuario pregunta precios pero NO deja email/teléfono
❌ Inventar o adivinar datos de contacto

CRÍTICO - productInterest:
⚠️ SIEMPRE extrae el productInterest del contexto de la conversación
⚠️ Revisa los mensajes anteriores para identificar qué le interesa al usuario
⚠️ Puede ser: plan específico, servicio, producto, consultoría, soporte, etc.
⚠️ Si el usuario mencionó algo de interés en conversaciones previas, úsalo

IMPORTANTE:
- Requiere email O phone REAL proporcionado explícitamente por el usuario
- NO uses datos genéricos o inventados
- NO pidas confirmación explícita "¿guardo tu email?" - Si lo proporcionó en contexto de interés, guárdalo
- Confirma al usuario DESPUÉS de guardarlo: "Perfecto, tengo tu contacto. Te daremos seguimiento."

NOTA: En WhatsApp, el teléfono ya está disponible del perfil del usuario - NO lo pidas nuevamente.`,
    parameters: z.object({
      name: z.string().optional().describe("Nombre REAL proporcionado explícitamente por el usuario. En WhatsApp se auto-completa del perfil. NUNCA uses 'Usuario', 'User', 'Contacto' u otros genéricos - déjalo vacío si no lo proporciona."),
      email: z.string().optional().describe("Email REAL proporcionado por el usuario - REQUERIDO en Web si no hay phone. OPCIONAL en WhatsApp"),
      phone: z.string().optional().describe("Teléfono REAL proporcionado por el usuario - REQUERIDO en Web si no hay email. En WhatsApp se auto-completa del perfil"),
      productInterest: z.string().optional().describe("OBLIGATORIO EXTRAER: Producto, servicio o tema de interés mencionado en la conversación. Revisa el historial completo para identificarlo. Ejemplos: 'Plan Pro', 'Consultoría', 'Automatización WhatsApp', 'Soporte técnico', 'Integración Gmail', etc."),
      position: z.string().optional().describe("Cargo mencionado por el usuario"),
      website: z.string().optional().describe("Website mencionado por el usuario"),
      notes: z.string().optional().describe("Notas adicionales del contexto")
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
  async ({ query, topK = 10 }) => {
    const { contextSearchHandler } = await import('./handlers/context-search');
    const result = await contextSearchHandler({ query, topK }, context);
    return result.message;
  },
  {
    name: "search_context",
    description: "Search the chatbot's knowledge base for information about products, services, pricing, policies, documentation, and any business-specific content.",
    parameters: z.object({
      query: z.string().describe("Specific search query with relevant keywords"),
      topK: z.number().optional().default(10).describe("Number of results to return (1-20)")
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
      chatbotId: z.string().optional().describe("MongoDB ObjectId del chatbot (24 caracteres hexadecimales). NO usar el nombre del chatbot. Si no se provee, analiza todos los chatbots del usuario."),
      period: z.enum(['week', 'month', 'quarter', 'year']).optional().default('week').describe("Período de análisis"),
      compareWithPrevious: z.boolean().optional().default(true).describe("Comparar con período anterior"),
      includeHourlyBreakdown: z.boolean().optional().default(false).describe("Incluir breakdown por horas del día")
    })
  }
);

// ===== REPORT GENERATION TOOLS =====

export const createGenerateChatbotReportTool = (context: ToolContext) => tool(
  async ({ format, includeMetrics }) => {
    const { handleGenerateChatbotReport } = await import('./handlers/generate-chatbot-report');
    const result = await handleGenerateChatbotReport({ format, includeMetrics }, context);

    // Si fue exitoso, retornar estructura con datos de descarga
    if (result.success && result.data) {
      return `✅ **Reporte generado exitosamente**

📊 **Resumen:**
• Chatbots analizados: **${result.data.chatbotsCount}**
• Total conversaciones: **${result.data.totalConversations}**
• Total mensajes: **${result.data.totalMessages}**
• Tamaño del archivo: **${result.data.size}**

📥 **[DESCARGAR REPORTE PDF →](${result.data.downloadUrl})**

⏱️ El enlace expira en ${result.data.expiresIn}. Descárgalo ahora para guardarlo.`;
    }

    return result.message;
  },
  {
    name: "generate_chatbot_report",
    description: `Genera un archivo PDF descargable con la lista completa de chatbots del usuario y sus métricas detalladas.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pide explícitamente: "genera un reporte", "dame un PDF", "quiero un documento", "exporta mis chatbots"
- Usuario pregunta: "¿puedes darme un resumen descargable?", "quiero ver mis stats en PDF"
- Frases clave: reporte, PDF, archivo, documento, descarga, export, exportar

**QUÉ GENERA:**
- Archivo PDF profesional descargable
- Lista de todos los chatbots con nombres, fechas de creación, conversaciones
- Métricas agregadas: totales, promedios, estadísticas generales
- Válido por 5 minutos (one-time download)

**IMPORTANTE:** Después de generar el reporte, SIEMPRE retorna el link de descarga en formato markdown para que sea clicable.`,
    parameters: z.object({
      format: z.enum(['pdf']).optional().default('pdf').describe("Formato del reporte (actualmente solo PDF)"),
      includeMetrics: z.boolean().optional().default(true).describe("Incluir métricas agregadas (totales, promedios)")
    })
  }
);

// ===== WHATSAPP TOOLS - DEPRECADO =====
// Composio WhatsApp fue eliminado - usar WhatsAppSDKService directo

// ===== GMAIL TOOLS (COMPOSIO INTEGRATION) =====

export const createSendGmailTool = (context: ToolContext) => tool(
  async ({ recipient_email, subject, body, cc, bcc, is_html, chatbotId }) => {
    const { sendGmailHandler } = await import('./handlers/gmail');
    const result = await sendGmailHandler({ recipient_email, subject, body, cc, bcc, is_html, chatbotId }, context);
    return result.message;
  },
  {
    name: "send_gmail",
    description: `Enviar email usando la cuenta de Gmail del usuario conectada al chatbot.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pide explícitamente: "envía un email", "manda un correo", "escribe un email a"
- Usuario proporciona destinatario y contenido del mensaje
- Frases clave: enviar email, mandar correo, escribir email, contactar por email, enviar por Gmail

**REQUISITOS:**
- El chatbot debe tener Gmail conectado vía Composio OAuth2
- Usuario debe haber autorizado acceso a Gmail (OAuth)
- Al menos un destinatario (recipient_email, cc, o bcc)
- Al menos subject O body debe estar presente

**IMPORTANTE:**
- SOLO funciona si el chatbot tiene integración de Gmail activa
- El email se envía desde la cuenta de Gmail del usuario que autorizó
- Si usa HTML, debe especificar is_html: true
- Si el usuario no tiene Gmail configurado, orientarlo a la sección de Integraciones`,
    parameters: z.object({
      recipient_email: z.string().describe("Email del destinatario principal (ej: usuario@example.com)"),
      subject: z.string().optional().describe("Asunto del email"),
      body: z.string().optional().describe("Contenido del email (texto plano o HTML)"),
      cc: z.array(z.string()).optional().describe("Lista de emails en copia (CC)"),
      bcc: z.array(z.string()).optional().describe("Lista de emails en copia oculta (BCC)"),
      is_html: z.boolean().optional().default(false).describe("true si el body contiene HTML, false para texto plano"),
      chatbotId: z.string().optional().describe("ID del chatbot (solo para Ghosty enviando en nombre de otros chatbots)")
    })
  }
);

export const createReadGmailTool = (context: ToolContext) => tool(
  async ({ query, max_results, label_ids, chatbotId }) => {
    const { readGmailHandler } = await import('./handlers/gmail');
    const result = await readGmailHandler({ query, max_results, label_ids, chatbotId }, context);
    return result.message;
  },
  {
    name: "read_gmail",
    description: `Leer y buscar emails en la cuenta de Gmail del usuario.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pregunta: "mis últimos emails", "busca emails de", "revisa mi Gmail", "qué emails tengo"
- Usuario quiere buscar: "emails sobre [tema]", "mensajes de [persona]", "correos recientes"
- Frases clave: leer Gmail, buscar emails, revisar correo, últimos mensajes, inbox

**BÚSQUEDAS SOPORTADAS:**
- Por remitente: "from:usuario@example.com"
- Por asunto: "subject:importante"
- Por contenido: cualquier palabra clave
- Combinaciones: "from:juan subject:reunión"

**ETIQUETAS COMUNES:**
- INBOX: Bandeja de entrada (default)
- SENT: Emails enviados
- SPAM: Correo no deseado
- TRASH: Papelera
- UNREAD: No leídos

**QUÉ RETORNA:**
- Lista de emails con remitente, asunto y preview
- Máximo 10 emails por búsqueda
- Ordenados por fecha (más recientes primero)`,
    parameters: z.object({
      query: z.string().optional().describe("Búsqueda (ej: 'from:juan@example.com', 'subject:importante', 'reunión')"),
      max_results: z.number().optional().default(5).describe("Número de emails a retornar (máximo 10)"),
      label_ids: z.array(z.string()).optional().describe("Etiquetas a filtrar (ej: ['INBOX', 'UNREAD'])"),
      chatbotId: z.string().optional().describe("ID del chatbot (solo para Ghosty)")
    })
  }
);

/**
 * Función para obtener tools según plan del usuario con context injection
 * Plan-aware tool selection funcional
 *
 * @param userPlan - Plan del usuario visitante (puede ser ANONYMOUS)
 * @param integrations - Integraciones activas del chatbot
 * @param context - Contexto de ejecución del tool
 * @param chatbotOwnerPlan - Plan del dueño del chatbot (para usuarios anónimos)
 */
export const getToolsForPlan = (
  userPlan: string,
  integrations: Record<string, any> = {},
  context: ToolContext,
  chatbotOwnerPlan?: string // ✅ NUEVO: Plan del dueño del chatbot
) => {
  // 🎯 Para usuarios anónimos, usar el plan del DUEÑO del chatbot
  const effectivePlan = userPlan === 'ANONYMOUS' && chatbotOwnerPlan
    ? chatbotOwnerPlan
    : userPlan;


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

  // Formmy Plan Payment - SOLO para Ghosty, disponible para TODOS los planes
  // Permite a cualquier usuario generar links de pago para upgrade/planes
  if (context.isGhosty) {
    tools.push(createFormmyPlanPaymentTool(context));
  }

  // Payment tools (usuario cobra a SUS clientes) - PENDIENTE IMPLEMENTACIÓN
  // Solo para chatbots públicos con plan PRO+ y Stripe configurado
  if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(effectivePlan) && integrations.stripe) {
    tools.push(createPaymentLinkTool(context));
  }

  // Contact tools - disponibles para chatbots públicos ANONYMOUS/STARTER+
  // ❌ Ghosty NO necesita esto (usuario ya autenticado)
  const shouldHaveSaveContact = !context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(effectivePlan);
  console.error(`[DEBUG save_contact_info] shouldHave: ${shouldHaveSaveContact}, isGhosty: ${context.isGhosty}, effectivePlan: ${effectivePlan}`);

  if (shouldHaveSaveContact) {
    tools.push(createSaveContactTool(context));
    console.error(`✅ [DEBUG] save_contact_info AGREGADO a tools`);
  } else {
    console.error(`❌ [DEBUG] save_contact_info NO agregado - Razón: isGhosty=${context.isGhosty}, plan=${effectivePlan}`);
  }

  // DateTime tools - disponibles para chatbots públicos ANONYMOUS/STARTER+
  // ❌ Ghosty NO necesita esto (no requiere fecha/hora para sus tareas)
  if (!context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(effectivePlan)) {
    tools.push(createGetCurrentDateTimeTool(context));
  }

  // Google Search tools - disponibles para chatbots públicos ANONYMOUS/STARTER+ con API configurada
  // ❌ Ghosty NO necesita esto (ya conoce toda la info de Formmy)
  if (!context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(effectivePlan) &&
      process.env.GOOGLE_SEARCH_API_KEY &&
      process.env.GOOGLE_SEARCH_ENGINE_ID) {
    tools.push(createGoogleSearchTool(context));
  }

  // Context Search (RAG) - ✅ DISPONIBLE PARA TODOS LOS CHATBOTS
  // Requiere vector search index en MongoDB Atlas
  // Nota: FREE/STARTER pueden generar embeddings vía Parser API (pagan créditos)
  // Una vez generados, DEBEN poder consultarlos. RAG es feature core de Formmy.
  if (context.chatbotId) {
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

  // Report generation tools - SOLO para Ghosty (reportes privados del usuario)
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(
      createGenerateChatbotReportTool(context)
    );
  }

  // WhatsApp tools - DEPRECADO (Composio WhatsApp eliminado)
  // WhatsApp ahora usa WhatsAppSDKService directo sin Composio

  // Gmail tools - Para chatbots públicos con Gmail conectado vía OAuth2
  // Ghosty puede enviar/leer Gmail en nombre de chatbots del usuario
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(
      createSendGmailTool(context),
      createReadGmailTool(context)
    );
  } else if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(effectivePlan) && integrations.gmail) {
    tools.push(
      createSendGmailTool(context),
      createReadGmailTool(context)
    );
  }

  const toolNames = tools.map((t: any) => t?.metadata?.name || t?.name || "unknown");

  console.error(`\n🛠️🛠️🛠️  [getToolsForPlan] ${tools.length} TOOLS FINALES:\n`);
  console.error(`   userPlan: ${userPlan}`);
  console.error(`   effectivePlan: ${effectivePlan}`);
  console.error(`   chatbotOwnerPlan: ${chatbotOwnerPlan || 'N/A'}`);
  console.error(`   context.chatbotId: ${context.chatbotId || 'NULL'}`);
  console.error(`   context.isGhosty: ${context.isGhosty}`);
  console.error(`\n   Tools: ${toolNames.join(', ')}\n`);
  console.error(`   search_context incluido: ${toolNames.includes('search_context') ? '✅ SÍ' : '❌ NO'}\n\n`);

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
  'create_formmy_plan_payment', // Tool para planes de Formmy
  'create_payment_link', // Pendiente: para chatbots del usuario
  'save_contact_info',
  'get_usage_limits',
  'query_chatbots',
  'get_chatbot_stats',
  'get_current_datetime',
  'web_search_google',
  'search_context',
  'generate_chatbot_report',
  // WhatsApp tools DEPRECADO - Composio eliminado
  'send_gmail', // Gmail via Composio OAuth2
  'read_gmail' // Gmail via Composio OAuth2
];