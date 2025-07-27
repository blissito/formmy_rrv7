import { Effect, Layer, Context } from "effect";
import type { Integration, IntegrationType } from "@prisma/client";
import { WhatsAppService } from "./WhatsAppService.js";
import { WhatsAppConfig } from "./config.js";
import { WhatsAppHttpClient } from "./httpClient.js";
import {
  WhatsAppError,
  ValidationError,
  type MessageResponse,
  type IncomingMessage,
} from "./types.js";
import { validatePhoneNumber, validateMessageText } from "./validation.js";
import {
  createIntegration as createIntegrationDB,
  updateIntegration as updateIntegrationDB,
  deleteIntegration as deleteIntegrationDB,
  getIntegrationsByChatbotId,
} from "../../chatbot/integrationModel.server.js";
import {
  createConversation,
  findConversationBySessionId,
} from "../../chatbot/conversationModel.server.js";
import {
  createMessage,
  addUserMessage,
  addAssistantMessage,
} from "../../chatbot/messageModel.server.js";

// ============================================================================
// WhatsApp Integration Service Interface
// ============================================================================

export interface CreateIntegrationData {
  chatbotId: string;
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
}

export interface UpdateIntegrationData {
  phoneNumberId?: string;
  accessToken?: string;
  businessAccountId?: string;
  webhookVerifyToken?: string;
  isActive?: boolean;
}

export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    phoneNumber: string;
    businessName: string;
    verificationStatus: string;
  };
}

export interface WhatsAppIntegrationService {
  readonly createIntegration: (
    data: CreateIntegrationData
  ) => Effect.Effect<Integration, WhatsAppError | ValidationError>;

  readonly updateIntegration: (
    id: string,
    data: UpdateIntegrationData
  ) => Effect.Effect<Integration, WhatsAppError | ValidationError>;

  readonly deleteIntegration: (
    id: string
  ) => Effect.Effect<Integration, WhatsAppError>;

  readonly testConnection: (
    integration: Integration
  ) => Effect.Effect<ConnectionTestResult, WhatsAppError | ValidationError>;

  readonly processIncomingMessage: (
    webhook: any,
    signature: string,
    chatbotId: string
  ) => Effect.Effect<void, WhatsAppError | ValidationError>;

  readonly getChatbotIdFromWebhook: (
    webhook: any
  ) => Effect.Effect<string, WhatsAppError | ValidationError>;

  readonly verifyWebhook: (
    mode: string,
    token: string,
    challenge: string
  ) => Effect.Effect<string, WhatsAppError | ValidationError>;
}

export const WhatsAppIntegrationService =
  Context.GenericTag<WhatsAppIntegrationService>(
    "@services/WhatsAppIntegrationService"
  );

// ============================================================================
// WhatsApp Integration Service Implementation
// ============================================================================

export class WhatsAppIntegrationServiceImpl
  implements WhatsAppIntegrationService
{
  constructor(private readonly whatsappService: WhatsAppService) {}

  // ============================================================================
  // Create Integration with Credential Validation
  // ============================================================================

  createIntegration = (
    data: CreateIntegrationData
  ): Effect.Effect<Integration, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Validate input data
      yield* this.validateCreateIntegrationData(data);

      // Create temporary integration for testing
      const tempIntegration: Integration = {
        id: "temp",
        platform: "WHATSAPP" as IntegrationType,
        token: data.accessToken,
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId,
        webhookVerifyToken: data.webhookVerifyToken,
        isActive: false,
        lastActivity: null,
        errorMessage: null,
        chatbotId: data.chatbotId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Test connection with provided credentials
      const testResult = yield* this.testConnection(tempIntegration);

      if (!testResult.success) {
        return yield* Effect.fail(
          new ValidationError({
            field: "credentials",
            value: "provided credentials",
            message: `Connection test failed: ${testResult.message}`,
          })
        );
      }

      // Create integration in database
      const integration = yield* Effect.tryPromise({
        try: () =>
          createIntegrationDB(
            data.chatbotId,
            "WHATSAPP" as IntegrationType,
            data.accessToken,
            {
              phoneNumberId: data.phoneNumberId,
              businessAccountId: data.businessAccountId,
              webhookVerifyToken: data.webhookVerifyToken,
            }
          ),
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to create integration in database",
            code: "DATABASE_ERROR",
          }),
      });

      // Log successful creation
      yield* Effect.logInfo("WhatsApp integration created successfully", {
        integrationId: integration.id,
        chatbotId: data.chatbotId,
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId,
        timestamp: new Date().toISOString(),
      });

      return integration;
    });

  // ============================================================================
  // Update Integration
  // ============================================================================

  updateIntegration = (
    id: string,
    data: UpdateIntegrationData
  ): Effect.Effect<Integration, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Validate input data
      yield* this.validateUpdateIntegrationData(data);

      // If credentials are being updated, test the connection
      if (data.accessToken || data.phoneNumberId || data.businessAccountId) {
        // Get current integration to merge with updates
        const currentIntegrations = yield* Effect.tryPromise({
          try: () => getIntegrationsByChatbotId("temp"), // We'll need the actual chatbot ID
          catch: (error) =>
            new WhatsAppError({
              cause: error,
              message: "Failed to fetch current integration",
              code: "DATABASE_ERROR",
            }),
        });

        // For now, we'll skip the connection test during update
        // In a real implementation, you'd want to fetch the current integration
        // and test with the merged credentials
      }

      // Update integration in database
      const integration = yield* Effect.tryPromise({
        try: () => updateIntegrationDB(id, data),
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to update integration in database",
            code: "DATABASE_ERROR",
          }),
      });

      // Log successful update
      yield* Effect.logInfo("WhatsApp integration updated successfully", {
        integrationId: id,
        updatedFields: Object.keys(data),
        timestamp: new Date().toISOString(),
      });

      return integration;
    });

  // ============================================================================
  // Delete Integration with Cleanup
  // ============================================================================

  deleteIntegration = (id: string): Effect.Effect<Integration, WhatsAppError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Delete integration from database
      const integration = yield* Effect.tryPromise({
        try: () => deleteIntegrationDB(id),
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to delete integration from database",
            code: "DATABASE_ERROR",
          }),
      });

      // Log successful deletion
      yield* Effect.logInfo("WhatsApp integration deleted successfully", {
        integrationId: id,
        chatbotId: integration.chatbotId,
        timestamp: new Date().toISOString(),
      });

      return integration;
    });

  // ============================================================================
  // Test Connection using WhatsApp SDK
  // ============================================================================

  testConnection = (
    integration: Integration
  ): Effect.Effect<ConnectionTestResult, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Validate integration has required fields
      if (!integration.token || !integration.phoneNumberId) {
        return yield* Effect.fail(
          new ValidationError({
            field: "integration",
            value: integration,
            message:
              "Integration missing required credentials (token or phoneNumberId)",
          })
        );
      }

      try {
        // Create a temporary WhatsApp service with the integration's credentials
        const config = {
          accessToken: integration.token,
          phoneNumberId: integration.phoneNumberId,
          businessAccountId: integration.businessAccountId || "",
          webhookVerifyToken: integration.webhookVerifyToken
            ? { _tag: "Some" as const, value: integration.webhookVerifyToken }
            : { _tag: "None" as const },
          apiVersion: "v17.0",
          baseUrl: "https://graph.facebook.com",
        };

        // Test by trying to send a simple API call (get phone number info)
        // This is a lightweight way to test credentials without sending actual messages
        const testResult = yield* Effect.tryPromise({
          try: async () => {
            const response = await fetch(
              `${config.baseUrl}/${config.apiVersion}/${integration.phoneNumberId}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${integration.token}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(
                `API Error: ${errorData.error?.message || response.statusText}`
              );
            }

            return await response.json();
          },
          catch: (error) =>
            new WhatsAppError({
              cause: error,
              message: `Connection test failed: ${
                error instanceof Error ? error.message : String(error)
              }`,
              code: "CONNECTION_TEST_FAILED",
            }),
        });

        // Extract business information from the response
        const phoneNumber =
          testResult.display_phone_number || integration.phoneNumberId;
        const businessName = testResult.verified_name || "Unknown Business";
        const verificationStatus =
          testResult.code_verification_status || "unknown";

        const result: ConnectionTestResult = {
          success: true,
          message: "Connection test successful",
          details: {
            phoneNumber,
            businessName,
            verificationStatus,
          },
        };

        // Log successful test
        yield* Effect.logInfo("WhatsApp connection test successful", {
          integrationId: integration.id,
          phoneNumber,
          businessName,
          verificationStatus,
          timestamp: new Date().toISOString(),
        });

        return result;
      } catch (error) {
        const result: ConnectionTestResult = {
          success: false,
          message:
            error instanceof Error ? error.message : "Unknown connection error",
        };

        // Log failed test
        yield* Effect.logWarning("WhatsApp connection test failed", {
          integrationId: integration.id,
          error: result.message,
          timestamp: new Date().toISOString(),
        });

        return result;
      }
    });

  // ============================================================================
  // Process Incoming Message and Generate Response
  // ============================================================================

  processIncomingMessage = (
    webhook: any,
    signature: string,
    chatbotId: string
  ): Effect.Effect<void, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Process webhook using WhatsApp service
      const incomingMessages = yield* this.whatsappService.processWebhook(
        webhook,
        signature
      );

      // Process each incoming message
      for (const message of incomingMessages) {
        yield* this.handleIncomingMessage(message, chatbotId);
      }

      // Log successful processing
      yield* Effect.logInfo("Webhook messages processed successfully", {
        messageCount: incomingMessages.length,
        timestamp: new Date().toISOString(),
      });
    });

  // ============================================================================
  // Get Chatbot ID from Webhook
  // ============================================================================

  getChatbotIdFromWebhook = (
    webhook: any
  ): Effect.Effect<string, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Extract phone number ID from webhook
      if (
        !webhook.entry ||
        !Array.isArray(webhook.entry) ||
        webhook.entry.length === 0
      ) {
        return yield* Effect.fail(
          new ValidationError({
            field: "webhook.entry",
            value: webhook.entry,
            message: "Invalid webhook structure: missing or empty entry array",
          })
        );
      }

      const entry = webhook.entry[0];
      if (
        !entry.changes ||
        !Array.isArray(entry.changes) ||
        entry.changes.length === 0
      ) {
        return yield* Effect.fail(
          new ValidationError({
            field: "webhook.entry[0].changes",
            value: entry.changes,
            message:
              "Invalid webhook structure: missing or empty changes array",
          })
        );
      }

      const change = entry.changes[0];
      if (
        !change.value ||
        !change.value.metadata ||
        !change.value.metadata.phone_number_id
      ) {
        return yield* Effect.fail(
          new ValidationError({
            field: "webhook.entry[0].changes[0].value.metadata.phone_number_id",
            value: change.value?.metadata?.phone_number_id,
            message:
              "Invalid webhook structure: missing phone_number_id in metadata",
          })
        );
      }

      const phoneNumberId = change.value.metadata.phone_number_id;

      // Find integration by phone number ID
      const integration = yield* Effect.tryPromise({
        try: async () => {
          // This is a simplified approach - in a real implementation, you'd want to
          // create a more efficient lookup method in the integration model
          const { PrismaClient } = await import("@prisma/client");
          const prisma = new PrismaClient();

          const integration = await prisma.integration.findFirst({
            where: {
              phoneNumberId,
              platform: "WHATSAPP",
              isActive: true,
            },
          });

          await prisma.$disconnect();
          return integration;
        },
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to find integration by phone number ID",
            code: "DATABASE_ERROR",
          }),
      });

      if (!integration) {
        return yield* Effect.fail(
          new ValidationError({
            field: "phoneNumberId",
            value: phoneNumberId,
            message: `No active WhatsApp integration found for phone number ID: ${phoneNumberId}`,
          })
        );
      }

      // Log successful chatbot ID resolution
      yield* Effect.logInfo("Chatbot ID resolved from webhook", {
        phoneNumberId,
        chatbotId: integration.chatbotId,
        integrationId: integration.id,
        timestamp: new Date().toISOString(),
      });

      return integration.chatbotId;
    });

  // ============================================================================
  // Webhook Verification (for GET requests)
  // ============================================================================

  verifyWebhook = (
    mode: string,
    token: string,
    challenge: string
  ): Effect.Effect<string, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Validate webhook verification parameters
      if (mode !== "subscribe") {
        return yield* Effect.fail(
          new ValidationError({
            field: "hub.mode",
            value: mode,
            message: "Invalid webhook verification mode. Expected 'subscribe'",
          })
        );
      }

      if (!token || token.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "hub.verify_token",
            value: token,
            message: "Webhook verification token is required",
          })
        );
      }

      if (!challenge || challenge.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "hub.challenge",
            value: challenge,
            message: "Webhook challenge is required",
          })
        );
      }

      // Find integration with matching webhook verify token
      const integration = yield* Effect.tryPromise({
        try: async () => {
          const { PrismaClient } = await import("@prisma/client");
          const prisma = new PrismaClient();

          const integration = await prisma.integration.findFirst({
            where: {
              webhookVerifyToken: token,
              platform: "WHATSAPP",
              isActive: true,
            },
          });

          await prisma.$disconnect();
          return integration;
        },
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to verify webhook token",
            code: "DATABASE_ERROR",
          }),
      });

      if (!integration) {
        return yield* Effect.fail(
          new ValidationError({
            field: "hub.verify_token",
            value: token,
            message: "Invalid webhook verification token",
          })
        );
      }

      // Log successful webhook verification
      yield* Effect.logInfo("Webhook verification successful", {
        integrationId: integration.id,
        chatbotId: integration.chatbotId,
        mode,
        timestamp: new Date().toISOString(),
      });

      return challenge;
    });

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private validateCreateIntegrationData = (
    data: CreateIntegrationData
  ): Effect.Effect<void, ValidationError> =>
    Effect.gen(function* () {
      // Validate chatbotId
      if (!data.chatbotId || data.chatbotId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "chatbotId",
            value: data.chatbotId,
            message: "Chatbot ID is required",
          })
        );
      }

      // Validate phoneNumberId
      if (!data.phoneNumberId || data.phoneNumberId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "phoneNumberId",
            value: data.phoneNumberId,
            message: "Phone Number ID is required",
          })
        );
      }

      // Validate accessToken
      if (!data.accessToken || data.accessToken.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "accessToken",
            value: data.accessToken,
            message: "Access Token is required",
          })
        );
      }

      // Validate businessAccountId
      if (!data.businessAccountId || data.businessAccountId.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "businessAccountId",
            value: data.businessAccountId,
            message: "Business Account ID is required",
          })
        );
      }
    });

  private validateUpdateIntegrationData = (
    data: UpdateIntegrationData
  ): Effect.Effect<void, ValidationError> =>
    Effect.gen(function* () {
      // Validate phoneNumberId if provided
      if (
        data.phoneNumberId !== undefined &&
        data.phoneNumberId.trim() === ""
      ) {
        return yield* Effect.fail(
          new ValidationError({
            field: "phoneNumberId",
            value: data.phoneNumberId,
            message: "Phone Number ID cannot be empty",
          })
        );
      }

      // Validate accessToken if provided
      if (data.accessToken !== undefined && data.accessToken.trim() === "") {
        return yield* Effect.fail(
          new ValidationError({
            field: "accessToken",
            value: data.accessToken,
            message: "Access Token cannot be empty",
          })
        );
      }

      // Validate businessAccountId if provided
      if (
        data.businessAccountId !== undefined &&
        data.businessAccountId.trim() === ""
      ) {
        return yield* Effect.fail(
          new ValidationError({
            field: "businessAccountId",
            value: data.businessAccountId,
            message: "Business Account ID cannot be empty",
          })
        );
      }
    });

  private handleIncomingMessage = (
    message: IncomingMessage,
    chatbotId: string
  ): Effect.Effect<void, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      // Find or create conversation using phone number as sessionId
      const sessionId = `whatsapp_${message.from}`;

      let conversation = yield* Effect.tryPromise({
        try: () => findConversationBySessionId(sessionId),
        catch: () => null, // Conversation doesn't exist yet
      });

      if (!conversation) {
        // Create new conversation
        conversation = yield* Effect.tryPromise({
          try: () =>
            createConversation({
              sessionId,
              chatbotId,
              visitorId: message.from,
              visitorIp: null,
            }),
          catch: (error) =>
            new WhatsAppError({
              cause: error,
              message: "Failed to create conversation",
              code: "DATABASE_ERROR",
            }),
        });
      }

      // Save incoming message
      yield* Effect.tryPromise({
        try: () =>
          addUserMessage(
            conversation!.id,
            message.body,
            undefined, // visitorIp not available from WhatsApp
            "whatsapp",
            message.messageId
          ),
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to save incoming message",
            code: "DATABASE_ERROR",
          }),
      });

      // Generate chatbot response based on message type
      const botResponse =
        message.type === "text"
          ? yield* this.generateChatbotResponse(message.body, chatbotId)
          : yield* this.handleMediaMessage(message, chatbotId);

      // Send response back to WhatsApp with retry logic
      const messageResponse = yield* this.whatsappService
        .sendTextMessage(message.from, botResponse)
        .pipe(
          Effect.retry({
            times: 3,
            delay: (attempt) => `${Math.pow(2, attempt) * 1000}ms`, // Exponential backoff
          }),
          Effect.catchAll((error) =>
            Effect.gen(function* () {
              // Log the error but don't fail the entire process
              yield* Effect.logError(
                "Failed to send WhatsApp message after retries",
                {
                  error: error instanceof Error ? error.message : String(error),
                  messageFrom: message.from,
                  botResponse: botResponse.substring(0, 100),
                  timestamp: new Date().toISOString(),
                }
              );

              // Return a mock response to continue processing
              return {
                messageId: `failed_${Date.now()}`,
                status: "failed",
                timestamp: new Date().toISOString(),
              } as MessageResponse;
            })
          )
        );

      // Save bot response message
      yield* Effect.tryPromise({
        try: () =>
          addAssistantMessage(
            conversation!.id,
            botResponse,
            undefined, // tokens - would be calculated by AI service
            undefined, // responseTime - would be measured
            undefined, // firstTokenLatency - would be measured
            "whatsapp",
            messageResponse.messageId
          ),
        catch: (error) =>
          new WhatsAppError({
            cause: error,
            message: "Failed to save bot response message",
            code: "DATABASE_ERROR",
          }),
      });

      // Update conversation activity
      yield* Effect.tryPromise({
        try: async () => {
          const { updateIntegration } = await import(
            "../../chatbot/integrationModel.server.js"
          );
          // Find the integration for this chatbot and update last activity
          const { PrismaClient } = await import("@prisma/client");
          const prisma = new PrismaClient();

          const integration = await prisma.integration.findFirst({
            where: {
              chatbotId,
              platform: "WHATSAPP",
              isActive: true,
            },
          });

          if (integration) {
            await updateIntegration(integration.id, {
              lastActivity: new Date(),
              errorMessage: null, // Clear any previous errors
            });
          }

          await prisma.$disconnect();
        },
        catch: (error) => {
          // Log but don't fail - this is not critical
          console.warn("Failed to update integration activity:", error);
        },
      });

      // Log successful message processing
      yield* Effect.logInfo("Incoming message processed successfully", {
        conversationId: conversation.id,
        incomingMessageId: message.messageId,
        responseMessageId: messageResponse.messageId,
        messageType: message.type,
        from: message.from,
        chatbotId,
        timestamp: new Date().toISOString(),
      });
    });

  // ============================================================================
  // Handle Different Message Types
  // ============================================================================

  private handleMediaMessage = (
    message: IncomingMessage,
    chatbotId: string
  ): Effect.Effect<string, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      if (!message.mediaId) {
        return "I received a media message, but I'm currently unable to process media files.";
      }

      try {
        // Download media information
        const mediaUrl = yield* this.whatsappService.getMediaUrl(
          message.mediaId
        );

        // For now, just acknowledge the media
        // In a real implementation, you might want to:
        // 1. Download the media
        // 2. Process it (OCR for images, transcription for audio, etc.)
        // 3. Store it securely
        // 4. Generate an appropriate response

        const mediaTypeResponse = {
          image:
            "I received your image. I can see it but I'm currently unable to analyze images in detail.",
          document:
            "I received your document. I can see it but I'm currently unable to process documents.",
          audio:
            "I received your audio message. I can hear it but I'm currently unable to process audio.",
          video:
            "I received your video. I can see it but I'm currently unable to analyze videos.",
        };

        return (
          mediaTypeResponse[message.type] ||
          "I received your media file, but I'm currently unable to process this type of media."
        );
      } catch (error) {
        yield* Effect.logWarning("Failed to process media message", {
          mediaId: message.mediaId,
          messageType: message.type,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString(),
        });

        return "I received your media file, but I'm having trouble processing it right now. Please try again later.";
      }
    });

  private generateChatbotResponse = (
    userMessage: string,
    chatbotId: string
  ): Effect.Effect<string, WhatsAppError> =>
    Effect.gen(function* (this: WhatsAppIntegrationServiceImpl) {
      try {
        // Get chatbot configuration
        const chatbot = yield* Effect.tryPromise({
          try: async () => {
            const { getChatbotById } = await import(
              "../../chatbot/chatbotModel.server.js"
            );
            return getChatbotById(chatbotId);
          },
          catch: (error) =>
            new WhatsAppError({
              cause: error,
              message: "Failed to fetch chatbot configuration",
              code: "DATABASE_ERROR",
            }),
        });

        if (!chatbot) {
          return yield* Effect.fail(
            new WhatsAppError({
              cause: new Error("Chatbot not found"),
              message: `Chatbot with ID ${chatbotId} not found`,
              code: "CHATBOT_NOT_FOUND",
            })
          );
        }

        // TODO: Integrate with your AI service here
        // This is where you would call your OpenAI, Anthropic, or other AI service
        // For now, we'll return a simple response that includes the chatbot's name
        const response = chatbot.instructions
          ? `${
              chatbot.name
            } says: I received your message "${userMessage}". ${chatbot.instructions.substring(
              0,
              100
            )}...`
          : `${chatbot.name} says: I received your message "${userMessage}". How can I help you?`;

        // Log response generation
        yield* Effect.logInfo("Chatbot response generated", {
          chatbotId,
          chatbotName: chatbot.name,
          userMessageLength: userMessage.length,
          responseLength: response.length,
          timestamp: new Date().toISOString(),
        });

        return response;
      } catch (error) {
        // Fallback response in case of any errors
        yield* Effect.logWarning(
          "Failed to generate chatbot response, using fallback",
          {
            chatbotId,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString(),
          }
        );

        return "I'm sorry, I'm having trouble processing your message right now. Please try again later.";
      }
    });
}

// ============================================================================
// Service Layer
// ============================================================================

export const WhatsAppIntegrationServiceLive = Layer.effect(
  WhatsAppIntegrationService,
  Effect.gen(function* () {
    const whatsappService = yield* WhatsAppService;

    return new WhatsAppIntegrationServiceImpl(whatsappService);
  })
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a WhatsApp integration service instance with explicit dependencies
 */
export const makeWhatsAppIntegrationService = (
  whatsappService: WhatsAppService
): WhatsAppIntegrationService =>
  new WhatsAppIntegrationServiceImpl(whatsappService);
