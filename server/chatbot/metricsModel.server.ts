import { db } from "~/utils/db.server";
import { ConversationStatus } from "@prisma/client";

/**
 * Interface for chatbot metrics
 */
export interface ChatbotMetrics {
  chatbotId: string;
  period: {
    start: Date;
    end: Date;
  };
  conversations: {
    total: number;
    completed: number;
    active: number;
    completionRate: number;
  };
  messages: {
    total: number;
    averagePerConversation: number;
    averageResponseTime: number;
    averageTokens: number;
  };
  engagement: {
    uniqueVisitors: number;
    averageSessionDuration: number;
    peakHours: Array<{ hour: number; count: number }>;
  };
  performance: {
    averageResponseTime: number;
    averageFirstTokenLatency: number;
  };
}

/**
 * Gets comprehensive metrics for a chatbot
 */
export async function getChatbotMetrics(
  chatbotId: string,
  startDate: Date,
  endDate: Date
): Promise<ChatbotMetrics> {
  // Obtener conversaciones del período
  const conversations = await db.conversation.findMany({
    where: {
      chatbotId,
      startedAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      messages: {
        where: {
          deleted: false,
        },
      },
    },
  });

  // Calcular métricas de conversaciones
  const totalConversations = conversations.length;
  const completedConversations = conversations.filter(
    (c) => c.status === ConversationStatus.COMPLETED
  ).length;
  const activeConversations = conversations.filter(
    (c) => c.status === ConversationStatus.ACTIVE
  ).length;
  const completionRate = totalConversations > 0 ? (completedConversations / totalConversations) * 100 : 0;

  // Calcular métricas de mensajes
  const allMessages = conversations.flatMap((c) => c.messages);
  const totalMessages = allMessages.length;
  const averagePerConversation = totalConversations > 0 ? totalMessages / totalConversations : 0;

  // Métricas de performance
  const messagesWithResponseTime = allMessages.filter((m) => m.responseTime);
  const averageResponseTime = messagesWithResponseTime.length > 0
    ? messagesWithResponseTime.reduce((sum, m) => sum + (m.responseTime || 0), 0) / messagesWithResponseTime.length
    : 0;

  const messagesWithTokens = allMessages.filter((m) => m.tokens);
  const averageTokens = messagesWithTokens.length > 0
    ? messagesWithTokens.reduce((sum, m) => sum + (m.tokens || 0), 0) / messagesWithTokens.length
    : 0;

  const messagesWithFirstTokenLatency = allMessages.filter((m) => m.firstTokenLatency);
  const averageFirstTokenLatency = messagesWithFirstTokenLatency.length > 0
    ? messagesWithFirstTokenLatency.reduce((sum, m) => sum + (m.firstTokenLatency || 0), 0) / messagesWithFirstTokenLatency.length
    : 0;

  // Métricas de engagement
  const uniqueVisitorIds = new Set(conversations.filter((c) => c.visitorId).map((c) => c.visitorId));
  const uniqueVisitors = uniqueVisitorIds.size;

  // Calcular duración promedio de sesión
  const sessionsWithDuration = conversations.filter((c) => c.endedAt);
  const averageSessionDuration = sessionsWithDuration.length > 0
    ? sessionsWithDuration.reduce((sum, c) => {
        const duration = c.endedAt!.getTime() - c.startedAt.getTime();
        return sum + duration;
      }, 0) / sessionsWithDuration.length
    : 0;

  // Calcular horas pico
  const hourCounts: { [hour: number]: number } = {};
  conversations.forEach((c) => {
    const hour = c.startedAt.getHours();
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });

  const peakHours = Object.entries(hourCounts)
    .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5); // Top 5 horas

  return {
    chatbotId,
    period: {
      start: startDate,
      end: endDate,
    },
    conversations: {
      total: totalConversations,
      completed: completedConversations,
      active: activeConversations,
      completionRate: Math.round(completionRate * 100) / 100,
    },
    messages: {
      total: totalMessages,
      averagePerConversation: Math.round(averagePerConversation * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime),
      averageTokens: Math.round(averageTokens),
    },
    engagement: {
      uniqueVisitors,
      averageSessionDuration: Math.round(averageSessionDuration / 1000), // en segundos
      peakHours,
    },
    performance: {
      averageResponseTime: Math.round(averageResponseTime),
      averageFirstTokenLatency: Math.round(averageFirstTokenLatency),
    },
  };
}

/**
 * Gets metrics for all chatbots of a user
 */
export async function getUserChatbotsMetrics(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<Array<ChatbotMetrics & { chatbotName: string }>> {
  // Obtener chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: {
      userId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  // Obtener métricas para cada chatbot
  const metricsPromises = chatbots.map(async (chatbot) => {
    const metrics = await getChatbotMetrics(chatbot.id, startDate, endDate);
    return {
      ...metrics,
      chatbotName: chatbot.name,
    };
  });

  return Promise.all(metricsPromises);
}

/**
 * Gets quick stats for a chatbot (for quick responses)
 */
export async function getChatbotQuickStats(chatbotId: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // Conversaciones últimos 30 días
  const [conversations30d, conversations7d] = await Promise.all([
    db.conversation.count({
      where: {
        chatbotId,
        startedAt: { gte: thirtyDaysAgo },
      },
    }),
    db.conversation.count({
      where: {
        chatbotId,
        startedAt: { gte: sevenDaysAgo },
      },
    }),
  ]);

  // Último mensaje del chatbot
  const lastConversation = await db.conversation.findFirst({
    where: {
      chatbotId,
    },
    orderBy: {
      startedAt: "desc",
    },
    select: {
      startedAt: true,
    },
  });

  return {
    chatbotId,
    conversations30d,
    conversations7d,
    lastActivity: lastConversation?.startedAt || null,
  };
}

/**
 * Helper function to get date ranges for common periods
 */
export function getDateRange(period: "7d" | "30d" | "3m" | "1y"): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  let start: Date;

  switch (period) {
    case "7d":
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3m":
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "1y":
      start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end };
}