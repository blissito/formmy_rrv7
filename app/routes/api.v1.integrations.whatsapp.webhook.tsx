import { data as json } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Effect, Layer } from "effect";
import { IntegrationType } from "@prisma/client";
import {
  WhatsAppService,
  WhatsAppServiceLive,
} from "../../server/integrations/whatsapp/WhatsAppService";
import { WhatsAppConfigLive } from "../../server/integrations/whatsapp/config";
import { WhatsAppHttpClientLive } from "../../server/integrations/whatsapp/httpClient";
import {
  WhatsAppError,
  ValidationError,
  type IncomingMessage,
} from "../../server/integrations/whatsapp/types";
import {
  addWhatsAppUserMessage,
  addWhatsAppAssistantMessage,
} from "../../server/chatbot/messageModel.server";
import {
  getConversationBySessionId,
  createConversation,
} from "../../server/chatbot/conversationModel.server";
import { getChatbotById } from "../../server/chatbot/chatbotModel.server";
import { db } from "../utils/db.server";

// Types for WhatsApp webhook payload
interface WhatsAppWebhookEntry {
  id: string;
  changes: Array<{
    value: {
      messaging_product: "whatsapp";
      metadata: {
        display_phone_number: string;
        phone_number_id: string;
      };
      contacts?: Array<{
        profile: {
          name: string;
        };
        wa_id: string;
      }>;
      messages?: Array<{
        from: string;
        id: string;
        timestamp: string;
        text?: {
          body: string;
        };
        type: "text" | "image" | "document" | "audio" | "video";
        image?: {
          id: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
        document?: {
          id: string;
          filename: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
        audio?: {
          id: string;
          mime_type: string;
          sha256: string;
        };
        video?: {
          id: string;
          mime_type: string;
          sha256: string;
          caption?: string;
        };
      }>;
      statuses?: Array<{
        id: string;
        status: "sent" | "delivered" | "read" | "failed";
        timestamp: string;
        recipient_id: string;
      }>;
    };
    field: "messages";
  }>;
}

interface WhatsAppWebhookPayload {
  object: "whatsapp_business_account";
  entry: WhatsAppWebhookEntry[];
}

/**
 * Loader function - handles GET requests for webhook verification
 * WhatsApp sends a GET request to verify the webhook endpoint
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const verificationEffect = Effect.gen(function* () {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

    yield* Effect.logInfo("Webhook verification request", {
      mode,
      token,
      challenge,
      hasVerifyToken: !!verifyToken,
    });

    // Verify that this is a webhook verification request
    if (mode !== "subscribe") {
      const error = `Invalid mode: ${mode}. Expected 'subscribe'`;
      yield* Effect.logWarning(error);
      return yield* Effect.fail(
        new ValidationError({
          field: "hub.mode",
          value: mode,
          message: error,
        })
      );
    }

    // Verify token matches
    if (token !== verifyToken) {
      const error = `Token verification failed. Received: ${token}, Expected: ${verifyToken}`;
      yield* Effect.logWarning(error);
      return yield* Effect.fail(
        new ValidationError({
          field: "hub.verify_token",
          value: "[REDACTED]", // Don't log the actual tokens
          message: "Token verification failed",
        })
      );
    }

    if (!challenge) {
      const error = "No challenge provided";
      yield* Effect.logWarning(error);
      return yield* Effect.fail(
        new ValidationError({
          field: "hub.challenge",
          value: challenge,
          message: error,
        })
      );
    }

    yield* Effect.logInfo("Webhook verification successful");
    return challenge;
  });

  try {
    const result = await Effect.runPromise(
      verificationEffect.pipe(
        Effect.catchAll((error) =>
          Effect.gen(function* () {
            yield* Effect.logError("Webhook verification failed", { error });
            return yield* Effect.fail(error);
          })
        )
      )
    );

    return new Response(result, {
      status: 200,
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    if (error instanceof ValidationError) {
      return new Response(error.message, { status: 400 });
    }
    return new Response("Verification failed", { status: 500 });
  }
};

/**
 * Action function - handles POST requests for incoming webhooks
 * Processes incoming WhatsApp messages and generates chatbot responses
 */
export const action = async ({ request }: ActionFunctionArgs) => {
  const webhookProcessingEffect = Effect.gen(function* () {
    // Parse the webhook payload
    const payload = yield* Effect.tryPromise({
      try: () => request.json() as Promise<WhatsAppWebhookPayload>,
      catch: (error) =>
        new ValidationError({
          field: "payload",
          value: "invalid",
          message: `Failed to parse webhook payload: ${error}`,
        }),
    });

    yield* Effect.logInfo("Received webhook payload", { payload });

    // Get webhook signature for verification
    const signature = request.headers.get("x-hub-signature-256");

    // Process webhook using WhatsApp service
    const whatsappService = yield* WhatsAppService;

    // Convert payload to the format expected by WhatsApp service
    const incomingMessages = yield* whatsappService.processWebhook(
      payload,
      signature || ""
    );

    // Process each incoming message
    const results = yield* Effect.all(
      incomingMessages.map((message) => processIncomingMessageEffect(message)),
      { concurrency: 5 } // Process up to 5 messages concurrently
    );

    return {
      success: true,
      processed: results.length,
      results,
    };
  });

  // Create the service layer
  const serviceLayer = Layer.mergeAll(
    WhatsAppConfigLive,
    WhatsAppHttpClientLive,
    WhatsAppServiceLive
  );

  try {
    const result = await Effect.runPromise(
      webhookProcessingEffect.pipe(Effect.provide(serviceLayer))
    );

    return json(result);
  } catch (error) {
    console.error("Webhook processing failed:", error);

    if (error instanceof ValidationError) {
      return json(
        {
          success: false,
          error: "Validation failed",
          details: error.message,
        },
        { status: 400 }
      );
    }

    if (error instanceof WhatsAppError) {
      return json(
        {
          success: false,
          error: "WhatsApp API error",
          details: error.message,
        },
        { status: 500 }
      );
    }

    return json(
      {
        success: false,
        error: "Webhook processing failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

/**
 * Process an incoming WhatsApp message using Effect
 */
const processIncomingMessageEffect = (message: IncomingMessage) =>
  Effect.gen(function* () {
    yield* Effect.logInfo("Processing incoming message", {
      messageId: message.messageId,
      from: message.from,
      type: message.type,
    });

    // Find the integration for this phone number
    const integration = yield* findIntegrationByPhoneNumberEffect(message.to);

    if (!integration.isActive) {
      yield* Effect.logWarning("Integration is not active", {
        integrationId: integration.id,
      });
      return yield* Effect.fail(
        new ValidationError({
          field: "integration",
          value: integration.id,
          message: "Integration is not active",
        })
      );
    }

    // Get the chatbot
    const chatbot = yield* Effect.tryPromise({
      try: () => getChatbotById(integration.chatbotId),
      catch: (error) =>
        new ValidationError({
          field: "chatbot",
          value: integration.chatbotId,
          message: `Failed to get chatbot: ${error}`,
        }),
    });

    if (!chatbot) {
      yield* Effect.logError("Chatbot not found", {
        chatbotId: integration.chatbotId,
      });
      return yield* Effect.fail(
        new ValidationError({
          field: "chatbot",
          value: integration.chatbotId,
          message: "Chatbot not found",
        })
      );
    }

    // Create or find conversation
    const conversation = yield* getOrCreateConversationEffect(
      message.from,
      integration.chatbotId
    );

    // Save the incoming message
    const userMessage = yield* Effect.tryPromise({
      try: () =>
        addWhatsAppUserMessage(
          conversation.id,
          message.body,
          message.messageId
        ),
      catch: (error) =>
        new ValidationError({
          field: "userMessage",
          value: message.messageId,
          message: `Failed to save user message: ${error}`,
        }),
    });

    // Generate chatbot response
    const botResponse = yield* generateChatbotResponseEffect(
      message.body,
      chatbot,
      conversation.id
    );

    // Save the bot response
    const assistantMessage = yield* Effect.tryPromise({
      try: () =>
        addWhatsAppAssistantMessage(
          conversation.id,
          botResponse.content,
          undefined, // WhatsApp message ID will be set when sent
          botResponse.tokens,
          botResponse.responseTime
        ),
      catch: (error) =>
        new ValidationError({
          field: "assistantMessage",
          value: conversation.id,
          message: `Failed to save assistant message: ${error}`,
        }),
    });

    // Send response back to WhatsApp using the service
    const whatsappService = yield* WhatsAppService;
    const messageResponse = yield* whatsappService.sendTextMessage(
      message.from,
      botResponse.content
    );

    // Update the assistant message with the WhatsApp message ID
    yield* Effect.tryPromise({
      try: () =>
        db.message.update({
          where: { id: assistantMessage.id },
          data: { externalMessageId: messageResponse.messageId },
        }),
      catch: (error) => {
        console.warn("Failed to update message with WhatsApp ID:", error);
        return null;
      },
    }).pipe(
      Effect.catchAll(() =>
        Effect.logWarning("Failed to update message with WhatsApp ID")
      )
    );

    yield* Effect.logInfo("Message processed successfully", {
      messageId: message.messageId,
      conversationId: conversation.id,
      responseMessageId: messageResponse.messageId,
    });

    return {
      success: true,
      messageId: message.messageId,
      conversationId: conversation.id,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMessage.id,
      whatsappMessageId: messageResponse.messageId,
    };
  });

/**
 * Find integration by phone number ID using Effect
 */
const findIntegrationByPhoneNumberEffect = (phoneNumberId: string) =>
  Effect.gen(function* () {
    const integration = yield* Effect.tryPromise({
      try: () =>
        db.integration.findFirst({
          where: {
            platform: IntegrationType.WHATSAPP,
            phoneNumberId,
            isActive: true,
          },
        }),
      catch: (error) =>
        new ValidationError({
          field: "phoneNumberId",
          value: phoneNumberId,
          message: `Failed to find integration: ${error}`,
        }),
    });

    if (!integration) {
      yield* Effect.logWarning("No integration found for phone number", {
        phoneNumberId,
      });
      return yield* Effect.fail(
        new ValidationError({
          field: "phoneNumberId",
          value: phoneNumberId,
          message: "No active integration found for this phone number",
        })
      );
    }

    return integration;
  });

/**
 * Get or create conversation using Effect
 */
const getOrCreateConversationEffect = (
  phoneNumber: string,
  chatbotId: string
) =>
  Effect.gen(function* () {
    const sessionId = `whatsapp_${phoneNumber}`;

    // Try to find existing conversation
    const existingConversation = yield* Effect.tryPromise({
      try: () => getConversationBySessionId(sessionId),
      catch: () => null, // If not found, we'll create a new one
    });

    if (existingConversation) {
      yield* Effect.logInfo("Found existing conversation", {
        conversationId: existingConversation.id,
        sessionId,
      });
      return existingConversation;
    }

    // Create new conversation
    const newConversation = yield* Effect.tryPromise({
      try: () =>
        createConversation({
          chatbotId,
          visitorId: phoneNumber,
          visitorIp: undefined,
        }),
      catch: (error) =>
        new ValidationError({
          field: "conversation",
          value: phoneNumber,
          message: `Failed to create conversation: ${error}`,
        }),
    });

    // Update the sessionId to our custom format for WhatsApp
    const updatedConversation = yield* Effect.tryPromise({
      try: () =>
        db.conversation.update({
          where: { id: newConversation.id },
          data: { sessionId },
        }),
      catch: (error) =>
        new ValidationError({
          field: "sessionId",
          value: sessionId,
          message: `Failed to update session ID: ${error}`,
        }),
    });

    yield* Effect.logInfo("Created new WhatsApp conversation", {
      conversationId: updatedConversation.id,
      sessionId,
      phoneNumber,
    });

    return updatedConversation;
  });

/**
 * Generate chatbot response using Effect
 */
const generateChatbotResponseEffect = (
  userMessage: string,
  chatbot: any,
  conversationId: string
) =>
  Effect.gen(function* () {
    const startTime = Date.now();

    yield* Effect.logInfo("Generating chatbot response", {
      userMessage: userMessage.substring(0, 100), // Log first 100 chars
      chatbotId: chatbot.id,
      conversationId,
    });

    // TODO: Integrate with your existing chatbot AI service
    // This should use the same logic as your web chat
    // For now, we'll return a basic response with proper Effect error handling

    const response = yield* Effect.try({
      try: () => ({
        content: `Hello! I received your message: "${userMessage}". This is a basic response from ${chatbot.name}. Full AI integration coming soon!`,
        tokens: 50, // Estimated tokens
        responseTime: Date.now() - startTime,
      }),
      catch: (error) =>
        new WhatsAppError({
          cause: error,
          message: "Failed to generate chatbot response",
          code: "AI_GENERATION_ERROR",
        }),
    });

    yield* Effect.logInfo("Chatbot response generated", {
      responseLength: response.content.length,
      tokens: response.tokens,
      responseTime: response.responseTime,
    });

    return response;
  }).pipe(
    Effect.catchAll((error) =>
      Effect.gen(function* () {
        yield* Effect.logError("Error generating chatbot response", { error });

        return {
          content:
            "I'm sorry, I'm having trouble processing your message right now. Please try again later.",
          tokens: 20,
          responseTime: Date.now() - startTime,
        };
      })
    )
  );

// All webhook processing is now handled by the WhatsApp service using Effect.js
// The service handles message sending, signature verification, and error handling
// with proper logging and type safety.
