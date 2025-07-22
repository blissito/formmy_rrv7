import { MessageRole, ConversationStatus } from "@prisma/client";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  createMessage,
  getMessagesByConversationId,
  checkRateLimit,
  RateLimitError,
  addUserMessage,
  addAssistantMessage,
  addSystemMessage,
  getMessageCount,
} from "../messageModel";
import {
  incrementMessageCount,
  getConversationById,
} from "../conversationModel";
import { db } from "~/utils/db.server";

// Mock the database and other dependencies
vi.mock("~/utils/db.server", () => ({
  db: {
    message: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
      count: vi.fn(),
    },
  },
}));

vi.mock("../conversationModel", () => ({
  incrementMessageCount: vi.fn(),
  getConversationById: vi.fn(),
}));

describe("Message Model", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("createMessage", () => {
    it("should create a message and increment message count", async () => {
      // Mock data
      const mockMessage = {
        id: "message-id",
        conversationId: "conversation-id",
        content: "Hello, how can I help you?",
        role: MessageRole.ASSISTANT,
        tokens: 15,
        responseTime: 250,
        createdAt: new Date(),
      };

      const mockConversation = {
        id: "conversation-id",
        status: ConversationStatus.ACTIVE,
      };

      // Setup mocks
      (db.message.create as any).mockResolvedValue(mockMessage);
      (incrementMessageCount as any).mockResolvedValue({
        id: "conversation-id",
        messageCount: 1,
      });
      (getConversationById as any).mockResolvedValue(mockConversation);

      // Call the function
      const result = await createMessage({
        conversationId: "conversation-id",
        content: "Hello, how can I help you?",
        role: MessageRole.ASSISTANT,
        tokens: 15,
        responseTime: 250,
      });

      // Assertions
      expect(getConversationById).toHaveBeenCalledWith("conversation-id");
      expect(db.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conversation-id",
          content: "Hello, how can I help you?",
          role: MessageRole.ASSISTANT,
          tokens: 15,
          responseTime: 250,
        },
      });
      expect(incrementMessageCount).toHaveBeenCalledWith("conversation-id");
      expect(result).toEqual(mockMessage);
    });

    it("should throw error if conversation is not active", async () => {
      // Mock an inactive conversation
      const mockConversation = {
        id: "conversation-id",
        status: ConversationStatus.COMPLETED,
      };

      (getConversationById as any).mockResolvedValue(mockConversation);

      // Call the function and expect it to throw
      await expect(
        createMessage({
          conversationId: "conversation-id",
          content: "Hello",
          role: MessageRole.USER,
        })
      ).rejects.toThrow("Cannot add message to a completed conversation");
    });

    it("should throw error if conversation does not exist", async () => {
      // Mock conversation not found
      (getConversationById as any).mockResolvedValue(null);

      // Call the function and expect it to throw
      await expect(
        createMessage({
          conversationId: "non-existent-id",
          content: "Hello",
          role: MessageRole.USER,
        })
      ).rejects.toThrow("Conversation with ID non-existent-id not found");
    });

    it("should throw rate limit error when limit is exceeded", async () => {
      // Mock an active conversation
      const mockConversation = {
        id: "conversation-id",
        status: ConversationStatus.ACTIVE,
      };

      (getConversationById as any).mockResolvedValue(mockConversation);

      // Set up IP for rate limiting
      const ip = "192.168.1.1";

      // First two requests should succeed
      await createMessage({
        conversationId: "conversation-id",
        content: "Message 1",
        role: MessageRole.USER,
        visitorIp: ip,
      });

      await createMessage({
        conversationId: "conversation-id",
        content: "Message 2",
        role: MessageRole.USER,
        visitorIp: ip,
      });

      // Third request should be rate limited
      await expect(
        createMessage({
          conversationId: "conversation-id",
          content: "Message 3",
          role: MessageRole.USER,
          visitorIp: ip,
        })
      ).rejects.toThrow(RateLimitError);
    });
  });

  describe("getMessagesByConversationId", () => {
    it("should return messages for a conversation", async () => {
      // Mock data
      const mockMessages = [
        {
          id: "message-id-1",
          conversationId: "conversation-id",
          content: "Hello",
          role: MessageRole.USER,
          createdAt: new Date(),
        },
        {
          id: "message-id-2",
          conversationId: "conversation-id",
          content: "How can I help you?",
          role: MessageRole.ASSISTANT,
          createdAt: new Date(),
        },
      ];

      // Setup mocks
      (db.message.findMany as any).mockResolvedValue(mockMessages);

      // Call the function
      const result = await getMessagesByConversationId("conversation-id");

      // Assertions
      expect(db.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: "conversation-id" },
        orderBy: { createdAt: "asc" },
      });
      expect(result).toEqual(mockMessages);
    });
  });

  describe("checkRateLimit", () => {
    it("should allow requests within rate limit", () => {
      const ip = "192.168.1.1";

      // First request should be allowed
      expect(checkRateLimit(ip, 2, 1000)).toBe(true);

      // Second request should be allowed
      expect(checkRateLimit(ip, 2, 1000)).toBe(true);

      // Third request should be rate limited
      expect(checkRateLimit(ip, 2, 1000)).toBe(false);
    });

    it("should allow requests if no IP is provided", () => {
      expect(checkRateLimit("", 2, 1000)).toBe(true);
    });
  });

  describe("helper message functions", () => {
    beforeEach(() => {
      // Mock an active conversation
      const mockConversation = {
        id: "conversation-id",
        status: ConversationStatus.ACTIVE,
      };

      (getConversationById as any).mockResolvedValue(mockConversation);

      // Mock message creation
      (db.message.create as any).mockImplementation(({ data }) => ({
        id: "new-message-id",
        ...data,
        createdAt: new Date(),
      }));
    });

    it("should add user message", async () => {
      await addUserMessage("conversation-id", "Hello", "192.168.1.1");

      expect(db.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conversation-id",
          content: "Hello",
          role: MessageRole.USER,
        },
      });
    });

    it("should add assistant message with tracking", async () => {
      await addAssistantMessage("conversation-id", "Hello there", 10, 150);

      expect(db.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conversation-id",
          content: "Hello there",
          role: MessageRole.ASSISTANT,
          tokens: 10,
          responseTime: 150,
        },
      });
    });

    it("should add system message", async () => {
      await addSystemMessage("conversation-id", "System notification");

      expect(db.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: "conversation-id",
          content: "System notification",
          role: MessageRole.SYSTEM,
        },
      });
    });
  });

  describe("getMessageCount", () => {
    it("should return the count of messages in a conversation", async () => {
      // Setup mock
      (db.message.count as any).mockResolvedValue(5);

      // Call the function
      const count = await getMessageCount("conversation-id");

      // Assertions
      expect(db.message.count).toHaveBeenCalledWith({
        where: { conversationId: "conversation-id" },
      });
      expect(count).toBe(5);
    });
  });
});
