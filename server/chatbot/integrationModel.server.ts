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
  },
  googleCalendarData?: {
    calendarId?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  },
  stripeData?: {
    stripeApiKey?: string;
    stripePublishableKey?: string;
    stripeWebhookSecret?: string;
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
      // Google Calendar-specific fields
      calendarId: googleCalendarData?.calendarId,
      clientId: googleCalendarData?.clientId,
      clientSecret: googleCalendarData?.clientSecret,
      redirectUri: googleCalendarData?.redirectUri,
      // Stripe-specific fields
      stripeApiKey: stripeData?.stripeApiKey,
      stripePublishableKey: stripeData?.stripePublishableKey,
      stripeWebhookSecret: stripeData?.stripeWebhookSecret,
      chatbot: {
        connect: {
          id: chatbotId,
        },
      },
    },
  });
}

/**
 * Creates or updates an integration for a chatbot (prevents duplicates)
 * @param chatbotId The ID of the chatbot to add the integration to
 * @param platform The type of integration platform
 * @param token Optional authentication token for the integration
 * @param whatsappData Optional WhatsApp-specific configuration data
 * @param googleCalendarData Optional Google Calendar-specific configuration data
 * @param stripeData Optional Stripe-specific configuration data
 * @returns The created or updated integration
 */
export async function upsertIntegration(
  chatbotId: string,
  platform: IntegrationType,
  token?: string,
  whatsappData?: {
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookVerifyToken?: string;
  },
  googleCalendarData?: {
    calendarId?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
  },
  stripeData?: {
    stripeApiKey?: string;
    stripePublishableKey?: string;
    stripeWebhookSecret?: string;
  }
): Promise<Integration> {
  // Check if integration already exists to preserve its active state
  const existingIntegration = await prisma.integration.findUnique({
    where: {
      platform_chatbotId: {
        platform,
        chatbotId,
      },
    },
  });

  const updateData = {
    token,
    // Only reset to inactive if it's a new integration or if required credentials are missing
    isActive: existingIntegration?.isActive || false,
    // WhatsApp-specific fields
    phoneNumberId: whatsappData?.phoneNumberId,
    businessAccountId: whatsappData?.businessAccountId,
    webhookVerifyToken: whatsappData?.webhookVerifyToken,
    // Google Calendar-specific fields
    calendarId: googleCalendarData?.calendarId,
    clientId: googleCalendarData?.clientId,
    clientSecret: googleCalendarData?.clientSecret,
    redirectUri: googleCalendarData?.redirectUri,
    // Stripe-specific fields
    stripeApiKey: stripeData?.stripeApiKey,
    stripePublishableKey: stripeData?.stripePublishableKey,
    stripeWebhookSecret: stripeData?.stripeWebhookSecret,
  };

  return prisma.integration.upsert({
    where: {
      platform_chatbotId: {
        platform,
        chatbotId,
      },
    },
    update: updateData,
    create: {
      platform,
      chatbotId,
      isActive: false, // New integrations start as inactive
      ...updateData,
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
    refreshToken?: string;
    isActive?: boolean;
    phoneNumberId?: string;
    businessAccountId?: string;
    webhookVerifyToken?: string;
    calendarId?: string;
    clientId?: string;
    clientSecret?: string;
    redirectUri?: string;
    stripeApiKey?: string;
    stripePublishableKey?: string;
    stripeWebhookSecret?: string;
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

/**
 * Gets the active Stripe integration for a chatbot
 * @param chatbotId The ID of the chatbot
 * @returns The active Stripe integration or null if not found
 */
export async function getActiveStripeIntegration(
  chatbotId: string
): Promise<Integration | null> {
  return prisma.integration.findFirst({
    where: {
      chatbotId,
      platform: "STRIPE",
      isActive: true,
      stripeApiKey: {
        not: null
      }
    },
  });
}
