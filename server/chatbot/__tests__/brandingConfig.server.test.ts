import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getChatbotBrandingConfig,
  getChatbotBrandingConfigById,
} from "../brandingConfig";

// Mock planLimits
vi.mock("../planLimits", () => {
  return {
    shouldShowBranding: vi.fn().mockImplementation((userId) => {
      if (userId === "free-user") {
        return Promise.resolve(true);
      } else if (userId === "pro-user") {
        return Promise.resolve(false);
      } else {
        throw new Error(`Usuario con ID ${userId} no encontrado`);
      }
    }),
  };
});

// Mock db
vi.mock("~/utils/db.server", () => {
  return {
    db: {
      chatbot: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "free-chatbot") {
            return Promise.resolve({ userId: "free-user" });
          } else if (where.id === "pro-chatbot") {
            return Promise.resolve({ userId: "pro-user" });
          } else {
            return Promise.resolve(null);
          }
        }),
      },
    },
  };
});

describe("Branding Config", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getChatbotBrandingConfig", () => {
    it("should show branding for FREE users", async () => {
      const config = await getChatbotBrandingConfig("free-user");

      expect(config.showBranding).toBe(true);
      expect(config.brandingText).toBe("Powered by Formmy");
      expect(config.brandingLink).toBe("https://formmy.app");
      expect(config.brandingLogo).toBeDefined();
    });

    it("should not show branding for PRO users", async () => {
      const config = await getChatbotBrandingConfig("pro-user");

      expect(config.showBranding).toBe(false);
      expect(config.brandingText).toBeUndefined();
      expect(config.brandingLink).toBeUndefined();
      expect(config.brandingLogo).toBeUndefined();
    });

    it("should throw an error if user is not found", async () => {
      await expect(
        getChatbotBrandingConfig("non-existent-user")
      ).rejects.toThrow();
    });
  });

  describe("getChatbotBrandingConfigById", () => {
    it("should show branding for FREE user chatbots", async () => {
      const config = await getChatbotBrandingConfigById("free-chatbot");

      expect(config.showBranding).toBe(true);
      expect(config.brandingText).toBe("Powered by Formmy");
    });

    it("should not show branding for PRO user chatbots", async () => {
      const config = await getChatbotBrandingConfigById("pro-chatbot");

      expect(config.showBranding).toBe(false);
    });

    it("should throw an error if chatbot is not found", async () => {
      await expect(
        getChatbotBrandingConfigById("non-existent-chatbot")
      ).rejects.toThrow();
    });
  });
});
