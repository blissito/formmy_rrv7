import { Effect, Layer, Context } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
  HttpBody,
} from "@effect/platform";
import { Schema } from "@effect/schema";
import { WhatsAppConfig } from "./config.js";
import { ApiError, WhatsAppError } from "./types.js";
import {
  withMessageSendRetry,
  withMediaUploadRetry,
  withMediaDownloadRetry,
  withRateLimitRetry,
} from "./retrySchedule.js";

// ============================================================================
// HTTP Client Service Interface
// ============================================================================

export interface WhatsAppHttpClient {
  readonly sendMessage: (
    payload: unknown
  ) => Effect.Effect<MessageApiResponse, ApiError>;
  readonly uploadMedia: (
    formData: FormData
  ) => Effect.Effect<MediaUploadResponse, ApiError>;
  readonly getMedia: (
    mediaId: string
  ) => Effect.Effect<MediaInfoResponse, ApiError>;
  readonly downloadMedia: (mediaUrl: string) => Effect.Effect<Buffer, ApiError>;
}

export const WhatsAppHttpClient = Context.GenericTag<WhatsAppHttpClient>(
  "@services/WhatsAppHttpClient"
);

// ============================================================================
// API Response Schemas
// ============================================================================

// Message API Response Schema
export const MessageApiResponseSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  contacts: Schema.Array(
    Schema.Struct({
      input: Schema.String,
      wa_id: Schema.String,
    })
  ),
  messages: Schema.Array(
    Schema.Struct({
      id: Schema.String,
      message_status: Schema.optional(
        Schema.Literal("accepted", "sent", "delivered", "read", "failed")
      ),
    })
  ),
});

export type MessageApiResponse = Schema.Schema.Type<
  typeof MessageApiResponseSchema
>;

// Media Upload Response Schema
export const MediaUploadResponseSchema = Schema.Struct({
  id: Schema.String,
});

export type MediaUploadResponse = Schema.Schema.Type<
  typeof MediaUploadResponseSchema
>;

// Media Info Response Schema
export const MediaInfoResponseSchema = Schema.Struct({
  id: Schema.String,
  url: Schema.String,
  mime_type: Schema.String,
  sha256: Schema.String,
  file_size: Schema.Number,
  messaging_product: Schema.Literal("whatsapp"),
});

export type MediaInfoResponse = Schema.Schema.Type<
  typeof MediaInfoResponseSchema
>;

// Error Response Schema
export const ErrorResponseSchema = Schema.Struct({
  error: Schema.Struct({
    message: Schema.String,
    type: Schema.String,
    code: Schema.Number,
    error_subcode: Schema.optional(Schema.Number),
    fbtrace_id: Schema.optional(Schema.String),
  }),
});

export type ErrorResponse = Schema.Schema.Type<typeof ErrorResponseSchema>;

// ============================================================================
// Request Schemas
// ============================================================================

// Text Message Request Schema
export const TextMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("text"),
  text: Schema.Struct({
    body: Schema.String,
    preview_url: Schema.optional(Schema.Boolean),
  }),
});

export type TextMessageRequest = Schema.Schema.Type<
  typeof TextMessageRequestSchema
>;

// Template Message Request Schema
export const TemplateMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("template"),
  template: Schema.Struct({
    name: Schema.String,
    language: Schema.Struct({
      code: Schema.String,
    }),
    components: Schema.optional(Schema.Array(Schema.Unknown)),
  }),
});

export type TemplateMessageRequest = Schema.Schema.Type<
  typeof TemplateMessageRequestSchema
>;

// Image Message Request Schema
export const ImageMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("image"),
  image: Schema.Struct({
    link: Schema.optional(Schema.String),
    id: Schema.optional(Schema.String),
    caption: Schema.optional(Schema.String),
  }),
});

export type ImageMessageRequest = Schema.Schema.Type<
  typeof ImageMessageRequestSchema
>;

// Document Message Request Schema
export const DocumentMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("document"),
  document: Schema.Struct({
    link: Schema.optional(Schema.String),
    id: Schema.optional(Schema.String),
    caption: Schema.optional(Schema.String),
    filename: Schema.optional(Schema.String),
  }),
});

export type DocumentMessageRequest = Schema.Schema.Type<
  typeof DocumentMessageRequestSchema
>;

// Video Message Request Schema
export const VideoMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("video"),
  video: Schema.Struct({
    link: Schema.optional(Schema.String),
    id: Schema.optional(Schema.String),
    caption: Schema.optional(Schema.String),
  }),
});

export type VideoMessageRequest = Schema.Schema.Type<
  typeof VideoMessageRequestSchema
>;

// Audio Message Request Schema
export const AudioMessageRequestSchema = Schema.Struct({
  messaging_product: Schema.Literal("whatsapp"),
  recipient_type: Schema.Literal("individual"),
  to: Schema.String,
  type: Schema.Literal("audio"),
  audio: Schema.Struct({
    link: Schema.optional(Schema.String),
    id: Schema.optional(Schema.String),
  }),
});

export type AudioMessageRequest = Schema.Schema.Type<
  typeof AudioMessageRequestSchema
>;

// ============================================================================
// HTTP Client Implementation
// ============================================================================

export class WhatsAppHttpClientImpl implements WhatsAppHttpClient {
  constructor(
    private readonly config: WhatsAppConfig,
    private readonly httpClient: HttpClient.HttpClient
  ) {}

  // ============================================================================
  // Base URL Construction
  // ============================================================================

  private buildApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.endsWith("/")
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    return `${baseUrl}/${this.config.apiVersion}/${this.config.phoneNumberId}/${endpoint}`;
  }

  private buildBusinessApiUrl(endpoint: string): string {
    const baseUrl = this.config.baseUrl.endsWith("/")
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;

    return `${baseUrl}/${this.config.apiVersion}/${this.config.businessAccountId}/${endpoint}`;
  }

  // ============================================================================
  // Authentication Headers
  // ============================================================================

  private createAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  private createMediaUploadHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.config.accessToken}`,
      // Content-Type will be set automatically for FormData
    };
  }

  // ============================================================================
  // Error Handling
  // ============================================================================

  private handleHttpError = (
    error: HttpClientResponse.HttpClientResponse
  ): Effect.Effect<never, ApiError> =>
    Effect.gen(function* (_) {
      const responseText = yield* _(
        Effect.tryPromise(() => error.text).pipe(
          Effect.catchAll(() => Effect.succeed("Failed to read response text"))
        )
      );

      // Try to parse as WhatsApp API error response
      let parsedResponse;
      try {
        parsedResponse = JSON.parse(responseText);
      } catch {
        parsedResponse = {
          error: { message: responseText, type: "unknown", code: error.status },
        };
      }

      const errorResponse = yield* _(
        Schema.decodeUnknown(ErrorResponseSchema)(parsedResponse).pipe(
          Effect.catchAll(() =>
            Effect.succeed({
              error: {
                message: responseText || "Unknown API error",
                type: "unknown",
                code: error.status,
              },
            })
          )
        )
      );

      return yield* _(
        Effect.fail(
          new ApiError({
            status: error.status,
            response: errorResponse,
            message: errorResponse.error.message,
          })
        )
      );
    });

  // ============================================================================
  // Message Sending
  // ============================================================================

  sendMessage = (
    payload: unknown
  ): Effect.Effect<MessageApiResponse, ApiError> =>
    withMessageSendRetry(
      Effect.gen(function* (_) {
        const url = this.buildApiUrl("messages");
        const headers = this.createAuthHeaders();

        const request = HttpClientRequest.post(url).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.setBody(HttpBody.json(payload))
        );

        const response = yield* _(
          this.httpClient
            .execute(request)
            .pipe(
              Effect.flatMap((response) =>
                response.status >= 200 && response.status < 300
                  ? Effect.succeed(response)
                  : this.handleHttpError(response)
              )
            )
        );

        const responseBody = yield* _(
          Effect.tryPromise(() => response.json).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: error,
                  message: "Failed to parse response JSON",
                })
            )
          )
        );

        return yield* _(
          Schema.decodeUnknown(MessageApiResponseSchema)(responseBody).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: responseBody,
                  message: `Invalid response format: ${error.message}`,
                })
            )
          )
        );
      }),
      this.config
    );

  // ============================================================================
  // Media Upload
  // ============================================================================

  uploadMedia = (
    formData: FormData
  ): Effect.Effect<MediaUploadResponse, ApiError> =>
    withMediaUploadRetry(
      Effect.gen(function* (_) {
        const url = this.buildBusinessApiUrl("media");
        const headers = this.createMediaUploadHeaders();

        const request = HttpClientRequest.post(url).pipe(
          HttpClientRequest.setHeaders(headers),
          HttpClientRequest.setBody(HttpBody.formData(formData))
        );

        const response = yield* _(
          this.httpClient
            .execute(request)
            .pipe(
              Effect.flatMap((response) =>
                response.status >= 200 && response.status < 300
                  ? Effect.succeed(response)
                  : this.handleHttpError(response)
              )
            )
        );

        const responseBody = yield* _(
          Effect.tryPromise(() => response.json).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: error,
                  message: "Failed to parse media upload response JSON",
                })
            )
          )
        );

        return yield* _(
          Schema.decodeUnknown(MediaUploadResponseSchema)(responseBody).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: responseBody,
                  message: `Invalid media upload response format: ${error.message}`,
                })
            )
          )
        );
      }),
      this.config
    );

  // ============================================================================
  // Media Information Retrieval
  // ============================================================================

  getMedia = (mediaId: string): Effect.Effect<MediaInfoResponse, ApiError> =>
    withRateLimitRetry(
      Effect.gen(function* (_) {
        const url = `${this.config.baseUrl}/${this.config.apiVersion}/${mediaId}`;
        const headers = this.createAuthHeaders();

        const request = HttpClientRequest.get(url).pipe(
          HttpClientRequest.setHeaders(headers)
        );

        const response = yield* _(
          this.httpClient
            .execute(request)
            .pipe(
              Effect.flatMap((response) =>
                response.status >= 200 && response.status < 300
                  ? Effect.succeed(response)
                  : this.handleHttpError(response)
              )
            )
        );

        const responseBody = yield* _(
          Effect.tryPromise(() => response.json).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: error,
                  message: "Failed to parse media info response JSON",
                })
            )
          )
        );

        return yield* _(
          Schema.decodeUnknown(MediaInfoResponseSchema)(responseBody).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: responseBody,
                  message: `Invalid media info response format: ${error.message}`,
                })
            )
          )
        );
      }),
      this.config
    );

  // ============================================================================
  // Media Download
  // ============================================================================

  downloadMedia = (mediaUrl: string): Effect.Effect<Buffer, ApiError> =>
    withMediaDownloadRetry(
      Effect.gen(function* (_) {
        const headers = this.createAuthHeaders();

        const request = HttpClientRequest.get(mediaUrl).pipe(
          HttpClientRequest.setHeaders(headers)
        );

        const response = yield* _(
          this.httpClient
            .execute(request)
            .pipe(
              Effect.flatMap((response) =>
                response.status >= 200 && response.status < 300
                  ? Effect.succeed(response)
                  : this.handleHttpError(response)
              )
            )
        );

        return yield* _(
          Effect.tryPromise(() =>
            response.arrayBuffer.then((buffer: ArrayBuffer) =>
              Buffer.from(buffer)
            )
          ).pipe(
            Effect.mapError(
              (error) =>
                new ApiError({
                  status: response.status,
                  response: error,
                  message: "Failed to download media content",
                })
            )
          )
        );
      }),
      this.config
    );
}

// ============================================================================
// Service Layer
// ============================================================================

export const WhatsAppHttpClientLive = Layer.effect(
  WhatsAppHttpClient,
  Effect.gen(function* () {
    const config = yield* WhatsAppConfig;
    const httpClient = yield* HttpClient.HttpClient;

    return new WhatsAppHttpClientImpl(config, httpClient);
  })
);

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Creates a text message request payload
 */
export const createTextMessageRequest = (
  to: string,
  text: string,
  previewUrl?: boolean
): TextMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "text",
  text: {
    body: text,
    preview_url: previewUrl,
  },
});

/**
 * Creates a template message request payload
 */
export const createTemplateMessageRequest = (
  to: string,
  templateName: string,
  languageCode: string,
  components?: unknown[]
): TemplateMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "template",
  template: {
    name: templateName,
    language: {
      code: languageCode,
    },
    components,
  },
});

/**
 * Creates an image message request payload
 */
export const createImageMessageRequest = (
  to: string,
  imageUrl?: string,
  mediaId?: string,
  caption?: string
): ImageMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "image",
  image: {
    link: imageUrl,
    id: mediaId,
    caption,
  },
});

/**
 * Creates a document message request payload
 */
export const createDocumentMessageRequest = (
  to: string,
  documentUrl?: string,
  mediaId?: string,
  caption?: string,
  filename?: string
): DocumentMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "document",
  document: {
    link: documentUrl,
    id: mediaId,
    caption,
    filename,
  },
});

/**
 * Creates a video message request payload
 */
export const createVideoMessageRequest = (
  to: string,
  videoUrl?: string,
  mediaId?: string,
  caption?: string
): VideoMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "video",
  video: {
    link: videoUrl,
    id: mediaId,
    caption,
  },
});

/**
 * Creates an audio message request payload
 */
export const createAudioMessageRequest = (
  to: string,
  audioUrl?: string,
  mediaId?: string
): AudioMessageRequest => ({
  messaging_product: "whatsapp",
  recipient_type: "individual",
  to,
  type: "audio",
  audio: {
    link: audioUrl,
    id: mediaId,
  },
});

/**
 * Validates and creates FormData for media upload
 */
export const createMediaUploadFormData = (
  fileBuffer: Buffer,
  mimeType: string,
  filename?: string
): FormData => {
  const formData = new FormData();

  const blob = new Blob([fileBuffer], { type: mimeType });
  const finalFilename = filename || `media.${mimeType.split("/")[1]}`;

  formData.append("file", blob, finalFilename);
  formData.append("messaging_product", "whatsapp");

  return formData;
};

/**
 * Extracts message ID from API response
 */
export const extractMessageId = (
  response: MessageApiResponse
): string | undefined => {
  return response.messages[0]?.id;
};

/**
 * Extracts WhatsApp ID from API response
 */
export const extractWhatsAppId = (
  response: MessageApiResponse
): string | undefined => {
  return response.contacts[0]?.wa_id;
};

/**
 * Checks if message was accepted by WhatsApp
 */
export const isMessageAccepted = (response: MessageApiResponse): boolean => {
  const messageStatus = response.messages[0]?.message_status;
  return messageStatus === "accepted" || messageStatus === "sent";
};
