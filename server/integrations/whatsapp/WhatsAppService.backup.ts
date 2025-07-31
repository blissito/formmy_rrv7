import { Effect, Layer, Context, Option } from "effect";
import { Schema } from "@effect/schema";
import { WhatsAppConfig } from "./config.js";
import { WhatsAppHttpClient } from "./httpClient.js";
import {
  WhatsAppError,
  ApiError,
  ValidationError,
  MediaIdSchema,
  type MessageResponse,
  type IncomingMessage,
  type MediaId,
  type MessageType,
  type MimeType,
  type PhoneNumber,
  type MessageText,
  type TemplateName,
  type LanguageCode,
} from "./types.js";
import {
  validatePhoneNumber,
  validateMessageText,
  validateTemplateName,
  validateLanguageCode,
  validateMimeType,
  validateFileSizeForMimeType,
  validateMediaFile,
  validateHttpsUrl,
  validateWebhookSignature,
  validateWebhookPayload,
  maskPhoneNumber,
} from "./validation.js";
import {
  createTextMessageRequest,
  createTemplateMessageRequest,
  createImageMessageRequest,
  createDocumentMessageRequest,
  createVideoMessageRequest,
  createAudioMessageRequest,
  createMediaUploadFormData,
  extractMessageId,
} from "./httpClient.js";

// ============================================================================
// WhatsApp Service Interface
// ============================================================================

export interface WhatsAppService {
  // Message sending methods
  readonly sendTextMessage: (
    to: string,
    text: string,
    previewUrl?: boolean
  ) => Effect.Effect<MessageResponse, WhatsAppError | ValidationError>;

  readonly sendTemplateMessage: (
    to: string,
    templateName: string,
    languageCode: string,
    components?: unknown[]
  ) => Effect.Effect<MessageResponse, WhatsAppError | ValidationError>;

  readonly sendImageMessage: (
    to: string,
    imageUrl: string,
    caption?: string
  ) => Effect.Effect<MessageResponse, WhatsAppError | ValidationError>;

  // Media handling methods
  readonly uploadMedia: (
    fileBuffer: Buffer,
    mimeType: string,
    filename?: string
  ) => Effect.Effect<string, WhatsAppError | ValidationError>;

  readonly getMediaUrl: (
    mediaId: string
  ) => Effect.Effect<string, WhatsAppError | ValidationError>;

  readonly downloadMedia: (
    mediaUrl: string
  ) => Effect.Effect<Buffer, WhatsAppError | ValidationError>;

  readonly sendMediaMessage: (
    to: string,
    mediaId: string,
    mediaType: "image" | "document" | "video" | "audio",
    caption?: string,
    filename?: string
  ) => Effect.Effect<MessageResponse, WhatsAppError | ValidationError>;

  // Webhook processing
  readonly processWebhook: (
    payload: unknown,
    signature: string
  ) => Effect.Effect<IncomingMessage[], WhatsAppError | ValidationError>;
}

export const WhatsAppService = Context.GenericTag<WhatsAppService>(
  "@services/WhatsAppService"
);

// ============================================================================
// Media Information Interface
// ============================================================================

export interface MediaInfo {
  readonly id: string;
  readonly url: string;
  readonly mimeType: string;
  readonly sha256: string;
  readonly fileSize: number;
}

// ============================================================================
// WhatsApp Service Implementation
// ============================================================================

export class WhatsAppServiceImpl implements WhatsAppService {
  constructor(
    private readonly config: WhatsAppConfig,
    private readonly httpClient: WhatsAppHttpClient
  ) {}

  // ============================================================================
  // Media Upload Implementation
  // ============================================================================

  uploadMedia = (
    fileBuffer: Buffer,
    mimeType: string,
    filename?: string
  ): Effect.Effect<string, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate MIME type
      const validatedMimeType = yield* validateMimeType(mimeType).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              field: "mimeType",
              value: mimeType,
              message: `Invalid MIME type for media upload: ${error.message}`,
            })
        )
      );

      // Validate file size based on MIME type
      const fileSize = fileBuffer.length;
      yield* validateFileSizeForMimeType(fileSize, mimeType).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              field: "fileSize",
              value: fileSize,
              message: `Invalid file size for ${mimeType}: ${error.message}`,
            })
        )
      );

      // Validate complete media file
      yield* validateMediaFile(fileSize, mimeType).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              field: "mediaFile",
              value: { fileSize, mimeType },
              message: `Media file validation failed: ${error.message}`,
            })
        )
      );

      // Create FormData for upload
      const formData = createMediaUploadFormData(
        fileBuffer,
        validatedMimeType,
        filename
      );

      // Upload media via HTTP client
      const uploadResponse = yield* this.httpClient.uploadMedia(formData).pipe(
        Effect.mapError(
          (apiError: ApiError) =>
            new WhatsAppError({
              cause: apiError,
              message: `Media upload failed: ${apiError.message}`,
              code: "MEDIA_UPLOAD_ERROR",
            })
        )
      );

      // Log successful upload
      yield* Effect.logInfo("Media uploaded successfully", {
        mediaId: uploadResponse.id,
        mimeType: validatedMimeType,
        fileSize,
        filename: filename || "unknown",
        timestamp: new Date().toISOString(),
      });

      return uploadResponse.id;
    });

  // ============================================================================
  // Media URL Retrieval Implementation
  // ============================================================================

  getMediaUrl = (
    mediaId: string
  ): Effect.Effect<string, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate media ID
      const validatedMediaId = yield* Schema.decodeUnknown(MediaIdSchema)(
        mediaId
      ).pipe(
        Effect.mapError(
          (error: any) =>
            new ValidationError({
              field: "mediaId",
              value: mediaId,
              message: `Invalid media ID: ${error.message}`,
            })
        )
      );

      // Get media information via HTTP client
      const mediaInfo = yield* this.httpClient.getMedia(validatedMediaId).pipe(
        Effect.mapError(
          (apiError: ApiError) =>
            new WhatsAppError({
              cause: apiError,
              message: `Failed to retrieve media information: ${apiError.message}`,
              code: "MEDIA_INFO_ERROR",
            })
        )
      );

      // Validate the returned URL
      const validatedUrl = yield* validateHttpsUrl(mediaInfo.url).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              field: "mediaUrl",
              value: mediaInfo.url,
              message: `Invalid media URL returned from API: ${error.message}`,
            })
        )
      );

      // Log successful media info retrieval
      yield* Effect.logInfo("Media information retrieved successfully", {
        mediaId: validatedMediaId,
        url: validatedUrl,
        mimeType: mediaInfo.mime_type,
        fileSize: mediaInfo.file_size,
        timestamp: new Date().toISOString(),
      });

      return validatedUrl;
    });

  // ============================================================================
  // Media Download Implementation
  // ============================================================================

  downloadMedia = (
    mediaUrl: string
  ): Effect.Effect<Buffer, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate media URL
      const validatedUrl = yield* validateHttpsUrl(mediaUrl).pipe(
        Effect.mapError(
          (error) =>
            new ValidationError({
              field: "mediaUrl",
              value: mediaUrl,
              message: `Invalid media URL for download: ${error.message}`,
            })
        )
      );

      // Download media via HTTP client
      const mediaBuffer = yield* this.httpClient
        .downloadMedia(validatedUrl)
        .pipe(
          Effect.mapError(
            (apiError: ApiError) =>
              new WhatsAppError({
                cause: apiError,
                message: `Media download failed: ${apiError.message}`,
                code: "MEDIA_DOWNLOAD_ERROR",
              })
          )
        );

      // Validate downloaded buffer
      if (!Buffer.isBuffer(mediaBuffer) || mediaBuffer.length === 0) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: new Error("Invalid buffer received"),
            message: "Downloaded media buffer is invalid or empty",
            code: "MEDIA_DOWNLOAD_INVALID",
          })
        );
      }

      // Log successful download
      yield* Effect.logInfo("Media downloaded successfully", {
        url: validatedUrl,
        bufferSize: mediaBuffer.length,
        timestamp: new Date().toISOString(),
      });

      return mediaBuffer;
    });

  // ============================================================================
  // Send Media Message Implementation
  // ============================================================================

  sendMediaMessage = (
    to: string,
    mediaId: string,
    mediaType: "image" | "document" | "video" | "audio",
    caption?: string,
    filename?: string
  ): Effect.Effect<MessageResponse, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate phone number
      const validatedTo = yield* validatePhoneNumber(to);

      // Validate media ID
      const validatedMediaId = yield* Schema.decodeUnknown(MediaIdSchema)(
        mediaId
      ).pipe(
        Effect.mapError(
          (error: any) =>
            new ValidationError({
              field: "mediaId",
              value: mediaId,
              message: `Invalid media ID: ${error.message}`,
            })
        )
      );

      // Validate caption if provided
      const validatedCaption = caption
        ? yield* validateMessageText(caption)
        : undefined;

      // Create appropriate message request based on media type
      const messageRequest = (() => {
        switch (mediaType) {
          case "image":
            return createImageMessageRequest(
              validatedTo,
              undefined, // no URL, using media ID
              validatedMediaId,
              validatedCaption
            );
          case "document":
            return createDocumentMessageRequest(
              validatedTo,
              undefined, // no URL, using media ID
              validatedMediaId,
              validatedCaption,
              filename
            );
          case "video":
            return createVideoMessageRequest(
              validatedTo,
              undefined, // no URL, using media ID
              validatedMediaId,
              validatedCaption
            );
          case "audio":
            return createAudioMessageRequest(
              validatedTo,
              undefined, // no URL, using media ID
              validatedMediaId
            );
          default:
            throw new Error(`Unsupported media type: ${mediaType}`);
        }
      })();

      // Send message via HTTP client
      const apiResponse = yield* this.httpClient
        .sendMessage(messageRequest)
        .pipe(
          Effect.mapError(
            (apiError: ApiError) =>
              new WhatsAppError({
                cause: apiError,
                message: `Failed to send ${mediaType} message: ${apiError.message}`,
                code: "MESSAGE_SEND_ERROR",
              })
          )
        );

      // Extract message ID from response
      const messageId = extractMessageId(apiResponse);
      if (!messageId) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: new Error("No message ID in response"),
            message: "WhatsApp API response missing message ID",
            code: "INVALID_API_RESPONSE",
          })
        );
      }

      // Create response object
      const response: MessageResponse = {
        messageId,
        status: apiResponse.messages[0]?.message_status || "sent",
        timestamp: new Date().toISOString(),
      };

      // Log successful message send
      yield* Effect.logInfo(`${mediaType} message sent successfully`, {
        messageId,
        to: validatedTo,
        mediaId: validatedMediaId,
        mediaType,
        hasCaption: !!validatedCaption,
        timestamp: response.timestamp,
      });

      return response;
    });

  // ============================================================================
  // Text Message Implementation (for completeness)
  // ============================================================================

  sendTextMessage = (
    to: string,
    text: string,
    previewUrl?: boolean
  ): Effect.Effect<MessageResponse, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate inputs
      const validatedTo = yield* validatePhoneNumber(to);
      const validatedText = yield* validateMessageText(text);

      // Create message request
      const messageRequest = createTextMessageRequest(
        validatedTo,
        validatedText,
        previewUrl
      );

      // Send message via HTTP client
      const apiResponse = yield* this.httpClient
        .sendMessage(messageRequest)
        .pipe(
          Effect.mapError(
            (apiError: ApiError) =>
              new WhatsAppError({
                cause: apiError,
                message: `Failed to send text message: ${apiError.message}`,
                code: "MESSAGE_SEND_ERROR",
              })
          )
        );

      // Extract message ID from response
      const messageId = extractMessageId(apiResponse);
      if (!messageId) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: new Error("No message ID in response"),
            message: "WhatsApp API response missing message ID",
            code: "INVALID_API_RESPONSE",
          })
        );
      }

      // Create response object
      const response: MessageResponse = {
        messageId,
        status: apiResponse.messages[0]?.message_status || "sent",
        timestamp: new Date().toISOString(),
      };

      // Log successful message send
      yield* Effect.logInfo("Text message sent successfully", {
        messageId,
        to: validatedTo,
        textLength: validatedText.length,
        previewUrl: previewUrl || false,
        timestamp: response.timestamp,
      });

      return response;
    });

  // ============================================================================
  // Template Message Implementation (for completeness)
  // ============================================================================

  sendTemplateMessage = (
    to: string,
    templateName: string,
    languageCode: string,
    components?: unknown[]
  ): Effect.Effect<MessageResponse, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate inputs
      const validatedTo = yield* validatePhoneNumber(to);
      const validatedTemplateName = yield* validateTemplateName(templateName);
      const validatedLanguageCode = yield* validateLanguageCode(languageCode);

      // Create message request
      const messageRequest = createTemplateMessageRequest(
        validatedTo,
        validatedTemplateName,
        validatedLanguageCode,
        components
      );

      // Send message via HTTP client
      const apiResponse = yield* this.httpClient
        .sendMessage(messageRequest)
        .pipe(
          Effect.mapError(
            (apiError: ApiError) =>
              new WhatsAppError({
                cause: apiError,
                message: `Failed to send template message: ${apiError.message}`,
                code: "MESSAGE_SEND_ERROR",
              })
          )
        );

      // Extract message ID from response
      const messageId = extractMessageId(apiResponse);
      if (!messageId) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: new Error("No message ID in response"),
            message: "WhatsApp API response missing message ID",
            code: "INVALID_API_RESPONSE",
          })
        );
      }

      // Create response object
      const response: MessageResponse = {
        messageId,
        status: apiResponse.messages[0]?.message_status || "sent",
        timestamp: new Date().toISOString(),
      };

      // Log successful message send
      yield* Effect.logInfo("Template message sent successfully", {
        messageId,
        to: validatedTo,
        templateName: validatedTemplateName,
        languageCode: validatedLanguageCode,
        hasComponents: !!components && components.length > 0,
        timestamp: response.timestamp,
      });

      return response;
    });

  // ============================================================================
  // Image Message Implementation (for completeness)
  // ============================================================================

  sendImageMessage = (
    to: string,
    imageUrl: string,
    caption?: string
  ): Effect.Effect<MessageResponse, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate inputs
      const validatedTo = yield* validatePhoneNumber(to);
      const validatedImageUrl = yield* validateHttpsUrl(imageUrl);
      const validatedCaption = caption
        ? yield* validateMessageText(caption)
        : undefined;

      // Create message request
      const messageRequest = createImageMessageRequest(
        validatedTo,
        validatedImageUrl,
        undefined, // no media ID, using URL
        validatedCaption
      );

      // Send message via HTTP client
      const apiResponse = yield* this.httpClient
        .sendMessage(messageRequest)
        .pipe(
          Effect.mapError(
            (apiError: ApiError) =>
              new WhatsAppError({
                cause: apiError,
                message: `Failed to send image message: ${apiError.message}`,
                code: "MESSAGE_SEND_ERROR",
              })
          )
        );

      // Extract message ID from response
      const messageId = extractMessageId(apiResponse);
      if (!messageId) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: new Error("No message ID in response"),
            message: "WhatsApp API response missing message ID",
            code: "INVALID_API_RESPONSE",
          })
        );
      }

      // Create response object
      const response: MessageResponse = {
        messageId,
        status: apiResponse.messages[0]?.message_status || "sent",
        timestamp: new Date().toISOString(),
      };

      // Log successful message send
      yield* Effect.logInfo("Image message sent successfully", {
        messageId,
        to: validatedTo,
        imageUrl: validatedImageUrl,
        hasCaption: !!validatedCaption,
        timestamp: response.timestamp,
      });

      return response;
    });

  // ============================================================================
  // Webhook Processing Implementation
  // ============================================================================

  processWebhook = (
    payload: unknown,
    signature: string
  ): Effect.Effect<IncomingMessage[], WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Verify webhook signature
      yield* this.verifyWebhookSignature(payload, signature);

      // Validate webhook payload structure
      const validatedPayload = yield* validateWebhookPayload(payload);

      // Process each entry in the webhook
      const allMessages: IncomingMessage[] = [];

      for (const entry of validatedPayload.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages" && change.value.messages) {
            const messages = yield* this.processWebhookMessages(
              change.value.messages,
              change.value.metadata.phone_number_id
            );
            allMessages.push(...messages);
          }
        }
      }

      // Log successful webhook processing
      yield* Effect.logInfo("Webhook processed successfully", {
        messageCount: allMessages.length,
        entryCount: validatedPayload.entry.length,
        timestamp: new Date().toISOString(),
      });

      return allMessages;
    });

  private verifyWebhookSignature = (
    payload: unknown,
    signature: string
  ): Effect.Effect<void, WhatsAppError | ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Check if webhook verification is configured
      if (!Option.isSome(this.config.webhookVerifyToken)) {
        yield* Effect.logWarning(
          "Webhook verification token not configured, skipping signature verification"
        );
        return;
      }

      const webhookToken = this.config.webhookVerifyToken.value;

      // Validate signature format
      yield* validateWebhookSignature(signature);

      // Calculate expected signature
      const expectedSignature = yield* this.calculateWebhookSignature(
        payload,
        webhookToken
      );

      // Compare signatures
      if (signature !== expectedSignature) {
        return yield* Effect.fail(
          new ValidationError({
            field: "webhookSignature",
            value: signature,
            message: "Webhook signature verification failed",
          })
        );
      }

      yield* Effect.logInfo("Webhook signature verified successfully");
    });

  private calculateWebhookSignature = (
    payload: unknown,
    verifyToken: string
  ): Effect.Effect<string, WhatsAppError> =>
    Effect.gen(function* () {
      try {
        const crypto = yield* Effect.sync(() => require("crypto"));
        const payloadString = JSON.stringify(payload);

        const hmac = crypto.createHmac("sha256", verifyToken);
        hmac.update(payloadString);
        const signature = `sha256=${hmac.digest("hex")}`;

        return signature;
      } catch (error) {
        return yield* Effect.fail(
          new WhatsAppError({
            cause: error,
            message: "Failed to calculate webhook signature",
            code: "SIGNATURE_CALCULATION_ERROR",
          })
        );
      }
    });

  private processWebhookMessages = (
    messages: Array<import("./types.js").WebhookMessage>,
    phoneNumberId: string
  ): Effect.Effect<IncomingMessage[], ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      const processedMessages: IncomingMessage[] = [];

      for (const message of messages) {
        const incomingMessage = yield* this.mapWebhookMessageToIncoming(
          message,
          phoneNumberId
        );
        processedMessages.push(incomingMessage);
      }

      return processedMessages;
    });

  private mapWebhookMessageToIncoming = (
    webhookMessage: import("./types.js").WebhookMessage,
    phoneNumberId: string
  ): Effect.Effect<IncomingMessage, ValidationError> =>
    Effect.gen(function* (this: WhatsAppServiceImpl) {
      // Validate phone numbers
      const validatedFrom = yield* validatePhoneNumber(webhookMessage.from);
      const validatedTo = phoneNumberId; // This is our phone number ID

      // Extract message content based on type
      const { body, mediaId } = this.extractMessageContent(webhookMessage);

      // Validate message body if present
      const validatedBody = body ? yield* validateMessageText(body) : "";

      // Map webhook message type to our message type
      const messageType = this.mapWebhookMessageType(webhookMessage.type);

      // Create incoming message
      const incomingMessage: IncomingMessage = {
        from: validatedFrom,
        to: validatedTo,
        body: validatedBody,
        messageId: webhookMessage.id,
        timestamp: webhookMessage.timestamp,
        type: messageType,
        mediaId,
      };

      // Log incoming message
      yield* Effect.logInfo("Incoming message processed", {
        messageId: webhookMessage.id,
        from: maskPhoneNumber(validatedFrom),
        type: messageType,
        hasMedia: !!mediaId,
        timestamp: webhookMessage.timestamp,
      });

      return incomingMessage;
    });

  private extractMessageContent = (
    webhookMessage: import("./types.js").WebhookMessage
  ): { body: string; mediaId?: string } => {
    switch (webhookMessage.type) {
      case "text":
        return {
          body: webhookMessage.text?.body || "",
        };
      case "image":
        return {
          body: webhookMessage.image?.caption || "",
          mediaId: webhookMessage.image?.id,
        };
      case "document":
        return {
          body:
            webhookMessage.document?.caption ||
            webhookMessage.document?.filename ||
            "",
          mediaId: webhookMessage.document?.id,
        };
      case "audio":
      case "voice":
        return {
          body: "",
          mediaId: webhookMessage.audio?.id || webhookMessage.voice?.id,
        };
      case "video":
        return {
          body: webhookMessage.video?.caption || "",
          mediaId: webhookMessage.video?.id,
        };
      case "sticker":
        return {
          body: "",
          mediaId: webhookMessage.sticker?.id,
        };
      default:
        return {
          body: `Unsupported message type: ${webhookMessage.type}`,
        };
    }
  };

  private mapWebhookMessageType = (
    webhookType: import("./types.js").WebhookMessage["type"]
  ): MessageType => {
    switch (webhookType) {
      case "text":
        return "text";
      case "image":
        return "image";
      case "document":
        return "document";
      case "audio":
      case "voice":
        return "audio";
      case "video":
        return "video";
      case "sticker":
        return "image"; // Treat stickers as images
      default:
        return "text"; // Default fallback
    }
  };
}

// ============================================================================
// Service Layer
// ============================================================================

export const WhatsAppServiceLive = Layer.effect(
  WhatsAppService,
  Effect.gen(function* () {
    const config = yield* WhatsAppConfig;
    const httpClient = yield* WhatsAppHttpClient;

    return new WhatsAppServiceImpl(config, httpClient);
  })
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a WhatsApp service instance with explicit dependencies
 */
export const makeWhatsAppService = (
  config: WhatsAppConfig,
  httpClient: WhatsAppHttpClient
): WhatsAppService => new WhatsAppServiceImpl(config, httpClient);

/**
 * Determines media type from MIME type
 */
export const getMediaTypeFromMimeType = (
  mimeType: string
): "image" | "document" | "video" | "audio" => {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  return "document"; // Default for application/* and text/plain
};

/**
 * Validates and uploads media, then sends media message
 */
export const uploadAndSendMedia = (
  service: WhatsAppService,
  to: string,
  fileBuffer: Buffer,
  mimeType: string,
  caption?: string,
  filename?: string
): Effect.Effect<MessageResponse, WhatsAppError | ValidationError> =>
  Effect.gen(function* () {
    // Upload media first
    const mediaId = yield* service.uploadMedia(fileBuffer, mimeType, filename);

    // Determine media type from MIME type
    const mediaType = getMediaTypeFromMimeType(mimeType);

    // Send media message
    return yield* service.sendMediaMessage(
      to,
      mediaId,
      mediaType,
      caption,
      filename
    );
  });

/**
 * Downloads media by ID and returns both the buffer and media info
 */
export const downloadMediaById = (
  service: WhatsAppService,
  mediaId: string
): Effect.Effect<
  { buffer: Buffer; info: MediaInfo },
  WhatsAppError | ValidationError
> =>
  Effect.gen(function* () {
    // Get media URL
    const mediaUrl = yield* service.getMediaUrl(mediaId);

    // Download media
    const buffer = yield* service.downloadMedia(mediaUrl);

    // Return both buffer and basic info
    const info: MediaInfo = {
      id: mediaId,
      url: mediaUrl,
      mimeType: "unknown", // Would need to be retrieved from getMedia API
      sha256: "unknown",
      fileSize: buffer.length,
    };

    return { buffer, info };
  });
