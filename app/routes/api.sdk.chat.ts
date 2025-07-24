import type { Route } from "./+types/api.sdk.chat";
import { data as json } from "react-router";
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
import { handleCorsPreflight, jsonWithCors } from "~/middleware/cors";
import { db } from "../utils/db.server";
import type { Chatbot } from "@prisma/client";

/**
 * Chat conversation endpoint for SDK
 * Handles chat messages with streaming support using Server-Sent Events
 * Falls back to regular JSON response when streaming is disabled
 */
export const action = async ({ request }: Route.ActionArgs) => {
  // Handle CORS preflight OPTIONS request
  if (request.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  try {
    // Extract and authenticate API key
    const apiKey = extractApiKeyFromRequest(request);
    if (!apiKey) {
      return jsonWithCors({ error: "API key required" }, { status: 401 });
    }

    const authResult = await authenticateApiKey(apiKey);
    const { user } = authResult.apiKey;

    // Parse request body
    const body = await request.json();
    const { chatbotId, message, sessionId } = body;

    if (!chatbotId || !message || !sessionId) {
      return jsonWithCors(
        {
          error: "Missing required fields: chatbotId, message, sessionId",
        },
        { status: 400 }
      );
    }

    // Verify chatbot ownership and get chatbot data
    // Find chatbot by slug/name for the authenticated user
    const chatbots = await db.chatbot.findMany({
      where: {
        userId: user.id,
      },
    });

    // Find chatbot by slug or ID
    const chatbot = chatbots.find(
      (bot: Chatbot) => bot.id === chatbotId || bot.slug === chatbotId
    );

    if (!chatbot) {
      return jsonWithCors(
        { error: "Chatbot not found or not accessible for this user" },
        { status: 400 }
      );
    }

    // Get visitor IP for rate limiting
    const visitorIp =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Get or create conversation
    let conversation = await getConversationBySessionId(sessionId);
    if (!conversation) {
      conversation = await createConversation({
        chatbotId,
        visitorIp,
        visitorId: sessionId, // Use sessionId as visitorId for SDK
      });
    }

    // Add user message to conversation
    await addUserMessage(conversation.id, message, visitorIp);

    // Get conversation history for AI context
    const messages = await getMessagesByConversationId(conversation.id);
    const aiMessages = messages.map((msg) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    }));

    // Check if streaming is enabled for this chatbot
    if (chatbot.enableStreaming) {
      // Return streaming response
      return createStreamingResponse(chatbot, aiMessages, conversation.id);
    } else {
      // Return regular JSON response
      const response = await processChatMessage(
        chatbot,
        aiMessages,
        conversation.id
      );
      return jsonWithCors({
        success: true,
        response: response.content,
        sessionId,
        conversationId: conversation.id,
      });
    }
  } catch (error) {
    console.error("Chat endpoint error:", error);

    if (error instanceof RateLimitError) {
      return jsonWithCors({ error: error.message }, { status: 429 });
    }

    if (error instanceof Response) {
      return new Response(error.body, {
        status: error.status,
        headers: {
          ...Object.fromEntries(error.headers?.entries() || []),
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Accept",
        },
      });
    }

    return jsonWithCors({ error: "Internal server error" }, { status: 500 });
  }
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
        const responseContent = await processStreamingMessage(
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
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
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

    return json(
      { content: response.content },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Accept",
        },
      }
    );
  } catch (error) {
    console.error("Error processing chat message:", error);
    return json(
      { error: "Failed to process message" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, X-API-Key, Accept",
        },
      }
    );
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
  return json(
    { error: "This endpoint only supports POST requests" },
    { status: 405 }
  );
};
