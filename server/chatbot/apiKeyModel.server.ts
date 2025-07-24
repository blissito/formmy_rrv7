import { ApiKeyType, type ApiKey } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "../../app/utils/db.server";

/**
 * Creates a new API key for a user
 */
export async function createApiKey({
  userId,
  name,
  keyType = ApiKeyType.LIVE,
  rateLimit = 1000,
  allowedDomains = [],
}: {
  userId: string;
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
      userId,
      rateLimit,
      allowedDomains,
      isActive: true,
      requestCount: 0,
      monthlyRequests: 0,
    },
  });
}

/**
 * Gets all API keys for a user
 */
export async function getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
  return db.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Gets the first active API key for a user, or creates one if none exists
 */
export async function getOrCreateDefaultApiKey(
  userId: string
): Promise<ApiKey> {
  // Try to find an existing active API key
  const existingKey = await db.apiKey.findFirst({
    where: {
      userId,
      isActive: true,
    },
    orderBy: { createdAt: "asc" }, // Get the oldest one (first created)
  });

  if (existingKey) {
    return existingKey;
  }

  // Create a new default API key
  return createApiKey({
    userId,
    name: "Default SDK Key",
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
 * Updates an API key
 */
export async function updateApiKey(
  id: string,
  data: Partial<
    Omit<ApiKey, "id" | "key" | "userId" | "createdAt" | "updatedAt">
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
  // Generate a secure random key with prefix
  const prefix = "fmy_"; // Formmy prefix
  const randomPart = nanoid(32); // 32 character random string
  return `${prefix}${randomPart}`;
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
      requestCount: 0, // Reset usage stats
      monthlyRequests: 0,
    },
  });
}
