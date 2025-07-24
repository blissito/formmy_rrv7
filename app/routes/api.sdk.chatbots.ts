import type { Route } from "./+types/api.sdk.chatbots";
import { data as json } from "react-router";
import {
  authenticateApiKey,
  extractApiKeyFromRequest,
} from "server/chatbot/apiKeyAuth.server";
import { db } from "../utils/db.server";
import { Effect, pipe } from "effect";

/**
 * Chatbot discovery endpoint for SDK
 * Fetches user's active chatbots with streaming configuration
 * Supports slug-based filtering
 */
export const loader = async ({ request }: Route.LoaderArgs) => {
  const program = pipe(
    Effect.succeed(request),
    Effect.flatMap((req) => {
      const apiKey = extractApiKeyFromRequest(req);
      return apiKey
        ? Effect.succeed(apiKey)
        : Effect.fail(new Response("API key required", { status: 401 }));
    }),
    Effect.flatMap((apiKey) =>
      Effect.tryPromise({
        try: () => authenticateApiKey(apiKey),
        catch: (error) =>
          error instanceof Response
            ? error
            : new Response("Authentication failed", { status: 401 }),
      })
    ),
    Effect.flatMap((authResult) => {
      const url = new URL(request.url);
      const slug = url.searchParams.get("slug");

      return Effect.tryPromise({
        try: () =>
          db.chatbot.findMany({
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
          }),
        catch: () => new Response("Database error", { status: 500 }),
      }).pipe(
        Effect.map((chatbots) => ({
          authResult,
          chatbots,
          slug,
        }))
      );
    }),
    Effect.map(({ authResult, chatbots, slug }) => {
      // If slug was provided but no chatbot found, return 404
      if (slug && chatbots.length === 0) {
        return new Response(
          JSON.stringify({ error: `Chatbot with slug '${slug}' not found` }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
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
    }),
    Effect.catchAll((error) => {
      if (error instanceof Response) {
        return Effect.succeed(error);
      }
      console.error("Chatbot discovery error:", error);
      return Effect.succeed(
        json({ error: "Internal server error" }, { status: 500 })
      );
    })
  );

  return Effect.runPromise(program);
};

/**
 * Handle POST requests for creating new chatbots (if needed in the future)
 */
export const action = async ({ request }: Route.ActionArgs) => {
  const program = pipe(
    Effect.succeed(request),
    Effect.flatMap((req) => {
      const apiKey = extractApiKeyFromRequest(req);
      return apiKey
        ? Effect.succeed(apiKey)
        : Effect.fail(new Response("API key required", { status: 401 }));
    }),
    Effect.flatMap((apiKey) =>
      Effect.tryPromise({
        try: () => authenticateApiKey(apiKey),
        catch: (error) =>
          error instanceof Response
            ? error
            : new Response("Authentication failed", { status: 401 }),
      })
    ),
    Effect.flatMap(() =>
      Effect.succeed(json({ error: "Method not implemented" }, { status: 501 }))
    ),
    Effect.catchAll((error) => {
      if (error instanceof Response) {
        return Effect.succeed(error);
      }
      console.error("Chatbot action error:", error);
      return Effect.succeed(
        json({ error: "Internal server error" }, { status: 500 })
      );
    })
  );

  return Effect.runPromise(program);
};
