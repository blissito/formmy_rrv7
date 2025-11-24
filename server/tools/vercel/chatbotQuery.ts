import { tool } from "ai";
import z from "zod";
import { queryChatbotsHandler } from "@/server/tools/handlers/chatbot-query";
import type { User } from "@prisma/client";

/**
 * Vercel AI SDK Tool: Query chatbots
 * Factory function que recibe el user del route handler
 */
export const createQueryChatbotsTool = (user: User) => tool({
  description: "List and filter user's chatbots with optional stats (conversations count, status, etc.)",
  inputSchema: z.object({
    status: z.enum(["all", "active", "inactive", "draft"]).optional().describe("Filter by chatbot status"),
    orderBy: z.enum(["name", "conversations", "created", "updated"]).optional().describe("Sort order"),
    limit: z.number().optional().describe("Max number of chatbots to return"),
    includeStats: z.boolean().optional().describe("Include conversation stats"),
  }),
  execute: async (params) => {
    console.log('🔍 [queryChatbotsTool] EJECUTANDO - params:', params, 'userId:', user.id);
    const context = {
      userId: user.id,
      userPlan: user.plan,
      chatbotId: null,
      message: '',
      integrations: {},
      isGhosty: true
    };
    const result = await queryChatbotsHandler(params, context);
    console.log('✅ [queryChatbotsTool] RESULTADO:', result);
    // Retornar datos estructurados con IDs para que el LLM pueda usarlos
    return JSON.stringify(result.data);
  },
});
