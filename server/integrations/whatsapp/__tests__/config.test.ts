import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { Effect, Config, Secret, Option } from "effect";
import {
  WhatsAppConfigSchema,
  validateWhatsAppConfig,
  CONFIG_ERROR_MESSAGES,
} from "../config.js";
import { ConfigurationError } from "../types.js";

describe("WhatsApp Configuration", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("WhatsAppConfigSchema", () => {
    it("should load valid configuration from environment variables", async () => {
      // Set up valid environment variables
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";
      process.env.WHATSAPP_API_VERSION = "v17.0";
      process.env.WHATSAPP_MAX_RETRIES = "3";
      process.env.WHATSAPP_RETRY_DELAY_MS = "1000";
      process.env.WHATSAPP_BASE_URL = "https://graph.facebook.com";

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      const result = await Effect.runPromise(program);

      expect(result.phoneNumberId).toBe("123456789");
      expect(result.accessToken).toBe("valid_access_token");
      expect(result.businessAccountId).toBe("business_123");
      expect(result.apiVersion).toBe("v17.0");
      expect(result.maxRetries).toBe(3);
      expect(result.retryDelayMs).toBe(1000);
      expect(result.baseUrl).toBe("https://graph.facebook.com");
    });

    it("should use default values for optional configuration", async () => {
      // Set up minimal required environment variables
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      const result = await Effect.runPromise(program);

      expect(result.apiVersion).toBe("v17.0");
      expect(result.maxRetries).toBe(3);
      expect(result.retryDelayMs).toBe(1000);
      expect(result.baseUrl).toBe("https://graph.facebook.com");
      expect(Option.isNone(result.webhookVerifyToken)).toBe(true);
    });

    it("should fail when required environment variables are missing", async () => {
      // Don't set any environment variables
      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should validate phone number ID is not empty", async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = "   "; // Empty string with spaces
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should validate API version format", async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";
      process.env.WHATSAPP_API_VERSION = "invalid_version"; // Invalid format

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should validate max retries range", async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";
      process.env.WHATSAPP_MAX_RETRIES = "15"; // Out of range

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should validate retry delay range", async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";
      process.env.WHATSAPP_RETRY_DELAY_MS = "50"; // Too low

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });

    it("should validate base URL is HTTPS", async () => {
      process.env.WHATSAPP_PHONE_NUMBER_ID = "123456789";
      process.env.WHATSAPP_ACCESS_TOKEN = "valid_access_token";
      process.env.WHATSAPP_BUSINESS_ACCOUNT_ID = "business_123";
      process.env.WHATSAPP_BASE_URL = "http://insecure.com"; // HTTP instead of HTTPS

      const program = Effect.gen(function* (_) {
        const config = yield* _(WhatsAppConfigSchema);
        return config;
      });

      await expect(Effect.runPromise(program)).rejects.toThrow();
    });
  });

  describe("validateWhatsAppConfig", () => {
    it("should return no errors for valid configuration", () => {
      const validConfig = {
        phoneNumberId: "123456789",
        accessToken: "valid_token",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.some("webhook_token"),
        maxRetries: 3,
        retryDelayMs: 1000,
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(validConfig);
      expect(errors).toHaveLength(0);
    });

    it("should return errors for invalid phone number ID", () => {
      const invalidConfig = {
        phoneNumberId: "",
        accessToken: "valid_token",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 3,
        retryDelayMs: 1000,
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("phoneNumberId");
    });

    it("should return errors for empty access token", () => {
      const invalidConfig = {
        phoneNumberId: "123456789",
        accessToken: "",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 3,
        retryDelayMs: 1000,
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("accessToken");
    });

    it("should return errors for invalid API version", () => {
      const invalidConfig = {
        phoneNumberId: "123456789",
        accessToken: "valid_token",
        apiVersion: "invalid",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 3,
        retryDelayMs: 1000,
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("apiVersion");
    });

    it("should return errors for invalid max retries", () => {
      const invalidConfig = {
        phoneNumberId: "123456789",
        accessToken: "valid_token",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 15, // Out of range
        retryDelayMs: 1000,
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("maxRetries");
    });

    it("should return errors for invalid retry delay", () => {
      const invalidConfig = {
        phoneNumberId: "123456789",
        accessToken: "valid_token",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 3,
        retryDelayMs: 50, // Too low
        baseUrl: "https://graph.facebook.com",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("retryDelayMs");
    });

    it("should return errors for invalid base URL", () => {
      const invalidConfig = {
        phoneNumberId: "123456789",
        accessToken: "valid_token",
        apiVersion: "v17.0",
        businessAccountId: "business_123",
        webhookVerifyToken: Option.none(),
        maxRetries: 3,
        retryDelayMs: 1000,
        baseUrl: "http://insecure.com", // HTTP instead of HTTPS
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors).toHaveLength(1);
      expect(errors[0]).toBeInstanceOf(ConfigurationError);
      expect(errors[0].field).toBe("baseUrl");
    });

    it("should return multiple errors for multiple invalid fields", () => {
      const invalidConfig = {
        phoneNumberId: "",
        accessToken: "",
        apiVersion: "invalid",
        businessAccountId: "",
        webhookVerifyToken: Option.none(),
        maxRetries: 15,
        retryDelayMs: 50,
        baseUrl: "invalid-url",
      };

      const errors = validateWhatsAppConfig(invalidConfig);
      expect(errors.length).toBeGreaterThan(1);

      const errorFields = errors.map((error) => error.field);
      expect(errorFields).toContain("phoneNumberId");
      expect(errorFields).toContain("accessToken");
      expect(errorFields).toContain("apiVersion");
      expect(errorFields).toContain("businessAccountId");
      expect(errorFields).toContain("maxRetries");
      expect(errorFields).toContain("retryDelayMs");
      expect(errorFields).toContain("baseUrl");
    });
  });

  describe("CONFIG_ERROR_MESSAGES", () => {
    it("should have all required error message constants", () => {
      expect(CONFIG_ERROR_MESSAGES.PHONE_NUMBER_ID_MISSING).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.ACCESS_TOKEN_MISSING).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.BUSINESS_ACCOUNT_ID_MISSING).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.INVALID_API_VERSION).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.INVALID_MAX_RETRIES).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.INVALID_RETRY_DELAY).toBeDefined();
      expect(CONFIG_ERROR_MESSAGES.INVALID_BASE_URL).toBeDefined();
    });
  });
});
