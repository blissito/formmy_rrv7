import { describe, it, expect, vi, beforeEach } from "vitest";
import { Effect, Option } from "effect";
import {
  WhatsAppServiceImpl,
  WhatsAppServiceLive,
} from "../WhatsAppService.js";
import { WhatsAppConfig } from "../config.js";
import { WhatsAppError, ApiError, ValidationError } from "../types.js";
import type {
  MessageApiResponse,
  MediaUploadResponse,
  MediaInfoResponse,
} from "../httpClient.js";

// Mock dependencies
const mockConfig: WhatsAppConfig = {
  phoneNumberId: "123456789",
  accessToken: "test-token",
  apiVersion: "v17.0",
  businessAccountId: "business-123",
  webhookVerifyToken: Option.some("webhook-token"),
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

const mockMediaUploadResponse: MediaUploadResponse = {
  id: "media_123",
};

const mockMediaInfoResponse: MediaInfoResponse = {
  id: "media_123",
  url: "https://example.com/media/file.jpg",
  mime_type: "image/jpeg",
  sha256: "abc123",
  file_size: 1024,
  messaging_product: "whatsapp",
};

describe("WhatsAppService - Media Handling", () => {
  let service: WhatsAppServiceImpl;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WhatsAppServiceImpl(mockConfig, mockHttpClient as any);
  });

  describe("uploadMedia", () => {
    it("should upload media successfully", async () => {
      // Arrange
      const fileBuffer = Buffer.from("fake image data");
      const mimeType = "image/jpeg";
      const filename = "test.jpg";

      mockHttpClient.uploadMedia.mockReturnValue(
        Effect.succeed(mockMediaUploadResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.uploadMedia(fileBuffer, mimeType, filename)
      );

      // Assert
      expect(result).toBe("media_123");
      expect(mockHttpClient.uploadMedia).toHaveBeenCalledWith(
        expect.any(FormData)
      );
    });

    it("should handle invalid MIME type", async () => {
      // Arrange
      const fileBuffer = Buffer.from("fake data");
      const invalidMimeType = "invalid/type";

      // Act & Assert
      await expect(
        Effect.runPromise(service.uploadMedia(fileBuffer, invalidMimeType))
      ).rejects.toThrow(ValidationError);
    });

    it("should handle file size validation", async () => {
      // Arrange
      const largeBuffer = Buffer.alloc(20 * 1024 * 1024); // 20MB - exceeds limit
      const mimeType = "image/jpeg";

      // Act & Assert
      await expect(
        Effect.runPromise(service.uploadMedia(largeBuffer, mimeType))
      ).rejects.toThrow(ValidationError);
    });

    it("should handle API errors during upload", async () => {
      // Arrange
      const fileBuffer = Buffer.from("fake data");
      const mimeType = "image/jpeg";
      const apiError = new ApiError({
        status: 500,
        response: { error: { message: "Upload failed" } },
        message: "Upload failed",
      });

      mockHttpClient.uploadMedia.mockReturnValue(Effect.fail(apiError));

      // Act & Assert
      await expect(
        Effect.runPromise(service.uploadMedia(fileBuffer, mimeType))
      ).rejects.toThrow(WhatsAppError);
    });

    it("should validate different media types", async () => {
      // Arrange
      const fileBuffer = Buffer.from("fake data");
      mockHttpClient.uploadMedia.mockReturnValue(
        Effect.succeed(mockMediaUploadResponse)
      );

      // Test image
      await Effect.runPromise(service.uploadMedia(fileBuffer, "image/png"));
      expect(mockHttpClient.uploadMedia).toHaveBeenCalled();

      // Test video
      vi.clearAllMocks();
      mockHttpClient.uploadMedia.mockReturnValue(
        Effect.succeed(mockMediaUploadResponse)
      );
      await Effect.runPromise(service.uploadMedia(fileBuffer, "video/mp4"));
      expect(mockHttpClient.uploadMedia).toHaveBeenCalled();

      // Test document
      vi.clearAllMocks();
      mockHttpClient.uploadMedia.mockReturnValue(
        Effect.succeed(mockMediaUploadResponse)
      );
      await Effect.runPromise(
        service.uploadMedia(fileBuffer, "application/pdf")
      );
      expect(mockHttpClient.uploadMedia).toHaveBeenCalled();
    });
  });

  describe("getMediaUrl", () => {
    it("should retrieve media URL successfully", async () => {
      // Arrange
      const mediaId = "media_123";
      mockHttpClient.getMedia.mockReturnValue(
        Effect.succeed(mockMediaInfoResponse)
      );

      // Act
      const result = await Effect.runPromise(service.getMediaUrl(mediaId));

      // Assert
      expect(result).toBe("https://example.com/media/file.jpg");
      expect(mockHttpClient.getMedia).toHaveBeenCalledWith(mediaId);
    });

    it("should handle invalid media ID", async () => {
      // Act & Assert
      await expect(Effect.runPromise(service.getMediaUrl(""))).rejects.toThrow(
        ValidationError
      );
    });

    it("should handle API errors during media info retrieval", async () => {
      // Arrange
      const mediaId = "media_123";
      const apiError = new ApiError({
        status: 404,
        response: { error: { message: "Media not found" } },
        message: "Media not found",
      });

      mockHttpClient.getMedia.mockReturnValue(Effect.fail(apiError));

      // Act & Assert
      await expect(
        Effect.runPromise(service.getMediaUrl(mediaId))
      ).rejects.toThrow(WhatsAppError);
    });

    it("should validate returned URL", async () => {
      // Arrange
      const mediaId = "media_123";
      const invalidResponse = {
        ...mockMediaInfoResponse,
        url: "invalid-url",
      };
      mockHttpClient.getMedia.mockReturnValue(Effect.succeed(invalidResponse));

      // Act & Assert
      await expect(
        Effect.runPromise(service.getMediaUrl(mediaId))
      ).rejects.toThrow(ValidationError);
    });
  });

  describe("downloadMedia", () => {
    it("should download media successfully", async () => {
      // Arrange
      const mediaUrl = "https://example.com/media/file.jpg";
      const expectedBuffer = Buffer.from("fake media content");
      mockHttpClient.downloadMedia.mockReturnValue(
        Effect.succeed(expectedBuffer)
      );

      // Act
      const result = await Effect.runPromise(service.downloadMedia(mediaUrl));

      // Assert
      expect(result).toEqual(expectedBuffer);
      expect(mockHttpClient.downloadMedia).toHaveBeenCalledWith(mediaUrl);
    });

    it("should handle invalid media URL", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(service.downloadMedia("invalid-url"))
      ).rejects.toThrow(ValidationError);

      await expect(
        Effect.runPromise(service.downloadMedia("http://insecure.com/file.jpg"))
      ).rejects.toThrow(ValidationError);
    });

    it("should handle API errors during download", async () => {
      // Arrange
      const mediaUrl = "https://example.com/media/file.jpg";
      const apiError = new ApiError({
        status: 403,
        response: { error: { message: "Access denied" } },
        message: "Access denied",
      });

      mockHttpClient.downloadMedia.mockReturnValue(Effect.fail(apiError));

      // Act & Assert
      await expect(
        Effect.runPromise(service.downloadMedia(mediaUrl))
      ).rejects.toThrow(WhatsAppError);
    });

    it("should handle invalid buffer response", async () => {
      // Arrange
      const mediaUrl = "https://example.com/media/file.jpg";
      const emptyBuffer = Buffer.alloc(0);
      mockHttpClient.downloadMedia.mockReturnValue(Effect.succeed(emptyBuffer));

      // Act & Assert
      await expect(
        Effect.runPromise(service.downloadMedia(mediaUrl))
      ).rejects.toThrow(WhatsAppError);
    });
  });

  describe("sendMediaMessage", () => {
    it("should send image message with media ID successfully", async () => {
      // Arrange
      const to = "+1234567890";
      const mediaId = "media_123";
      const caption = "Check this out!";

      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendMediaMessage(to, mediaId, "image", caption)
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
        to,
        type: "image",
        image: {
          link: undefined,
          id: mediaId,
          caption,
        },
      });
    });

    it("should send document message with filename", async () => {
      // Arrange
      const to = "+1234567890";
      const mediaId = "media_123";
      const filename = "document.pdf";

      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendMediaMessage(to, mediaId, "document", undefined, filename)
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
        to,
        type: "document",
        document: {
          link: undefined,
          id: mediaId,
          caption: undefined,
          filename,
        },
      });
    });

    it("should send video message successfully", async () => {
      // Arrange
      const to = "+1234567890";
      const mediaId = "media_123";

      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendMediaMessage(to, mediaId, "video")
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
        to,
        type: "video",
        video: {
          link: undefined,
          id: mediaId,
          caption: undefined,
        },
      });
    });

    it("should send audio message successfully", async () => {
      // Arrange
      const to = "+1234567890";
      const mediaId = "media_123";

      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(mockApiResponse)
      );

      // Act
      const result = await Effect.runPromise(
        service.sendMediaMessage(to, mediaId, "audio")
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
        to,
        type: "audio",
        audio: {
          link: undefined,
          id: mediaId,
        },
      });
    });

    it("should handle invalid phone number", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendMediaMessage("invalid-phone", "media_123", "image")
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should handle invalid media ID", async () => {
      // Act & Assert
      await expect(
        Effect.runPromise(service.sendMediaMessage("+1234567890", "", "image"))
      ).rejects.toThrow(ValidationError);
    });

    it("should handle invalid caption", async () => {
      // Arrange
      const longCaption = "a".repeat(5000); // Exceeds limit

      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendMediaMessage(
            "+1234567890",
            "media_123",
            "image",
            longCaption
          )
        )
      ).rejects.toThrow(ValidationError);
    });

    it("should handle API errors during message send", async () => {
      // Arrange
      const apiError = new ApiError({
        status: 400,
        response: { error: { message: "Invalid media ID" } },
        message: "Invalid media ID",
      });

      mockHttpClient.sendMessage.mockReturnValue(Effect.fail(apiError));

      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendMediaMessage("+1234567890", "media_123", "image")
        )
      ).rejects.toThrow(WhatsAppError);
    });

    it("should handle missing message ID in response", async () => {
      // Arrange
      const responseWithoutId: MessageApiResponse = {
        messaging_product: "whatsapp",
        contacts: [{ input: "+1234567890", wa_id: "1234567890" }],
        messages: [],
      };
      mockHttpClient.sendMessage.mockReturnValue(
        Effect.succeed(responseWithoutId)
      );

      // Act & Assert
      await expect(
        Effect.runPromise(
          service.sendMediaMessage("+1234567890", "media_123", "image")
        )
      ).rejects.toThrow(WhatsAppError);
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

describe("Utility Functions", () => {
  describe("getMediaTypeFromMimeType", () => {
    it("should return correct media type for different MIME types", () => {
      const { getMediaTypeFromMimeType } = require("../WhatsAppService.js");

      expect(getMediaTypeFromMimeType("image/jpeg")).toBe("image");
      expect(getMediaTypeFromMimeType("image/png")).toBe("image");
      expect(getMediaTypeFromMimeType("video/mp4")).toBe("video");
      expect(getMediaTypeFromMimeType("audio/mpeg")).toBe("audio");
      expect(getMediaTypeFromMimeType("application/pdf")).toBe("document");
      expect(getMediaTypeFromMimeType("text/plain")).toBe("document");
    });
  });
});
