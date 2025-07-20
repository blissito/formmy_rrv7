import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ConversationStatus, MessageRole } from "@prisma/client";
import { db } from "~/utils/db.server";
import {
  exportConversationsToJSON,
  exportConversationsToCSV,
  exportConversations,
  ExportError,
} from "../conversationExport";
import { getMessagesByConversationId } from "../messageModel";

// Mock the database and message model
vi.mock("~/utils/db.server", () => ({
  db: {
    conversation: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("../messageModel", () => ({
  getMessagesByConversationId: vi.fn(),
}));

describe("Conversation Export", () => {
  const mockChatbotId = "chatbot123";
  const mockStartDate = new Date("2025-01-01");
  const mockEndDate = new Date("2025-01-31");

  const mockConversations = [
    {
      id: "conv1",
      sessionId: "session1",
      visitorIp: "192.168.1.1",
      visitorId: "visitor1",
      status: ConversationStatus.COMPLETED,
      startedAt: new Date("2025-01-15T10:00:00Z"),
      endedAt: new Date("2025-01-15T10:15:00Z"),
      messageCount: 5,
      createdAt: new Date("2025-01-15T10:00:00Z"),
      updatedAt: new Date("2025-01-15T10:15:00Z"),
      chatbotId: mockChatbotId,
    },
    {
      id: "conv2",
      sessionId: "session2",
      visitorIp: "192.168.1.2",
      visitorId: "visitor2",
      status: ConversationStatus.ACTIVE,
      startedAt: new Date("2025-01-16T11:00:00Z"),
      endedAt: null,
      messageCount: 3,
      createdAt: new Date("2025-01-16T11:00:00Z"),
      updatedAt: new Date("2025-01-16T11:10:00Z"),
      chatbotId: mockChatbotId,
    },
  ];

  const mockMessages = {
    conv1: [
      {
        id: "msg1",
        content: "Hello",
        role: MessageRole.USER,
        tokens: null,
        responseTime: null,
        createdAt: new Date("2025-01-15T10:00:00Z"),
        conversationId: "conv1",
      },
      {
        id: "msg2",
        content: "Hi there! How can I help you?",
        role: MessageRole.ASSISTANT,
        tokens: 15,
        responseTime: 500,
        createdAt: new Date("2025-01-15T10:00:05Z"),
        conversationId: "conv1",
      },
    ],
    conv2: [
      {
        id: "msg3",
        content: "What are your business hours?",
        role: MessageRole.USER,
        tokens: null,
        responseTime: null,
        createdAt: new Date("2025-01-16T11:00:00Z"),
        conversationId: "conv2",
      },
      {
        id: "msg4",
        content: "Our business hours are 9am-5pm Monday to Friday.",
        role: MessageRole.ASSISTANT,
        tokens: 20,
        responseTime: 600,
        createdAt: new Date("2025-01-16T11:00:06Z"),
        conversationId: "conv2",
      },
    ],
  };

  beforeEach(() => {
    // Reset mocks
    vi.resetAllMocks();

    // Setup default mock implementations
    (db.conversation.findMany as any).mockResolvedValue(mockConversations);
    (getMessagesByConversationId as any).mockImplementation(
      (convId: string) => {
        return Promise.resolve(
          mockMessages[convId as keyof typeof mockMessages] || []
        );
      }
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("exportConversationsToJSON", () => {
    it("should export conversations to JSON format", async () => {
      const result = await exportConversationsToJSON({
        chatbotId: mockChatbotId,
        format: "json",
      });

      // Parse the result to verify it's valid JSON
      const parsed = JSON.parse(result);

      // Verify the database was called with correct parameters
      expect(db.conversation.findMany).toHaveBeenCalledWith({
        where: { chatbotId: mockChatbotId },
        orderBy: { createdAt: "desc" },
      });

      // Verify the messages were fetched
      expect(getMessagesByConversationId).toHaveBeenCalledWith("conv1");
      expect(getMessagesByConversationId).toHaveBeenCalledWith("conv2");

      // Verify the structure of the exported data
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe("conv1");
      expect(parsed[0].messages).toHaveLength(2);
      expect(parsed[1].id).toBe("conv2");
      expect(parsed[1].messages).toHaveLength(2);
    });

    it("should apply date filters when provided", async () => {
      await exportConversationsToJSON({
        chatbotId: mockChatbotId,
        format: "json",
        startDate: mockStartDate,
        endDate: mockEndDate,
      });

      // Verify the database was called with date filters
      expect(db.conversation.findMany).toHaveBeenCalledWith({
        where: {
          chatbotId: mockChatbotId,
          createdAt: {
            gte: mockStartDate,
            lte: mockEndDate,
          },
        },
        orderBy: { createdAt: "desc" },
      });
    });

    it("should exclude messages when includeMessages is false", async () => {
      await exportConversationsToJSON({
        chatbotId: mockChatbotId,
        format: "json",
        includeMessages: false,
      });

      // Verify the messages were not fetched
      expect(getMessagesByConversationId).not.toHaveBeenCalled();
    });

    it("should handle errors gracefully", async () => {
      // Mock a database error
      (db.conversation.findMany as any).mockRejectedValue(
        new Error("Database error")
      );

      await expect(
        exportConversationsToJSON({
          chatbotId: mockChatbotId,
          format: "json",
        })
      ).rejects.toThrow(ExportError);
    });
  });

  describe("exportConversationsToCSV", () => {
    it("should export conversations to CSV format", async () => {
      const result = await exportConversationsToCSV({
        chatbotId: mockChatbotId,
        format: "csv",
      });

      // Verify the result is a string and contains expected CSV headers
      expect(typeof result).toBe("string");
      expect(result).toContain(
        "id,sessionId,visitorIp,visitorId,status,startedAt,endedAt,messageCount,createdAt,updatedAt"
      );
      expect(result).toContain("# MESSAGES");
      expect(result).toContain(
        "conversationId,messageId,role,content,tokens,responseTime,createdAt"
      );

      // Verify data is included
      expect(result).toContain("conv1,session1");
      expect(result).toContain("conv2,session2");
    });

    it("should handle special characters in CSV content", async () => {
      // Mock a conversation with special characters
      const specialConversations = [
        {
          ...mockConversations[0],
          visitorId: "visitor,with,commas",
        },
      ];

      (db.conversation.findMany as any).mockResolvedValue(specialConversations);

      const result = await exportConversationsToCSV({
        chatbotId: mockChatbotId,
        format: "csv",
      });

      // Verify the special characters are properly escaped
      expect(result).toContain('"visitor,with,commas"');
    });

    it("should return empty CSV with headers when no conversations exist", async () => {
      (db.conversation.findMany as any).mockResolvedValue([]);

      const result = await exportConversationsToCSV({
        chatbotId: mockChatbotId,
        format: "csv",
      });

      // Verify the result has headers but no data
      expect(result).toBe(
        "id,sessionId,visitorIp,visitorId,status,startedAt,endedAt,messageCount,createdAt,updatedAt\n"
      );
    });
  });

  describe("exportConversations", () => {
    it("should handle JSON format correctly", async () => {
      // Create a spy on the module's exportConversationsToJSON function
      const jsonSpy = vi.spyOn(
        { exportConversationsToJSON },
        "exportConversationsToJSON"
      );

      // Just test that the function returns a string for JSON format
      const result = await exportConversations({
        chatbotId: mockChatbotId,
        format: "json",
      });

      expect(typeof result).toBe("string");
    });

    it("should handle CSV format correctly", async () => {
      // Just test that the function returns a string for CSV format
      const result = await exportConversations({
        chatbotId: mockChatbotId,
        format: "csv",
      });

      expect(typeof result).toBe("string");
    });

    it("should throw an error for unsupported formats", async () => {
      await expect(
        exportConversations({
          chatbotId: mockChatbotId,
          format: "xml" as any,
        })
      ).rejects.toThrow(ExportError);
    });
  });
});
