import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Layer, Context } from "effect";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import {
  WhatsAppHttpClient,
  WhatsAppHttpClientImpl,
  WhatsAppHttpClientLive,
  createTextMessageRequest,
  createTemplateMessageRequest,
  createImageMessageRequest,
  createMediaUploadFormData,
  extractMessageId,
  isMessageAccepted,
  type MessageApiResponse,
  type MediaUploadResponse,
} from "../httpClient.js";
import { WhatsAppConfig } from "../config.js";
import { ApiError } from "../types.js";

// Mock HTTP client
const mockHttpClient = {
  execute: vi.fn(),
} as unknown as HttpClient.HttpClient;

// Mock configuration
const mockConfig: WhatsAppConfig = {
  phoneNumberId: "123456789",
  accessToken: "test-access-token",
  apiVersion: "v17.0",
  businessAccountId: "business-123",
  webhookVerifyToken: { _tag: "None" },
  maxRetries: 3,
  retryDelayMs: 1000,
  baseUrl: "https://graph.facebook.com",
};

describe("WhatsAppHttpClient", () => {
  let httpClient: WhatsAppHttpClientImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    httpClient = new WhatsAppHttpClientImpl(mockConfig, mockHttpClient);
  });

  describe("URL Construction", () => {
    it("should build correct API URL for messages", () => {
      const expectedUrl = "https://graph.facebook.com/v17.0/123456789/messages";

      // We can't directly test the private method, but we can test it through sendMessage
      const mockResponse = {
        status: 200,
        json: Promise.resolve({
          messaging_product: "whatsapp",
          contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
          messages: [{ id: "msg-123", message_status: "accepted" }],
        }),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const payload = createTextMessageRequest("+1234567890", "Hello World");

      Effect.runSync(httpClient.sendMessage(payload));

      expect(mockHttpClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expectedUrl,
        })
      );
    });

    it("should build correct API URL for media upload", () => {
      const expectedUrl = "https://graph.facebook.com/v17.0/business-123/media";

      const mockResponse = {
        status: 200,
        json: Promise.resolve({ id: "media-123" }),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const formData = createMediaUploadFormData(
        Buffer.from("test"),
        "image/jpeg"
      );

      Effect.runSync(httpClient.uploadMedia(formData));

      expect(mockHttpClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expectedUrl,
        })
      );
    });
  });

  describe("Authentication Headers", () => {
    it("should include correct authorization header for messages", () => {
      const mockResponse = {
        status: 200,
        json: Promise.resolve({
          messaging_product: "whatsapp",
          contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
          messages: [{ id: "msg-123", message_status: "accepted" }],
        }),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const payload = createTextMessageRequest("+1234567890", "Hello World");

      Effect.runSync(httpClient.sendMessage(payload));

      expect(mockHttpClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should include correct authorization header for media upload", () => {
      const mockResponse = {
        status: 200,
        json: Promise.resolve({ id: "media-123" }),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const formData = createMediaUploadFormData(
        Buffer.from("test"),
        "image/jpeg"
      );

      Effect.runSync(httpClient.uploadMedia(formData));

      expect(mockHttpClient.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
          }),
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors correctly", () => {
      const errorResponse = {
        status: 400,
        text: Promise.resolve(
          JSON.stringify({
            error: {
              message: "Invalid phone number",
              type: "param",
              code: 100,
            },
          })
        ),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(errorResponse)
      );

      const payload = createTextMessageRequest("invalid", "Hello World");

      const result = Effect.runSync(
        Effect.either(httpClient.sendMessage(payload))
      );

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(ApiError);
        expect(result.left.status).toBe(400);
        expect(result.left.message).toBe("Invalid phone number");
      }
    });

    it("should handle network errors", () => {
      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.fail(new Error("Network error"))
      );

      const payload = createTextMessageRequest("+1234567890", "Hello World");

      const result = Effect.runSync(
        Effect.either(httpClient.sendMessage(payload))
      );

      expect(result._tag).toBe("Left");
    });
  });

  describe("Response Parsing", () => {
    it("should parse successful message response correctly", () => {
      const mockApiResponse: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg-123", message_status: "accepted" }],
      };

      const mockResponse = {
        status: 200,
        json: Promise.resolve(mockApiResponse),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const payload = createTextMessageRequest("+1234567890", "Hello World");

      const result = Effect.runSync(httpClient.sendMessage(payload));

      expect(result).toEqual(mockApiResponse);
    });

    it("should parse media upload response correctly", () => {
      const mockApiResponse: MediaUploadResponse = {
        id: "media-123",
      };

      const mockResponse = {
        status: 200,
        json: Promise.resolve(mockApiResponse),
      } as unknown as HttpClientResponse.HttpClientResponse;

      vi.mocked(mockHttpClient.execute).mockReturnValue(
        Effect.succeed(mockResponse)
      );

      const formData = createMediaUploadFormData(
        Buffer.from("test"),
        "image/jpeg"
      );

      const result = Effect.runSync(httpClient.uploadMedia(formData));

      expect(result).toEqual(mockApiResponse);
    });
  });
});

describe("Request Creation Utilities", () => {
  describe("createTextMessageRequest", () => {
    it("should create correct text message request", () => {
      const request = createTextMessageRequest(
        "+1234567890",
        "Hello World",
        true
      );

      expect(request).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "text",
        text: {
          body: "Hello World",
          preview_url: true,
        },
      });
    });

    it("should create text message request without preview URL", () => {
      const request = createTextMessageRequest("+1234567890", "Hello World");

      expect(request.text.preview_url).toBeUndefined();
    });
  });

  describe("createTemplateMessageRequest", () => {
    it("should create correct template message request", () => {
      const components = [
        {
          type: "body",
          parameters: [{ type: "text", text: "John" }],
        },
      ];

      const request = createTemplateMessageRequest(
        "+1234567890",
        "welcome_template",
        "en",
        components
      );

      expect(request).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "template",
        template: {
          name: "welcome_template",
          language: {
            code: "en",
          },
          components,
        },
      });
    });
  });

  describe("createImageMessageRequest", () => {
    it("should create image message request with URL", () => {
      const request = createImageMessageRequest(
        "+1234567890",
        "https://example.com/image.jpg",
        undefined,
        "Caption text"
      );

      expect(request).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "image",
        image: {
          link: "https://example.com/image.jpg",
          id: undefined,
          caption: "Caption text",
        },
      });
    });

    it("should create image message request with media ID", () => {
      const request = createImageMessageRequest(
        "+1234567890",
        undefined,
        "media-123",
        "Caption text"
      );

      expect(request).toEqual({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: "+1234567890",
        type: "image",
        image: {
          link: undefined,
          id: "media-123",
          caption: "Caption text",
        },
      });
    });
  });
});

describe("Response Utilities", () => {
  describe("extractMessageId", () => {
    it("should extract message ID from response", () => {
      const response: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg-123", message_status: "accepted" }],
      };

      const messageId = extractMessageId(response);
      expect(messageId).toBe("msg-123");
    });

    it("should return undefined if no messages", () => {
      const response: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [],
      };

      const messageId = extractMessageId(response);
      expect(messageId).toBeUndefined();
    });
  });

  describe("isMessageAccepted", () => {
    it("should return true for accepted message", () => {
      const response: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg-123", message_status: "accepted" }],
      };

      expect(isMessageAccepted(response)).toBe(true);
    });

    it("should return true for sent message", () => {
      const response: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg-123", message_status: "sent" }],
      };

      expect(isMessageAccepted(response)).toBe(true);
    });

    it("should return false for failed message", () => {
      const response: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [{ id: "msg-123", message_status: "failed" }],
      };

      expect(isMessageAccepted(response)).toBe(false);
    });
  });
});

describe("createMediaUploadFormData", () => {
  it("should create FormData with correct structure", () => {
    const buffer = Buffer.from("test image data");
    const formData = createMediaUploadFormData(
      buffer,
      "image/jpeg",
      "test.jpg"
    );

    expect(formData.get("messaging_product")).toBe("whatsapp");
    expect(formData.get("file")).toBeInstanceOf(Blob);
  });

  it("should generate filename from MIME type if not provided", () => {
    const buffer = Buffer.from("test image data");
    const formData = createMediaUploadFormData(buffer, "image/png");

    const file = formData.get("file") as File;
    expect(file.name).toBe("media.png");
  });
});

describe("WhatsAppHttpClientLive Layer", () => {
  it("should create service with dependencies", () => {
    const configLayer = Layer.succeed(WhatsAppConfig, mockConfig);
    const httpClientLayer = Layer.succeed(
      HttpClient.HttpClient,
      mockHttpClient
    );

    const testLayer = WhatsAppHttpClientLive.pipe(
      Layer.provide(configLayer),
      Layer.provide(httpClientLayer)
    );

    const program = Effect.gen(function* (_) {
      const service = yield* _(WhatsAppHttpClient);
      return service;
    });

    const result = Effect.runSync(program.pipe(Effect.provide(testLayer)));
    expect(result).toBeInstanceOf(WhatsAppHttpClientImpl);
  });
});
