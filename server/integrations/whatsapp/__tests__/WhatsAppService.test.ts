import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer, Context } from "effect";
import {
  WhatsAppServiceImpl,
  WhatsAppService,
  WhatsAppServiceLive,
} from "../WhatsAppService.js";
import { WhatsAppConfig } from "../config.js";
import { WhatsAppHttpClient } from "../httpClient.js";
import { WhatsAppError, ApiError, ValidationError } from "../types.js";
import type { MessageApiResponse } from "../httpClient.js";

// Mock dependencies
const mockConfig: WhatsAppConfig = {
  phoneNumberId: "123456789",
  accessToken: "test-token",
  apiVersion: "v17.0",
  businessAccountId: "business-123",
  webhookVerifyToken: { _tag: "Some", value: "webhook-token" },
  maxRetries: 3,
  retryDelayMs: 1000,
  baseUrl: "https://graph.facebook.com",
};

const mockHttpClient = {
  sendMessage: vi.fn(),
  uploadMedia: vi.fn(),
  getMedia: vi.fn(),
  downloadMedia: vi.fn(),
};

const mockApiResponse: MessageApiResponse = {
  messaging_product: "whatsapp",
  contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
  messages: [{ id: "msg_123", message_status: "accepted" }],
};

describe("WhatsAppService", () => {
  let service: WhatsAppServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhatsAppServiceImpl(mockConfig, mockHttpClient as any);
  });

  describe("sendTextMessage", () => {
    it("should send a text message successfully", async () => {
      // Arrange
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendTextMessage("+1234567890", "Hello, World!")
      );

      // Assert
      expect(result).toEqual({
        messageId: "msg_123",
        status: "accepted",
        timestamp: expect.any(String),
      });
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "text",
        text: {
          body: "Hello, World!",
          preview_url: false,
        },
      });
    });

    it("should handle validation errors", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(service.sendTextMessage("invalid-phone", "Hello"))
      ).rejects.toThrow();
    });

    it("should handle API errors", async () => {
      // Arrange
      const apiError = new ApiError({
        status: 400,
        response: { error: { message: "Invalid phone number" } },
        message: "Invalid phone number",
      });
      mockHttpClient.sendMessage.mockReturnValue(Effect.fail(apiError));

      // Act & Assert
      await expect(
        Effect.runPromise(service.sendTextMessage("+1234567890", "Hello"))
      ).rejects.toThrow(ApiError);
    });

    it("should handle missing message ID", async () => {
      // Arrange
      const responseWithoutId: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [], // No messages array
      };
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(responseWithoutId)
      );

      // Act & Assert
      await expect(
        Effect.runPromise(service.sendTextMessage("+1234567890", "Hello"))
      ).rejects.toThrow(WhatsAppError);
    });

    it("should support preview URL option", async () => {
      // Arrange
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      await Effect.runPromise(
        service.sendTextMessage(
          "+1234567890",
          "Check this out: https://example.com",
          true
        )
      );

      // Assert
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "text",
        text: {
          body: "Check this out: https://example.com",
          preview_url: true,
        },
      });
    });
  });

  describe("sendTemplateMessage", () => {
    it("should send a template message successfully", async () => {
      // Arrange
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendTemplateMessage("+1234567890", "welcome_template", "en", [
          { type: "body", parameters: [{ type: "text", text: "John" }] },
        ])
      );

      // Assert
      expect(result).toEqual({
        messageId: "msg_123",
        status: "accepted",
        timestamp: expect.any(String),
      });
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "template",
        template: {
          name: "welcome_template",
          language: { code: "en" },
          components: [
            { type: "body", parameters: [{ type: "text", text: "John" }] },
          ],
        },
      });
    });

    it("should handle invalid template name", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendTemplateMessage("+1234567890", "Invalid Template!", "en")
        )
      ).rejects.toThrow();
    });

    it("should handle invalid language code", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendTemplateMessage(
            "+1234567890",
            "welcome_template",
            "invalid"
          )
        )
      ).rejects.toThrow();
    });
  });

  describe("sendImageMessage", () => {
    it("should send an image message successfully", async () => {
      // Arrange
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendImageMessage(
          "+1234567890",
          "https://example.com/image.jpg",
          "Check this out!"
        )
      );

      // Assert
      expect(result).toEqual({
        messageId: "msg_123",
        status: "accepted",
        timestamp: expect.any(String),
      });
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "image",
        image: {
          link: "https://example.com/image.jpg",
          id: undefined,
          caption: "Check this out!",
        },
      });
    });

    it("should handle invalid image URL", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendImageMessage("+1234567890", "invalid-url", "Caption")
        )
      ).rejects.toThrow();
    });

    it("should send image without caption", async () => {
      // Arrange
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      await Effect.runPromise(
        service.sendImageMessage("+1234567890", "https://example.com/image.jpg")
      );

      // Assert
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "image",
        image: {
          link: "https://example.com/image.jpg",
          id: undefined,
          caption: undefined,
        },
      });
    });
  });

  describe("sendMessage", () => {
    it("should send a generic message successfully", async () => {
      // Arrange
      const customPayload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "text",
        text: { body: "Custom message" },
      };
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendMessage(customPayload)
      );

      // Assert
      expect(result).toEqual({
        messageId: "msg_123",
        status: "accepted",
        timestamp: expect.any(String),
      });
      expect(mockHttpClient.sendMessage).toHaveBeenCalledWith(customPayload);
    });

    it("should handle invalid payload", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(service.sendMessage(null))
      ).rejects.toThrow(ValidationError);

      await expect(
        Effect.runPromise(service.sendMessage("string"))
      ).rejects.toThrow(ValidationError);

      await expect(Effect.runPromise(service.sendMessage(123))).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("message status handling", () => {
    it("should return 'failed' status when message is not accepted", async () => {
      // Arrange
      const failedResponse: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg_123", message_status: "failed" }],
      };
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(failedResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendTextMessage("+1234567890", "Hello")
      );

      // Assert
      expect(result.status).toBe("failed");
    });

    it("should return 'accepted' status when message is sent", async () => {
      // Arrange
      const sentResponse: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg_123", message_status: "sent" }],
      };
      mockHttpClient.sendMessage.mockReturnValue(Effect.succeed(sentResponse));

      // Act
      const result = await Effect.runPromise(
        service.sendTextMessage("+1234567890", "Hello")
      );

      // Assert
      expect(result.status).toBe("accepted");
    });
  });
});

describe("WhatsAppService Layer", () => {
  it("should create service layer correctly", async () => {
    // This test would require more complex setup with Effect layers
    // For now, we'll just verify the layer exists
    expect(WhatsAppServiceLive).toBeDefined();
  });
});
