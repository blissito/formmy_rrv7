import { ApiKeyType, type ApiKey } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "../../app/utils/db.server";

/**
 * Creates a new API key for a chatbot
 */
export async function createApiKey({
  chatbotId,
  name,
  keyType = ApiKeyType.LIVE,
  rateLimit = 1000,
  allowedDomains = [],
}: {
  chatbotId: string;
  name: string;
  keyType?: ApiKeyType;
  rateLimit?: number;
  allowedDomains?: string[];
}): Promise<ApiKey> {
  // Generate a secure API key
  const key = generateApiKey();

  return db.apiKey.create({
    data: {
      key,
      name,
      keyType,
      chatbotId,
      rateLimit,
      allowedDomains,
      isActive: true,
      requestCount: 0,
      monthlyRequests: 0,
    },
  });
}

/**
 * Gets all API keys for a chatbot
 */
export async function getApiKeysByChatbotId(
  chatbotId: string
): Promise<ApiKey[]> {
  return db.apiKey.findMany({
    where: { chatbotId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Gets all API keys for a user's chatbots
 */
export async function getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
  return db.apiKey.findMany({
    where: {
      chatbot: { userId },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Gets the first active API key for a chatbot, or creates one if none exists
 */
export async function getOrCreateDefaultApiKey(
  chatbotId: string,
  chatbotName: string = "Chatbot"
): Promise<ApiKey> {
  // Try to find an existing active API key for this chatbot
  const existingKey = await db.apiKey.findFirst({
    where: {
      chatbotId,
      isActive: true,
    },
    orderBy: { createdAt: "asc" }, // Get the oldest one (first created)
  });

  if (existingKey) {
    return existingKey;
  }

  // Create a new default API key for the chatbot
  return createApiKey({
    chatbotId,
    name: `${chatbotName} Default Key`,
    keyType: ApiKeyType.LIVE,
  });
}

/**
 * Gets an API key by ID
 */
export async function getApiKeyById(id: string): Promise<ApiKey | null> {
  return db.apiKey.findUnique({
    where: { id },
  });
}

/**
 * Gets an API key by key value
 */
export async function getApiKeyByKey(key: string): Promise<ApiKey | null> {
  return db.apiKey.findUnique({
    where: { key },
    include: {
      chatbot: true,
    },
  });
}

/**
 * Updates an API key
 */
export async function updateApiKey(
  id: string,
  data: Partial<
    Omit<ApiKey, "id" | "key" | "chatbotId" | "createdAt" | "updatedAt">
  >
): Promise<ApiKey> {
  return db.apiKey.update({
    where: { id },
    data,
  });
}

/**
 * Deactivates an API key
 */
export async function deactivateApiKey(id: string): Promise<ApiKey> {
  return db.apiKey.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Deletes an API key
 */
export async function deleteApiKey(id: string): Promise<ApiKey> {
  return db.apiKey.delete({
    where: { id },
  });
}

/**
 * Generates a secure API key
 */
function generateApiKey(): string {
  // Generate a secure random string FRMY?
  return `formmy_${nanoid(7)}`;
}

/**
 * Regenerates an API key (creates new key value but keeps same record)
 */
export async function regenerateApiKey(id: string): Promise<ApiKey> {
  const newKey = generateApiKey();

  return db.apiKey.update({
    where: { id },
    data: {
      key: newKey,
      lastUsedAt: null,
    },
  });
}
