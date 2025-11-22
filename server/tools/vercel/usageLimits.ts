import { tool } from "ai";
import z from "zod";
import { getUsageLimitsHandler } from "@/server/tools/handlers/usage-limits";
import type { User } from "@prisma/client";

/**
 * Vercel AI SDK Tool: Get usage limits
 * Factory function que recibe el user del route handler
 */
export const createGetUsageLimitsTool = (user: User) => tool({
  description: "Get current plan limits and usage (conversations used/remaining, credits, reset date)",
  inputSchema: z.object({}),
  execute: async () => {
    const context = {
      userId: user.id,
      userPlan: user.plan,
      chatbotId: null,
      message: '',
      integrations: {},
      isGhosty: true
    };
    const result = await getUsageLimitsHandler({}, context);
    return result.message || JSON.stringify(result.data);
  }
});
