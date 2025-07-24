import type { Route } from "./+types/api.v1.apikey";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { getOrCreateDefaultApiKey } from "server/chatbot/apiKeyModel.server";

/**
 * Gets or creates the default API key for the authenticated user
 */
export const loader = async ({
  request,
}: Route.LoaderArgs): Promise<Response> => {
  console.log("API key loader called");

  try {
    const user = await getUserOrRedirect(request);
    console.log("User authenticated:", user.id);

    // Get or create the default API key for this user
    const apiKey = await getOrCreateDefaultApiKey(user.id);
    console.log("API key retrieved/created:", apiKey.id);

    const responseData = {
      success: true,
      data: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        keyType: apiKey.keyType,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        requestCount: apiKey.requestCount,
        monthlyRequests: apiKey.monthlyRequests,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API key loader error:", error);

    // If it's already a Response (like a redirect), return it
    if (error instanceof Response) {
      return error;
    }

    // For any other error, return a 500 response
    const errorData = {
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    };

    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};

/**
 * Handle POST requests for API key operations (regenerate, etc.)
 */
export const action = async ({
  request,
}: Route.ActionArgs): Promise<Response> => {
  console.log("API key action called");

  try {
    const user = await getUserOrRedirect(request);
    console.log("User authenticated for action:", user.id);

    // For now, just return the current API key
    // In the future, this could handle regeneration, creation of new keys, etc.
    const apiKey = await getOrCreateDefaultApiKey(user.id);

    const responseData = {
      success: true,
      data: {
        id: apiKey.id,
        key: apiKey.key,
        name: apiKey.name,
        keyType: apiKey.keyType,
        isActive: apiKey.isActive,
        rateLimit: apiKey.rateLimit,
        requestCount: apiKey.requestCount,
        monthlyRequests: apiKey.monthlyRequests,
        lastUsedAt: apiKey.lastUsedAt?.toISOString() || null,
        createdAt: apiKey.createdAt.toISOString(),
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("API key action error:", error);

    // If it's already a Response (like a redirect), return it
    if (error instanceof Response) {
      return error;
    }

    // For any other error, return a 500 response
    const errorData = {
      success: false,
      error: "Internal server error",
      details: error instanceof Error ? error.message : String(error),
    };

    return new Response(JSON.stringify(errorData), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
