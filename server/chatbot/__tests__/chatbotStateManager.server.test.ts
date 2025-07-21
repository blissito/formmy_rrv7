import { describe, it, expect, vi, beforeEach } from "vitest";
import { ChatbotStatus } from "@prisma/client";
import {
  validateStateTransition,
  changeChatbotState,
  activateChatbot,
  deactivateChatbot,
  setToDraftMode,
  markChatbotAsDeleted,
  getChatbotState,
  isChatbotInState,
  isChatbotActive,
} from "../chatbotStateManager";

// Mock db
vi.mock("~/utils/db.server", () => {
  const mockChatbot = {
    id: "mock-id",
    status: "DRAFT",
    isActive: false,
  };

  return {
    db: {
      chatbot: {
        findUnique: vi.fn().mockImplementation(({ where }) => {
          if (where.id === "non-existent-id") {
            return Promise.resolve(null);
          }
          return Promise.resolve(mockChatbot);
        }),
        update: vi.fn().mockImplementation(({ data }) => {
          return Promise.resolve({
            ...mockChatbot,
            ...data,
          });
        }),
      },
    },
  };
});

describe("Chatbot State Manager", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("validateStateTransition", () => {
    it("should allow valid transitions", () => {
      expect(
        validateStateTransition(ChatbotStatus.DRAFT, ChatbotStatus.ACTIVE)
      ).toEqual({ isValid: true });
      expect(
        validateStateTransition(ChatbotStatus.ACTIVE, ChatbotStatus.INACTIVE)
      ).toEqual({ isValid: true });
      expect(
        validateStateTransition(ChatbotStatus.INACTIVE, ChatbotStatus.ACTIVE)
      ).toEqual({ isValid: true });
    });

    it("should reject invalid transitions", () => {
      const result = validateStateTransition(
        ChatbotStatus.DELETED,
        ChatbotStatus.ACTIVE
      );
      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("INVALID_STATE_TRANSITION");
    });
  });

  describe("changeChatbotState", () => {
    it("should change chatbot state when transition is valid", async () => {
      const result = await changeChatbotState("mock-id", ChatbotStatus.ACTIVE);
      expect(result.status).toBe(ChatbotStatus.ACTIVE);
      expect(result.isActive).toBe(true);
    });

    it("should throw error when chatbot is not found", async () => {
      await expect(
        changeChatbotState("non-existent-id", ChatbotStatus.ACTIVE)
      ).rejects.toThrow("Chatbot with ID non-existent-id not found");
    });
  });

  describe("State change convenience functions", () => {
    it("should activate a chatbot", async () => {
      const result = await activateChatbot("mock-id");
      expect(result.status).toBe(ChatbotStatus.ACTIVE);
      expect(result.isActive).toBe(true);
    });

    it("should deactivate a chatbot", async () => {
      const result = await deactivateChatbot("mock-id");
      expect(result.status).toBe(ChatbotStatus.INACTIVE);
      expect(result.isActive).toBe(false);
    });

    it("should set a chatbot to draft mode", async () => {
      const result = await setToDraftMode("mock-id");
      expect(result.status).toBe(ChatbotStatus.DRAFT);
      expect(result.isActive).toBe(false);
    });

    it("should mark a chatbot as deleted", async () => {
      const result = await markChatbotAsDeleted("mock-id");
      expect(result.status).toBe(ChatbotStatus.DELETED);
      expect(result.isActive).toBe(false);
    });
  });

  describe("State query functions", () => {
    it("should get chatbot state", async () => {
      const state = await getChatbotState("mock-id");
      expect(state).toEqual({
        status: ChatbotStatus.DRAFT,
        isActive: false,
      });
    });

    it("should check if chatbot is in a specific state", async () => {
      const isInDraft = await isChatbotInState("mock-id", ChatbotStatus.DRAFT);
      const isInActive = await isChatbotInState(
        "mock-id",
        ChatbotStatus.ACTIVE
      );
      expect(isInDraft).toBe(true);
      expect(isInActive).toBe(false);
    });

    it("should check if chatbot is active", async () => {
      const isActive = await isChatbotActive("mock-id");
      expect(isActive).toBe(false);
    });
  });
});
