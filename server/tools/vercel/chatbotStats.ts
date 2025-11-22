import { tool } from "ai";
import z from "zod";
import { getChatbotStatsHandler } from "@/server/tools/handlers/chatbot-stats";
import type { User } from "@prisma/client";

/**
 * Vercel AI SDK Tool: Get chatbot statistics
 * Factory function que recibe el user del route handler
 */
export const createGetChatbotStatsTool = (user: User) => tool({
  description: "Get detailed analytics and statistics for a specific chatbot or all user's chatbots (conversations, engagement, performance metrics)",
  inputSchema: z.object({
    chatbotId: z.string().optional().describe("MongoDB ObjectId del chatbot (24 caracteres hexadecimales). Obtener de queryChatbotsTool usando el campo 'id'. NO usar el nombre. Omitir para estadísticas de todos los chatbots."),
    period: z.enum(['week', 'month', 'quarter', 'year']).optional().describe("Time period for stats"),
    compareWithPrevious: z.boolean().optional().describe("Include comparison with previous period"),
    includeHourlyBreakdown: z.boolean().optional().describe("Include hourly activity breakdown")
  }),
  execute: async (params) => {
    const context = {
      userId: user.id,
      userPlan: user.plan,
      chatbotId: null,
      message: '',
      integrations: {},
      isGhosty: true
    };
    const result = await getChatbotStatsHandler(params, context);
    return result.message || JSON.stringify(result.data);
  }
});
