import { db } from "~/utils/db.server";

export interface ToolUsageData {
  chatbotId: string;
  toolName: string;
  success: boolean;
  errorMessage?: string;
  userMessage?: string;
  response?: string;
  metadata?: Record<string, any>;
}

export class ToolUsageTracker {
  /**
   * Registrar uso de herramienta (método principal)
   */
  static async trackUsage(data: ToolUsageData) {
    try {
      const usage = await db.toolUsage.create({
        data: {
          chatbotId: data.chatbotId,
          toolName: data.toolName,
          success: data.success,
          errorMessage: data.errorMessage,
          userMessage: data.userMessage?.substring(0, 500), // Limitar longitud
          response: data.response?.substring(0, 1000), // Limitar longitud
          metadata: data.metadata,
        },
      });

      console.log(`📊 [Tool Tracker] ${data.toolName} registrado: ${usage.id}`);
      return usage;
    } catch (error) {
      console.error("Error tracking tool usage:", error);
      // No fallar la operación principal por un error de tracking
      return null;
    }
  }

  /**
   * Obtener estadísticas de uso por chatbot
   */
  static async getUsageStats(chatbotId: string, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    try {
      const stats = await db.toolUsage.groupBy({
        by: ['toolName'],
        where: {
          chatbotId,
          createdAt: {
            gte: startDate,
          },
        },
        _count: {
          id: true,
        },
        _sum: {
          success: true,
        },
      });

      return stats.map(stat => ({
        toolName: stat.toolName,
        totalUses: stat._count.id,
        successfulUses: stat._sum.success || 0,
        failureRate: ((stat._count.id - (stat._sum.success || 0)) / stat._count.id * 100).toFixed(1) + '%',
      }));
    } catch (error) {
      console.error("Error getting usage stats:", error);
      return [];
    }
  }

  /**
   * Obtener uso reciente de herramientas
   */
  static async getRecentUsage(chatbotId: string, limit: number = 10) {
    try {
      return await db.toolUsage.findMany({
        where: { chatbotId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          chatbot: {
            select: {
              name: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error getting recent usage:", error);
      return [];
    }
  }

  /**
   * Obtener conteo total por herramienta
   */
  static async getToolCounts(chatbotId: string) {
    try {
      const results = await db.toolUsage.groupBy({
        by: ['toolName'],
        where: { chatbotId },
        _count: { id: true },
      });

      const counts: Record<string, number> = {};
      results.forEach(result => {
        counts[result.toolName] = result._count.id;
      });

      return counts;
    } catch (error) {
      console.error("Error getting tool counts:", error);
      return {};
    }
  }

  /**
   * Limpiar registros antiguos (maintenance)
   */
  static async cleanOldRecords(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      const deleted = await db.toolUsage.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      console.log(`🧹 Limpieza: ${deleted.count} registros de tool usage eliminados`);
      return deleted.count;
    } catch (error) {
      console.error("Error cleaning old records:", error);
      return 0;
    }
  }
}