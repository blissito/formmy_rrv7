import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Schedule, Duration } from "effect";
import {
  shouldRetryError,
  createRetrySchedule,
  createRetryScheduleFromConfig,
  withRetry,
  withWhatsAppRetry,
  withMessageSendRetry,
  withMediaUploadRetry,
  withMediaDownloadRetry,
  withRateLimitRetry,
  calculateRetryDelay,
  formatRetryDelay,
  describeRetryConfig,
  DEFAULT_RETRY_CONFIG,
} from "../retrySchedule.js";
import { ApiError, WhatsAppError } from "../types.js";
import { WhatsAppConfig } from "../config.js";
import { Option } from "effect";

describe("Retry Schedule", () => {
  const mockConfig: WhatsAppConfig = {
    phoneNumberId: "123456789",
    accessToken: "test_token",
    apiVersion: "v17.0",
    businessAccountId: "business_123",
    webhookVerifyToken: Option.none(),
    maxRetries: 3,
    retryDelayMs: 1000,
    baseUrl: "https://graph.facebook.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("shouldRetryError", () => {
    it("should not retry client errors (4xx)", () => {
      const clientError = new ApiError({
        status: 400,
        response: {
          error: { message: "Bad Request", type: "client", code: 400 },
        },
        message: "Bad Request",
      });

      expect(shouldRetryError(clientError)).toBe(false);
    });

    it("should not retry 404 errors", () => {
      const notFoundError = new ApiError({
        status: 404,
        response: {
          error: { message: "Not Found", type: "client", code: 404 },
        },
        message: "Not Found",
      });

      expect(shouldRetryError(notFoundError)).toBe(false);
    });

    it("should retry server errors (5xx)", () => {
      const serverError = new ApiError({
        status: 500,
        response: {
          error: {
            message: "Internal Server Error",
            type: "server",
            code: 500,
          },
        },
        message: "Internal Server Error",
      });

      expect(shouldRetryError(serverError)).toBe(true);
    });

    it("should retry 502 Bad Gateway errors", () => {
      const badGatewayError = new ApiError({
        status: 502,
        response: {
          error: { message: "Bad Gateway", type: "server", code: 502 },
        },
        message: "Bad Gateway",
      });

      expect(shouldRetryError(badGatewayError)).toBe(true);
    });

    it("should retry network-related WhatsApp errors", () => {
      const networkError = new WhatsAppError({
        cause: new Error("Network timeout"),
        message: "Network error occurred",
        code: "NETWORK_ERROR",
      });

      expect(shouldRetryError(networkError)).toBe(true);
    });

    it("should retry timeout errors", () => {
      const timeoutError = new WhatsAppError({
        cause: new Error("Request timeout"),
        message: "Request timed out",
        code: "TIMEOUT_ERROR",
      });

      expect(shouldRetryError(timeoutError)).toBe(true);
    });

    it("should retry connection errors", () => {
      const connectionError = new WhatsAppError({
        cause: new Error("Connection refused"),
        message: "Connection error",
        code: "CONNECTION_ERROR",
      });

      expect(shouldRetryError(connectionError)).toBe(true);
    });

    it("should not retry other WhatsApp errors", () => {
      const validationError = new WhatsAppError({
        cause: new Error("Validation failed"),
        message: "Validation error",
        code: "VALIDATION_ERROR",
      });

      expect(shouldRetryError(validationError)).toBe(false);
    });

    it("should not retry unknown errors", () => {
      const unknownError = new Error("Unknown error");
      expect(shouldRetryError(unknownError)).toBe(false);
    });
  });

  describe("createRetrySchedule", () => {
    it("should create a retry schedule with correct configuration", () => {
      const schedule = createRetrySchedule(DEFAULT_RETRY_CONFIG);
      expect(schedule).toBeDefined();
    });

    it("should respect maximum retry attempts", async () => {
      const config = { ...DEFAULT_RETRY_CONFIG, maxRetries: 2 };
      const schedule = createRetrySchedule(config);

      let attempts = 0;
      const failingEffect = Effect.gen(function* () {
        attempts++;
        return yield* Effect.fail(
          new ApiError({
            status: 500,
            response: {
              error: { message: "Server Error", type: "server", code: 500 },
            },
            message: "Server Error",
          })
        );
      });

      const result = await Effect.runPromise(
        failingEffect.pipe(Effect.retry(schedule), Effect.either)
      );

      expect(result._tag).toBe("Left");
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });

    it("should not retry client errors", async () => {
      const schedule = createRetrySchedule(DEFAULT_RETRY_CONFIG);

      let attempts = 0;
      const clientErrorEffect = Effect.gen(function* () {
        attempts++;
        return yield* Effect.fail(
          new ApiError({
            status: 400,
            response: {
              error: { message: "Bad Request", type: "client", code: 400 },
            },
            message: "Bad Request",
          })
        );
      });

      const result = await Effect.runPromise(
        clientErrorEffect.pipe(Effect.retry(schedule), Effect.either)
      );

      expect(result._tag).toBe("Left");
      expect(attempts).toBe(1); // Only initial attempt, no retries
    });
  });

  describe("createRetryScheduleFromConfig", () => {
    it("should create retry schedule from WhatsApp config", () => {
      const schedule = createRetryScheduleFromConfig(mockConfig);
      expect(schedule).toBeDefined();
    });

    it("should use config values for retry parameters", async () => {
      const customConfig = {
        ...mockConfig,
        maxRetries: 1,
        retryDelayMs: 500,
      };

      const schedule = createRetryScheduleFromConfig(customConfig);

      let attempts = 0;
      const failingEffect = Effect.gen(function* () {
        attempts++;
        return yield* Effect.fail(
          new ApiError({
            status: 500,
            response: {
              error: { message: "Server Error", type: "server", code: 500 },
            },
            message: "Server Error",
          })
        );
      });

      const startTime = Date.now();
      const result = await Effect.runPromise(
        failingEffect.pipe(Effect.retry(schedule), Effect.either)
      );
      const endTime = Date.now();

      expect(result._tag).toBe("Left");
      expect(attempts).toBe(2); // Initial attempt + 1 retry
      // Should have some delay, but not too much due to jitter
      expect(endTime - startTime).toBeGreaterThan(200);
    });
  });

  describe("withRetry", () => {
    it("should successfully retry and eventually succeed", async () => {
      let attempts = 0;
      const eventuallySucceedingEffect = Effect.gen(function* () {
        attempts++;
        if (attempts < 3) {
          return yield* Effect.fail(
            new ApiError({
              status: 500,
              response: {
                error: { message: "Server Error", type: "server", code: 500 },
              },
              message: "Server Error",
            })
          );
        }
        return "success";
      });

      const schedule = createRetrySchedule({
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 3,
      });
      const result = await Effect.runPromise(
        withRetry(eventuallySucceedingEffect, schedule)
      );

      expect(result).toBe("success");
      expect(attempts).toBe(3);
    });

    it("should fail after exhausting all retries", async () => {
      let attempts = 0;
      const alwaysFailingEffect = Effect.gen(function* () {
        attempts++;
        return yield* Effect.fail(
          new ApiError({
            status: 500,
            response: {
              error: { message: "Server Error", type: "server", code: 500 },
            },
            message: "Server Error",
          })
        );
      });

      const schedule = createRetrySchedule({
        ...DEFAULT_RETRY_CONFIG,
        maxRetries: 2,
      });
      const result = await Effect.runPromise(
        withRetry(alwaysFailingEffect, schedule).pipe(Effect.either)
      );

      expect(result._tag).toBe("Left");
      expect(attempts).toBe(3); // Initial attempt + 2 retries
    });
  });

  describe("withWhatsAppRetry", () => {
    it("should use WhatsApp config for retry logic", async () => {
      let attempts = 0;
      const failingEffect = Effect.gen(function* () {
        attempts++;
        return yield* Effect.fail(
          new ApiError({
            status: 500,
            response: {
              error: { message: "Server Error", type: "server", code: 500 },
            },
            message: "Server Error",
          })
        );
      });

      const result = await Effect.runPromise(
        withWhatsAppRetry(failingEffect, mockConfig).pipe(Effect.either)
      );

      expect(result._tag).toBe("Left");
      expect(attempts).toBe(4); // Initial attempt + 3 retries (from mockConfig.maxRetries)
    }, 10000); // 10 second timeout
  });

  describe("specialized retry functions", () => {
    it("withMessageSendRetry should work correctly", async () => {
      let attempts = 0;
      const messageEffect = Effect.gen(function* () {
        attempts++;
        if (attempts < 2) {
          return yield* Effect.fail(
            new ApiError({
              status: 500,
              response: {
                error: { message: "Server Error", type: "server", code: 500 },
              },
              message: "Server Error",
            })
          );
        }
        return {
          messageId: "msg_123",
          status: "sent",
          timestamp: "2023-01-01T00:00:00Z",
        };
      });

      const result = await Effect.runPromise(
        withMessageSendRetry(messageEffect, mockConfig)
      );

      expect(result.messageId).toBe("msg_123");
      expect(attempts).toBe(2);
    });

    it("withMediaUploadRetry should work correctly", async () => {
      let attempts = 0;
      const uploadEffect = Effect.gen(function* () {
        attempts++;
        if (attempts < 2) {
          return yield* Effect.fail(
            new ApiError({
              status: 502,
              response: {
                error: { message: "Bad Gateway", type: "server", code: 502 },
              },
              message: "Bad Gateway",
            })
          );
        }
        return { id: "media_123" };
      });

      const result = await Effect.runPromise(
        withMediaUploadRetry(uploadEffect, mockConfig)
      );

      expect(result.id).toBe("media_123");
      expect(attempts).toBe(2);
    });

    it("withMediaDownloadRetry should work correctly", async () => {
      let attempts = 0;
      const downloadEffect = Effect.gen(function* () {
        attempts++;
        if (attempts < 2) {
          return yield* Effect.fail(
            new ApiError({
              status: 503,
              response: {
                error: {
                  message: "Service Unavailable",
                  type: "server",
                  code: 503,
                },
              },
              message: "Service Unavailable",
            })
          );
        }
        return Buffer.from("media content");
      });

      const result = await Effect.runPromise(
        withMediaDownloadRetry(downloadEffect, mockConfig)
      );

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toBe("media content");
      expect(attempts).toBe(2);
    });

    it("withRateLimitRetry should handle rate limiting", async () => {
      let attempts = 0;
      const rateLimitedEffect = Effect.gen(function* () {
        attempts++;
        if (attempts < 2) {
          return yield* Effect.fail(
            new ApiError({
              status: 429,
              response: {
                error: {
                  message: "Too Many Requests",
                  type: "client",
                  code: 429,
                },
              },
              message: "Too Many Requests",
            })
          );
        }
        return "success";
      });

      const result = await Effect.runPromise(
        withRateLimitRetry(rateLimitedEffect, mockConfig)
      );

      expect(result).toBe("success");
      expect(attempts).toBe(2);
    }, 10000); // 10 second timeout
  });

  describe("utility functions", () => {
    describe("calculateRetryDelay", () => {
      it("should calculate exponential backoff correctly", () => {
        const delay1 = calculateRetryDelay(0, 1000, 2, 30000, false);
        const delay2 = calculateRetryDelay(1, 1000, 2, 30000, false);
        const delay3 = calculateRetryDelay(2, 1000, 2, 30000, false);

        expect(delay1).toBe(1000); // 1000 * 2^0
        expect(delay2).toBe(2000); // 1000 * 2^1
        expect(delay3).toBe(4000); // 1000 * 2^2
      });

      it("should respect maximum delay", () => {
        const delay = calculateRetryDelay(10, 1000, 2, 5000, false);
        expect(delay).toBe(5000);
      });

      it("should add jitter when enabled", () => {
        const delay1 = calculateRetryDelay(1, 1000, 2, 30000, true);
        const delay2 = calculateRetryDelay(1, 1000, 2, 30000, true);

        // With jitter, delays should be different (most of the time)
        // We'll just check they're in a reasonable range
        expect(delay1).toBeGreaterThan(1500); // Base 2000 - 25% = 1500
        expect(delay1).toBeLessThan(2500); // Base 2000 + 25% = 2500
        expect(delay2).toBeGreaterThan(1500);
        expect(delay2).toBeLessThan(2500);
      });
    });

    describe("formatRetryDelay", () => {
      it("should format milliseconds correctly", () => {
        expect(formatRetryDelay(500)).toBe("500ms");
        expect(formatRetryDelay(999)).toBe("999ms");
      });

      it("should format seconds correctly", () => {
        expect(formatRetryDelay(1000)).toBe("1.0s");
        expect(formatRetryDelay(2500)).toBe("2.5s");
        expect(formatRetryDelay(59999)).toBe("60.0s");
      });

      it("should format minutes correctly", () => {
        expect(formatRetryDelay(60000)).toBe("1.0m");
        expect(formatRetryDelay(90000)).toBe("1.5m");
        expect(formatRetryDelay(120000)).toBe("2.0m");
      });
    });

    describe("describeRetryConfig", () => {
      it("should create human-readable description", () => {
        const description = describeRetryConfig(DEFAULT_RETRY_CONFIG);
        expect(description).toContain("Max retries: 3");
        expect(description).toContain("Base delay: 1.0s");
        expect(description).toContain("Max delay: 30.0s");
        expect(description).toContain("Backoff: 2x");
        expect(description).toContain("Jitter: enabled");
      });

      it("should handle disabled jitter", () => {
        const config = { ...DEFAULT_RETRY_CONFIG, jitterEnabled: false };
        const description = describeRetryConfig(config);
        expect(description).toContain("Jitter: disabled");
      });
    });
  });

  describe("error classification edge cases", () => {
    it("should handle API errors with status 0 (network issues)", () => {
      const networkError = new ApiError({
        status: 0,
        response: {
          error: { message: "Network Error", type: "network", code: 0 },
        },
        message: "Network Error",
      });

      expect(shouldRetryError(networkError)).toBe(true);
    });

    it("should handle API errors in 300-399 range", () => {
      const redirectError = new ApiError({
        status: 301,
        response: {
          error: { message: "Moved Permanently", type: "redirect", code: 301 },
        },
        message: "Moved Permanently",
      });

      expect(shouldRetryError(redirectError)).toBe(true);
    });

    it("should handle rate limiting (429) as retryable", () => {
      const rateLimitError = new ApiError({
        status: 429,
        response: {
          error: {
            message: "Too Many Requests",
            type: "rate_limit",
            code: 429,
          },
        },
        message: "Too Many Requests",
      });

      expect(shouldRetryError(rateLimitError)).toBe(true);
    });
  });
});
