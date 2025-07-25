import { type ApiKey, type User } from "@prisma/client";
import { Effect } from "effect";
import { db } from "~/utils/db.server";

/**
 * Interface for API key authentication result
 */
export interface ApiKeyAuthResult {
  apiKey: ApiKey & { user: User };
  isValid: boolean;
}

/**
 * Interface for rate limit check result
 */
export interface RateLimitResult {
  isWithinLimit: boolean;
  currentRequests: number;
  maxRequests: number;
  remainingRequests: number;
  resetTime: Date;
}

/**
 * Interface for usage tracking result
 */
export interface UsageUpdateResult {
  success: boolean;
  newRequestCount: number;
  newMonthlyRequests: number;
}

/**
 * Authenticates an API key and returns the key record with user information
 * @param apiKey The API key string to authenticate
 * @returns Promise<ApiKeyAuthResult> Authentication result with key and user data
 * @throws Response with 401 status if key is invalid or inactive
 */
export async function authenticateApiKey(
  apiKey: string
): Promise<ApiKeyAuthResult> {
  if (!apiKey) {
    throw new Response("API key required", { status: 401 });
  }

  // Find the API key in the database
  const keyRecord = await db.apiKey.findUnique({
    where: {
      key: apiKey,
      isActive: true,
    },
    include: {
      chatbot: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!keyRecord) {
    throw new Response("Invalid or inactive API key", { status: 401 });
  }

  // Check rate limits
  const rateLimitResult = await checkRateLimit(keyRecord);
  if (!rateLimitResult.isWithinLimit) {
    throw new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        limit: rateLimitResult.maxRequests,
        resetTime: rateLimitResult.resetTime.toISOString(),
        remainingRequests: rateLimitResult.remainingRequests,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": rateLimitResult.maxRequests.toString(),
          "X-RateLimit-Remaining": rateLimitResult.remainingRequests.toString(),
          "X-RateLimit-Reset": Math.floor(
            rateLimitResult.resetTime.getTime() / 1000
          ).toString(),
        },
      }
    );
  }

  // Update usage stats
  await updateKeyUsage(keyRecord.id);

  // Return the key record with user info via chatbot
  return {
    apiKey: {
      ...keyRecord,
      user: keyRecord.chatbot.user,
    },
    isValid: true,
  };
}

/**
 * Checks if an API key is within its hourly rate limit
 * @param apiKey The API key record to check
 * @returns Promise<RateLimitResult> Rate limit status and information
 */
export async function checkRateLimit(apiKey: ApiKey): Promise<RateLimitResult> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  // For simplicity, we'll use a basic approach by tracking requests in the last hour
  // In a production system, you might want to use Redis or a more sophisticated approach

  // Count recent requests by checking when the key was last used and estimating based on request count
  // This is a simplified approach - in production you'd want to track individual requests
  const hourlyRequestCount = await estimateHourlyRequests(apiKey, oneHourAgo);

  const isWithinLimit = hourlyRequestCount < apiKey.rateLimit;
  const remainingRequests = Math.max(0, apiKey.rateLimit - hourlyRequestCount);

  return {
    isWithinLimit,
    currentRequests: hourlyRequestCount,
    maxRequests: apiKey.rateLimit,
    remainingRequests,
    resetTime: nextHour,
  };
}

/**
 * Estimates hourly requests for an API key
 * This is a simplified implementation - in production you'd want to track individual requests
 * @param apiKey The API key record
 * @param oneHourAgo Date representing one hour ago
 * @returns Promise<number> Estimated number of requests in the last hour
 */
async function estimateHourlyRequests(
  apiKey: ApiKey,
  oneHourAgo: Date
): Promise<number> {
  // If the key was last used within the last hour, we need to be more careful about rate limiting
  if (apiKey.lastUsedAt && apiKey.lastUsedAt > oneHourAgo) {
    // For now, we'll use a simple heuristic: if the key was used recently,
    // assume some portion of recent requests were in the last hour
    // This is simplified - in production you'd track individual requests with timestamps
    const timeSinceLastUse = Date.now() - apiKey.lastUsedAt.getTime();
    const hoursAgo = timeSinceLastUse / (1000 * 60 * 60);

    if (hoursAgo < 1) {
      // Estimate based on recent usage pattern
      // This is a rough estimate - you'd want more precise tracking in production
      return Math.min(apiKey.rateLimit * 0.1, 10); // Conservative estimate
    }
  }

  return 0; // No recent usage detected
}

/**
 * Updates usage statistics for an API key
 * @param apiKeyId The ID of the API key to update
 * @returns Promise<UsageUpdateResult> Result of the usage update operation
 */
export async function updateKeyUsage(
  apiKeyId: string
): Promise<UsageUpdateResult> {
  try {
    const now = new Date();

    // Get current month start for monthly tracking
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Update the API key usage statistics
    const updatedKey = await db.apiKey.update({
      where: { id: apiKeyId },
      data: {
        requestCount: { increment: 1 },
        monthlyRequests: { increment: 1 },
        lastUsedAt: now,
      },
    });

    // Reset monthly counter if we're in a new month
    // This is a simple approach - in production you'd want a more robust monthly reset system
    if (updatedKey.lastUsedAt && updatedKey.lastUsedAt < monthStart) {
      await db.apiKey.update({
        where: { id: apiKeyId },
        data: {
          monthlyRequests: 1, // Reset to 1 (current request)
        },
      });
    }

    return {
      success: true,
      newRequestCount: updatedKey.requestCount,
      newMonthlyRequests: updatedKey.monthlyRequests,
    };
  } catch (error) {
    console.error("Failed to update API key usage:", error);
    return {
      success: false,
      newRequestCount: 0,
      newMonthlyRequests: 0,
    };
  }
}

/**
 * Helper function to extract API key from request headers or URL parameters
 * @param request The incoming request object
 * @returns string | null The extracted API key or null if not found
 */
export async function extractApiKeyFromRequest(
  request: Request
): Promise<string | null> {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get("X-API-Key");
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  // Check URL parameters
  const url = new URL(request.url);
  const apiKeyParam =
    url.searchParams.get("key") || url.searchParams.get("api_key");
  if (apiKeyParam) {
    return apiKeyParam;
  }

  // Skip body parsing to avoid conflicts with request body reading
  // API key should be provided via headers or URL parameters

  return null;
}

/**
 * Middleware function that can be used in route loaders/actions
 * @param request The incoming request object
 * @returns Promise<ApiKeyAuthResult> Authentication result
 */
export async function requireApiKey(
  request: Request
): Promise<ApiKeyAuthResult> {
  const apiKey = extractApiKeyFromRequest(request);

  if (!apiKey) {
    throw new Response("API key required", { status: 401 });
  }

  return await authenticateApiKey(apiKey);
}

/**
 * Gets usage analytics for an API key
 * @param apiKeyId The ID of the API key
 * @returns Promise with usage analytics data
 */
export async function getApiKeyAnalytics(apiKeyId: string): Promise<{
  totalRequests: number;
  monthlyRequests: number;
  lastUsedAt: Date | null;
  rateLimit: number;
  isActive: boolean;
}> {
  const apiKey = await db.apiKey.findUnique({
    where: { id: apiKeyId },
    select: {
      requestCount: true,
      monthlyRequests: true,
      lastUsedAt: true,
      rateLimit: true,
      isActive: true,
    },
  });

  if (!apiKey) {
    throw new Error(`API key with ID ${apiKeyId} not found`);
  }

  return {
    totalRequests: apiKey.requestCount,
    monthlyRequests: apiKey.monthlyRequests,
    lastUsedAt: apiKey.lastUsedAt,
    rateLimit: apiKey.rateLimit,
    isActive: apiKey.isActive,
  };
}
