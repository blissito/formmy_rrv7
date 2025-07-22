import { describe, it, expect, vi, beforeEach } from "vitest";
import { Plans } from "@prisma/client";
import {
  validateChatbotLimit,
  validateAvailableModel,
  shouldShowBranding,
  validateContextSizeLimit,
  getUserPlanLimits,
  PLAN_LIMITS,
} from "../planLimits";

// Mock db
vi.mock("~/utils/db.server", () => {
  return {
    db: {
      user: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "free-user") {
            return Promise.resolve({ plan: Plans.FREE });
          } else if (where.id === "pro-user") {
            return Promise.resolve({ plan: Plans.PRO });
          } else {
            return Promise.resolve(null);
          }
        }),
      },
      chatbot: {
        count: vi.fn().mockImplementation(({ where }) => {
          if (where.userId === "free-user") {
            return Promise.resolve(1); // Ya tiene un chatbot
          } else if (where.userId === "pro-user") {
            return Promise.resolve(5); // Tiene varios chatbots
          } else {
            return Promise.resolve(0);
          }
        }),
      },
    },
  };
});

describe("Plan Limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateChatbotLimit", () => {
    it("should not allow FREE users to create more chatbots if they already have one", async () => {
      const result = await validateChatbotLimit("free-user");

      expect(result.canCreate).toBe(false);
      expect(result.currentCount).toBe(1);
      expect(result.maxAllowed).toBe(1);
    });

    it("should allow PRO users to create more chatbots", async () => {
      const result = await validateChatbotLimit("pro-user");

      expect(result.canCreate).toBe(true);
      expect(result.currentCount).toBe(5);
      expect(result.maxAllowed).toBe(Infinity);
    });

    it("should throw an error if user is not found", async () => {
      await expect(validateChatbotLimit("non-existent-user")).rejects.toThrow();
    });
  });

  describe("validateAvailableModel", () => {
    it("should allow FREE users to use only basic models", async () => {
      const basicModel = "mistralai/mistral-small-3.2-24b-instruct";
      const advancedModel = "anthropic/claude-3-sonnet-20240229";

      const basicResult = await validateAvailableModel("free-user", basicModel);
      const advancedResult = await validateAvailableModel(
        "free-user",
        advancedModel
      );

      expect(basicResult.isAvailable).toBe(true);
      expect(advancedResult.isAvailable).toBe(false);
      expect(basicResult.availableModels).toEqual(
        PLAN_LIMITS[Plans.FREE].availableModels
      );
    });

    it("should allow PRO users to use all models", async () => {
      const basicModel = "mistralai/mistral-small-3.2-24b-instruct";
      const advancedModel = "anthropic/claude-3-sonnet-20240229";

      const basicResult = await validateAvailableModel("pro-user", basicModel);
      const advancedResult = await validateAvailableModel(
        "pro-user",
        advancedModel
      );

      expect(basicResult.isAvailable).toBe(true);
      expect(advancedResult.isAvailable).toBe(true);
      expect(basicResult.availableModels).toEqual(
        PLAN_LIMITS[Plans.PRO].availableModels
      );
    });

    it("should throw an error if user is not found", async () => {
      await expect(
        validateAvailableModel("non-existent-user", "any-model")
      ).rejects.toThrow();
    });
  });

  describe("shouldShowBranding", () => {
    it("should show branding for FREE users", async () => {
      const result = await shouldShowBranding("free-user");
      expect(result).toBe(true);
    });

    it("should not show branding for PRO users", async () => {
      const result = await shouldShowBranding("pro-user");
      expect(result).toBe(false);
    });

    it("should throw an error if user is not found", async () => {
      await expect(shouldShowBranding("non-existent-user")).rejects.toThrow();
    });
  });

  describe("validateContextSizeLimit", () => {
    it("should limit context size for FREE users", async () => {
      const currentSize = 800;
      const additionalSize = 300;

      const result = await validateContextSizeLimit(
        "free-user",
        currentSize,
        additionalSize
      );

      expect(result.canAdd).toBe(false);
      expect(result.currentSize).toBe(800);
      expect(result.maxAllowed).toBe(1000);
      expect(result.remainingSize).toBe(200);
    });

    it("should allow more context for PRO users", async () => {
      const currentSize = 5000;
      const additionalSize = 3000;

      const result = await validateContextSizeLimit(
        "pro-user",
        currentSize,
        additionalSize
      );

      expect(result.canAdd).toBe(true);
      expect(result.currentSize).toBe(5000);
      expect(result.maxAllowed).toBe(10000);
      expect(result.remainingSize).toBe(5000);
    });

    it("should throw an error if user is not found", async () => {
      await expect(
        validateContextSizeLimit("non-existent-user", 100, 100)
      ).rejects.toThrow();
    });
  });

  describe("getUserPlanLimits", () => {
    it("should return all limits for FREE users", async () => {
      const result = await getUserPlanLimits("free-user");

      expect(result.plan).toBe(Plans.FREE);
      expect(result.limits).toEqual(PLAN_LIMITS[Plans.FREE]);
    });

    it("should return all limits for PRO users", async () => {
      const result = await getUserPlanLimits("pro-user");

      expect(result.plan).toBe(Plans.PRO);
      expect(result.limits).toEqual(PLAN_LIMITS[Plans.PRO]);
    });

    it("should throw an error if user is not found", async () => {
      await expect(getUserPlanLimits("non-existent-user")).rejects.toThrow();
    });
  });
});
