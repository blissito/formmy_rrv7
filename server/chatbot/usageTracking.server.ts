import { ChatbotStatus, type Chatbot } from "@prisma/client";
import { db } from "~/utils/db.server";
import { PLAN_LIMITS } from "./planLimits.server";
import { deactivateChatbot } from "./chatbotStateManager.server";

/**
 * Interface for usage tracking results
 */
export interface UsageTrackingResult {
  isLimitReached: boolean;
  currentUsage: number;
  maxAllowed: number;
  remainingUsage: number;
  percentageUsed: number;
}

/**
 * Checks if a chatbot has reached its monthly conversation limit
 * @param chatbotId Chatbot ID
 * @returns Object with usage information and limit status
 */
export async function checkMonthlyUsageLimit(
  chatbotId: string
): Promise<UsageTrackingResult> {
  // Get the chatbot and its user
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { user: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  const maxAllowed = PLAN_LIMITS[chatbot.user.plan].maxConversationsPerMonth;
  const currentUsage = chatbot.monthlyUsage;

  // If the plan is PRO, maxAllowed is Infinity
  const isLimitReached = maxAllowed !== Infinity && currentUsage >= maxAllowed;
  const remainingUsage =
    maxAllowed === Infinity ? Infinity : Math.max(0, maxAllowed - currentUsage);
  const percentageUsed =
    maxAllowed === Infinity
      ? 0
      : Math.min(100, (currentUsage / maxAllowed) * 100);

  return {
    isLimitReached,
    currentUsage,
    maxAllowed,
    remainingUsage,
    percentageUsed,
  };
}

/**
 * Pauses a chatbot if it has reached its monthly conversation limit
 * @param chatbotId Chatbot ID
 * @returns Object with the result of the operation
 */
export async function pauseChatbotIfLimitReached(chatbotId: string): Promise<{
  wasPaused: boolean;
  chatbot: Chatbot | null;
  usageInfo: UsageTrackingResult;
}> {
  const usageInfo = await checkMonthlyUsageLimit(chatbotId);

  if (usageInfo.isLimitReached) {
    // Deactivate the chatbot
    const chatbot = await deactivateChatbot(chatbotId);

    // Log the event
    console.log(
      `Chatbot ${chatbotId} was paused due to reaching monthly limit of ${usageInfo.maxAllowed} conversations`
    );

    return {
      wasPaused: true,
      chatbot,
      usageInfo,
    };
  }

  return {
    wasPaused: false,
    chatbot: null,
    usageInfo,
  };
}

/**
 * Checks all active chatbots and pauses those that have reached their limits
 * This function should be called periodically by a cron job or similar
 * @returns Array of chatbots that were paused
 */
export async function checkAndPauseAllLimitedChatbots(): Promise<{
  pausedCount: number;
  pausedChatbots: Chatbot[];
}> {
  // Get all active chatbots
  const activeChatbots = await db.chatbot.findMany({
    where: {
      status: ChatbotStatus.ACTIVE,
      isActive: true,
    },
    include: { user: true },
  });

  const pausedChatbots: Chatbot[] = [];

  // Check each chatbot
  for (const chatbot of activeChatbots) {
    const maxAllowed = PLAN_LIMITS[chatbot.user.plan].maxConversationsPerMonth;

    // Skip if the plan has unlimited conversations
    if (maxAllowed === Infinity) {
      continue;
    }

    // Check if the chatbot has reached its limit
    if (chatbot.monthlyUsage >= maxAllowed) {
      // Deactivate the chatbot
      const pausedChatbot = await deactivateChatbot(chatbot.id);
      pausedChatbots.push(pausedChatbot);

      // Log the event
      console.log(
        `Chatbot ${chatbot.id} was paused due to reaching monthly limit of ${maxAllowed} conversations`
      );
    }
  }

  return {
    pausedCount: pausedChatbots.length,
    pausedChatbots,
  };
}

/**
 * Gets the current usage statistics for a chatbot
 * @param chatbotId Chatbot ID
 * @returns Object with usage statistics
 */
export async function getChatbotUsageStats(chatbotId: string): Promise<{
  totalConversations: number;
  monthlyConversations: number;
  monthlyLimit: number | "unlimited";
  isLimitReached: boolean;
  percentageUsed: number;
}> {
  // Get the chatbot and its user
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { user: true },
  });

  if (!chatbot) {
    throw new Error(`Chatbot with ID ${chatbotId} not found`);
  }

  const maxAllowed = PLAN_LIMITS[chatbot.user.plan].maxConversationsPerMonth;
  const isLimitReached =
    maxAllowed !== Infinity && chatbot.monthlyUsage >= maxAllowed;
  const percentageUsed =
    maxAllowed === Infinity
      ? 0
      : Math.min(100, (chatbot.monthlyUsage / maxAllowed) * 100);

  return {
    totalConversations: chatbot.conversationCount,
    monthlyConversations: chatbot.monthlyUsage,
    monthlyLimit: maxAllowed === Infinity ? "unlimited" : maxAllowed,
    isLimitReached,
    percentageUsed,
  };
}

/**
 * Resets monthly usage counters for all chatbots
 * This function should be called at the beginning of each month by a cron job
 * @returns Number of chatbots whose counters were reset
 */
export async function resetAllMonthlyUsage(): Promise<number> {
  const result = await db.chatbot.updateMany({
    data: {
      monthlyUsage: 0,
    },
  });

  return result.count;
}
