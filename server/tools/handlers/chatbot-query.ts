/**
 * Chatbot Query Handler - Consultar chatbots del usuario con filtros
 * Para Ghosty Tools System
 */

import { db } from "~/utils/db.server";

// TODO: Este tipo se movió - definir localmente o importar de otro lugar
interface ToolContext {
  userId: string;
  chatbotId?: string;
  conversationId?: string;
}

interface QueryChatbotsParams {
  status?: 'all' | 'active' | 'inactive' | 'draft';
  orderBy?: 'name' | 'conversations' | 'created' | 'updated';
  limit?: number;
  includeStats?: boolean;
}

export const queryChatbotsHandler = async (
  params: QueryChatbotsParams,
  context: ToolContext
) => {
  const { userId } = context;
  const {
    status = 'all',
    orderBy = 'updated',
    limit = 10,
    includeStats = true
  } = params;

  try {
    // Build where clause
    const whereClause: any = { userId };

    if (status === 'active') {
      whereClause.isActive = true;
      whereClause.status = 'ACTIVE';
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    } else if (status === 'draft') {
      whereClause.status = 'DRAFT';
    }

    // Build orderBy clause
    let orderByClause: any = { updatedAt: 'desc' };
    if (orderBy === 'name') orderByClause = { name: 'asc' };
    if (orderBy === 'conversations') orderByClause = { conversationCount: 'desc' };
    if (orderBy === 'created') orderByClause = { createdAt: 'desc' };

    // Query chatbots with conversations for stats
    const chatbots = await db.chatbot.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: limit,
      include: {
        conversations: includeStats ? {
          select: {
            id: true,
            messageCount: true,
            startedAt: true,
            endedAt: true,
            status: true
          }
        } : false,
        contexts: {
          select: {
            id: true,
            type: true,
            sizeKB: true
          }
        },
        integrations: {
          select: {
            platform: true,
            isActive: true
          }
        }
      }
    });

    // Process stats if requested
    const processedChatbots = chatbots.map(chatbot => {
      const weeklyConversations = includeStats && chatbot.conversations
        ? chatbot.conversations.filter(conv => {
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(conv.startedAt) >= weekAgo;
          }).length
        : 0;

      const avgMessagesPerConv = includeStats && chatbot.conversations && chatbot.conversations.length > 0
        ? chatbot.conversations.reduce((sum, conv) => sum + conv.messageCount, 0) / chatbot.conversations.length
        : 0;

      const activeIntegrations = chatbot.integrations?.filter(int => int.isActive).length || 0;
      const totalContextSize = chatbot.contexts?.reduce((sum, ctx) => sum + (ctx.sizeKB || 0), 0) || 0;

      return {
        id: chatbot.id,
        name: chatbot.name,
        slug: chatbot.slug,
        description: chatbot.description,
        status: chatbot.status,
        isActive: chatbot.isActive,
        aiModel: chatbot.aiModel,
        totalConversations: chatbot.conversationCount,
        weeklyConversations,
        avgMessagesPerConv: Math.round(avgMessagesPerConv * 10) / 10,
        contextsCount: chatbot.contexts?.length || 0,
        totalContextSizeKB: totalContextSize,
        integrationsCount: activeIntegrations,
        createdAt: chatbot.createdAt,
        updatedAt: chatbot.updatedAt
      };
    });

    // Generate summary
    const totalChatbots = processedChatbots.length;
    const activeChatbots = processedChatbots.filter(c => c.isActive).length;
    const totalWeeklyConversations = processedChatbots.reduce((sum, c) => sum + c.weeklyConversations, 0);
    const avgConversationsPerBot = totalChatbots > 0 ? Math.round((totalWeeklyConversations / totalChatbots) * 10) / 10 : 0;

    const summary = `Encontré ${totalChatbots} chatbots (${activeChatbots} activos). Esta semana: ${totalWeeklyConversations} conversaciones total (promedio ${avgConversationsPerBot} por bot).`;

    // Format for AI consumption
    const botsList = processedChatbots.map(bot =>
      `• **${bot.name}** [ID: ${bot.id}] (${bot.status.toLowerCase()}) - ${bot.weeklyConversations} conv. esta semana, ${bot.totalConversations} total, ${bot.contextsCount} contextos (${bot.totalContextSizeKB}KB), ${bot.integrationsCount} integraciones activas`
    ).join('\n');

    const result = `${summary}\n\n**Chatbots detallados:**\n${botsList}`;

    return {
      success: true,
      message: result,
      data: {
        summary: {
          totalChatbots,
          activeChatbots,
          weeklyConversations: totalWeeklyConversations,
          avgConversationsPerBot
        },
        chatbots: processedChatbots
      }
    };

  } catch (error) {
    console.error('❌ Error querying chatbots:', error);
    return {
      success: false,
      message: `Error consultando chatbots: ${error instanceof Error ? error.message : 'Error desconocido'}`,
      data: null
    };
  }
};