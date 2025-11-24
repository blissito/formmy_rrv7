import { tool } from "ai";
import z from "zod";
import { queryChatbotsHandler } from "@/server/tools/handlers/chatbot-query";
import type { User } from "@prisma/client";

/**
 * Vercel AI SDK Tool: Query chatbots
 * Factory function que recibe el user del route handler
 */
export const createQueryChatbotsTool = (user: User) => tool({
  description: `Get ALL chatbots owned by the user. ALWAYS use this tool to answer questions about:
- "cuáles son mis chatbots" / "mis bots" / "enlista mis chatbots"
- "cuántos chatbots tengo" / "mis chatbots creados"
- "qué chatbots tengo activos/inactivos"
- ANY question that mentions user's chatbots, bots, or agents
Returns complete list with stats (conversations, contexts, integrations). Call this FIRST before saying "no tienes chatbots".`,
  inputSchema: z.object({
    includeStats: z.boolean().optional().default(true).describe("Include detailed stats (conversations, contexts, integrations)"),
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
    // Default params: all status, ordered by updated, limit 50, includeStats from input
    const handlerParams = {
      status: 'all' as const,
      orderBy: 'updated' as const,
      limit: 50,
      includeStats: params.includeStats ?? true,
    };
    const result = await queryChatbotsHandler(handlerParams, context);
    console.log('✅ [queryChatbotsTool] RESULTADO:', result);
    // Retornar string formateado para que el LLM lo lea directamente
    return result.message;
  },
});
