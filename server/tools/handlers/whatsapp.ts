/**
 * WhatsApp Tool Handlers - Composio Integration
 * Integración oficial de WhatsApp vía Composio para agentes
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
    throw new Error("No chatbotId provided for WhatsApp integration");
  }
  return `chatbot_${chatbotId}`;
}

/**
 * Handler: Enviar mensaje de WhatsApp
 * Requiere que el chatbot tenga WhatsApp conectado vía Composio
 */
export async function sendWhatsAppMessageHandler(
  input: {
    phoneNumber: string;
    message: string;
    chatbotId?: string; // Para Ghosty que puede enviar en nombre de otros chatbots
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { phoneNumber, message, chatbotId } = input;

  // Validaciones
  if (!phoneNumber || !message) {
    return {
      success: false,
      message: "❌ Error: Se requiere número de teléfono y mensaje"
    };
  }

  try {
    // Verificar API key de Composio
    if (!process.env.COMPOSIO_API_KEY) {
      return {
        success: false,
        message: "⚠️ WhatsApp no está configurado. Contacta al administrador."
      };
    }

    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && chatbotId ? chatbotId : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: "❌ Error: No se pudo determinar el chatbot para WhatsApp"
      };
    }

    const entityId = getEntityId(targetChatbotId);

    // Inicializar Composio
    const composio = new Composio({ apiKey: process.env.COMPOSIO_API_KEY });

    // Verificar que el chatbot tenga WhatsApp conectado
    const connections = await composio.connectedAccounts.list({
      userId: entityId,
    });

    const whatsappConnection = connections.items.find(
      (conn: any) => conn.appName === 'whatsapp' && conn.status === 'ACTIVE'
    );

    if (!whatsappConnection) {
      return {
        success: false,
        message: "🔐 WhatsApp no está conectado para este chatbot. Conéctalo desde tu dashboard en la sección de Integraciones."
      };
    }

    // Obtener phone_number_id del chatbot desde BD
    const { db } = await import("~/utils/db.server");
    const chatbot = await db.chatbot.findUnique({
      where: { id: targetChatbotId },
      select: {
        whatsappConfig: true,
        name: true
      }
    });

    if (!chatbot?.whatsappConfig || !(chatbot.whatsappConfig as any).phoneNumberId) {
      return {
        success: false,
        message: "⚠️ Configuración de WhatsApp incompleta. Verifica el phone_number_id en tu configuración."
      };
    }

    const phoneNumberId = (chatbot.whatsappConfig as any).phoneNumberId;

    // Ejecutar tool de Composio para enviar mensaje
    const result = await composio.tools.execute(
      'WHATSAPP_SEND_MESSAGE',
      {
        userId: entityId,
        arguments: {
          phone_number_id: phoneNumberId,
          to_number: phoneNumber,
          text: message,
          preview_url: true
        }
      }
    );

    // Extraer datos de result.data (no directamente de result)
    const responseData = (result as any).data;
    const successful = (result as any).successful;

    if (!successful) {
      const errorMsg = (result as any).error || 'Error desconocido al enviar mensaje';

      // Track error
      if (context.conversationId) {
        ToolUsageTracker.trackUsage({
          chatbotId: targetChatbotId,
          conversationId: context.conversationId,
          toolName: 'send_whatsapp_message',
          success: false,
          errorMessage: errorMsg,
          userMessage: context.message,
          metadata: { phoneNumber, messageLength: message.length }
        }).catch(() => {});
      }

      return {
        success: false,
        message: `❌ Error al enviar WhatsApp: ${errorMsg}`
      };
    }

    // Track success
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: targetChatbotId,
        conversationId: context.conversationId,
        toolName: 'send_whatsapp_message',
        success: true,
        userMessage: context.message,
        metadata: {
          phoneNumber,
          messageLength: message.length,
          messageId: responseData?.message_id
        }
      }).catch(() => {});
    }

    return {
      success: true,
      message: `✅ **Mensaje de WhatsApp enviado**\n\n📱 Enviado a: ${phoneNumber}\n💬 "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"\n\n${chatbot.name ? `📤 Desde: ${chatbot.name}` : ''}`,
      data: {
        messageId: responseData?.message_id,
        phoneNumber,
        chatbotName: chatbot.name
      }
    };

  } catch (error: any) {
    // Manejo de errores OAuth
    if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
      return {
        success: false,
        message: '🔐 Necesitas conectar WhatsApp primero. Ve a Integraciones en tu dashboard.'
      };
    }

    // Track error
    if (context.conversationId && context.chatbotId) {
      ToolUsageTracker.trackUsage({
        chatbotId: context.chatbotId,
        conversationId: context.conversationId,
        toolName: 'send_whatsapp_message',
        success: false,
        errorMessage: error.message || 'Unknown error',
        userMessage: context.message,
        metadata: { phoneNumber }
      }).catch(() => {});
    }

    return {
      success: false,
      message: `❌ Error: ${error.message || 'Error desconocido al enviar WhatsApp'}`
    };
  }
}

/**
 * Handler: Listar conversaciones de WhatsApp
 * Requiere integración con WhatsApp Business API
 */
export async function listWhatsAppConversationsHandler(
  input: {
    limit?: number;
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { limit = 10, chatbotId } = input;

  try {
    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && chatbotId ? chatbotId : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: "❌ Error: No se pudo determinar el chatbot"
      };
    }

    // Obtener conversaciones de WhatsApp desde BD
    const { db } = await import("~/utils/db.server");

    const conversations = await db.conversation.findMany({
      where: {
        chatbotId: targetChatbotId,
        platform: 'whatsapp'
      },
      take: Math.min(limit, 20),
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (conversations.length === 0) {
      return {
        success: true,
        message: "📭 No hay conversaciones de WhatsApp aún.",
        data: { conversations: [] }
      };
    }

    // Formatear respuesta
    const conversationList = conversations.map((conv, i) => {
      const lastMessage = conv.messages[0];
      const timeAgo = getTimeAgo(conv.updatedAt);
      const preview = lastMessage?.content?.substring(0, 50) || 'Sin mensajes';

      return `${i + 1}. **${conv.name || 'Sin nombre'}**\n   📱 WhatsApp | 🕐 ${timeAgo}\n   💬 "${preview}${lastMessage && lastMessage.content.length > 50 ? '...' : ''}"`;
    }).join('\n\n');

    // Track usage
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: targetChatbotId,
        conversationId: context.conversationId,
        toolName: 'list_whatsapp_conversations',
        success: true,
        userMessage: context.message,
        metadata: { conversationsFound: conversations.length, limit }
      }).catch(() => {});
    }

    return {
      success: true,
      message: `📱 **Conversaciones de WhatsApp** (${conversations.length}):\n\n${conversationList}`,
      data: {
        conversations: conversations.map(c => ({
          id: c.id,
          name: c.name,
          phoneNumber: c.phoneNumber,
          updatedAt: c.updatedAt,
          messageCount: c.messageCount
        }))
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `❌ Error al listar conversaciones: ${error.message || 'Error desconocido'}`
    };
  }
}

/**
 * Handler: Obtener estadísticas de WhatsApp
 * Para Ghosty y análisis de chatbots
 */
export async function getWhatsAppStatsHandler(
  input: {
    chatbotId?: string; // Para Ghosty
    period?: 'week' | 'month' | 'all';
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { chatbotId, period = 'week' } = input;

  try {
    // Determinar qué chatbot usar
    const targetChatbotId = context.isGhosty && chatbotId ? chatbotId : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: "❌ Error: No se pudo determinar el chatbot"
      };
    }

    // Calcular rango de fechas
    const now = new Date();
    const startDate = new Date();

    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'all':
        startDate.setFullYear(2020); // Desde el inicio
        break;
    }

    // Obtener stats desde BD
    const { db } = await import("~/utils/db.server");

    const [totalConversations, totalMessages, activeConversations] = await Promise.all([
      db.conversation.count({
        where: {
          chatbotId: targetChatbotId,
          platform: 'whatsapp',
          createdAt: { gte: startDate }
        }
      }),
      db.message.count({
        where: {
          conversation: {
            chatbotId: targetChatbotId,
            platform: 'whatsapp'
          },
          createdAt: { gte: startDate }
        }
      }),
      db.conversation.count({
        where: {
          chatbotId: targetChatbotId,
          platform: 'whatsapp',
          updatedAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24h
          }
        }
      })
    ]);

    const avgMessagesPerConversation = totalConversations > 0
      ? (totalMessages / totalConversations).toFixed(1)
      : '0';

    const periodLabel = period === 'week' ? 'última semana' : period === 'month' ? 'último mes' : 'total';

    // Track usage
    if (context.conversationId) {
      ToolUsageTracker.trackUsage({
        chatbotId: targetChatbotId,
        conversationId: context.conversationId,
        toolName: 'get_whatsapp_stats',
        success: true,
        userMessage: context.message,
        metadata: { period, totalConversations, totalMessages }
      }).catch(() => {});
    }

    return {
      success: true,
      message: `📊 **Estadísticas de WhatsApp** (${periodLabel}):\n\n` +
        `💬 **Conversaciones totales:** ${totalConversations}\n` +
        `📨 **Mensajes totales:** ${totalMessages}\n` +
        `🔥 **Conversaciones activas (24h):** ${activeConversations}\n` +
        `📈 **Promedio msgs/conversación:** ${avgMessagesPerConversation}`,
      data: {
        period,
        totalConversations,
        totalMessages,
        activeConversations,
        avgMessagesPerConversation: parseFloat(avgMessagesPerConversation)
      }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `❌ Error al obtener estadísticas: ${error.message || 'Error desconocido'}`
    };
  }
}

/**
 * Helper: Calcular tiempo relativo (timeago)
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return new Date(date).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}
