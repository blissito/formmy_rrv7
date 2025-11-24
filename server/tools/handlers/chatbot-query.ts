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

    // Query chatbots - SIMPLIFIED
    const chatbots = await db.chatbot.findMany({
      where: whereClause,
      orderBy: orderByClause,
      take: limit,
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        isActive: true,
        aiModel: true,
        conversationCount: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            contextObjects: true,
            integrations: true
          }
        }
      }
    });

    // SIMPLIFIED: No complex calculations, just return essentials
    const processedChatbots = chatbots.map(chatbot => ({
      id: chatbot.id,
      name: chatbot.name,
      slug: chatbot.slug,
      description: chatbot.description,
      status: chatbot.status,
      isActive: chatbot.isActive,
      aiModel: chatbot.aiModel,
      totalConversations: chatbot.conversationCount,
      contextsCount: chatbot._count.contextObjects,
      integrationsCount: chatbot._count.integrations,
      createdAt: chatbot.createdAt,
      updatedAt: chatbot.updatedAt
    }));

    // SIMPLIFIED: Basic summary only
    const totalChatbots = processedChatbots.length;
    const activeChatbots = processedChatbots.filter(c => c.isActive).length;
    const totalConversations = processedChatbots.reduce((sum, c) => sum + c.totalConversations, 0);

    const summary = `Encontré ${totalChatbots} chatbots (${activeChatbots} activos). Total de conversaciones: ${totalConversations}.`;

    // Format for AI consumption
    const botsList = processedChatbots.map(bot =>
      `• **${bot.name}** (${bot.status.toLowerCase()}) - ${bot.totalConversations} conversaciones, ${bot.contextsCount} contextos, ${bot.integrationsCount} integraciones`
    ).join('\n');

    const result = `${summary}\n\n${botsList}`;

    return {
      success: true,
      message: result,
      data: {
        summary: {
          totalChatbots,
          activeChatbots,
          totalConversations
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