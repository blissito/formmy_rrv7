/**
 * Gmail Tool Handlers - Composio Integration
 * Integración oficial de Gmail vía Composio para agentes
 */

import type { ToolContext, ToolResponse } from "../types";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";
import { Composio } from "@composio/core";

/**
 * Helper para obtener entityId basado en chatbot
 * Cada chatbot tiene su propia "entity" en Composio para aislar conexiones
 */
function getEntityId(chatbotId: string | null): string {
  if (!chatbotId) {
    throw new Error("No chatbotId provided for Gmail integration");
  }
  return `chatbot_${chatbotId}`;
}

/**
 * Handler: Enviar email vía Gmail
 * Requiere que el chatbot tenga Gmail conectado vía Composio OAuth2
 */
export async function sendGmailHandler(
  input: {
    recipient_email: string;
    subject?: string;
    body?: string;
    cc?: string[];
    bcc?: string[];
    is_html?: boolean;
    chatbotId?: string; // Para Ghosty que puede enviar en nombre de otros chatbots
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { recipient_email, subject, body, cc, bcc, is_html, chatbotId } = input;

  // Validaciones
  if (!recipient_email) {
    return {
      success: false,
      message: "❌ Error: Se requiere el email del destinatario (recipient_email)"
    };
  }

  if (!subject && !body) {
    return {
      success: false,
      message: "❌ Error: Se requiere al menos un subject o body"
    };
  }

  try {
    // Verificar API key de Composio
    if (!process.env.COMPOSIO_API_KEY) {
      return {
        success: false,
        message: "⚠️ Gmail no está configurado. Contacta al administrador."
      };
    }

    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && chatbotId ? chatbotId : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: "❌ Error: No se pudo determinar el chatbot para Gmail"
      };
    }

    const entityId = getEntityId(targetChatbotId);

    // Inicializar Composio
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

    // Verificar que el chatbot tenga Gmail conectado
    const connections = await composio.connectedAccounts.list({
      userIds: [entityId],
      toolkitSlugs: ['gmail'],
    });

    if (connections.items && connections.items.length > 0) {
    }

    // ✅ MÉTODO CORRECTO según docs oficiales de Composio
    // Buscar conexión ACTIVE (no disabled) que coincida con toolkit 'gmail'
    const gmailConnection = connections.items.find(
      (conn: any) =>
        conn.status === 'ACTIVE' &&
        !conn.is_disabled &&
        conn.toolkit?.slug === 'gmail'
    );

    // Fallback: Si toolkitSlugs ya filtró, tomar primera ACTIVE no disabled
    const finalConnection = gmailConnection || connections.items.find(
      (conn: any) => conn.status === 'ACTIVE' && !conn.is_disabled
    );

    if (!finalConnection) {
      return {
        success: false,
        message: "🔐 Gmail no está conectado para este chatbot. Conéctalo desde tu dashboard en la sección de Integraciones."
      };
    }


    // Ejecutar tool de Composio para enviar email
    const result = await composio.tools.execute(
      'GMAIL_SEND_EMAIL',
      {
        userId: entityId,
        arguments: {
          recipient_email,
          subject: subject || '',
          body: body || '',
          cc: cc || [],
          bcc: bcc || [],
          is_html: is_html || false,
        }
      }
    );

    // Extraer datos de result.data
    const responseData = (result as any).data;
    const successful = (result as any).successful;

    if (!successful) {
      const errorMsg = (result as any).error || 'Error desconocido al enviar email';

      // Track error
      if (context.conversationId) {
        ToolUsageTracker.trackUsage({
          chatbotId: targetChatbotId,
          conversationId: context.conversationId,
          toolName: 'send_gmail',
          success: false,
          errorMessage: errorMsg,
          userMessage: context.message,
          metadata: { recipient_email, subject }
        }).catch(() => {});
      }

      return {
        success: false,
        message: `❌ Error al enviar email: ${errorMsg}`
      };
    }

    // Track success
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: targetChatbotId,
        conversationId: context.conversationId,
        toolName: 'send_gmail',
        success: true,
        userMessage: context.message,
        metadata: {
          recipient_email,
          subject,
          bodyLength: body?.length || 0,
          hasCC: (cc && cc.length > 0),
          hasBCC: (bcc && bcc.length > 0),
        }
      }).catch(() => {});
    }

    // Obtener nombre del chatbot para el mensaje
    const { db } = await import("~/utils/db.server");
    const chatbot = await db.chatbot.findUnique({
      where: { id: targetChatbotId },
      select: { name: true }
    });

    return {
      success: true,
      message: `✅ **Email enviado exitosamente**\n\n📧 Para: ${recipient_email}\n📝 Asunto: ${subject || '(Sin asunto)'}\n✉️ Cuerpo: ${body ? `${body.substring(0, 100)}${body.length > 100 ? '...' : ''}` : '(Sin cuerpo)'}${chatbot?.name ? `\n\n📤 Desde: ${chatbot.name}` : ''}`,
      data: {
        recipient_email,
        subject,
        chatbotName: chatbot?.name
      }
    };

  } catch (error: any) {
    // Manejo de errores OAuth
    if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
      return {
        success: false,
        message: '🔐 Necesitas conectar Gmail primero. Ve a Integraciones en tu dashboard.'
      };
    }

    // Track error
    if (context.conversationId && context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        conversationId: context.conversationId,
        toolName: 'send_gmail',
        success: false,
        errorMessage: error.message || 'Unknown error',
        userMessage: context.message,
        metadata: { recipient_email }
      }).catch(() => {});
    }

    return {
      success: false,
      message: `❌ Error: ${error.message || 'Error desconocido al enviar email'}`
    };
  }
}

/**
 * Handler: Leer emails recientes de Gmail
 * Útil para que el agente pueda buscar información en emails
 */
export async function readGmailHandler(
  input: {
    query?: string;
    max_results?: number;
    label_ids?: string[];
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { query, max_results = 5, label_ids, chatbotId } = input;

  try {
    // Verificar API key de Composio
    if (!process.env.COMPOSIO_API_KEY) {
      return {
        success: false,
        message: "⚠️ Gmail no está configurado. Contacta al administrador."
      };
    }

    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && chatbotId ? chatbotId : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: "❌ Error: No se pudo determinar el chatbot para Gmail"
      };
    }

    const entityId = getEntityId(targetChatbotId);

    // Inicializar Composio
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

    // Verificar conexión
    const connections = await composio.connectedAccounts.list({
      userIds: [entityId],
      toolkitSlugs: ['gmail'],
    });


    // ✅ MÉTODO CORRECTO según docs oficiales de Composio
    // Buscar conexión ACTIVE (no disabled) que coincida con toolkit 'gmail'
    const gmailConnection = connections.items.find(
      (conn: any) =>
        conn.status === 'ACTIVE' &&
        !conn.is_disabled &&
        conn.toolkit?.slug === 'gmail'
    );

    // Fallback: Si toolkitSlugs ya filtró, tomar primera ACTIVE no disabled
    const finalConnection = gmailConnection || connections.items.find(
      (conn: any) => conn.status === 'ACTIVE' && !conn.is_disabled
    );

    if (!finalConnection) {
      return {
        success: false,
        message: "🔐 Gmail no está conectado para este chatbot. Conéctalo desde tu dashboard."
      };
    }


    // Ejecutar tool de Composio para leer emails
    const result = await composio.tools.execute(
      'GMAIL_FETCH_EMAILS',
      {
        userId: entityId,
        arguments: {
          query: query || '',
          max_results: Math.min(max_results, 10), // Max 10 emails
          label_ids: label_ids || ['INBOX'],
          include_payload: true,
          verbose: true,
        }
      }
    );

    const responseData = (result as any).data;
    const successful = (result as any).successful;

    if (!successful) {
      const errorMsg = (result as any).error || 'Error desconocido al leer emails';
      return {
        success: false,
        message: `❌ Error al leer emails: ${errorMsg}`
      };
    }

    const messages = responseData?.messages || [];

    if (messages.length === 0) {
      return {
        success: true,
        message: "📭 No se encontraron emails con los criterios especificados.",
        data: { emails: [] }
      };
    }

    // Formatear respuesta
    const emailList = messages.map((msg: any, i: number) => {
      const headers = msg.payload?.headers || [];
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Desconocido';
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sin asunto)';
      const snippet = msg.snippet || '';

      return `${i + 1}. **De:** ${from}\n   **Asunto:** ${subject}\n   **Vista previa:** ${snippet.substring(0, 80)}${snippet.length > 80 ? '...' : ''}`;
    }).join('\n\n');

    // Track usage
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: targetChatbotId,
        conversationId: context.conversationId,
        toolName: 'read_gmail',
        success: true,
        userMessage: context.message,
        metadata: { emailsFound: messages.length, query, max_results }
      }).catch(() => {});
    }

    return {
      success: true,
      message: `📬 **Emails encontrados** (${messages.length}):\n\n${emailList}`,
      data: {
        emails: messages.map((m: any) => ({
          id: m.id,
          threadId: m.threadId,
          snippet: m.snippet,
          headers: m.payload?.headers,
        }))
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `❌ Error al leer emails: ${error.message || 'Error desconocido'}`
    };
  }
}
