import { PrismaClient } from "@prisma/client";
import type { Integration, IntegrationType } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Creates a new integration for a chatbot
 * @param chatbotId The ID of the chatbot to add the integration to
 * @param platform The type of integration platform (WHATSAPP, TELEGRAM)
 * @param token Optional authentication token for the integration
 * @param whatsappData Optional WhatsApp-specific configuration data
 * @returns The created integration
 */
export async function createIntegration(
  chatbotId: string,
  platform: IntegrationType,
  token?: string,
  whatsappData?: {
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookVerifyToken?: string;
  }
): Promise<Integration> {
  return prisma.integration.create({
    data: {
      platform,
      token,
      isActive: false, // Default to inactive until configured properly
      // WhatsApp-specific fields
      phoneNumberId: whatsappData?.phoneNumberId,
      businessAccountId: whatsappData?.businessAccountId,
      webhookVerifyToken: whatsappData?.webhookVerifyToken,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
    },
  });
}

/**
 * Gets all integrations for a specific chatbot
 * @param chatbotId The ID of the chatbot
 * @returns Array of integrations
 */
export async function getIntegrationsByChatbotId(
  chatbotId: string
): Promise<Integration[]> {
  return prisma.integration.findMany({
    where: {
      chatbotId,
    },
  });
}

/**
 * Updates an existing integration
 * @param id The ID of the integration to update
 * @param data The data to update
 * @returns The updated integration
 */
export async function updateIntegration(
  id: string,
  data: {
    token?: string;
    isActive?: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookVerifyToken?: string;
    lastActivity?: Date;
    errorMessage?: string;
  }
): Promise<Integration> {
  return prisma.integration.update({
    where: {
      id,
    },
    data,
  });
}

/**
 * Toggles the active state of an integration
 * @param id The ID of the integration
 * @param isActive The new active state
 * @returns The updated integration
 */
export async function toggleIntegrationStatus(
  id: string,
  isActive: boolean
): Promise<Integration> {
  return prisma.integration.update({
    where: {
      id,
    },
    data: {
      isActive,
    },
  });
}

/**
 * Updates integration activity and error status
 * @param id The ID of the integration
 * @param lastActivity The timestamp of last activity
 * @param errorMessage Optional error message to store
 * @returns The updated integration
 */
export async function updateIntegrationActivity(
  id: string,
  lastActivity: Date,
  errorMessage?: string
): Promise<Integration> {
  return prisma.integration.update({
    where: {
      id,
    },
    data: {
      lastActivity,
      errorMessage,
    },
  });
}

/**
 * Deletes an integration
 * @param id The ID of the integration to delete
 * @returns The deleted integration
 */
export async function deleteIntegration(id: string): Promise<Integration> {
  return prisma.integration.delete({
    where: {
      id,
    },
  });
}
