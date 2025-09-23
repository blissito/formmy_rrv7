/**
 * Chatbot Stats Handler - Métricas detalladas de conversaciones
 * Para Ghosty Tools System
 */

import { db } from "~/utils/db.server";
import type { ToolContext } from '../index';

interface GetChatbotStatsParams {
  chatbotId?: string;
  period?: 'week' | 'month' | 'quarter' | 'year';
  compareWithPrevious?: boolean;
  includeHourlyBreakdown?: boolean;
}

export const getChatbotStatsHandler = async (
  params: GetChatbotStatsParams,
  context: ToolContext
) => {
  const { userId } = context;
  const {
    chatbotId,
    period = 'week',
    compareWithPrevious = true,
    includeHourlyBreakdown = false
  } = params;

  try {
    // Calcular fechas del período
    const now = new Date();
    const periodDays = { week: 7, month: 30, quarter: 90, year: 365 }[period];

    const currentPeriodStart = new Date();
    currentPeriodStart.setDate(now.getDate() - periodDays);

    const previousPeriodStart = new Date();
    previousPeriodStart.setDate(currentPeriodStart.getDate() - periodDays);
    const previousPeriodEnd = currentPeriodStart;

    // Build query - si no hay chatbotId específico, obtener todos del usuario
    const whereClause: any = chatbotId
      ? { chatbotId, chatbot: { userId } }
      : { chatbot: { userId } };

    // Conversaciones del período actual
    const currentConversations = await db.conversation.findMany({
      where: {
        ...whereClause,
        startedAt: {
          gte: currentPeriodStart,
          lte: now
        }
      },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            createdAt: true,
            tokens: true
          }
        },
        chatbot: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    // Conversaciones del período anterior (para comparación)
    const previousConversations = compareWithPrevious ? await db.conversation.findMany({
      where: {
        ...whereClause,
        startedAt: {
          gte: previousPeriodStart,
          lt: previousPeriodEnd
        }
      },
      include: {
        messages: {
          select: {
            id: true,
            role: true,
            tokens: true
          }
        }
      }
    }) : [];

    // Procesar estadísticas del período actual
    const processStats = (conversations: any[]) => {
      const totalConversations = conversations.length;
      const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
      const totalTokens = conversations.reduce((sum, conv) =>
        sum + conv.messages.reduce((msgSum: number, msg: any) => msgSum + (msg.tokens || 0), 0), 0
      );

      const completedConversations = conversations.filter(conv => conv.status === 'COMPLETED').length;
      const avgMessagesPerConv = totalConversations > 0 ? Math.round((totalMessages / totalConversations) * 10) / 10 : 0;
      const completionRate = totalConversations > 0 ? Math.round((completedConversations / totalConversations) * 100) : 0;

      // Análisis por chatbot (si no hay chatbotId específico y chatbot está incluido)
      const byBot = conversations.reduce((acc: any, conv) => {
        // Defensive check - solo procesar si chatbot está incluido
        if (!conv.chatbot?.id) {
          return acc;
        }

        const botId = conv.chatbot.id;
        if (!acc[botId]) {
          acc[botId] = {
            name: conv.chatbot.name,
            slug: conv.chatbot.slug,
            conversations: 0,
            messages: 0,
            tokens: 0
          };
        }
        acc[botId].conversations++;
        acc[botId].messages += conv.messages.length;
        acc[botId].tokens += conv.messages.reduce((sum: number, msg: any) => sum + (msg.tokens || 0), 0);
        return acc;
      }, {});

      return {
        totalConversations,
        totalMessages,
        totalTokens,
        completedConversations,
        avgMessagesPerConv,
        completionRate,
        byBot: Object.values(byBot)
      };
    };

    const currentStats = processStats(currentConversations);
    const previousStats = compareWithPrevious ? processStats(previousConversations) : null;

    // Calcular cambios porcentuales
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Breakdown por horas (solo si se solicita)
    const hourlyBreakdown = includeHourlyBreakdown ?
      currentConversations.reduce((acc: any, conv) => {
        const hour = new Date(conv.startedAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {}) : null;

    // Generar reporte textual
    const periodLabel = { week: 'esta semana', month: 'este mes', quarter: 'este trimestre', year: 'este año' }[period];
    const periodLabelPrev = { week: 'semana anterior', month: 'mes anterior', quarter: 'trimestre anterior', year: 'año anterior' }[period];

    let report = `📊 **Estadísticas ${periodLabel}**:\n`;
    report += `• ${currentStats.totalConversations} conversaciones (${currentStats.totalMessages} mensajes)\n`;
    report += `• ${currentStats.completionRate}% de conversaciones completadas\n`;
    report += `• Promedio: ${currentStats.avgMessagesPerConv} mensajes por conversación\n`;
    report += `• ${currentStats.totalTokens.toLocaleString()} tokens consumidos\n`;

    if (compareWithPrevious && previousStats) {
      const convChange = calculateChange(currentStats.totalConversations, previousStats.totalConversations);
      const msgChange = calculateChange(currentStats.totalMessages, previousStats.totalMessages);
      const tokenChange = calculateChange(currentStats.totalTokens, previousStats.totalTokens);

      report += `\n📈 **Comparación con ${periodLabelPrev}**:\n`;
      report += `• Conversaciones: ${convChange > 0 ? '+' : ''}${convChange}%\n`;
      report += `• Mensajes: ${msgChange > 0 ? '+' : ''}${msgChange}%\n`;
      report += `• Tokens: ${tokenChange > 0 ? '+' : ''}${tokenChange}%\n`;
    }

    // Stats por chatbot (si hay múltiples)
    if (!chatbotId && (currentStats.byBot as any[]).length > 1) {
      report += `\n🤖 **Por chatbot**:\n`;
      (currentStats.byBot as any[])
        .sort((a, b) => b.conversations - a.conversations)
        .slice(0, 5)
        .forEach(bot => {
          report += `• **${bot.name}**: ${bot.conversations} conv., ${bot.messages} msgs\n`;
        });
    }

    // Insights automáticos
    if (currentStats.completionRate < 70) {
      report += `\n💡 **Insight**: Tasa de finalización baja (${currentStats.completionRate}%). Considera revisar el flujo conversacional.`;
    }
    if (currentStats.avgMessagesPerConv > 15) {
      report += `\n💡 **Insight**: Conversaciones largas (${currentStats.avgMessagesPerConv} msgs/conv). Podrías optimizar respuestas más directas.`;
    }

    return {
      success: true,
      message: report,
      data: {
        period,
        current: currentStats,
        previous: previousStats,
        changes: previousStats ? {
          conversations: calculateChange(currentStats.totalConversations, previousStats.totalConversations),
          messages: calculateChange(currentStats.totalMessages, previousStats.totalMessages),
          tokens: calculateChange(currentStats.totalTokens, previousStats.totalTokens)
        } : null,
        hourlyBreakdown
      }
    };

  } catch (error) {
    console.error('❌ Error getting chatbot stats:', error);
    return {
      success: false,
      message: `Error obteniendo estadísticas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      data: null
    };
  }
};