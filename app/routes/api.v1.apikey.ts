import type { Route } from "./+types/api.v1.apikey";
import { Effect, pipe } from "effect";

type ApiError = {
  _tag: "ApiError";
  status: number;
  message: string;
  details?: string;
};
import { getOrCreateDefaultApiKey } from "server/chatbot/apiKeyModel.server";
import { db } from "~/utils/db.server";

// Helper function to create error responses
const createErrorResponse = (
  status: number,
  error: string,
  details?: unknown
) => {
  const responseBody = {
    success: false,
    error,
  };

  if (details) {
    Object.assign(responseBody, { details });
  }

  return new Response(JSON.stringify(responseBody), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};

// Helper function to create success response
const createSuccessResponse = (data: unknown) =>
  new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
    },
  });

// Type for API key response data
type ApiKeyResponse = {
  id: string;
  key: string;
  name: string;
  keyType: string;
  isActive: boolean;
  rateLimit: number;
  requestCount: number;
  monthlyRequests: number;
  lastUsedAt: string | null;
  createdAt: string;
};

/**
 * Gets or creates the default API key for a chatbot
 */
const handleApiKeyRequest = async (request: Request) => {
  const url = new URL(request.url);
  const chatbotId = url.searchParams.get("chatbotId");

  if (!chatbotId) {
    return createErrorResponse(400, "Chatbot ID is required");
  }

  const program = pipe(
    Effect.tryPromise({
      try: () =>
        db.chatbot.findUnique({
          where: { id: chatbotId },
          select: { name: true },
        }),
      catch: (error) =>
        Effect.fail(
          error instanceof Error
            ? error
            : new Error(`Failed to fetch chatbot: ${error}`)
        ),
    }),
    Effect.flatMap((chatbot) =>
      chatbot
        ? Effect.succeed(chatbot)
        : Effect.fail(new Error(`Chatbot not found`))
    ),
    Effect.flatMap((chatbot) =>
      Effect.tryPromise({
        try: () => getOrCreateDefaultApiKey(chatbotId, chatbot.name),
        catch: (error) => Effect.fail(error),
      })
    ),
    Effect.match({
      onSuccess: (apiKey) => createSuccessResponse(apiKey),
      onFailure: (error) => {
        const errorMessage =
          error instanceof Error ? error.message : "An unknown error occurred";
        return createErrorResponse(500, errorMessage);
      },
    })
  );

  return Effect.runPromise(program);
};

export const loader = async ({
  request,
}: Route.LoaderArgs): Promise<Response> => {
  return handleApiKeyRequest(request);
};

/**
 * Handle POST requests for API key operations (regenerate, create new, etc.)
 */
export const action = async ({
  request,
}: Route.ActionArgs): Promise<Response> => {
  return handleApiKeyRequest(request);
};
