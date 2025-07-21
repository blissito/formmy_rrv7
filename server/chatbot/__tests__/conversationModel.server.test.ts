import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { db } from "~/utils/db.server";
import {
  createConversation,
  getConversationById,
  updateConversationStatus,
  handleConversationTimeouts,
} from "../conversationModel";
import { ConversationStatus, ChatbotStatus, Plans } from "@prisma/client";
import { validateMonthlyConversationLimit } from "../planLimits";

// Mock the database
vi.mock("~/utils/db.server", () => ({
  db: {
    user: {
      findUnique: vi.fn(),
    },
    chatbot: {
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    conversation: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

// Mock the chatbotModel
vi.mock("../chatbotModel", () => ({
  incrementConversationCount: vi.fn().mockResolvedValue({}),
}));

// Mock the planLimits
vi.mock("../planLimits", () => ({
  validateMonthlyConversationLimit: vi.fn(),
  PLAN_LIMITS: {
    FREE: {
      maxConversationsPerMonth: 100,
    },
    PRO: {
      maxConversationsPerMonth: Infinity,
    },
  },
}));

describe("Conversation Model", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createConversation", () => {
    it("should create a new conversation when limits are not exceeded", async () => {
      // Mock the validateMonthlyConversationLimit function
      vi.mocked(validateMonthlyConversationLimit).mockResolvedValue({
        canCreate: true,
        currentCount: 50,
        maxAllowed: 100,
        remainingCount: 50,
      });

      // Mock the conversation creation
      const mockConversation = {
        id: "conv123",
        sessionId: "session123",
        chatbotId: "chatbot123",
        visitorIp: "127.0.0.1",
        status: ConversationStatus.ACTIVE,
        startedAt: new Date(),
        messageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      vi.mocked(db.conversation.create).mockResolvedValue(mockConversation);

      // Call the function
      const result = await createConversation({
        chatbotId: "chatbot123",
        visitorIp: "127.0.0.1",
      });

      // Verify the result
      expect(result).toEqual(mockConversation);
      expect(validateMonthlyConversationLimit).toHaveBeenCalledWith(
        "chatbot123"
      );
      expect(db.conversation.create).toHaveBeenCalled();
    });

    it("should throw an error when monthly limits are exceeded", async () => {
      // Mock the validateMonthlyConversationLimit function to return false
      vi.mocked(validateMonthlyConversationLimit).mockResolvedValue({
        canCreate: false,
        currentCount: 100,
        maxAllowed: 100,
        remainingCount: 0,
      });

      // Call the function and expect it to throw
      await expect(
        createConversation({
          chatbotId: "chatbot123",
          visitorIp: "127.0.0.1",
        })
      ).rejects.toThrow(/límite mensual/);

      // Verify that the conversation was not created
      expect(db.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe("updateConversationStatus", () => {
    it("should update the conversation status", async () => {
      // Mock the conversation update
      const mockUpdatedConversation = {
        id: "conv123",
        status: ConversationStatus.COMPLETED,
        endedAt: new Date(),
      };
      vi.mocked(db.conversation.update).mockResolvedValue(
        mockUpdatedConversation
      );

      // Call the function
      const result = await updateConversationStatus(
        "conv123",
        ConversationStatus.COMPLETED
      );

      // Verify the result
      expect(result).toEqual(mockUpdatedConversation);
      expect(db.conversation.update).toHaveBeenCalledWith({
        where: { id: "conv123" },
        data: {
          status: ConversationStatus.COMPLETED,
          endedAt: expect.any(Date),
        },
      });
    });
  });

  describe("handleConversationTimeouts", () => {
    it("should mark inactive conversations as timed out", async () => {
      // Mock finding inactive conversations
      const mockInactiveConversations = [{ id: "conv1" }, { id: "conv2" }];
      vi.mocked(db.conversation.findMany).mockResolvedValue(
        mockInactiveConversations
      );

      // Mock updating the conversations
      vi.mocked(db.conversation.updateMany).mockResolvedValue({ count: 2 });

      // Call the function
      const result = await handleConversationTimeouts(30);

      // Verify the result
      expect(result).toBe(2);
      expect(db.conversation.findMany).toHaveBeenCalled();
      expect(db.conversation.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: ["conv1", "conv2"],
          },
        },
        data: {
          status: ConversationStatus.TIMEOUT,
          endedAt: expect.any(Date),
        },
      });
    });

    it("should return 0 when no inactive conversations are found", async () => {
      // Mock finding no inactive conversations
      vi.mocked(db.conversation.findMany).mockResolvedValue([]);

      // Call the function
      const result = await handleConversationTimeouts(30);

      // Verify the result
      expect(result).toBe(0);
      expect(db.conversation.findMany).toHaveBeenCalled();
      expect(db.conversation.updateMany).not.toHaveBeenCalled();
    });
  });
});
