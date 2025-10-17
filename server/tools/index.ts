/**
 * LlamaIndex Native Tools - Zero Registry, Pure Functional
 * Siguiendo patterns oficiales de LlamaIndex TypeScript
 */

import { tool } from "llamaindex";
import { z } from "zod";

// ===== TOOL CONTEXT TYPE (imported from types.ts) =====
export type { ToolContext, ToolResponse } from './types';

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
• **STARTER** - $149 MXN/mes: 2 chatbots, 50 conversaciones, 200 créditos
• **PRO** - $499 MXN/mes: 10 chatbots, 250 conversaciones, 1000 créditos
• **ENTERPRISE** - $1,499 MXN/mes: Chatbots ilimitados, 1000 conversaciones, 5000 créditos

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
  async ({ name, email, phone, company, position, website, notes }) => {
    const { saveContactInfoHandler } = await import('./handlers/contact');
    const result = await saveContactInfoHandler({ name, email, phone, company, position, website, notes }, context);
    return result.message;
  },
  {
    name: "save_contact_info",
    description: "⚠️ SOLO usar cuando el usuario EXPLÍCITAMENTE diga 'guarda mi email', 'anota mi teléfono', etc. y proporcione datos de contacto reales. NO usar para solicitudes de información, planes, o pagos. NO inventar datos. Requiere email O phone válido proporcionado por el usuario.",
    parameters: z.object({
      name: z.string().optional().describe("Nombre completo proporcionado por el usuario"),
      email: z.string().optional().describe("Email REAL proporcionado por el usuario - REQUERIDO si no hay phone"),
      phone: z.string().optional().describe("Teléfono REAL proporcionado por el usuario - REQUERIDO si no hay email"),
      company: z.string().optional().describe("Empresa mencionada por el usuario"),
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

// ===== WHATSAPP TOOLS (COMPOSIO INTEGRATION) =====

export const createSendWhatsAppMessageTool = (context: ToolContext) => tool(
  async ({ phoneNumber, message, chatbotId }) => {
    const { sendWhatsAppMessageHandler } = await import('./handlers/whatsapp');
    const result = await sendWhatsAppMessageHandler({ phoneNumber, message, chatbotId }, context);
    return result.message;
  },
  {
    name: "send_whatsapp_message",
    description: `Enviar mensaje de texto por WhatsApp a un número específico.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pide explícitamente: "envía un WhatsApp", "manda mensaje por WhatsApp", "contacta por WhatsApp"
- Usuario proporciona número de teléfono y mensaje
- Frases clave: WhatsApp, enviar mensaje, mandar WhatsApp, contactar por WhatsApp

**REQUISITOS:**
- El chatbot debe tener WhatsApp conectado vía Composio
- Número en formato internacional (ej: +52 1234567890)
- El destinatario debe haber enviado el primer mensaje (restricción de WhatsApp Business)

**IMPORTANTE:**
- SOLO funciona si el chatbot tiene integración de WhatsApp activa
- Si el usuario no tiene WhatsApp configurado, orientarlo a la sección de Integraciones`,
    parameters: z.object({
      phoneNumber: z.string().describe("Número de teléfono con código de país (ej: +52 1234567890, +1 4155551234)"),
      message: z.string().describe("Contenido del mensaje a enviar"),
      chatbotId: z.string().optional().describe("ID del chatbot (solo para Ghosty enviando en nombre de otros chatbots)")
    })
  }
);

export const createListWhatsAppConversationsTool = (context: ToolContext) => tool(
  async ({ limit, chatbotId }) => {
    const { listWhatsAppConversationsHandler } = await import('./handlers/whatsapp');
    const result = await listWhatsAppConversationsHandler({ limit, chatbotId }, context);
    return result.message;
  },
  {
    name: "list_whatsapp_conversations",
    description: `Listar conversaciones recientes de WhatsApp del chatbot.

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pregunta: "mis conversaciones de WhatsApp", "chats de WhatsApp", "últimos mensajes de WhatsApp"
- Usuario quiere revisar actividad de WhatsApp
- Frases clave: conversaciones WhatsApp, chats WhatsApp, mensajes WhatsApp, lista WhatsApp

**QUÉ RETORNA:**
- Lista de conversaciones recientes ordenadas por última actividad
- Nombre/teléfono del contacto
- Preview del último mensaje
- Timestamp relativo (ej: "2h", "3d")`,
    parameters: z.object({
      limit: z.number().optional().default(10).describe("Número de conversaciones a listar (máximo 20)"),
      chatbotId: z.string().optional().describe("ID del chatbot (solo para Ghosty)")
    })
  }
);

export const createGetWhatsAppStatsTool = (context: ToolContext) => tool(
  async ({ chatbotId, period }) => {
    const { getWhatsAppStatsHandler } = await import('./handlers/whatsapp');
    const result = await getWhatsAppStatsHandler({ chatbotId, period }, context);
    return result.message;
  },
  {
    name: "get_whatsapp_stats",
    description: `Obtener estadísticas de WhatsApp del chatbot (conversaciones, mensajes, actividad).

**CUÁNDO USAR ESTA HERRAMIENTA:**
- Usuario pregunta: "estadísticas de WhatsApp", "cuántos mensajes de WhatsApp", "actividad de WhatsApp"
- Usuario quiere métricas: "rendimiento WhatsApp", "analytics WhatsApp"
- Frases clave: stats WhatsApp, estadísticas WhatsApp, métricas WhatsApp, analytics WhatsApp

**PERÍODOS DISPONIBLES:**
- 'week': Última semana (default)
- 'month': Último mes
- 'all': Desde el inicio

**QUÉ RETORNA:**
- Total de conversaciones y mensajes
- Conversaciones activas en últimas 24h
- Promedio de mensajes por conversación`,
    parameters: z.object({
      chatbotId: z.string().optional().describe("ID del chatbot (solo para Ghosty)"),
      period: z.enum(['week', 'month', 'all']).optional().default('week').describe("Período de análisis")
    })
  }
);

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
 */
export const getToolsForPlan = (
  userPlan: string,
  integrations: Record<string, any> = {},
  context: ToolContext
) => {
  console.log(`\n${'🔧'.repeat(40)}`);
  console.log(`🔧 [getToolsForPlan] CONSTRUYENDO TOOLS`);
  console.log(`   context.isGhosty: ${context.isGhosty}`);
  console.log(`   context.chatbotId: ${context.chatbotId}`);
  console.log(`   userPlan: ${userPlan}`);
  console.log(`${'🔧'.repeat(40)}\n`);

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
  if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.stripe) {
    tools.push(createPaymentLinkTool(context));
  }

  // Contact tools - disponibles para chatbots públicos ANONYMOUS/STARTER+
  // ❌ Ghosty NO necesita esto (usuario ya autenticado)
  if (!context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(createSaveContactTool(context));
  }

  // DateTime tools - disponibles para chatbots públicos ANONYMOUS/STARTER+
  // ❌ Ghosty NO necesita esto (no requiere fecha/hora para sus tareas)
  if (!context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push(createGetCurrentDateTimeTool(context));
  }

  // Google Search tools - disponibles para chatbots públicos ANONYMOUS/STARTER+ con API configurada
  // ❌ Ghosty NO necesita esto (ya conoce toda la info de Formmy)
  if (!context.isGhosty && ['ANONYMOUS', 'STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) &&
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

  // Report generation tools - SOLO para Ghosty (reportes privados del usuario)
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    console.log("📄 [getToolsForPlan] Agregando generate_chatbot_report tool");
    tools.push(
      createGenerateChatbotReportTool(context)
    );
  }

  // WhatsApp tools - SOLO para chatbots públicos (NO Ghosty) con PRO/ENTERPRISE/TRIAL y WhatsApp conectado
  // Ghosty puede enviar WhatsApp en nombre de chatbots del usuario
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    console.log("📱 [getToolsForPlan] Agregando WhatsApp tools para Ghosty");
    tools.push(
      createSendWhatsAppMessageTool(context),
      createListWhatsAppConversationsTool(context),
      createGetWhatsAppStatsTool(context)
    );
  } else if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.whatsapp) {
    console.log("📱 [getToolsForPlan] Agregando WhatsApp tools para chatbot público");
    tools.push(
      createSendWhatsAppMessageTool(context),
      createListWhatsAppConversationsTool(context)
    );
  }

  // Gmail tools - Para chatbots públicos con Gmail conectado vía OAuth2
  // Ghosty puede enviar/leer Gmail en nombre de chatbots del usuario
  if (context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    console.log("📧 [getToolsForPlan] Agregando Gmail tools para Ghosty");
    tools.push(
      createSendGmailTool(context),
      createReadGmailTool(context)
    );
  } else if (!context.isGhosty && ['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan) && integrations.gmail) {
    console.log("📧 [getToolsForPlan] Agregando Gmail tools para chatbot público");
    tools.push(
      createSendGmailTool(context),
      createReadGmailTool(context)
    );
  }

  const toolNames = tools.map((t: any) => t?.metadata?.name || t?.name || "unknown");
  console.log(`🛠️  [getToolsForPlan] ${tools.length} tools disponibles para ${userPlan}:`, toolNames);

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
  'create_formmy_plan_payment', // 🆕 Tool para planes de Formmy
  'create_payment_link', // Pendiente: para chatbots del usuario
  'save_contact_info',
  'get_usage_limits',
  'query_chatbots',
  'get_chatbot_stats',
  'get_current_datetime',
  'web_search_google',
  'search_context',
  'generate_chatbot_report',
  'send_whatsapp_message', // 🆕 WhatsApp via Composio
  'list_whatsapp_conversations', // 🆕 WhatsApp via Composio
  'get_whatsapp_stats', // 🆕 WhatsApp via Composio
  'send_gmail', // 🆕 Gmail via Composio OAuth2
  'read_gmail' // 🆕 Gmail via Composio OAuth2
];