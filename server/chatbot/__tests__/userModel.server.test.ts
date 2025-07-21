import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getUserWithChatbots,
  getUserChatbotsWithPlanInfo,
  updateUserPlan,
  validateUserChatbotFeatures,
  canUserAccessModel,
  validateUserAIModelAccess,
  getUserPlanFeatures,
  validateUserChatbotCreation,
} from "../userModel";
import { Plans, ChatbotStatus } from "@prisma/client";
import * as planLimits from "../planLimits.server";

// Mock the database
vi.mock("~/utils/db.server", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    },
  };
});

// Mock the planLimits module
vi.mock("../planLimits", () => {
  return {
    PLAN_LIMITS: {
      FREE: {
        maxChatbots: 1,
        maxContextSizeKB: 1000,
        maxConversationsPerMonth: 100,
        availableModels: ["model-free-1", "model-free-2"],
        showBranding: true,
      },
      PRO: {
        maxChatbots: Infinity,
        maxContextSizeKB: 10000,
        maxConversationsPerMonth: Infinity,
        availableModels: [
          "model-free-1",
          "model-free-2",
          "model-pro-1",
          "model-pro-2",
        ],
        showBranding: false,
      },
    },
    validateAvailableModel: vi.fn(),
  };
});

// Import the mocked db
import { db } from "~/utils/db.server";

describe("userModel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("getUserWithChatbots", () => {
    it("should return user with chatbots", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
        chatbots: [
          {
            id: "chatbot-1",
            name: "Test Chatbot",
            status: ChatbotStatus.ACTIVE,
          },
        ],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserWithChatbots("user-1");
      expect(result).toEqual(mockUser);
      expect(db.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user-1" },
        include: { chatbots: true },
      });
    });
  });

  describe("getUserChatbotsWithPlanInfo", () => {
    it("should return chatbots with plan limits for FREE user", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
        chatbots: [
          {
            id: "chatbot-1",
            name: "Test Chatbot",
          },
        ],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserChatbotsWithPlanInfo("user-1");
      expect(result).toEqual({
        chatbots: mockUser.chatbots,
        plan: Plans.FREE,
        limits: {
          maxChatbots: 1,
          currentCount: 1,
          canCreateMore: false,
          availableModels: ["model-free-1", "model-free-2"],
          showBranding: true,
        },
      });
    });

    it("should return chatbots with plan limits for PRO user", async () => {
      const mockUser = {
        id: "user-2",
        plan: Plans.PRO,
        chatbots: [
          {
            id: "chatbot-1",
            name: "Test Chatbot 1",
          },
          {
            id: "chatbot-2",
            name: "Test Chatbot 2",
          },
        ],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserChatbotsWithPlanInfo("user-2");
      expect(result).toEqual({
        chatbots: mockUser.chatbots,
        plan: Plans.PRO,
        limits: {
          maxChatbots: Infinity,
          currentCount: 2,
          canCreateMore: true,
          availableModels: [
            "model-free-1",
            "model-free-2",
            "model-pro-1",
            "model-pro-2",
          ],
          showBranding: false,
        },
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(getUserChatbotsWithPlanInfo("non-existent")).rejects.toThrow(
        "Usuario con ID non-existent no encontrado"
      );
    });
  });

  describe("updateUserPlan", () => {
    it("should update user plan", async () => {
      const mockUpdatedUser = {
        id: "user-1",
        plan: Plans.PRO,
      };

      vi.mocked(db.user.update).mockResolvedValue(mockUpdatedUser as any);

      const result = await updateUserPlan("user-1", Plans.PRO);
      expect(result).toEqual(mockUpdatedUser);
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { plan: Plans.PRO },
      });
    });
  });

  describe("validateUserChatbotFeatures", () => {
    it("should return features for FREE user", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserChatbotFeatures("user-1");
      expect(result).toEqual({
        plan: Plans.FREE,
        features: {
          availableModels: ["model-free-1", "model-free-2"],
          showBranding: true,
          maxContextSizeKB: 1000,
          maxConversationsPerMonth: 100,
        },
      });
    });

    it("should return features for PRO user", async () => {
      const mockUser = {
        id: "user-2",
        plan: Plans.PRO,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserChatbotFeatures("user-2");
      expect(result).toEqual({
        plan: Plans.PRO,
        features: {
          availableModels: [
            "model-free-1",
            "model-free-2",
            "model-pro-1",
            "model-pro-2",
          ],
          showBranding: false,
          maxContextSizeKB: 10000,
          maxConversationsPerMonth: Infinity,
        },
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(validateUserChatbotFeatures("non-existent")).rejects.toThrow(
        "Usuario con ID non-existent no encontrado"
      );
    });
  });

  describe("canUserAccessModel", () => {
    it("should check if user can access a specific model", async () => {
      // Import the module with the mocked function
      // const planLimits = await import("../planLimits"); // This line is removed

      // Mock the validateAvailableModel function
      vi.spyOn(planLimits, "validateAvailableModel").mockResolvedValue({
        isAvailable: true,
        availableModels: ["model-1", "model-2"],
      });

      const result = await canUserAccessModel("user-1", "model-1");
      expect(result).toBe(true);
      expect(planLimits.validateAvailableModel).toHaveBeenCalledWith(
        "user-1",
        "model-1"
      );
    });
  });

  describe("validateUserAIModelAccess", () => {
    it("should return AI model access for FREE user", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserAIModelAccess("user-1");
      expect(result).toEqual({
        canUseAdvancedModels: false,
        availableModels: ["model-free-1", "model-free-2"],
      });
    });

    it("should return AI model access for PRO user", async () => {
      const mockUser = {
        id: "user-2",
        plan: Plans.PRO,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserAIModelAccess("user-2");
      expect(result).toEqual({
        canUseAdvancedModels: true,
        availableModels: [
          "model-free-1",
          "model-free-2",
          "model-pro-1",
          "model-pro-2",
        ],
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(validateUserAIModelAccess("non-existent")).rejects.toThrow(
        "Usuario con ID non-existent no encontrado"
      );
    });
  });

  describe("getUserPlanFeatures", () => {
    it("should return all plan features for FREE user", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserPlanFeatures("user-1");
      expect(result).toEqual({
        plan: Plans.FREE,
        isPro: false,
        features: {
          availableModels: ["model-free-1", "model-free-2"],
          showBranding: true,
          maxContextSizeKB: 1000,
          maxChatbots: 1,
          maxConversationsPerMonth: 100,
        },
      });
    });

    it("should return all plan features for PRO user", async () => {
      const mockUser = {
        id: "user-2",
        plan: Plans.PRO,
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await getUserPlanFeatures("user-2");
      expect(result).toEqual({
        plan: Plans.PRO,
        isPro: true,
        features: {
          availableModels: [
            "model-free-1",
            "model-free-2",
            "model-pro-1",
            "model-pro-2",
          ],
          showBranding: false,
          maxContextSizeKB: 10000,
          maxChatbots: Infinity,
          maxConversationsPerMonth: Infinity,
        },
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(getUserPlanFeatures("non-existent")).rejects.toThrow(
        "Usuario con ID non-existent no encontrado"
      );
    });
  });

  describe("validateUserChatbotCreation", () => {
    it("should validate chatbot creation for FREE user with no chatbots", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
        chatbots: [],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserChatbotCreation("user-1");
      expect(result).toEqual({
        canCreate: true,
        currentCount: 0,
        maxAllowed: 1,
        isPro: false,
      });
    });

    it("should validate chatbot creation for FREE user with one chatbot", async () => {
      const mockUser = {
        id: "user-1",
        plan: Plans.FREE,
        chatbots: [
          {
            id: "chatbot-1",
            name: "Test Chatbot",
          },
        ],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserChatbotCreation("user-1");
      expect(result).toEqual({
        canCreate: false,
        currentCount: 1,
        maxAllowed: 1,
        isPro: false,
      });
    });

    it("should validate chatbot creation for PRO user with multiple chatbots", async () => {
      const mockUser = {
        id: "user-2",
        plan: Plans.PRO,
        chatbots: [
          {
            id: "chatbot-1",
            name: "Test Chatbot 1",
          },
          {
            id: "chatbot-2",
            name: "Test Chatbot 2",
          },
        ],
      };

      vi.mocked(db.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await validateUserChatbotCreation("user-2");
      expect(result).toEqual({
        canCreate: true,
        currentCount: 2,
        maxAllowed: Infinity,
        isPro: true,
      });
    });

    it("should throw error if user not found", async () => {
      vi.mocked(db.user.findUnique).mockResolvedValue(null);

      await expect(validateUserChatbotCreation("non-existent")).rejects.toThrow(
        "Usuario con ID non-existent no encontrado"
      );
    });
  });
});
