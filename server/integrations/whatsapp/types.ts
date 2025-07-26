import { Data } from "effect";
import { Schema } from "@effect/schema";

// ============================================================================
// Error Types using Effect Data
// ============================================================================

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

// ============================================================================
// Message Types and Interfaces
// ============================================================================

export type MessageType =
  | "text"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "template";

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

// ============================================================================
// Branded Types using Effect Schema
// ============================================================================

// Phone Number Schema with validation and branding
export const PhoneNumberSchema = Schema.String.pipe(
  Schema.pattern(/^\+[1-9]\d{7,14}$/, {
    message: () =>
      "Phone number must be in international format (E.164) starting with + and 8-15 digits",
  }),
  Schema.brand("PhoneNumber")
);

export type PhoneNumber = Schema.Schema.Type<typeof PhoneNumberSchema>;

// Message Text Schema with length validation and branding
export const MessageTextSchema = Schema.String.pipe(
  Schema.minLength(1, { message: () => "Message text cannot be empty" }),
  Schema.maxLength(4096, {
    message: () => "Message text cannot exceed 4096 characters",
  }),
  Schema.brand("MessageText")
);

export type MessageText = Schema.Schema.Type<typeof MessageTextSchema>;

// Template Name Schema with pattern validation and branding
export const TemplateNameSchema = Schema.String.pipe(
  Schema.pattern(/^[a-z0-9_]+$/, {
    message: () =>
      "Template name must contain only lowercase letters, numbers, and underscores",
  }),
  Schema.brand("TemplateName")
);

export type TemplateName = Schema.Schema.Type<typeof TemplateNameSchema>;

// MIME Type Schema for media validation
export const MimeTypeSchema = Schema.String.pipe(
  Schema.pattern(
    /^(image\/(jpeg|jpg|png|webp)|video\/(mp4|3gpp)|audio\/(aac|amr|mpeg|mp4|ogg)|application\/(pdf|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|text\/plain)$/,
    {
      message: () =>
        "MIME type must be a WhatsApp supported format (image, video, audio, document, or text)",
    }
  ),
  Schema.brand("MimeType")
);

export type MimeType = Schema.Schema.Type<typeof MimeTypeSchema>;

// ============================================================================
// File Size Validation Schemas
// ============================================================================

// File Size Schema for media validation (16MB limit for WhatsApp)
export const FileSizeSchema = Schema.Number.pipe(
  Schema.positive({ message: () => "File size must be positive" }),
  Schema.lessThanOrEqualTo(16 * 1024 * 1024, {
    message: () => "File size cannot exceed 16MB (WhatsApp limit)",
  }),
  Schema.brand("FileSize")
);

export type FileSize = Schema.Schema.Type<typeof FileSizeSchema>;

// Image File Size Schema (5MB limit for images)
export const ImageFileSizeSchema = Schema.Number.pipe(
  Schema.positive({ message: () => "Image file size must be positive" }),
  Schema.lessThanOrEqualTo(5 * 1024 * 1024, {
    message: () => "Image file size cannot exceed 5MB",
  }),
  Schema.brand("ImageFileSize")
);

export type ImageFileSize = Schema.Schema.Type<typeof ImageFileSizeSchema>;

// Video File Size Schema (16MB limit for videos)
export const VideoFileSizeSchema = Schema.Number.pipe(
  Schema.positive({ message: () => "Video file size must be positive" }),
  Schema.lessThanOrEqualTo(16 * 1024 * 1024, {
    message: () => "Video file size cannot exceed 16MB",
  }),
  Schema.brand("VideoFileSize")
);

export type VideoFileSize = Schema.Schema.Type<typeof VideoFileSizeSchema>;

// Audio File Size Schema (16MB limit for audio)
export const AudioFileSizeSchema = Schema.Number.pipe(
  Schema.positive({ message: () => "Audio file size must be positive" }),
  Schema.lessThanOrEqualTo(16 * 1024 * 1024, {
    message: () => "Audio file size cannot exceed 16MB",
  }),
  Schema.brand("AudioFileSize")
);

export type AudioFileSize = Schema.Schema.Type<typeof AudioFileSizeSchema>;

// Document File Size Schema (100MB limit for documents)
export const DocumentFileSizeSchema = Schema.Number.pipe(
  Schema.positive({ message: () => "Document file size must be positive" }),
  Schema.lessThanOrEqualTo(100 * 1024 * 1024, {
    message: () => "Document file size cannot exceed 100MB",
  }),
  Schema.brand("DocumentFileSize")
);

export type DocumentFileSize = Schema.Schema.Type<
  typeof DocumentFileSizeSchema
>;

// ============================================================================
// Enhanced MIME Type Schemas for Specific Media Types
// ============================================================================

// Image MIME Type Schema
export const ImageMimeTypeSchema = Schema.String.pipe(
  Schema.pattern(/^image\/(jpeg|jpg|png|webp)$/, {
    message: () => "Image MIME type must be jpeg, jpg, png, or webp",
  }),
  Schema.brand("ImageMimeType")
);

export type ImageMimeType = Schema.Schema.Type<typeof ImageMimeTypeSchema>;

// Video MIME Type Schema
export const VideoMimeTypeSchema = Schema.String.pipe(
  Schema.pattern(/^video\/(mp4|3gpp)$/, {
    message: () => "Video MIME type must be mp4 or 3gpp",
  }),
  Schema.brand("VideoMimeType")
);

export type VideoMimeType = Schema.Schema.Type<typeof VideoMimeTypeSchema>;

// Audio MIME Type Schema
export const AudioMimeTypeSchema = Schema.String.pipe(
  Schema.pattern(/^audio\/(aac|amr|mpeg|mp4|ogg)$/, {
    message: () => "Audio MIME type must be aac, amr, mpeg, mp4, or ogg",
  }),
  Schema.brand("AudioMimeType")
);

export type AudioMimeType = Schema.Schema.Type<typeof AudioMimeTypeSchema>;

// Document MIME Type Schema
export const DocumentMimeTypeSchema = Schema.String.pipe(
  Schema.pattern(
    /^(application\/(pdf|vnd\.ms-powerpoint|vnd\.openxmlformats-officedocument\.presentationml\.presentation|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet)|text\/plain)$/,
    {
      message: () =>
        "Document MIME type must be a supported document format (PDF, Word, Excel, PowerPoint, or plain text)",
    }
  ),
  Schema.brand("DocumentMimeType")
);

export type DocumentMimeType = Schema.Schema.Type<
  typeof DocumentMimeTypeSchema
>;

// ============================================================================
// Phone Number Formatting and Validation Utilities
// ============================================================================

// Enhanced Phone Number Schema with country code validation
export const EnhancedPhoneNumberSchema = Schema.String.pipe(
  Schema.pattern(/^\+[1-9]\d{7,14}$/, {
    message: () =>
      "Phone number must be in international format (E.164) starting with + and 8-15 digits",
  }),
  Schema.transform(Schema.String, {
    decode: (phoneNumber) => {
      // Normalize phone number format
      return phoneNumber.replace(/\s+/g, "").replace(/[^\d+]/g, "");
    },
    encode: (phoneNumber) => phoneNumber,
  }),
  Schema.brand("EnhancedPhoneNumber")
);

export type EnhancedPhoneNumber = Schema.Schema.Type<
  typeof EnhancedPhoneNumberSchema
>;

// Country Code Schema
export const CountryCodeSchema = Schema.String.pipe(
  Schema.pattern(/^\+[1-9]\d{0,3}$/, {
    message: () => "Country code must start with + followed by 1-4 digits",
  }),
  Schema.brand("CountryCode")
);

export type CountryCode = Schema.Schema.Type<typeof CountryCodeSchema>;

// Media ID Schema for WhatsApp media references
export const MediaIdSchema = Schema.String.pipe(
  Schema.minLength(1, { message: () => "Media ID cannot be empty" }),
  Schema.brand("MediaId")
);

export type MediaId = Schema.Schema.Type<typeof MediaIdSchema>;

// ============================================================================
// Additional Utility Types
// ============================================================================

// Language Code Schema for template messages
export const LanguageCodeSchema = Schema.String.pipe(
  Schema.pattern(/^[a-z]{2}(_[A-Z]{2})?$/, {
    message: () => "Language code must be in format 'en' or 'en_US'",
  }),
  Schema.brand("LanguageCode")
);

export type LanguageCode = Schema.Schema.Type<typeof LanguageCodeSchema>;

// Message ID Schema for WhatsApp message references
export const MessageIdSchema = Schema.String.pipe(
  Schema.minLength(1, { message: () => "Message ID cannot be empty" }),
  Schema.brand("MessageId")
);

export type MessageId = Schema.Schema.Type<typeof MessageIdSchema>;

// ============================================================================
// URL and Media Validation Schemas
// ============================================================================

// URL Schema for media URLs and webhook URLs
export const UrlSchema = Schema.String.pipe(
  Schema.pattern(/^https?:\/\/[^\s/$.?#].[^\s]*$/, {
    message: () => "URL must be a valid HTTP or HTTPS URL",
  }),
  Schema.brand("Url")
);

export type Url = Schema.Schema.Type<typeof UrlSchema>;

// HTTPS URL Schema for secure media URLs
export const HttpsUrlSchema = Schema.String.pipe(
  Schema.pattern(/^https:\/\/[^\s/$.?#].[^\s]*$/, {
    message: () => "URL must be a valid HTTPS URL",
  }),
  Schema.brand("HttpsUrl")
);

export type HttpsUrl = Schema.Schema.Type<typeof HttpsUrlSchema>;

// Media URL Schema specifically for WhatsApp media
export const MediaUrlSchema = Schema.String.pipe(
  Schema.pattern(
    /^https:\/\/[^\s/$.?#].[^\s]*\.(jpg|jpeg|png|webp|mp4|3gpp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|aac|amr|mpeg|ogg)(\?.*)?$/i,
    {
      message: () =>
        "Media URL must be a valid HTTPS URL pointing to a supported media file",
    }
  ),
  Schema.brand("MediaUrl")
);

export type MediaUrl = Schema.Schema.Type<typeof MediaUrlSchema>;

// ============================================================================
// Template Message Validation Schemas
// ============================================================================

// Template Component Type Schema
export const TemplateComponentTypeSchema = Schema.Literal(
  "header",
  "body",
  "footer",
  "button"
);

export type TemplateComponentType = Schema.Schema.Type<
  typeof TemplateComponentTypeSchema
>;

// Template Parameter Schema
export const TemplateParameterSchema = Schema.Struct({
  type: Schema.Literal(
    "text",
    "currency",
    "date_time",
    "image",
    "document",
    "video"
  ),
  text: Schema.optional(
    Schema.String.pipe(
      Schema.minLength(1, {
        message: () => "Template parameter text cannot be empty",
      }),
      Schema.maxLength(1024, {
        message: () => "Template parameter text cannot exceed 1024 characters",
      })
    )
  ),
  currency: Schema.optional(
    Schema.Struct({
      fallback_value: Schema.String,
      code: Schema.String.pipe(
        Schema.length(3, {
          message: () => "Currency code must be 3 characters",
        })
      ),
      amount_1000: Schema.Number.pipe(Schema.int(), Schema.positive()),
    })
  ),
  date_time: Schema.optional(
    Schema.Struct({
      fallback_value: Schema.String,
    })
  ),
  image: Schema.optional(
    Schema.Struct({
      link: HttpsUrlSchema,
    })
  ),
  document: Schema.optional(
    Schema.Struct({
      link: HttpsUrlSchema,
      filename: Schema.optional(Schema.String),
    })
  ),
  video: Schema.optional(
    Schema.Struct({
      link: HttpsUrlSchema,
    })
  ),
});

export type TemplateParameter = Schema.Schema.Type<
  typeof TemplateParameterSchema
>;

// Template Component Schema
export const TemplateComponentSchema = Schema.Struct({
  type: TemplateComponentTypeSchema,
  parameters: Schema.optional(Schema.Array(TemplateParameterSchema)),
});

export type TemplateComponent = Schema.Schema.Type<
  typeof TemplateComponentSchema
>;

// ============================================================================
// Webhook Validation Schemas
// ============================================================================

// Webhook Signature Schema
export const WebhookSignatureSchema = Schema.String.pipe(
  Schema.pattern(/^sha256=[a-f0-9]{64}$/, {
    message: () =>
      "Webhook signature must be in format 'sha256=' followed by 64 hex characters",
  }),
  Schema.brand("WebhookSignature")
);

export type WebhookSignature = Schema.Schema.Type<
  typeof WebhookSignatureSchema
>;

// Timestamp Schema for webhook and message timestamps
export const TimestampSchema = Schema.String.pipe(
  Schema.pattern(/^\d{10}$/, {
    message: () => "Timestamp must be a 10-digit Unix timestamp",
  }),
  Schema.brand("Timestamp")
);

export type Timestamp = Schema.Schema.Type<typeof TimestampSchema>;

// ============================================================================
// Validation Utility Functions
// ============================================================================

/**
 * Validates file size based on MIME type
 */
export const validateFileSizeForMimeType = (
  fileSize: number,
  mimeType: string
) => {
  if (mimeType.startsWith("image/")) {
    return Schema.decodeUnknown(ImageFileSizeSchema)(fileSize);
  } else if (mimeType.startsWith("video/")) {
    return Schema.decodeUnknown(VideoFileSizeSchema)(fileSize);
  } else if (mimeType.startsWith("audio/")) {
    return Schema.decodeUnknown(AudioFileSizeSchema)(fileSize);
  } else if (mimeType.startsWith("application/") || mimeType === "text/plain") {
    return Schema.decodeUnknown(DocumentFileSizeSchema)(fileSize);
  } else {
    return Schema.decodeUnknown(FileSizeSchema)(fileSize);
  }
};

/**
 * Validates MIME type for specific media category
 */
export const validateMimeTypeForCategory = (
  mimeType: string,
  category: "image" | "video" | "audio" | "document"
) => {
  switch (category) {
    case "image":
      return Schema.decodeUnknown(ImageMimeTypeSchema)(mimeType);
    case "video":
      return Schema.decodeUnknown(VideoMimeTypeSchema)(mimeType);
    case "audio":
      return Schema.decodeUnknown(AudioMimeTypeSchema)(mimeType);
    case "document":
      return Schema.decodeUnknown(DocumentMimeTypeSchema)(mimeType);
    default:
      return Schema.decodeUnknown(MimeTypeSchema)(mimeType);
  }
};
