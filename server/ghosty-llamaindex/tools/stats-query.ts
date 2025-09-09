/**
 * Stats Query Tool - Get detailed statistics using FunctionTool pattern
 */

import { FunctionTool } from "llamaindex";
import type { StatsQuery, StatsResult, GhostyContext } from "../types";

// Use existing Prisma instance from the app
async function getPrisma() {
  const { prisma } = await import("server/db.server");
  return prisma;
}

/**
 * Helper function to get date range for period
 */
function getDateRange(period: StatsQuery['period']) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case 'day':
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'year':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
  }

  return { startDate, endDate: now };
}

/**
 * Format numeric values for display
 */
function formatValue(value: number, metric: string): string {
  switch (metric) {
    case 'cost':
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'USD',
      }).format(value);
    case 'tokens':
      return new Intl.NumberFormat('es-MX').format(value);
    default:
      return value.toString();
  }
}

/**
 * Calculate trend based on comparison
 */
function calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
  const changePercent = previous === 0 ? 100 : ((current - previous) / previous) * 100;
  
  if (Math.abs(changePercent) < 5) return 'stable';
  return changePercent > 0 ? 'up' : 'down';
}

/**
 * Get chatbot statistics tool
 */
export const getChatbotStatsTool = FunctionTool.from(
  async ({ 
    chatbotId,
    period = 'month',
    metric = 'conversations',
    groupBy,
    includeComparison = true
  }: StatsQuery & { includeComparison?: boolean }, context?: GhostyContext): Promise<StatsResult> => {
    
    if (!context?.userId) {
      throw new Error("User context is required");
    }

    console.log(`📊 Getting ${metric} stats for period: ${period}, chatbot: ${chatbotId || 'all'}`);

    const prisma = await getPrisma();
    const { startDate, endDate } = getDateRange(period);
    
    // Build where clause
    const where: any = {
      chatbot: { userId: context.userId },
      createdAt: {
        gte: startDate,
        lte: endDate,
      }
    };

    if (chatbotId) {
      where.chatbotId = chatbotId;
    }

    let value = 0;
    let previousValue = 0;

    switch (metric) {
      case 'conversations': {
        const conversations = await prisma.conversation.count({ where });
        value = conversations;

        if (includeComparison) {
          // Get previous period for comparison
          const prevRange = getDateRange(period);
          prevRange.endDate = startDate;
          prevRange.startDate = new Date(prevRange.startDate.getTime() - (endDate.getTime() - startDate.getTime()));
          
          previousValue = await prisma.conversation.count({
            where: {
              ...where,
              createdAt: {
                gte: prevRange.startDate,
                lte: prevRange.endDate,
              }
            }
          });
        }
        break;
      }

      case 'messages': {
        const result = await prisma.message.aggregate({
          where: {
            conversation: {
              chatbot: { userId: context.userId },
              ...(chatbotId ? { chatbotId } : {}),
              createdAt: {
                gte: startDate,
                lte: endDate,
              }
            }
          },
          _count: { id: true }
        });
        value = result._count.id || 0;

        if (includeComparison) {
          const prevRange = getDateRange(period);
          prevRange.endDate = startDate;
          prevRange.startDate = new Date(prevRange.startDate.getTime() - (endDate.getTime() - startDate.getTime()));
          
          const prevResult = await prisma.message.aggregate({
            where: {
              conversation: {
                chatbot: { userId: context.userId },
                ...(chatbotId ? { chatbotId } : {}),
                createdAt: {
                  gte: prevRange.startDate,
                  lte: prevRange.endDate,
                }
              }
            },
            _count: { id: true }
          });
          previousValue = prevResult._count.id || 0;
        }
        break;
      }

      case 'tokens': {
        const result = await prisma.message.aggregate({
          where: {
            conversation: {
              chatbot: { userId: context.userId },
              ...(chatbotId ? { chatbotId } : {}),
              createdAt: {
                gte: startDate,
                lte: endDate,
              }
            },
            role: 'ASSISTANT', // Only count assistant tokens
          },
          _sum: {
            inputTokens: true,
            outputTokens: true,
            cachedTokens: true,
          }
        });

        const inputTokens = result._sum.inputTokens || 0;
        const outputTokens = result._sum.outputTokens || 0;
        const cachedTokens = result._sum.cachedTokens || 0;
        
        value = inputTokens + outputTokens + cachedTokens;

        if (includeComparison) {
          const prevRange = getDateRange(period);
          prevRange.endDate = startDate;
          prevRange.startDate = new Date(prevRange.startDate.getTime() - (endDate.getTime() - startDate.getTime()));
          
          const prevResult = await prisma.message.aggregate({
            where: {
              conversation: {
                chatbot: { userId: context.userId },
                ...(chatbotId ? { chatbotId } : {}),
                createdAt: {
                  gte: prevRange.startDate,
                  lte: prevRange.endDate,
                }
              },
              role: 'ASSISTANT',
            },
            _sum: {
              inputTokens: true,
              outputTokens: true,
              cachedTokens: true,
            }
          });

          const prevInputTokens = prevResult._sum.inputTokens || 0;
          const prevOutputTokens = prevResult._sum.outputTokens || 0;
          const prevCachedTokens = prevResult._sum.cachedTokens || 0;
          
          previousValue = prevInputTokens + prevOutputTokens + prevCachedTokens;
        }
        break;
      }

      case 'cost': {
        const result = await prisma.message.aggregate({
          where: {
            conversation: {
              chatbot: { userId: context.userId },
              ...(chatbotId ? { chatbotId } : {}),
              createdAt: {
                gte: startDate,
                lte: endDate,
              }
            },
            role: 'ASSISTANT',
          },
          _sum: { totalCost: true }
        });

        value = result._sum.totalCost || 0;

        if (includeComparison) {
          const prevRange = getDateRange(period);
          prevRange.endDate = startDate;
          prevRange.startDate = new Date(prevRange.startDate.getTime() - (endDate.getTime() - startDate.getTime()));
          
          const prevResult = await prisma.message.aggregate({
            where: {
              conversation: {
                chatbot: { userId: context.userId },
                ...(chatbotId ? { chatbotId } : {}),
                createdAt: {
                  gte: prevRange.startDate,
                  lte: prevRange.endDate,
                }
              },
              role: 'ASSISTANT',
            },
            _sum: { totalCost: true }
          });
          previousValue = prevResult._sum.totalCost || 0;
        }
        break;
      }

      case 'users': {
        const result = await prisma.conversation.findMany({
          where,
          select: { visitorId: true },
          distinct: ['visitorId'],
        });
        value = result.filter(r => r.visitorId).length;

        if (includeComparison) {
          const prevRange = getDateRange(period);
          prevRange.endDate = startDate;
          prevRange.startDate = new Date(prevRange.startDate.getTime() - (endDate.getTime() - startDate.getTime()));
          
          const prevResult = await prisma.conversation.findMany({
            where: {
              ...where,
              createdAt: {
                gte: prevRange.startDate,
                lte: prevRange.endDate,
              }
            },
            select: { visitorId: true },
            distinct: ['visitorId'],
          });
          previousValue = prevResult.filter(r => r.visitorId).length;
        }
        break;
      }
    }

    // Calculate comparison
    const changePercent = previousValue === 0 ? 
      (value > 0 ? 100 : 0) : 
      ((value - previousValue) / previousValue) * 100;

    const result: StatsResult = {
      metric,
      value,
      period,
      formattedValue: formatValue(value, metric),
      comparison: includeComparison ? {
        previousValue,
        changePercent,
        trend: calculateTrend(value, previousValue),
      } : undefined,
    };

    console.log(`✅ Stats result: ${metric} = ${result.formattedValue} (${period})`);
    
    return result;
  },
  {
    name: "get_chatbot_stats",
    description: "Obtiene estadísticas detalladas de chatbots por diferentes métricas y períodos. Incluye comparación con período anterior.",
    parameters: {
      type: "object",
      properties: {
        chatbotId: {
          type: "string",
          description: "ID del chatbot específico (opcional, si no se especifica obtiene stats de todos)"
        },
        period: {
          type: "string",
          enum: ["day", "week", "month", "year"],
          description: "Período de tiempo para las estadísticas",
          default: "month"
        },
        metric: {
          type: "string",
          enum: ["conversations", "messages", "tokens", "users", "cost"],
          description: "Tipo de métrica a obtener",
          default: "conversations"
        },
        groupBy: {
          type: "string",
          enum: ["day", "week", "month"],
          description: "Agrupar resultados por período (opcional)"
        },
        includeComparison: {
          type: "boolean",
          description: "Si incluir comparación con período anterior",
          default: true
        }
      }
    }
  }
);