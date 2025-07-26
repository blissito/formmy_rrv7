# Design Document

## Overview

The refactored WhatsApp service will be a single, consolidated service that uses Effect-TS for functional error handling and validation. The service will replace the existing duplicate implementations with a robust, production-ready solution that handles all WhatsApp Business API operations through a unified interface. The design emphasizes type safety, comprehensive validation, and functional programming patterns using Effect-TS.

## Architecture

### Core Components

```
WhatsAppService (Main Service)
├── Configuration (Config validation and management)
├── MessageSender (Outbound message handling)
├── WebhookProcessor (Inbound message processing)
├── MediaHandler (File upload/download operations)
├── ValidationLayer (Input validation using Effect)
└── ErrorHandler (Centralized error management with Effect)
```

### Effect-TS Integration

The service will use Effect-TS for:

- Error handling instead of try/catch blocks
- Validation pipelines
- Retry mechanisms with exponential backoff
- Configuration validation
- Logging and observability

## Components and Interfaces

### 1. Core Service Interface

```typescript
import { Effect, Config, Layer } from "@effect/core";
import { HttpClient } from "@effect/platform";

export interface WhatsAppService {
  sendTextMessage: (
    to: string,
    text: string,
    previewUrl?: boolean
  ) => Effect.Effect<MessageResponse, WhatsAppError>;
  sendTemplateMessage: (
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
  ) => Effect.Effect<MessageResponse, WhatsAppError>;
  sendImageMessage: (
    to: string,
    imageUrl: string,
    caption?: string
  ) => Effect.Effect<MessageResponse, WhatsAppError>;
  uploadMedia: (
    fileBuffer: Buffer,
    mimeType: string
  ) => Effect.Effect<string, WhatsAppError>;
  processWebhook: (
    payload: unknown,
    signature: string
  ) => Effect.Effect<IncomingMessage, WhatsAppError>;
}
```

### 2. Configuration Schema

```typescript
export interface WhatsAppConfig {
  readonly phoneNumberId: string;
  readonly accessToken: string;
  readonly apiVersion: string;
  readonly businessAccountId: string;
  readonly webhookVerifyToken?: string;
  readonly maxRetries: number;
  readonly retryDelayMs: number;
}

// Effect Config schema
export const WhatsAppConfigSchema = Config.all({
  phoneNumberId: Config.string("WHATSAPP_PHONE_NUMBER_ID"),
  accessToken: Config.secret("WHATSAPP_ACCESS_TOKEN"),
  apiVersion: Config.string("WHATSAPP_API_VERSION").pipe(
    Config.withDefault("v17.0")
  ),
  businessAccountId: Config.string("WHATSAPP_BUSINESS_ACCOUNT_ID"),
  webhookVerifyToken: Config.optional(
    Config.secret("WHATSAPP_WEBHOOK_VERIFY_TOKEN")
  ),
  maxRetries: Config.integer("WHATSAPP_MAX_RETRIES").pipe(
    Config.withDefault(3)
  ),
  retryDelayMs: Config.integer("WHATSAPP_RETRY_DELAY_MS").pipe(
    Config.withDefault(1000)
  ),
});
```

### 3. Error Types

```typescript
export class WhatsAppError extends Data.TaggedError("WhatsAppError")<{
  readonly cause: unknown;
  readonly message: string;
  readonly code: string;
}> {}

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly field: string;
  readonly message: string;
}> {}

export class ValidationError extends Data.TaggedError("ValidationError")<{
  readonly field: string;
  readonly value: unknown;
  readonly message: string;
}> {}

export class ApiError extends Data.TaggedError("ApiError")<{
  readonly status: number;
  readonly response: unknown;
  readonly message: string;
}> {}
```

### 4. Message Types

```typescript
export interface MessageResponse {
  readonly messageId: string;
  readonly status: string;
  readonly timestamp: string;
}

export interface IncomingMessage {
  readonly from: string;
  readonly to: string;
  readonly body: string;
  readonly messageId: string;
  readonly timestamp: string;
  readonly type: MessageType;
  readonly mediaId?: string;
}

export type MessageType =
  | "text"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "template";
```

### 5. Validation Layer

```typescript
export const PhoneNumberSchema = Schema.string.pipe(
  Schema.pattern(/^\+?[1-9]\d{1,14}$/),
  Schema.brand("PhoneNumber")
);

export const MessageTextSchema = Schema.string.pipe(
  Schema.minLength(1),
  Schema.maxLength(4096),
  Schema.brand("MessageText")
);

export const TemplateNameSchema = Schema.string.pipe(
  Schema.pattern(/^[a-z0-9_]+$/),
  Schema.brand("TemplateName")
);
```

## Data Models

### 1. Service Implementation

```typescript
export class WhatsAppServiceImpl implements WhatsAppService {
  constructor(
    private readonly config: WhatsAppConfig,
    private readonly httpClient: HttpClient.HttpClient,
    private readonly logger: Logger.Logger
  ) {}

  sendTextMessage = (to: string, text: string, previewUrl = false) =>
    Effect.gen(function* (_) {
      const validatedPhone = yield* _(
        Schema.decodeUnknown(PhoneNumberSchema)(to)
      );
      const validatedText = yield* _(
        Schema.decodeUnknown(MessageTextSchema)(text)
      );

      const message = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: validatedPhone,
        type: "text",
        text: {
          body: validatedText,
          preview_url: previewUrl,
        },
      };

      return yield* _(sendMessageWithRetry(message));
    });

  private sendMessageWithRetry = (message: unknown) =>
    Effect.gen(function* (_) {
      const response = yield* _(
        httpClient.post("/messages", { body: HttpBody.json(message) }).pipe(
          Effect.retry(
            Schedule.exponential(this.config.retryDelayMs).pipe(
              Schedule.intersect(Schedule.recurs(this.config.maxRetries))
            )
          ),
          Effect.catchTag("HttpError", (error) =>
            error.status >= 400 && error.status < 500
              ? Effect.fail(
                  new ApiError({
                    status: error.status,
                    response: error.body,
                    message: "Client error",
                  })
                )
              : Effect.fail(
                  new WhatsAppError({
                    cause: error,
                    message: "Server error",
                    code: "SERVER_ERROR",
                  })
                )
          )
        )
      );

      return yield* _(
        Schema.decodeUnknown(MessageResponseSchema)(response.body)
      );
    });
}
```

### 2. Webhook Processing

```typescript
export const processWebhook = (payload: unknown, signature: string) =>
  Effect.gen(function* (_) {
    yield* _(verifyWebhookSignature(payload, signature));
    const validatedPayload = yield* _(
      Schema.decodeUnknown(WebhookPayloadSchema)(payload)
    );

    return yield* _(
      Effect.forEach(validatedPayload.entry, (entry) =>
        Effect.forEach(entry.changes, (change) =>
          change.field === "messages"
            ? processMessageChange(change.value)
            : Effect.succeed(undefined)
        )
      )
    );
  });

const verifyWebhookSignature = (payload: unknown, signature: string) =>
  Effect.gen(function* (_) {
    const config = yield* _(WhatsAppConfigSchema);
    const expectedSignature = yield* _(
      calculateSignature(payload, config.webhookVerifyToken)
    );

    return signature === expectedSignature
      ? Effect.succeed(true)
      : Effect.fail(
          new ValidationError({
            field: "signature",
            value: signature,
            message: "Invalid webhook signature",
          })
        );
  });
```

### 3. Media Handling

```typescript
export const uploadMedia = (fileBuffer: Buffer, mimeType: string) =>
  Effect.gen(function* (_) {
    const validatedMimeType = yield* _(
      Schema.decodeUnknown(MimeTypeSchema)(mimeType)
    );
    const validatedBuffer = yield* _(validateFileSize(fileBuffer));

    const formData = new FormData();
    formData.append("file", validatedBuffer, {
      filename: `media.${validatedMimeType.split("/")[1]}`,
      contentType: validatedMimeType,
    });
    formData.append("messaging_product", "whatsapp");

    const response = yield* _(
      httpClient
        .post("/media", {
          body: HttpBody.formData(formData),
          headers: Headers.fromInput(formData.getHeaders()),
        })
        .pipe(Effect.retry(Schedule.exponential(1000).pipe(Schedule.recurs(3))))
    );

    const result = yield* _(
      Schema.decodeUnknown(MediaUploadResponseSchema)(response.body)
    );
    return result.id;
  });

const validateFileSize = (buffer: Buffer) =>
  buffer.length > 16 * 1024 * 1024 // 16MB limit
    ? Effect.fail(
        new ValidationError({
          field: "fileSize",
          value: buffer.length,
          message: "File size exceeds 16MB limit",
        })
      )
    : Effect.succeed(buffer);
```

## Error Handling

### 1. Error Classification

```typescript
export const handleWhatsAppError = (error: unknown) =>
  Match.value(error).pipe(
    Match.when(Match.instanceOf(ConfigurationError), (err) =>
      Effect.logError(`Configuration error: ${err.message}`).pipe(
        Effect.zipRight(Effect.fail(err))
      )
    ),
    Match.when(Match.instanceOf(ValidationError), (err) =>
      Effect.logWarning(`Validation error: ${err.message}`).pipe(
        Effect.zipRight(Effect.fail(err))
      )
    ),
    Match.when(Match.instanceOf(ApiError), (err) =>
      err.status >= 500
        ? Effect.logError(`API server error: ${err.message}`).pipe(
            Effect.zipRight(Effect.fail(err))
          )
        : Effect.logWarning(`API client error: ${err.message}`).pipe(
            Effect.zipRight(Effect.fail(err))
          )
    ),
    Match.orElse(() =>
      Effect.logError(`Unexpected error: ${String(error)}`).pipe(
        Effect.zipRight(
          Effect.fail(
            new WhatsAppError({
              cause: error,
              message: "Unexpected error",
              code: "UNKNOWN_ERROR",
            })
          )
        )
      )
    )
  );
```

### 2. Retry Strategies

```typescript
export const retrySchedule = Schedule.exponential(Duration.millis(1000)).pipe(
  Schedule.intersect(Schedule.recurs(3)),
  Schedule.whileInput((error: unknown) =>
    Match.value(error).pipe(
      Match.when(Match.instanceOf(ApiError), (err) => err.status >= 500),
      Match.when(
        Match.instanceOf(WhatsAppError),
        (err) => err.code === "NETWORK_ERROR"
      ),
      Match.orElse(() => false)
    )
  )
);
```

## Service Layer Integration

### 1. Layer Construction

```typescript
export const WhatsAppServiceLive = Layer.effect(
  WhatsAppService,
  Effect.gen(function* (_) {
    const config = yield* _(WhatsAppConfigSchema);
    const httpClient = yield* _(HttpClient.HttpClient);
    const logger = yield* _(Logger.Logger);

    return new WhatsAppServiceImpl(config, httpClient, logger);
  })
).pipe(Layer.provide(HttpClient.layer), Layer.provide(Logger.layer));
```

### 2. Service Usage

```typescript
export const sendWelcomeMessage = (phoneNumber: string, userName: string) =>
  Effect.gen(function* (_) {
    const whatsappService = yield* _(WhatsAppService);

    return yield* _(
      whatsappService.sendTemplateMessage(
        phoneNumber,
        "welcome_template",
        "es",
        [{ type: "text", text: userName }]
      )
    );
  }).pipe(
    Effect.provide(WhatsAppServiceLive),
    Effect.catchAll(handleWhatsAppError)
  );
```

## Logging and Observability

### 1. Structured Logging

```typescript
export const logMessageSent = (messageId: string, to: string, type: string) =>
  Effect.logInfo("Message sent successfully", {
    messageId,
    to: maskPhoneNumber(to),
    type,
    timestamp: new Date().toISOString(),
  });

export const logWebhookReceived = (payload: unknown) =>
  Effect.logInfo("Webhook received", {
    payloadSize: JSON.stringify(payload).length,
    timestamp: new Date().toISOString(),
  });
```

### 2. Metrics Collection

```typescript
export const incrementMessageCounter = (
  type: string,
  status: "success" | "error"
) =>
  Effect.sync(() => {
    // Increment metrics counter
    metrics.increment(`whatsapp.messages.${type}.${status}`);
  });
```

This design provides a comprehensive, production-ready WhatsApp service that consolidates the existing implementations while using Effect-TS for robust error handling and functional programming patterns. The service includes proper validation, retry mechanisms, and observability features required for production deployment.
