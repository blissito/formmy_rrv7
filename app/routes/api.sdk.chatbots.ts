import type { Route } from "./+types/api.sdk.chatbots";
import { data as json } from "react-router";
import {
  authenticateApiKey,
  extractApiKeyFromRequest,
} from "server/chatbot/apiKeyAuth.server";
import { db } from "../utils/db.server";

/**
 * Chatbot discovery endpoint for SDK
 * Fetches user's active chatbots with streaming configuration
 * Supports slug-based filtering
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const apiKey = extractApiKeyFromRequest(request);
    if (!apiKey) {
      return json({ error: "API key required" }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    const url = new URL(request.url);
    const slug = url.searchParams.get("slug");

    const chatbots = await db.chatbot.findMany({
      where: {
        userId: authResult.apiKey.user.id,
        isActive: true,
        status: "ACTIVE",
        ...(slug && { slug }),
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        welcomeMessage: true,
        primaryColor: true,
        theme: true,
        enableStreaming: true,
        streamingSpeed: true,
        personality: true,
        aiModel: true,
        temperature: true,
        conversationCount: true,
        monthlyUsage: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // If slug was provided but no chatbot found, return 404
    if (slug && chatbots.length === 0) {
      return json(
        { error: `Chatbot with slug '${slug}' not found` },
        { status: 404 }
      );
    }

    return json({
      success: true,
      data: {
        chatbots: chatbots.map((chatbot) => ({
          id: chatbot.id,
          slug: chatbot.slug,
          name: chatbot.name,
          description: chatbot.description,
          welcomeMessage: chatbot.welcomeMessage,
          primaryColor: chatbot.primaryColor,
          theme: chatbot.theme,
          streaming: {
            enabled: chatbot.enableStreaming,
            speed: chatbot.streamingSpeed,
          },
          ai: {
            model: chatbot.aiModel,
            personality: chatbot.personality,
            temperature: chatbot.temperature,
          },
          stats: {
            conversationCount: chatbot.conversationCount,
            monthlyUsage: chatbot.monthlyUsage,
          },
          timestamps: {
            createdAt: chatbot.createdAt.toISOString(),
            updatedAt: chatbot.updatedAt.toISOString(),
          },
        })),
        user: {
          id: authResult.apiKey.user.id,
          plan: authResult.apiKey.user.plan,
        },
        meta: {
          total: chatbots.length,
          filtered: !!slug,
          slug: slug,
        },
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Chatbot discovery error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};

/**
 * Handle POST requests for creating new chatbots (if needed in the future)
 */
export const action = async ({ request }: Route.ActionArgs) => {
  try {
    const apiKey = extractApiKeyFromRequest(request);
    if (!apiKey) {
      return json({ error: "API key required" }, { status: 401 });
    }

    await authenticateApiKey(apiKey);

    return json({ error: "Method not implemented" }, { status: 501 });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }
    console.error("Chatbot action error:", error);
    return json({ error: "Internal server error" }, { status: 500 });
  }
};
