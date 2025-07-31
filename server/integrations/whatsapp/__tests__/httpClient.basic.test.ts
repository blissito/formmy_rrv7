import { describe, it, expect } from "vitest";
import {
  createTextMessageRequest,
  createTemplateMessageRequest,
  createImageMessageRequest,
  createMediaUploadFormData,
  extractMessageId,
  isMessageAccepted,
  type MessageApiResponse,
} from "../httpClient.js";

describe("WhatsApp HTTP Client Utilities", () => {
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
});
