import { PrismaClient, IntegrationType } from "@prisma/client";
import {
  createIntegration,
  getIntegrationsByChatbotId,
  updateIntegration,
  toggleIntegrationStatus,
  deleteIntegration,
} from "../integrationModel";

// Mock PrismaClient
jest.mock("@prisma/client", () => {
  const mockCreate = jest.fn();
  const mockFindMany = jest.fn();
  const mockUpdate = jest.fn();
  const mockDelete = jest.fn();

  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      integration: {
        create: mockCreate,
        findMany: mockFindMany,
        update: mockUpdate,
        delete: mockDelete,
      },
    })),
    IntegrationType: {
      WHATSAPP: "WHATSAPP",
      TELEGRAM: "TELEGRAM",
    },
  };
});

const prisma = new PrismaClient();
const mockChatbotId = "mock-chatbot-id";
const mockIntegrationId = "mock-integration-id";

describe("Integration Model", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createIntegration", () => {
    it("should create a new integration with the provided data", async () => {
      const mockIntegration = {
        id: mockIntegrationId,
        platform: IntegrationType.WHATSAPP,
        token: "mock-token",
        isActive: false,
        chatbotId: mockChatbotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.integration.create as jest.Mock).mockResolvedValue(
        mockIntegration
      );

      const result = await createIntegration(
        mockChatbotId,
        IntegrationType.WHATSAPP,
        "mock-token"
      );

      expect(prisma.integration.create).toHaveBeenCalledWith({
        data: {
          platform: IntegrationType.WHATSAPP,
          token: "mock-token",
          isActive: false,
          chatbot: {
            connect: {
              id: mockChatbotId,
            },
          },
        },
      });
      expect(result).toEqual(mockIntegration);
    });
  });

  describe("getIntegrationsByChatbotId", () => {
    it("should return all integrations for a chatbot", async () => {
      const mockIntegrations = [
        {
          id: "integration-1",
          platform: IntegrationType.WHATSAPP,
          token: "token-1",
          isActive: true,
          chatbotId: mockChatbotId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "integration-2",
          platform: IntegrationType.TELEGRAM,
          token: "token-2",
          isActive: false,
          chatbotId: mockChatbotId,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (prisma.integration.findMany as jest.Mock).mockResolvedValue(
        mockIntegrations
      );

      const result = await getIntegrationsByChatbotId(mockChatbotId);

      expect(prisma.integration.findMany).toHaveBeenCalledWith({
        where: {
          chatbotId: mockChatbotId,
        },
      });
      expect(result).toEqual(mockIntegrations);
    });
  });

  describe("updateIntegration", () => {
    it("should update an integration with the provided data", async () => {
      const mockUpdatedIntegration = {
        id: mockIntegrationId,
        platform: IntegrationType.WHATSAPP,
        token: "updated-token",
        isActive: true,
        chatbotId: mockChatbotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.integration.update as jest.Mock).mockResolvedValue(
        mockUpdatedIntegration
      );

      const result = await updateIntegration(mockIntegrationId, {
        token: "updated-token",
        isActive: true,
      });

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: {
          id: mockIntegrationId,
        },
        data: {
          token: "updated-token",
          isActive: true,
        },
      });
      expect(result).toEqual(mockUpdatedIntegration);
    });
  });

  describe("toggleIntegrationStatus", () => {
    it("should toggle the active status of an integration", async () => {
      const mockUpdatedIntegration = {
        id: mockIntegrationId,
        platform: IntegrationType.WHATSAPP,
        token: "mock-token",
        isActive: true,
        chatbotId: mockChatbotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.integration.update as jest.Mock).mockResolvedValue(
        mockUpdatedIntegration
      );

      const result = await toggleIntegrationStatus(mockIntegrationId, true);

      expect(prisma.integration.update).toHaveBeenCalledWith({
        where: {
          id: mockIntegrationId,
        },
        data: {
          isActive: true,
        },
      });
      expect(result).toEqual(mockUpdatedIntegration);
    });
  });

  describe("deleteIntegration", () => {
    it("should delete an integration", async () => {
      const mockDeletedIntegration = {
        id: mockIntegrationId,
        platform: IntegrationType.WHATSAPP,
        token: "mock-token",
        isActive: false,
        chatbotId: mockChatbotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.integration.delete as jest.Mock).mockResolvedValue(
        mockDeletedIntegration
      );

      const result = await deleteIntegration(mockIntegrationId);

      expect(prisma.integration.delete).toHaveBeenCalledWith({
        where: {
          id: mockIntegrationId,
        },
      });
      expect(result).toEqual(mockDeletedIntegration);
    });
  });
});
