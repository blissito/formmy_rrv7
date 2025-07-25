import type { Route } from "./+types/api.sdk.chat";
import { Effect, pipe } from "effect";
import {
  authenticateApiKey,
  extractApiKeyFromRequest,
} from "server/chatbot/apiKeyAuth.server";
import {
  createConversation,
  getConversationBySessionId,
} from "server/chatbot/conversationModel.server";
import {
  addUserMessage,
  addAssistantMessage,
  getMessagesByConversationId,
  RateLimitError,
} from "server/chatbot/messageModel.server";
import { FALLBACK_MODELS } from "../utils/aiModels";
import { db } from "../utils/db.server";
import type { Chatbot } from "@prisma/client";

/**
 * Chat conversation endpoint for SDK
 * Handles chat messages with streaming support using Server-Sent Events
 * Falls back to regular JSON response when streaming is disabled
 */
export const action = ({ request }: Route.ActionArgs) => {
  const result = pipe(
    // Extraer y autenticar API key
    Effect.gen(function* () {
      const apiKey = extractApiKeyFromRequest(request);
      if (!apiKey) {
        return yield* Effect.fail({
          status: 401,
          error: "API key required",
        });
      }
      return yield* Effect.tryPromise({
        try: () => authenticateApiKey(apiKey),
        catch: (error) => {
          console.error("Error in API key authentication:", error);
          return {
            status: 500,
            error: "Internal server error during authentication",
          };
        },
      });
    }),
    Effect.flatMap((authResult) =>
      Effect.gen(function* () {
        const { user } = authResult.apiKey;

        // Parsear el cuerpo de la petición
        const body = yield* Effect.tryPromise({
          try: () => request.json(),
          catch: () => ({} as any), // En caso de error, devolvemos un objeto vacío
        });

        // Validar que el body sea un objeto
        if (typeof body !== "object" || body === null) {
          return yield* Effect.fail({
            status: 400,
            error: "Invalid request body",
          });
        }

        const { chatbotId, message, sessionId } = body as any;

        // Validar campos requeridos
        if (!chatbotId || !message || !sessionId) {
          return yield* Effect.fail({
            status: 400,
            error: "Missing required fields: chatbotId, message, sessionId",
          });
        }

        // Obtener chatbots del usuario
        const chatbots = yield* Effect.promise(() =>
          db.chatbot.findMany({
            where: { userId: user.id },
            // @todo only active ones
          })
        );

        // Buscar chatbot por ID o slug
        const chatbot = chatbots.find(
          (bot: Chatbot) => bot.id === chatbotId || bot.slug === chatbotId
        );

        if (!chatbot) {
          return yield* Effect.fail({
            status: 400,
            error: "Chatbot not found or not accessible for this user",
          });
        }

        // Obtener IP del visitante
        const visitorIp =
          request.headers.get("x-forwarded-for") ||
          request.headers.get("x-real-ip") ||
          "unknown";

        // Obtener o crear conversación
        let conversation = yield* Effect.promise(() =>
          getConversationBySessionId(sessionId)
        );

        if (!conversation) {
          conversation = yield* Effect.promise(() =>
            createConversation({
              chatbotId,
              visitorIp,
              visitorId: sessionId,
            })
          );
        }

        // Agregar mensaje del usuario
        yield* Effect.promise(() =>
          addUserMessage(conversation.id, message, visitorIp)
        );

        // Obtener historial de la conversación
        const messages = yield* Effect.promise(() =>
          getMessagesByConversationId(conversation.id)
        );

        const aiMessages = messages.map((msg) => ({
          role: msg.role.toLowerCase(),
          content: msg.content,
        }));

        // Manejar respuesta según si streaming está habilitado
        if (chatbot.enableStreaming) {
          return {
            type: "stream",
            chatbot,
            messages: aiMessages,
            conversationId: conversation.id,
          } as const;
        } else {
          const response = yield* Effect.promise(() =>
            processChatMessage(chatbot, aiMessages, conversation.id)
          );
          return {
            type: "json",
            response: response.content,
            sessionId,
            conversationId: conversation.id,
          } as const;
        }
      })
    ),
    // Mapear el resultado a una respuesta HTTP
    Effect.match({
      onSuccess: (result) => {
        if (result.type === "stream") {
          return createStreamingResponse(
            result.chatbot,
            result.messages,
            result.conversationId
          );
        } else {
          return new Response(
            JSON.stringify({
              success: true,
              response: result.response,
              sessionId: result.sessionId,
              conversationId: result.conversationId,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
      onFailure: (error) => {
        console.error("Chat endpoint error:", error);

        // Usar Effect.try para manejar los errores de forma funcional
        const errorResponse = Effect.runSync(
          Effect.match(error, {
            onSuccess: (response) => response, // No debería pasar ya que es un error
            onFailure: (error) => {
              if (error instanceof RateLimitError) {
                return new Response(JSON.stringify({ error: error.message }), {
                  status: 429,
                  headers: { "Content-Type": "application/json" },
                });
              }

              if (error instanceof Response) {
                return error;
              }

              const status =
                typeof error === "object" && error !== null && "status" in error
                  ? (error as any).status
                  : 500;

              const message =
                typeof error === "object" && error !== null && "error" in error
                  ? (error as any).error
                  : "Internal server error";

              return new Response(JSON.stringify({ error: message }), {
                status,
                headers: { "Content-Type": "application/json" },
              });
            },
          })
        );

        // Si algo falla en el manejo de errores, devolver un error genérico
        return (
          errorResponse ||
          new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          })
        );
      },
    })
  );
  return Effect.runSync(result);
};

/**
 * Creates a streaming response using Server-Sent Events
 * NOTE: This function does NOT use Effect as per instructions for streaming endpoints
 */
function createStreamingResponse(
  chatbot: any,
  messages: any[],
  conversationId: string
): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send start event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "start" })}\n\n`)
        );

        // Process streaming message
        await processStreamingMessage(
          chatbot,
          messages,
          conversationId,
          (chunk) => {
            // Send chunk event
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "chunk",
                  content: chunk,
                })}\n\n`
              )
            );
          }
        );

        // Send end event
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "end" })}\n\n`)
        );
        controller.close();
      } catch (error) {
        console.error("Streaming error:", error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "error",
              message: "Error processing message",
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      // CORS ya manejado por el middleware Express
    },
  });
}

/**
 * Processes a chat message and returns a regular response
 */
async function processChatMessage(
  chatbot: any,
  messages: any[],
  conversationId: string
): Promise<{ content: string }> {
  const startTime = Date.now();

  try {
    const response = await callOpenRouterAPI(chatbot, messages, false);
    const responseTime = Date.now() - startTime;

    // Save assistant response to conversation
    await addAssistantMessage(
      conversationId,
      response.content,
      response.tokens,
      responseTime
    );

    // Retornar directamente el objeto en lugar de usar json() para evitar errores de tipado
    return { content: response.content };
  } catch (error) {
    console.error("Error processing chat message:", error);
    // Retornar un objeto con el formato esperado
    return { content: "Error: Failed to process message" };
  }
}

/**
 * Processes a streaming chat message with callback for chunks
 */
async function processStreamingMessage(
  chatbot: any,
  messages: any[],
  conversationId: string,
  onChunk: (chunk: string) => void
): Promise<string> {
  const startTime = Date.now();
  let fullContent = "";

  try {
    const response = await callOpenRouterAPI(chatbot, messages, true, onChunk);
    const responseTime = Date.now() - startTime;

    fullContent = response.content;

    // Save assistant response to conversation
    await addAssistantMessage(
      conversationId,
      fullContent,
      response.tokens,
      responseTime
    );

    return fullContent;
  } catch (error) {
    console.error("Error processing streaming message:", error);
    throw new Error("Failed to process streaming message");
  }
}

/**
 * Calls OpenRouter API with fallback model support
 */
async function callOpenRouterAPI(
  chatbot: any,
  messages: any[],
  stream: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokens?: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OpenRouter API key not configured");
  }

  let currentModel =
    chatbot.aiModel || "mistralai/mistral-small-3.2-24b-instruct";
  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const requestBody = {
        model: currentModel,
        messages: messages,
        temperature: chatbot.temperature || 0.7,
        stream: stream,
      };

      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://formmy.app",
            "X-Title": "Formmy Chatbot SDK",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (response.status === 429) {
        // Rate limit - try fallback model
        const fallbackModel =
          FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
        if (fallbackModel && fallbackModel !== currentModel) {
          console.log(
            `[SDK Chat] Rate limit on ${currentModel}, switching to ${fallbackModel}`
          );
          currentModel = fallbackModel;
          attempts++;
          continue;
        } else {
          throw new Error("Rate limit reached on all available models");
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `[SDK Chat] OpenRouter error ${response.status}: ${errorText}`
        );
        throw new Error(`OpenRouter API error: ${errorText}`);
      }

      if (stream) {
        // Handle streaming response
        return await handleStreamingResponse(response, onChunk);
      } else {
        // Handle regular response
        const data = await response.json();
        return {
          content:
            data.choices?.[0]?.message?.content || "No response generated",
          tokens: data.usage?.total_tokens,
        };
      }
    } catch (error) {
      console.error(`[SDK Chat] Error on attempt ${attempts + 1}:`, error);
      attempts++;

      if (attempts >= maxAttempts) {
        throw error;
      }

      // Try fallback model on error
      const fallbackModel =
        FALLBACK_MODELS[currentModel as keyof typeof FALLBACK_MODELS];
      if (fallbackModel && fallbackModel !== currentModel) {
        currentModel = fallbackModel;
      }
    }
  }

  throw new Error("Maximum attempts reached");
}

/**
 * Handles streaming response from OpenRouter
 */
async function handleStreamingResponse(
  response: Response,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; tokens?: number }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body stream");
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: "

          if (data === "[DONE]") {
            return { content: fullContent };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;
              if (onChunk) {
                onChunk(content);
              }
            }
          } catch (parseError) {
            // Ignore invalid JSON lines
            console.warn("[SDK Chat] Invalid SSE line:", line);
          }
        }
      }
    }

    return { content: fullContent };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Handle GET requests (not supported)
 */
export const loader = async () => {
  return new Response(
    JSON.stringify({ error: "This endpoint only supports POST requests" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};
