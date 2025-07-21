import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createChatbot,
  updateChatbot,
  addContextItem,
  removeContextItem,
  updateChatbotStatus,
  incrementConversationCount,
  resetMonthlyUsage,
  getChatbotById,
  getChatbotBySlug,
  getChatbotsByUserId,
  deleteChatbot,
} from "../chatbotModel.server";
import { ChatbotStatus } from "@prisma/client";
import type { Chatbot } from "@prisma/client";
import { db } from "~/utils/db.server";

// Mock db
vi.mock("~/utils/db.server", () => {
  const mockChatbot = {
    id: "mock-id",
    name: "Test Chatbot",
    slug: "test-chatbot-123456",
    description: "Test description",
    userId: "user-123",
    personality: "Friendly",
    welcomeMessage: "Hello!",
    aiModel: "mistralai/mistral-small-3.2-24b-instruct",
    primaryColor: "#FF5733",
    theme: "light",
    status: "DRAFT",
    isActive: false,
    conversationCount: 0,
    monthlyUsage: 0,
    contextSizeKB: 0,
    contexts: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return {
    db: {
      chatbot: {
        create: vi.fn().mockResolvedValue(mockChatbot),
        update: vi.fn().mockImplementation((args) => {
          if (args.data.contexts) {
            return Promise.resolve({
              ...mockChatbot,
              contexts: args.data.contexts,
              contextSizeKB:
                args.data.contextSizeKB || mockChatbot.contextSizeKB,
            });
          }
          return Promise.resolve({ ...mockChatbot, ...args.data });
        }),
        findUnique: vi.fn().mockResolvedValue(mockChatbot),
        findMany: vi.fn().mockResolvedValue([mockChatbot]),
        delete: vi.fn().mockResolvedValue(mockChatbot),
      },
    },
  };
});

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: () => "123456",
}));

describe("Chatbot Model", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a chatbot with basic fields", async () => {
    const chatbot = await createChatbot({
      name: "Test Chatbot",
      description: "Test description",
      userId: "user-123",
      personality: "Friendly",
      welcomeMessage: "Hello!",
      primaryColor: "#FF5733",
      theme: "light",
    });

    expect(chatbot).toBeDefined();
    expect(chatbot.name).toBe("Test Chatbot");
    expect(chatbot.slug).toContain("test-chatbot-");
    expect(chatbot.status).toBe("DRAFT");
    expect(chatbot.isActive).toBe(false);
  });

  it("should update a chatbot", async () => {
    const updatedChatbot = await updateChatbot("mock-id", {
      name: "Updated Chatbot",
      description: "Updated description",
    });

    expect(updatedChatbot.name).toBe("Updated Chatbot");
    expect(updatedChatbot.description).toBe("Updated description");
  });

  it("should add a context item to a chatbot", async () => {
    const contextItem = {
      type: "TEXT" as const,
      title: "Test Context",
      content: "This is a test context",
      sizeKB: 1,
    };

    const updatedChatbot = await addContextItem("mock-id", contextItem);

    expect(updatedChatbot.contexts.length).toBe(1);
    expect(updatedChatbot.contexts[0].title).toBe("Test Context");
    expect(updatedChatbot.contextSizeKB).toBe(1);
  });

  it("should remove a context item from a chatbot", async () => {
    // Mock the chatbot with a context item
    const mockChatbotWithContext = {
      id: "mock-id",
      contexts: [
        {
          id: "123456",
          type: "TEXT",
          title: "Test Context",
          content: "This is a test context",
          sizeKB: 1,
          createdAt: new Date(),
        },
      ],
      contextSizeKB: 1,
    };

    // Override the findUnique mock for this test
    vi.mocked(db.chatbot.findUnique).mockResolvedValueOnce(
      mockChatbotWithContext as unknown as Chatbot
    );

    const chatbot = await removeContextItem("mock-id", "123456");

    expect(chatbot.contexts.length).toBe(0);
    expect(chatbot.contextSizeKB).toBe(0);
  });

  it("should update chatbot status", async () => {
    const updatedChatbot = await updateChatbotStatus(
      "mock-id",
      ChatbotStatus.ACTIVE,
      true
    );

    expect(updatedChatbot.status).toBe("ACTIVE");
    expect(updatedChatbot.isActive).toBe(true);
  });

  it("should increment conversation count", async () => {
    const updatedChatbot = await incrementConversationCount("mock-id");

    expect(updatedChatbot.conversationCount).toBe(1);
    expect(updatedChatbot.monthlyUsage).toBe(1);
  });

  it("should reset monthly usage", async () => {
    const updatedChatbot = await resetMonthlyUsage("mock-id");

    expect(updatedChatbot.monthlyUsage).toBe(0);
  });

  it("should get a chatbot by ID", async () => {
    const chatbot = await getChatbotById("mock-id");

    expect(chatbot).toBeDefined();
    expect(chatbot?.id).toBe("mock-id");
  });

  it("should get a chatbot by slug", async () => {
    const chatbot = await getChatbotBySlug("test-chatbot-123456");

    expect(chatbot).toBeDefined();
    expect(chatbot?.slug).toBe("test-chatbot-123456");
  });

  it("should get all chatbots for a user", async () => {
    const chatbots = await getChatbotsByUserId("user-123");

    expect(chatbots).toBeInstanceOf(Array);
    expect(chatbots.length).toBe(1);
    expect(chatbots[0].userId).toBe("user-123");
  });

  it("should delete a chatbot", async () => {
    const deletedChatbot = await deleteChatbot("mock-id");

    expect(deletedChatbot).toBeDefined();
    expect(deletedChatbot.id).toBe("mock-id");
  });
});
