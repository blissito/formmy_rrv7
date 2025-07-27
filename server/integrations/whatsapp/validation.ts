import { Effect } from "effect";
import { Schema } from "@effect/schema";
import {
  PhoneNumberSchema,
  EnhancedPhoneNumberSchema,
  MessageTextSchema,
  TemplateNameSchema,
  MimeTypeSchema,
  ImageMimeTypeSchema,
  VideoMimeTypeSchema,
  AudioMimeTypeSchema,
  DocumentMimeTypeSchema,
  FileSizeSchema,
  ImageFileSizeSchema,
  VideoFileSizeSchema,
  AudioFileSizeSchema,
  DocumentFileSizeSchema,
  UrlSchema,
  HttpsUrlSchema,
  MediaUrlSchema,
  LanguageCodeSchema,
  WebhookSignatureSchema,
  TimestampSchema,
  TemplateComponentSchema,
  WebhookPayloadSchema,
  ValidationError,
  type PhoneNumber,
  type MessageText,
  type TemplateName,
  type MimeType,
  type FileSize,
  type Url,
  type LanguageCode,
  type WebhookSignature,
  type Timestamp,
  type TemplateComponent,
  type WebhookPayload,
} from "./types.js";

// ============================================================================
// Phone Number Validation and Formatting
// ============================================================================

/**
 * Validates and formats a phone number to E.164 format
 */
export const validatePhoneNumber = (
  phoneNumber: string
): Effect.Effect<PhoneNumber, ValidationError> =>
  Schema.decodeUnknown(PhoneNumberSchema)(phoneNumber).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "phoneNumber",
          value: phoneNumber,
          message: `Invalid phone number: ${error.message}`,
        })
    )
  );

/**
 * Enhanced phone number validation with normalization
 */
export const validateAndNormalizePhoneNumber = (
  phoneNumber: string
): Effect.Effect<string, ValidationError> =>
  Schema.decodeUnknown(EnhancedPhoneNumberSchema)(phoneNumber).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "phoneNumber",
          value: phoneNumber,
          message: `Invalid phone number format: ${error.message}`,
        })
    )
  );

/**
 * Formats phone number for logging (masks middle digits)
 */
export const maskPhoneNumber = (phoneNumber: string): string => {
  if (phoneNumber.length <= 6) return phoneNumber;
  const start = phoneNumber.substring(0, 3);
  const end = phoneNumber.substring(phoneNumber.length - 3);
  const middle = "*".repeat(phoneNumber.length - 6);
  return `${start}${middle}${end}`;
};

/**
 * Extracts country code from phone number
 */
export const extractCountryCode = (phoneNumber: string): string => {
  // Check for 1-digit country codes first (like +1, +7)
  if (/^\+[17]\d/.test(phoneNumber)) {
    return phoneNumber.substring(0, 2); // +1 or +7
  }

  // Check for 2-digit country codes
  const twoDigitMatch = phoneNumber.match(/^\+(\d{2})\d/);
  if (twoDigitMatch) {
    return `+${twoDigitMatch[1]}`;
  }

  // Check for 3-digit country codes
  const threeDigitMatch = phoneNumber.match(/^\+(\d{3})\d/);
  if (threeDigitMatch) {
    return `+${threeDigitMatch[1]}`;
  }

  return "";
};

// ============================================================================
// Message Content Validation
// ============================================================================

/**
 * Validates message text content
 */
export const validateMessageText = (
  text: string
): Effect.Effect<MessageText, ValidationError> =>
  Schema.decodeUnknown(MessageTextSchema)(text).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "messageText",
          value: text,
          message: `Invalid message text: ${error.message}`,
        })
    )
  );

/**
 * Validates template name
 */
export const validateTemplateName = (
  templateName: string
): Effect.Effect<TemplateName, ValidationError> =>
  Schema.decodeUnknown(TemplateNameSchema)(templateName).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "templateName",
          value: templateName,
          message: `Invalid template name: ${error.message}`,
        })
    )
  );

/**
 * Validates language code for templates
 */
export const validateLanguageCode = (
  languageCode: string
): Effect.Effect<LanguageCode, ValidationError> =>
  Schema.decodeUnknown(LanguageCodeSchema)(languageCode).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "languageCode",
          value: languageCode,
          message: `Invalid language code: ${error.message}`,
        })
    )
  );

/**
 * Validates template components
 */
export const validateTemplateComponents = (
  components: unknown[]
): Effect.Effect<TemplateComponent[], ValidationError> =>
  Effect.forEach(components, (component, index) =>
    Schema.decodeUnknown(TemplateComponentSchema)(component).pipe(
      Effect.mapError(
        (error) =>
          new ValidationError({
            field: `templateComponent[${index}]`,
            value: component,
            message: `Invalid template component at index ${index}: ${error.message}`,
          })
      )
    )
  );

// ============================================================================
// Media and File Validation
// ============================================================================

/**
 * Validates MIME type
 */
export const validateMimeType = (
  mimeType: string
): Effect.Effect<MimeType, ValidationError> =>
  Schema.decodeUnknown(MimeTypeSchema)(mimeType).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "mimeType",
          value: mimeType,
          message: `Invalid MIME type: ${error.message}`,
        })
    )
  );

/**
 * Validates MIME type for specific media category
 */
export const validateMimeTypeForCategory = (
  mimeType: string,
  category: "image" | "video" | "audio" | "document"
): Effect.Effect<string, ValidationError> => {
  const schema = (() => {
    switch (category) {
      case "image":
        return ImageMimeTypeSchema;
      case "video":
        return VideoMimeTypeSchema;
      case "audio":
        return AudioMimeTypeSchema;
      case "document":
        return DocumentMimeTypeSchema;
      default:
        return MimeTypeSchema;
    }
  })();

  return Schema.decodeUnknown(schema)(mimeType).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "mimeType",
          value: mimeType,
          message: `Invalid ${category} MIME type: ${error.message}`,
        })
    )
  );
};

/**
 * Validates file size
 */
export const validateFileSize = (
  fileSize: number
): Effect.Effect<FileSize, ValidationError> =>
  Schema.decodeUnknown(FileSizeSchema)(fileSize).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "fileSize",
          value: fileSize,
          message: `Invalid file size: ${error.message}`,
        })
    )
  );

/**
 * Validates file size based on MIME type category
 */
export const validateFileSizeForMimeType = (
  fileSize: number,
  mimeType: string
): Effect.Effect<number, ValidationError> => {
  const schema = (() => {
    if (mimeType.startsWith("image/")) {
      return ImageFileSizeSchema;
    } else if (mimeType.startsWith("video/")) {
      return VideoFileSizeSchema;
    } else if (mimeType.startsWith("audio/")) {
      return AudioFileSizeSchema;
    } else if (
      mimeType.startsWith("application/") ||
      mimeType === "text/plain"
    ) {
      return DocumentFileSizeSchema;
    } else {
      return FileSizeSchema;
    }
  })();

  return Schema.decodeUnknown(schema)(fileSize).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "fileSize",
          value: fileSize,
          message: `Invalid file size for ${mimeType}: ${error.message}`,
        })
    )
  );
};

/**
 * Validates media file (both MIME type and size)
 */
export const validateMediaFile = (
  fileSize: number,
  mimeType: string
): Effect.Effect<{ size: number; type: string }, ValidationError> =>
  Effect.gen(function* (_) {
    const validatedMimeType = yield* _(validateMimeType(mimeType));
    const validatedFileSize = yield* _(
      validateFileSizeForMimeType(fileSize, mimeType)
    );

    return {
      size: validatedFileSize,
      type: validatedMimeType,
    };
  });

// ============================================================================
// URL Validation
// ============================================================================

/**
 * Validates URL
 */
export const validateUrl = (url: string): Effect.Effect<Url, ValidationError> =>
  Schema.decodeUnknown(UrlSchema)(url).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "url",
          value: url,
          message: `Invalid URL: ${error.message}`,
        })
    )
  );

/**
 * Validates HTTPS URL
 */
export const validateHttpsUrl = (
  url: string
): Effect.Effect<string, ValidationError> =>
  Schema.decodeUnknown(HttpsUrlSchema)(url).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "httpsUrl",
          value: url,
          message: `Invalid HTTPS URL: ${error.message}`,
        })
    )
  );

/**
 * Validates media URL
 */
export const validateMediaUrl = (
  url: string
): Effect.Effect<string, ValidationError> =>
  Schema.decodeUnknown(MediaUrlSchema)(url).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "mediaUrl",
          value: url,
          message: `Invalid media URL: ${error.message}`,
        })
    )
  );

// ============================================================================
// Webhook Validation
// ============================================================================

/**
 * Validates webhook signature
 */
export const validateWebhookSignature = (
  signature: string
): Effect.Effect<WebhookSignature, ValidationError> =>
  Schema.decodeUnknown(WebhookSignatureSchema)(signature).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "webhookSignature",
          value: signature,
          message: `Invalid webhook signature: ${error.message}`,
        })
    )
  );

/**
 * Validates timestamp
 */
export const validateTimestamp = (
  timestamp: string
): Effect.Effect<Timestamp, ValidationError> =>
  Schema.decodeUnknown(TimestampSchema)(timestamp).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "timestamp",
          value: timestamp,
          message: `Invalid timestamp: ${error.message}`,
        })
    )
  );

/**
 * Validates webhook payload structure
 */
export const validateWebhookPayload = (
  payload: unknown
): Effect.Effect<WebhookPayload, ValidationError> =>
  Schema.decodeUnknown(WebhookPayloadSchema)(payload).pipe(
    Effect.mapError(
      (error) =>
        new ValidationError({
          field: "webhookPayload",
          value: payload,
          message: `Invalid webhook payload: ${error.message}`,
        })
    )
  );

// ============================================================================
// Composite Validation Functions
// ============================================================================

/**
 * Validates a complete text message
 */
export const validateTextMessage = (
  to: string,
  text: string
): Effect.Effect<{ to: PhoneNumber; text: MessageText }, ValidationError> =>
  Effect.gen(function* (_) {
    const validatedTo = yield* _(validatePhoneNumber(to));
    const validatedText = yield* _(validateMessageText(text));

    return {
      to: validatedTo,
      text: validatedText,
    };
  });

/**
 * Validates a complete template message
 */
export const validateTemplateMessage = (
  to: string,
  templateName: string,
  languageCode: string,
  components?: unknown[]
): Effect.Effect<
  {
    to: PhoneNumber;
    templateName: TemplateName;
    languageCode: LanguageCode;
    components?: TemplateComponent[];
  },
  ValidationError
> =>
  Effect.gen(function* (_) {
    const validatedTo = yield* _(validatePhoneNumber(to));
    const validatedTemplateName = yield* _(validateTemplateName(templateName));
    const validatedLanguageCode = yield* _(validateLanguageCode(languageCode));
    const validatedComponents = components
      ? yield* _(validateTemplateComponents(components))
      : undefined;

    return {
      to: validatedTo,
      templateName: validatedTemplateName,
      languageCode: validatedLanguageCode,
      components: validatedComponents,
    };
  });

/**
 * Validates a complete media message
 */
export const validateMediaMessage = (
  to: string,
  mediaUrl: string,
  caption?: string
): Effect.Effect<
  {
    to: PhoneNumber;
    mediaUrl: string;
    caption?: MessageText;
  },
  ValidationError
> =>
  Effect.gen(function* (_) {
    const validatedTo = yield* _(validatePhoneNumber(to));
    const validatedMediaUrl = yield* _(validateMediaUrl(mediaUrl));
    const validatedCaption = caption
      ? yield* _(validateMessageText(caption))
      : undefined;

    return {
      to: validatedTo,
      mediaUrl: validatedMediaUrl,
      caption: validatedCaption,
    };
  });

// ============================================================================
// Validation Error Helpers
// ============================================================================

/**
 * Creates a validation error with context
 */
export const createValidationError = (
  field: string,
  value: unknown,
  message: string
): ValidationError =>
  new ValidationError({
    field,
    value,
    message,
  });

/**
 * Combines multiple validation errors
 */
export const combineValidationErrors = (
  errors: ValidationError[]
): ValidationError =>
  new ValidationError({
    field: "multiple",
    value: errors.map((e) => e.field),
    message: `Multiple validation errors: ${errors
      .map((e) => `${e.field}: ${e.message}`)
      .join(", ")}`,
  });
