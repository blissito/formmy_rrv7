import { db } from "~/utils/db.server";

/**
 * Interfaz para métricas de costos agregados
 */
export interface CostMetrics {
  totalCost: number;
  totalTokens: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalMessages: number;
  costByProvider: Array<{
    provider: string;
    cost: number;
    messages: number;
    tokens: number;
  }>;
  costByModel: Array<{
    model: string;
    cost: number;
    messages: number;
    tokens: number;
  }>;
  dailyCosts: Array<{
    date: string;
    cost: number;
    messages: number;
  }>;
}

/**
 * Obtiene métricas de costos para un chatbot en un período específico
 */
export async function getCostMetrics(
  chatbotId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CostMetrics> {
  const whereClause = {
    conversation: {
      chatbotId
    },
    role: "ASSISTANT" as const,
    totalCost: {
      not: null
    },
    ...(startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {})
  };

  // Obtener todos los mensajes con costos
  const messages = await db.message.findMany({
    where: whereClause,
    select: {
      totalCost: true,
      inputTokens: true,
      outputTokens: true,
      tokens: true,
      provider: true,
      aiModel: true,
      createdAt: true,
    }
  });

  // Calcular métricas totales
  const totalCost = messages.reduce((sum, msg) => sum + (msg.totalCost || 0), 0);
  const totalInputTokens = messages.reduce((sum, msg) => sum + (msg.inputTokens || 0), 0);
  const totalOutputTokens = messages.reduce((sum, msg) => sum + (msg.outputTokens || 0), 0);
  const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

  // Agrupar por proveedor
  const providerMap = new Map<string, {cost: number, messages: number, tokens: number}>();
  messages.forEach(msg => {
    const provider = msg.provider || 'unknown';
    const existing = providerMap.get(provider) || {cost: 0, messages: 0, tokens: 0};
    providerMap.set(provider, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1,
      tokens: existing.tokens + (msg.tokens || 0)
    });
  });

  // Agrupar por modelo
  const modelMap = new Map<string, {cost: number, messages: number, tokens: number}>();
  messages.forEach(msg => {
    const model = msg.aiModel || 'unknown';
    const existing = modelMap.get(model) || {cost: 0, messages: 0, tokens: 0};
    modelMap.set(model, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1,
      tokens: existing.tokens + (msg.tokens || 0)
    });
  });

  // Agrupar por día
  const dailyMap = new Map<string, {cost: number, messages: number}>();
  messages.forEach(msg => {
    const date = msg.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = dailyMap.get(date) || {cost: 0, messages: 0};
    dailyMap.set(date, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1
    });
  });

  return {
    totalCost,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    totalMessages: messages.length,
    costByProvider: Array.from(providerMap.entries()).map(([provider, data]) => ({
      provider,
      ...data
    })).sort((a, b) => b.cost - a.cost),
    costByModel: Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      ...data
    })).sort((a, b) => b.cost - a.cost),
    dailyCosts: Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date))
  };
}

/**
 * Obtiene métricas de costos para todos los chatbots de un usuario
 */
export async function getUserCostMetrics(
  userId: string,
  startDate?: Date,
  endDate?: Date
): Promise<CostMetrics & { costByChatbot: Array<{chatbotId: string, chatbotName: string, cost: number, messages: number}> }> {
  const whereClause = {
    conversation: {
      chatbot: {
        userId
      }
    },
    role: "ASSISTANT" as const,
    totalCost: {
      not: null
    },
    ...(startDate && endDate ? {
      createdAt: {
        gte: startDate,
        lte: endDate
      }
    } : {})
  };

  // Obtener todos los mensajes con costos del usuario
  const messages = await db.message.findMany({
    where: whereClause,
    select: {
      totalCost: true,
      inputTokens: true,
      outputTokens: true,
      tokens: true,
      provider: true,
      aiModel: true,
      createdAt: true,
      conversation: {
        select: {
          chatbotId: true,
          chatbot: {
            select: {
              name: true
            }
          }
        }
      }
    }
  });

  // Calcular métricas básicas
  const baseMetrics = await getCostMetricsFromMessages(messages);

  // Agrupar por chatbot
  const chatbotMap = new Map<string, {chatbotName: string, cost: number, messages: number}>();
  messages.forEach(msg => {
    const chatbotId = msg.conversation.chatbotId;
    const chatbotName = msg.conversation.chatbot.name;
    const existing = chatbotMap.get(chatbotId) || {chatbotName, cost: 0, messages: 0};
    chatbotMap.set(chatbotId, {
      chatbotName,
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1
    });
  });

  return {
    ...baseMetrics,
    costByChatbot: Array.from(chatbotMap.entries()).map(([chatbotId, data]) => ({
      chatbotId,
      ...data
    })).sort((a, b) => b.cost - a.cost)
  };
}

/**
 * Función helper para calcular métricas desde una lista de mensajes
 */
function getCostMetricsFromMessages(messages: any[]): CostMetrics {
  const totalCost = messages.reduce((sum, msg) => sum + (msg.totalCost || 0), 0);
  const totalInputTokens = messages.reduce((sum, msg) => sum + (msg.inputTokens || 0), 0);
  const totalOutputTokens = messages.reduce((sum, msg) => sum + (msg.outputTokens || 0), 0);
  const totalTokens = messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);

  // Agrupar por proveedor
  const providerMap = new Map<string, {cost: number, messages: number, tokens: number}>();
  messages.forEach(msg => {
    const provider = msg.provider || 'unknown';
    const existing = providerMap.get(provider) || {cost: 0, messages: 0, tokens: 0};
    providerMap.set(provider, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1,
      tokens: existing.tokens + (msg.tokens || 0)
    });
  });

  // Agrupar por modelo
  const modelMap = new Map<string, {cost: number, messages: number, tokens: number}>();
  messages.forEach(msg => {
    const model = msg.aiModel || 'unknown';
    const existing = modelMap.get(model) || {cost: 0, messages: 0, tokens: 0};
    modelMap.set(model, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1,
      tokens: existing.tokens + (msg.tokens || 0)
    });
  });

  // Agrupar por día
  const dailyMap = new Map<string, {cost: number, messages: number}>();
  messages.forEach(msg => {
    const date = msg.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
    const existing = dailyMap.get(date) || {cost: 0, messages: 0};
    dailyMap.set(date, {
      cost: existing.cost + (msg.totalCost || 0),
      messages: existing.messages + 1
    });
  });

  return {
    totalCost,
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    totalMessages: messages.length,
    costByProvider: Array.from(providerMap.entries()).map(([provider, data]) => ({
      provider,
      ...data
    })).sort((a, b) => b.cost - a.cost),
    costByModel: Array.from(modelMap.entries()).map(([model, data]) => ({
      model,
      ...data
    })).sort((a, b) => b.cost - a.cost),
    dailyCosts: Array.from(dailyMap.entries()).map(([date, data]) => ({
      date,
      ...data
    })).sort((a, b) => a.date.localeCompare(b.date))
  };
}