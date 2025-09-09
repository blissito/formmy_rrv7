/**
 * Chatbot Query Tool - Query user's chatbots using FunctionTool pattern
 */

import { FunctionTool } from "llamaindex";
import type { ChatbotQueryFilters, ChatbotWithStats, GhostyContext } from "../types";

// Use existing Prisma instance from the app
async function getPrisma() {
  const { db } = await import("../../../app/utils/db.server");
  return db;
}

/**
 * Clean object by removing null/undefined values recursively
 */
function cleanObject(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  
  const cleaned: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedNested = cleanObject(value);
        if (Object.keys(cleanedNested).length > 0) {
          cleaned[key] = cleanedNested;
        }
      } else if (Array.isArray(value)) {
        const cleanedArray = value
          .map(item => typeof item === 'object' ? cleanObject(item) : item)
          .filter(item => item !== null && item !== undefined);
        if (cleanedArray.length > 0) {
          cleaned[key] = cleanedArray;
        }
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Core query function that can be called with context
 */
async function queryChatbotsCore(
  params: { 
    filters?: ChatbotQueryFilters; 
    includeStats?: boolean;
  }, 
  context: GhostyContext
): Promise<ChatbotWithStats[]> {
  const { filters = {}, includeStats = false } = params;
    
    if (!context?.userId) {
      throw new Error("User context is required");
    }

    console.log(`🔍 Querying chatbots for user ${context.userId} with filters:`, filters);

    const prisma = await getPrisma();

    // Build where clause
    const where: any = {
      userId: context.userId,
    };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.searchTerm) {
      where.OR = [
        { name: { contains: filters.searchTerm, mode: 'insensitive' } },
        { description: { contains: filters.searchTerm, mode: 'insensitive' } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.createdAt.lte = filters.dateTo;
      }
    }

    // Query chatbots
    const chatbots = await prisma.chatbot.findMany({
      where,
      include: {
        conversations: includeStats ? {
          select: {
            id: true,
            messageCount: true,
            createdAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10, // Latest 10 conversations for stats
        } : false,
        _count: includeStats ? {
          select: {
            conversations: true,
            contexts: true,
            integrations: true,
          }
        } : false,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Calculate stats if requested
    const chatbotsWithStats: ChatbotWithStats[] = chatbots.map(chatbot => {
      const result: ChatbotWithStats = { ...chatbot };

      if (includeStats && chatbot.conversations) {
        const totalMessages = chatbot.conversations.reduce((sum, conv) => sum + conv.messageCount, 0);
        const activeConversations = chatbot.conversations.filter(conv => conv.status === 'ACTIVE').length;
        const lastActivity = chatbot.conversations[0]?.createdAt;

        result.stats = {
          totalConversations: chatbot._count?.conversations || 0,
          totalMessages,
          avgMessagesPerConversation: totalMessages > 0 ? Math.round(totalMessages / chatbot.conversations.length) : 0,
          lastActivity,
          monthlyUsage: chatbot.monthlyUsage,
        };
      }

      return result;
    });

    console.log(`✅ Found ${chatbotsWithStats.length} chatbots for user`);
    
    // Sanitize data to remove null values that cause JSONValue errors in LlamaIndex
    const sanitizedResults = chatbotsWithStats.map(chatbot => {
      // Create clean object without null values
      const cleaned: any = {};
      
      for (const [key, value] of Object.entries(chatbot)) {
        if (value !== null && value !== undefined) {
          if (typeof value === 'object' && !Array.isArray(value)) {
            // Recursively clean nested objects
            cleaned[key] = cleanObject(value);
          } else if (Array.isArray(value)) {
            // Clean arrays
            cleaned[key] = value.map(item => 
              typeof item === 'object' ? cleanObject(item) : item
            );
          } else {
            cleaned[key] = value;
          }
        }
      }
      
      return cleaned;
    });
    
    console.log(`🧹 Sanitized ${sanitizedResults.length} chatbot records for LlamaIndex`);
    return sanitizedResults;
}

/**
 * Export core function for context-aware wrappers
 */
export { queryChatbotsCore };

/**
 * Legacy LlamaIndex FunctionTool (NOT USED - context issue)
 */
export const queryChatbotsTool = {
  metadata: {
    name: "query_chatbots",
    description: "Busca información sobre los chatbots del usuario",
  },
  call: queryChatbotsCore
};

/**
 * Get specific chatbot by ID or slug
 */
export const getChatbotTool = FunctionTool.from(
  async ({ 
    identifier,
    type = "id" 
  }: { 
    identifier: string; 
    type?: "id" | "slug";
  }, context?: GhostyContext) => {
    
    if (!context?.userId) {
      throw new Error("User context is required");
    }

    console.log(`🔍 Getting chatbot ${type}:${identifier} for user ${context.userId}`);

    const prisma = await getPrisma();

    const where: any = {
      userId: context.userId,
    };

    if (type === "id") {
      where.id = identifier;
    } else {
      where.slug = identifier;
    }

    const chatbot = await prisma.chatbot.findFirst({
      where,
      include: {
        contexts: true,
        integrations: {
          where: { isActive: true }
        },
        _count: {
          select: {
            conversations: true,
            contexts: true,
            integrations: true,
          }
        }
      }
    });

    if (!chatbot) {
      throw new Error(`Chatbot not found: ${identifier}`);
    }

    console.log(`✅ Found chatbot: ${chatbot.name}`);
    
    return chatbot;
  },
  {
    name: "get_chatbot",
    description: "Obtiene un chatbot específico por ID o slug. Incluye contextos, integraciones activas y contadores.",
    parameters: {
      type: "object",
      properties: {
        identifier: {
          type: "string",
          description: "ID o slug del chatbot a obtener"
        },
        type: {
          type: "string",
          enum: ["id", "slug"],
          description: "Tipo de identificador: 'id' o 'slug'",
          default: "id"
        }
      },
      required: ["identifier"]
    }
  }
);