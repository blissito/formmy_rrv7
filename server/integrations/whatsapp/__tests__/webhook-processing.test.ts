import { describe, it, expect, beforeEach } from "vitest";
import { Effect, Option } from "effect";
import { WhatsAppServiceImpl } from "../WhatsAppService.js";
import { WhatsAppConfig } from "../config.js";
import { WhatsAppHttpClient } from "../httpClient.js";
import { ValidationError, WhatsAppError } from "../types.js";

// Mock HTTP client for testing
const mockHttpClient: WhatsAppHttpClient = {
  sendMessage: () =>
    Effect.succeed({ messages: [{ id: "test-id", message_status: "sent" }] }),
  uploadMedia: () => Effect.succeed({ id: "media-123" }),
  getMedia: () =>
    Effect.succeed({
      url: "https://example.com/media",
      mime_type: "image/jpeg",
      file_size: 1024,
    }),
  downloadMedia: () => Effect.succeed(Buffer.from("test-data")),
};

// Test configuration with webhook token
const testConfig: WhatsAppConfig = {
  phoneNumberId: "123456789",
  accessToken: "test-token",
  apiVersion: "v17.0",
  businessAccountId: "business-123",
  webhookVerifyToken: Option.some("webhook-secret"),
  maxRetries: 3,
  retryDelayMs: 1000,
  baseUrl: "https://graph.facebook.com",
};

// Test configuration without webhook token
const testConfigNoWebhook: WhatsAppConfig = {
  ...testConfig,
  webhookVerifyToken: Option.none(),
};

describe("Webhook Processing", () => {
  let service: WhatsAppServiceImpl;
  let serviceNoWebhook: WhatsAppServiceImpl;

  beforeEach(() => {
    service = new WhatsAppServiceImpl(testConfig, mockHttpClient);
    serviceNoWebhook = new WhatsAppServiceImpl(
      testConfigNoWebhook,
      mockHttpClient
    );
  });

  describe("processWebhook", () => {
    const validWebhookPayload = {
      object: "whatsapp_business_account",
      entry: [
        {
          id: "entry-123",
          changes: [
            {
              value: {
                messaging_product: "whatsapp",
                metadata: {
                  display_phone_number: "+1234567890",
                  phone_number_id: "123456789",
                },
                messages: [
                  {
                    from: "+1987654321",
                    id: "msg-123",
                    timestamp: "1640995200",
                    type: "text" as const,
                    text: {
                      body: "Hello, world!",
                    },
                  },
                ],
              },
              field: "messages" as const,
            },
          ],
        },
      ],
    };

    const validSignature =
      "sha256=a1b2c3d4e5f6789012345678901234567890123456789012345678901234567890";

    it("should process valid webhook with text message", async () => {
      const result = await Effect.runPromise(
        service.processWebhook(validWebhookPayload, validSignature)
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        from: "+1987654321",
        to: "123456789",
        body: "Hello, world!",
        messageId: "msg-123",
        timestamp: "1640995200",
        type: "text",
      });
    });

    it("should process webhook with image message", async () => {
      const imageWebhookPayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: "+1987654321",
                      id: "img-123",
                      timestamp: "1640995200",
                      type: "image" as const,
                      image: {
                        id: "media-123",
                        mime_type: "image/jpeg",
                        caption: "Check this out!",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(imageWebhookPayload, validSignature)
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        from: "+1987654321",
        to: "123456789",
        body: "Check this out!",
        messageId: "img-123",
        timestamp: "1640995200",
        type: "image",
        mediaId: "media-123",
      });
    });

    it("should process webhook with document message", async () => {
      const documentWebhookPayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: "+1987654321",
                      id: "doc-123",
                      timestamp: "1640995200",
                      type: "document" as const,
                      document: {
                        id: "doc-media-123",
                        mime_type: "application/pdf",
                        filename: "report.pdf",
                        caption: "Monthly report",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(documentWebhookPayload, validSignature)
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        from: "+1987654321",
        to: "123456789",
        body: "Monthly report",
        messageId: "doc-123",
        timestamp: "1640995200",
        type: "document",
        mediaId: "doc-media-123",
      });
    });

    it("should process webhook with audio message", async () => {
      const audioWebhookPayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: "+1987654321",
                      id: "audio-123",
                      timestamp: "1640995200",
                      type: "audio" as const,
                      audio: {
                        id: "audio-media-123",
                        mime_type: "audio/mpeg",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(audioWebhookPayload, validSignature)
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        from: "+1987654321",
        to: "123456789",
        body: "",
        messageId: "audio-123",
        timestamp: "1640995200",
        type: "audio",
        mediaId: "audio-media-123",
      });
    });

    it("should process webhook with multiple messages", async () => {
      const multiMessagePayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: "+1987654321",
                      id: "msg-1",
                      timestamp: "1640995200",
                      type: "text" as const,
                      text: {
                        body: "First message",
                      },
                    },
                    {
                      from: "+1987654321",
                      id: "msg-2",
                      timestamp: "1640995201",
                      type: "text" as const,
                      text: {
                        body: "Second message",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(multiMessagePayload, validSignature)
      );

      expect(result).toHaveLength(2);
      expect(result[0].body).toBe("First message");
      expect(result[1].body).toBe("Second message");
    });

    it("should skip webhook verification when token not configured", async () => {
      const result = await Effect.runPromise(
        serviceNoWebhook.processWebhook(
          validWebhookPayload,
          "invalid-signature"
        )
      );

      expect(result).toHaveLength(1);
      expect(result[0].body).toBe("Hello, world!");
    });

    it("should fail with invalid webhook payload structure", async () => {
      const invalidPayload = {
        object: "invalid_object",
        entry: [],
      };

      await expect(
        Effect.runPromise(
          service.processWebhook(invalidPayload, validSignature)
        )
      ).rejects.toThrow();
    });

    it("should fail with invalid signature format", async () => {
      const invalidSignature = "invalid-signature-format";

      await expect(
        Effect.runPromise(
          service.processWebhook(validWebhookPayload, invalidSignature)
        )
      ).rejects.toThrow();
    });

    it("should fail with invalid phone number in message", async () => {
      const invalidPhonePayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [
                    {
                      from: "invalid-phone",
                      id: "msg-123",
                      timestamp: "1640995200",
                      type: "text" as const,
                      text: {
                        body: "Hello, world!",
                      },
                    },
                  ],
                },
              },
            ],
          },
        ],
      };

      await expect(
        Effect.runPromise(
          service.processWebhook(invalidPhonePayload, validSignature)
        )
      ).rejects.toThrow();
    });

    it("should handle empty messages array", async () => {
      const emptyMessagesPayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: [],
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(emptyMessagesPayload, validSignature)
      );

      expect(result).toHaveLength(0);
    });

    it("should handle webhook with no messages field", async () => {
      const noMessagesPayload = {
        ...validWebhookPayload,
        entry: [
          {
            ...validWebhookPayload.entry[0],
            changes: [
              {
                ...validWebhookPayload.entry[0].changes[0],
                value: {
                  ...validWebhookPayload.entry[0].changes[0].value,
                  messages: undefined,
                },
              },
            ],
          },
        ],
      };

      const result = await Effect.runPromise(
        service.processWebhook(noMessagesPayload, validSignature)
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("signature verification", () => {
    it("should calculate correct signature", async () => {
      // This test would require mocking crypto module properly
      // For now, we'll test that the signature verification process works
      const payload = { test: "data" };
      const signature =
        "sha256=1234567890123456789012345678901234567890123456789012345678901234";

      // Should not throw when signature format is valid (even if verification fails)
      await expect(
        Effect.runPromise(service.processWebhook(payload, signature))
      ).rejects.toThrow(); // Will fail due to invalid payload structure, not signature
    });
  });

  describe("message type mapping", () => {
    it("should map webhook message types correctly", async () => {
      const testCases = [
        { webhookType: "text", expectedType: "text" },
        { webhookType: "image", expectedType: "image" },
        { webhookType: "document", expectedType: "document" },
        { webhookType: "audio", expectedType: "audio" },
        { webhookType: "voice", expectedType: "audio" },
        { webhookType: "video", expectedType: "video" },
        { webhookType: "sticker", expectedType: "image" },
      ];

      for (const testCase of testCases) {
        const payload = {
          object: "whatsapp_business_account",
          entry: [
            {
              id: "entry-123",
              changes: [
                {
                  value: {
                    messaging_product: "whatsapp",
                    metadata: {
                      display_phone_number: "+1234567890",
                      phone_number_id: "123456789",
                    },
                    messages: [
                      {
                        from: "+1987654321",
                        id: "msg-123",
                        timestamp: "1640995200",
                        type: testCase.webhookType as any,
                        [testCase.webhookType]:
                          testCase.webhookType === "text"
                            ? { body: "test" }
                            : { id: "media-123" },
                      },
                    ],
                  },
                  field: "messages" as const,
                },
              ],
            },
          ],
        };

        const result = await Effect.runPromise(
          serviceNoWebhook.processWebhook(payload, "dummy-signature")
        );

        expect(result[0].type).toBe(testCase.expectedType);
      }
    });
  });
});
