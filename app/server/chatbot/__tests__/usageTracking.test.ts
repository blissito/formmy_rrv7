import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "~/utils/db.server";
import { ChatbotStatus, Plans } from "@prisma/client";
import {
  checkMonthlyUsageLimit,
  pauseChatbotIfLimitReached,
  checkAndPauseAllLimitedChatbots,
  getChatbotUsageStats,
  resetAllMonthlyUsage,
} from "../usageTracking";
import * as chatbotStateManager from "../chatbotStateManager";

// Mock the database
vi.mock("~/utils/db.server", () => ({
  db: {
    chatbot: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock the chatbotStateManager
vi.mock("../chatbotStateManager", () => ({
  deactivateChatbot: vi.fn(),
}));

describe("Usage Tracking", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("checkMonthlyUsageLimit", () => {
    it("should return correct usage info for FREE plan with limit not reached", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        monthlyUsage: 50,
        user: {
          plan: Plans.FREE,
        },
      } as any);

      const result = await checkMonthlyUsageLimit("chatbot1");

      expect(result).toEqual({
        isLimitReached: false,
        currentUsage: 50,
        maxAllowed: 100, // From PLAN_LIMITS
        remainingUsage: 50,
        percentageUsed: 50,
      });
    });

    it("should return correct usage info for FREE plan with limit reached", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        monthlyUsage: 100,
        user: {
          plan: Plans.FREE,
        },
      } as any);

      const result = await checkMonthlyUsageLimit("chatbot1");

      expect(result).toEqual({
        isLimitReached: true,
        currentUsage: 100,
        maxAllowed: 100, // From PLAN_LIMITS
        remainingUsage: 0,
        percentageUsed: 100,
      });
    });

    it("should return correct usage info for PRO plan with unlimited conversations", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        monthlyUsage: 500,
        user: {
          plan: Plans.PRO,
        },
      } as any);

      const result = await checkMonthlyUsageLimit("chatbot1");

      expect(result).toEqual({
        isLimitReached: false,
        currentUsage: 500,
        maxAllowed: Infinity, // From PLAN_LIMITS
        remainingUsage: Infinity,
        percentageUsed: 0,
      });
    });

    it("should throw an error if chatbot is not found", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue(null);

      await expect(checkMonthlyUsageLimit("nonexistent")).rejects.toThrow(
        "Chatbot with ID nonexistent not found"
      );
    });
  });

  describe("pauseChatbotIfLimitReached", () => {
    it("should not pause chatbot if limit is not reached", async () => {
      // Mock the checkMonthlyUsageLimit function result
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        monthlyUsage: 50,
        user: {
          plan: Plans.FREE,
        },
      } as any);

      const result = await pauseChatbotIfLimitReached("chatbot1");

      expect(result).toEqual({
        wasPaused: false,
        chatbot: null,
        usageInfo: {
          isLimitReached: false,
          currentUsage: 50,
          maxAllowed: 100,
          remainingUsage: 50,
          percentageUsed: 50,
        },
      });

      // Verify that deactivateChatbot was not called
      expect(chatbotStateManager.deactivateChatbot).not.toHaveBeenCalled();
    });

    it("should pause chatbot if limit is reached", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        monthlyUsage: 100,
        user: {
          plan: Plans.FREE,
        },
      } as any);

      // Mock the deactivateChatbot function
      vi.mocked(chatbotStateManager.deactivateChatbot).mockResolvedValue({
        id: "chatbot1",
        status: ChatbotStatus.INACTIVE,
        isActive: false,
      } as any);

      const result = await pauseChatbotIfLimitReached("chatbot1");

      expect(result.wasPaused).toBe(true);
      expect(result.chatbot).toEqual({
        id: "chatbot1",
        status: ChatbotStatus.INACTIVE,
        isActive: false,
      });
      expect(result.usageInfo.isLimitReached).toBe(true);

      // Verify that deactivateChatbot was called with the correct ID
      expect(chatbotStateManager.deactivateChatbot).toHaveBeenCalledWith(
        "chatbot1"
      );
    });
  });

  describe("checkAndPauseAllLimitedChatbots", () => {
    it("should pause all chatbots that have reached their limits", async () => {
      // Mock the database response for active chatbots
      vi.mocked(db.chatbot.findMany).mockResolvedValue([
        {
          id: "chatbot1",
          monthlyUsage: 100, // Reached limit
          user: {
            plan: Plans.FREE,
          },
        },
        {
          id: "chatbot2",
          monthlyUsage: 50, // Not reached limit
          user: {
            plan: Plans.FREE,
          },
        },
        {
          id: "chatbot3",
          monthlyUsage: 500, // PRO plan has unlimited
          user: {
            plan: Plans.PRO,
          },
        },
      ] as any);

      // Mock the deactivateChatbot function
      vi.mocked(chatbotStateManager.deactivateChatbot).mockResolvedValue({
        id: "chatbot1",
        status: ChatbotStatus.INACTIVE,
        isActive: false,
      } as any);

      const result = await checkAndPauseAllLimitedChatbots();

      expect(result.pausedCount).toBe(1);
      expect(result.pausedChatbots).toHaveLength(1);
      expect(result.pausedChatbots[0].id).toBe("chatbot1");

      // Verify that deactivateChatbot was called only for chatbot1
      expect(chatbotStateManager.deactivateChatbot).toHaveBeenCalledTimes(1);
      expect(chatbotStateManager.deactivateChatbot).toHaveBeenCalledWith(
        "chatbot1"
      );
    });

    it("should not pause any chatbots if none have reached their limits", async () => {
      // Mock the database response for active chatbots
      vi.mocked(db.chatbot.findMany).mockResolvedValue([
        {
          id: "chatbot1",
          monthlyUsage: 50, // Not reached limit
          user: {
            plan: Plans.FREE,
          },
        },
        {
          id: "chatbot2",
          monthlyUsage: 500, // PRO plan has unlimited
          user: {
            plan: Plans.PRO,
          },
        },
      ] as any);

      const result = await checkAndPauseAllLimitedChatbots();

      expect(result.pausedCount).toBe(0);
      expect(result.pausedChatbots).toHaveLength(0);

      // Verify that deactivateChatbot was not called
      expect(chatbotStateManager.deactivateChatbot).not.toHaveBeenCalled();
    });
  });

  describe("resetAllMonthlyUsage", () => {
    it("should reset monthly usage for all chatbots", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.updateMany).mockResolvedValue({ count: 5 } as any);

      const result = await resetAllMonthlyUsage();

      expect(result).toBe(5);

      // Verify that updateMany was called with the correct data
      expect(db.chatbot.updateMany).toHaveBeenCalledWith({
        data: {
          monthlyUsage: 0,
        },
      });
    });
  });

  describe("getChatbotUsageStats", () => {
    it("should return correct usage stats for FREE plan", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        conversationCount: 150,
        monthlyUsage: 50,
        user: {
          plan: Plans.FREE,
        },
      } as any);

      const result = await getChatbotUsageStats("chatbot1");

      expect(result).toEqual({
        totalConversations: 150,
        monthlyConversations: 50,
        monthlyLimit: 100,
        isLimitReached: false,
        percentageUsed: 50,
      });
    });

    it("should return correct usage stats for PRO plan", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue({
        id: "chatbot1",
        conversationCount: 1500,
        monthlyUsage: 500,
        user: {
          plan: Plans.PRO,
        },
      } as any);

      const result = await getChatbotUsageStats("chatbot1");

      expect(result).toEqual({
        totalConversations: 1500,
        monthlyConversations: 500,
        monthlyLimit: "unlimited",
        isLimitReached: false,
        percentageUsed: 0,
      });
    });

    it("should throw an error if chatbot is not found", async () => {
      // Mock the database response
      vi.mocked(db.chatbot.findUnique).mockResolvedValue(null);

      await expect(getChatbotUsageStats("nonexistent")).rejects.toThrow(
        "Chatbot with ID nonexistent not found"
      );
    });
  });
});
