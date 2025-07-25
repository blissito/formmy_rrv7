import type { Route } from "./+types/api.sdk.chat";
import {
  authenticateApiKey,
  extractApiKeyFromRequest,
  type ApiKeyAuthResult,
} from "server/chatbot/apiKeyAuth.server";
import {
  createConversation,
  getConversationBySessionId,
} from "server/chatbot/conversationModel.server";
import {
  addUserMessage,
  addAssistantMessage,
  getMessagesByConversationId,
} from "server/chatbot/messageModel.server";
import { FALLBACK_MODELS } from "../utils/aiModels";
import { db } from "../utils/db.server";
import type { Chatbot, User } from "@prisma/client";

// Type for the chat message request body
interface ChatMessageRequest {
  chatbotId: string;
  message: string;
  sessionId: string;
  stream?: boolean;
}

// Type for the successful auth result
interface AuthSuccessResult {
  status: "success";
  apiKey: ApiKeyAuthResult["apiKey"];
  user: User;
}

// Type for error responses
interface ErrorResponse {
  status: number;
  error: string;
  details?: any;
}

// Type for the chat message response
interface ChatMessageResponse {
  type: "stream" | "json";
  chatbot?: Chatbot;
  messages?: Array<{ role: string; content: string }>;
  response?: string;
  sessionId?: string;
  conversationId: string;
}

/**
 * Chat conversation endpoint for SDK
 * Handles chat messages with streaming support using Server-Sent Events
 * Falls back to regular JSON response when streaming is disabled
 */
export const action = async ({
  request,
}: Route.ActionArgs): Promise<Response> => {
  try {
    // Extract and authenticate API key
    const apiKey = await extractApiKeyFromRequest(request);

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const authResult = await authenticateApiKey(apiKey);
    const { user } = authResult.apiKey;

    // Parse request body
    let body: ChatMessageRequest;
    try {
      const contentType = request.headers.get("content-type") || "";
      const text = await request.text();

      if (!text.trim()) {
        return new Response(JSON.stringify({ error: "Empty request body" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        // Handle form data
        const params = new URLSearchParams(text);
        body = {
          chatbotId: params.get("chatbotId") || "",
          message: params.get("message") || "",
          sessionId: params.get("sessionId") || "",
          stream: params.get("stream") === "true",
        };
      } else {
        // Handle JSON
        body = JSON.parse(text) as ChatMessageRequest;
      }
    } catch (error) {
      console.error("Error parsing request body:", error);
      return new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: error instanceof Error ? error.message : "Unknown error",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { chatbotId, message, sessionId, stream = false } = body;

    // Validate required fields
    if (!chatbotId || !message || !sessionId) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: chatbotId, message, sessionId",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get user IP from headers
    const forwardedFor = request.headers.get("x-forwarded-for");
    const userIp = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    // Find the chatbot
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId, userId: user.id },
    });

    if (!chatbot) {
      return new Response(JSON.stringify({ error: "Chatbot not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Find or create conversation
    let conversation = await getConversationBySessionId(sessionId);
    if (!conversation) {
      conversation = await createConversation({
        chatbotId,
        visitorIp: userIp,
        visitorId: sessionId,
      });
    }

    // Add user message to conversation
    await addUserMessage(conversation.id, message, userIp);

    // Get conversation history
    const messages = await getMessagesByConversationId(conversation.id);
    const aiMessages = messages.map((msg) => ({
      role: msg.role.toLowerCase(),
      content: msg.content,
    }));

    // Handle response based on whether streaming is enabled
    if (chatbot.enableStreaming && stream) {
      // Create streaming response
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // Add assistant message placeholder
              const assistantMessage = await addAssistantMessage(
                conversation.id,
                "generando..."
              );

              // Process streaming message
              let accumulatedContent = "";

              // Create a streaming callback that yields chunks
              const streamingCallback = (chunk: string) => {
                accumulatedContent += chunk;

                // Send SSE data
                const data = {
                  type: "chunk",
                  content: chunk,
                  conversationId: conversation.id,
                  messageId: assistantMessage.id,
                };

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
                );
              };

              // Use the existing streaming function
              await processStreamingMessage(
                chatbot,
                aiMessages,
                conversation.id,
                streamingCallback
              );

              // Update the assistant message with final content
              await db.message.update({
                where: { id: assistantMessage.id },
                data: { content: accumulatedContent },
              });

              // Send completion signal
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "done",
                    conversationId: conversation.id,
                  })}\n\n`
                )
              );
              controller.close();
            } catch (error) {
              console.error("Streaming error:", error);
              controller.error(error);
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        }
      );
    } else {
      try {
        const response = await processChatMessage(
          chatbot,
          aiMessages,
          conversation.id
        );
        const jsonResponse: ChatMessageResponse = {
          type: "json",
          response: response.content,
          sessionId,
          conversationId: conversation.id,
        };

        return new Response(JSON.stringify(jsonResponse), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error processing chat message:", error);
        return new Response(
          JSON.stringify({ error: "Internal server error" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }
    }
  } catch (error) {
    console.error("Error in chat API:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

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

    return { content: response.content };
  } catch (error) {
    console.error("Error processing chat message:", error);
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
  onChunk?: (chunk: string) => void
): Promise<string> {
  const startTime = Date.now();
  let fullContent = "";

  try {
    const response = await callOpenRouterAPI(
      chatbot,
      messages,
      true,
      onChunk
    );
    const responseTime = Date.now() - startTime;
    
    // Calcular firstTokenLatency si está disponible
    const firstTokenLatency = response.firstTokenLatency 
      ? response.firstTokenLatency - startTime
      : null;

    fullContent = response.content;

    // Save assistant response to conversation
    await addAssistantMessage(
      conversationId,
      fullContent,
      response.tokens,
      responseTime,
      firstTokenLatency ? Math.max(0, firstTokenLatency) : undefined
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
): Promise<{ 
  content: string; 
  tokens?: number;
  firstTokenLatency?: number;
}> {
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
): Promise<{ 
  content: string; 
  tokens?: number;
  firstTokenLatency?: number;
}> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body stream");
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";
  let firstChunkTime: number | null = null;

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
              // Registrar el tiempo del primer chunk
              if (firstChunkTime === null) {
                firstChunkTime = Date.now();
              }
              
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
