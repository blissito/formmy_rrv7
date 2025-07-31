import { Config, Secret, Option, Effect, Layer, Context } from "effect";
import { ConfigurationError } from "./types.js";

// ============================================================================
// WhatsApp Configuration Interface
// ============================================================================

export interface WhatsAppConfig {
  readonly phoneNumberId: string;
  readonly accessToken: string; // Changed from Secret.Secret to string for easier HTTP client usage
  readonly apiVersion: string;
  readonly businessAccountId: string;
  readonly webhookVerifyToken: Option.Option<string>; // Changed from Secret.Secret to string
  readonly maxRetries: number;
  readonly retryDelayMs: number;
  readonly baseUrl: string;
}

// Context tag for dependency injection
export const WhatsAppConfig = Context.GenericTag<WhatsAppConfig>(
  "@services/WhatsAppConfig"
);

// ============================================================================
// Configuration Schema using Effect Config
// ============================================================================

export const WhatsAppConfigSchema = Config.all({
  phoneNumberId: Config.string("WHATSAPP_PHONE_NUMBER_ID").pipe(
    Config.validate({
      message: "Phone Number ID must be a non-empty string",
      validation: (value) => value.trim().length > 0,
    })
  ),

  accessToken: Config.secret("WHATSAPP_ACCESS_TOKEN").pipe(
    Config.validate({
      message: "Access Token must be a non-empty secret",
      validation: (secret) => Secret.value(secret).trim().length > 0,
    }),
    Config.map(Secret.value) // Extract the string value from Secret
  ),

  apiVersion: Config.string("WHATSAPP_API_VERSION").pipe(
    Config.withDefault("v17.0"),
    Config.validate({
      message: "API Version must match pattern vX.Y (e.g., v17.0)",
      validation: (value) => /^v\d+\.\d+$/.test(value),
    })
  ),

  businessAccountId: Config.string("WHATSAPP_BUSINESS_ACCOUNT_ID").pipe(
    Config.validate({
      message: "Business Account ID must be a non-empty string",
      validation: (value) => value.trim().length > 0,
    })
  ),

  webhookVerifyToken: Config.option(
    Config.secret("WHATSAPP_WEBHOOK_VERIFY_TOKEN").pipe(
      Config.map(Secret.value) // Extract the string value from Secret
    )
  ),

  maxRetries: Config.integer("WHATSAPP_MAX_RETRIES").pipe(
    Config.withDefault(3),
    Config.validate({
      message: "Max retries must be between 0 and 10",
      validation: (value) => value >= 0 && value <= 10,
    })
  ),

  retryDelayMs: Config.integer("WHATSAPP_RETRY_DELAY_MS").pipe(
    Config.withDefault(1000),
    Config.validate({
      message: "Retry delay must be between 100ms and 30000ms",
      validation: (value) => value >= 100 && value <= 30000,
    })
  ),

  baseUrl: Config.string("WHATSAPP_BASE_URL").pipe(
    Config.withDefault("https://graph.facebook.com"),
    Config.validate({
      message: "Base URL must be a valid HTTPS URL",
      validation: (value) => {
        try {
          const url = new URL(value);
          return url.protocol === "https:";
        } catch {
          return false;
        }
      },
    })
  ),
});

// ============================================================================
// Configuration Validation Helpers
// ============================================================================

/**
 * Validates the complete WhatsApp configuration
 * Provides detailed error messages for each validation failure
 */
export const validateWhatsAppConfig = (config: WhatsAppConfig) => {
  const errors: ConfigurationError[] = [];

  // Validate phone number ID
  if (!config.phoneNumberId || config.phoneNumberId.trim().length === 0) {
    errors.push(
      new ConfigurationError({
        field: "phoneNumberId",
        message: "Phone Number ID is required and cannot be empty",
      })
    );
  }

  // Validate access token
  if (!config.accessToken || config.accessToken.trim().length === 0) {
    errors.push(
      new ConfigurationError({
        field: "accessToken",
        message: "Access Token is required and cannot be empty",
      })
    );
  }

  // Validate API version format
  if (!config.apiVersion || !/^v\d+\.\d+$/.test(config.apiVersion)) {
    errors.push(
      new ConfigurationError({
        field: "apiVersion",
        message: "API Version must be in format vX.Y (e.g., v17.0)",
      })
    );
  }

  // Validate business account ID
  if (
    !config.businessAccountId ||
    config.businessAccountId.trim().length === 0
  ) {
    errors.push(
      new ConfigurationError({
        field: "businessAccountId",
        message: "Business Account ID is required and cannot be empty",
      })
    );
  }

  // Validate webhook verify token if provided
  if (Option.isSome(config.webhookVerifyToken)) {
    const webhookTokenValue = config.webhookVerifyToken.value;
    if (!webhookTokenValue || webhookTokenValue.trim().length === 0) {
      errors.push(
        new ConfigurationError({
          field: "webhookVerifyToken",
          message: "Webhook Verify Token cannot be empty if provided",
        })
      );
    }
  }

  // Validate max retries
  if (config.maxRetries < 0 || config.maxRetries > 10) {
    errors.push(
      new ConfigurationError({
        field: "maxRetries",
        message: "Max retries must be between 0 and 10",
      })
    );
  }

  // Validate retry delay
  if (config.retryDelayMs < 100 || config.retryDelayMs > 30000) {
    errors.push(
      new ConfigurationError({
        field: "retryDelayMs",
        message: "Retry delay must be between 100ms and 30000ms",
      })
    );
  }

  // Validate base URL
  try {
    const url = new URL(config.baseUrl);
    if (url.protocol !== "https:") {
      errors.push(
        new ConfigurationError({
          field: "baseUrl",
          message: "Base URL must use HTTPS protocol",
        })
      );
    }
  } catch {
    errors.push(
      new ConfigurationError({
        field: "baseUrl",
        message: "Base URL must be a valid URL",
      })
    );
  }

  return errors;
};

// ============================================================================
// Configuration Error Messages
// ============================================================================

export const CONFIG_ERROR_MESSAGES = {
  PHONE_NUMBER_ID_MISSING:
    "WHATSAPP_PHONE_NUMBER_ID environment variable is required",
  ACCESS_TOKEN_MISSING:
    "WHATSAPP_ACCESS_TOKEN environment variable is required",
  BUSINESS_ACCOUNT_ID_MISSING:
    "WHATSAPP_BUSINESS_ACCOUNT_ID environment variable is required",
  INVALID_API_VERSION:
    "WHATSAPP_API_VERSION must be in format vX.Y (e.g., v17.0)",
  INVALID_MAX_RETRIES: "WHATSAPP_MAX_RETRIES must be a number between 0 and 10",
  INVALID_RETRY_DELAY:
    "WHATSAPP_RETRY_DELAY_MS must be a number between 100 and 30000",
  INVALID_BASE_URL: "WHATSAPP_BASE_URL must be a valid HTTPS URL",
} as const;

// ============================================================================
// Environment Variable Documentation
// ============================================================================

/**
 * Required Environment Variables:
 *
 * WHATSAPP_PHONE_NUMBER_ID - The WhatsApp Business phone number ID from Meta
 * WHATSAPP_ACCESS_TOKEN - The access token for WhatsApp Business API
 * WHATSAPP_BUSINESS_ACCOUNT_ID - The business account ID from Meta
 *
 * Optional Environment Variables:
 *
 * WHATSAPP_API_VERSION - API version to use (default: v17.0)
 * WHATSAPP_WEBHOOK_VERIFY_TOKEN - Token for webhook verification
 * WHATSAPP_MAX_RETRIES - Maximum retry attempts (default: 3, range: 0-10)
 * WHATSAPP_RETRY_DELAY_MS - Delay between retries in ms (default: 1000, range: 100-30000)
 * WHATSAPP_BASE_URL - Base URL for WhatsApp API (default: https://graph.facebook.com)
 */

// ============================================================================
// Configuration Service Layer
// ============================================================================

/**
 * Layer that provides WhatsAppConfig service from environment variables
 */
export const WhatsAppConfigLive = Layer.effect(
  WhatsAppConfig,
  Effect.gen(function* () {
    const config = yield* WhatsAppConfigSchema;

    // Validate the configuration
    const validationErrors = validateWhatsAppConfig(config);
    if (validationErrors.length > 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "configuration",
          message: `Configuration validation failed: ${validationErrors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ")}`,
        })
      );
    }

    return config;
  })
);

/**
 * Creates a WhatsAppConfig service with explicit configuration values
 * Useful for testing or when configuration comes from sources other than environment variables
 */
export const makeWhatsAppConfigLayer = (config: WhatsAppConfig) =>
  Layer.succeed(WhatsAppConfig, config);

/**
 * Effect that loads and validates WhatsApp configuration
 */
export const loadWhatsAppConfig = (): Effect.Effect<
  WhatsAppConfig,
  ConfigurationError
> =>
  Effect.gen(function* () {
    const config = yield* WhatsAppConfigSchema.pipe(
      Effect.mapError(
        (error) =>
          new ConfigurationError({
            field: "environment",
            message: `Failed to load configuration from environment: ${error.message}`,
          })
      )
    );

    const validationErrors = validateWhatsAppConfig(config);
    if (validationErrors.length > 0) {
      return yield* Effect.fail(
        new ConfigurationError({
          field: "validation",
          message: `Configuration validation failed: ${validationErrors
            .map((e) => `${e.field}: ${e.message}`)
            .join(", ")}`,
        })
      );
    }

    return config;
  });
