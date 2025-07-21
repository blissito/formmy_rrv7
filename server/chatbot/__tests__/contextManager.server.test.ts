import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateFile,
  addFileContext,
  addUrlContext,
  addTextContext,
  ALLOWED_FILE_TYPES,
  MAX_FILE_SIZE_KB,
} from "../contextManager";
import * as chatbotModel from "../chatbotModel.server";

// Mock the chatbotModel module
vi.mock("../chatbotModel", () => {
  return {
    addContextItem: vi.fn().mockImplementation((chatbotId, contextItem) => {
      return Promise.resolve({
        id: "mock-chatbot-id",
        contexts: [
          {
            id: "mock-context-id",
            createdAt: new Date(),
            ...contextItem,
          },
        ],
      });
    }),
  };
});

describe("Context Manager", () => {
  describe("validateFile", () => {
    it("should validate allowed file types", () => {
      // Test with a valid file type
      const result = validateFile("application/pdf", 100);
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("should reject disallowed file types", () => {
      // Test with an invalid file type
      const result = validateFile("image/jpeg", 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Tipo de archivo no permitido");
    });

    it("should reject files that are too large", () => {
      // Test with a file that exceeds the size limit
      const result = validateFile("application/pdf", MAX_FILE_SIZE_KB + 1);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("El archivo es demasiado grande");
    });
  });

  describe("addFileContext", () => {
    beforeEach(() => {
      vi.mocked(chatbotModel.addContextItem).mockClear();
    });

    it("should add a valid file context", async () => {
      const fileData = {
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileUrl: "https://example.com/test.pdf",
        sizeKB: 100,
        content: "Test content",
      };

      await addFileContext("chatbot-id", fileData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "FILE",
        ...fileData,
      });
    });

    it("should throw an error for invalid file type", async () => {
      const fileData = {
        fileName: "test.jpg",
        fileType: "image/jpeg",
        fileUrl: "https://example.com/test.jpg",
        sizeKB: 100,
      };

      await expect(addFileContext("chatbot-id", fileData)).rejects.toThrow(
        "Tipo de archivo no permitido"
      );
      expect(chatbotModel.addContextItem).not.toHaveBeenCalled();
    });

    it("should throw an error for files that are too large", async () => {
      const fileData = {
        fileName: "test.pdf",
        fileType: "application/pdf",
        fileUrl: "https://example.com/test.pdf",
        sizeKB: MAX_FILE_SIZE_KB + 1,
      };

      await expect(addFileContext("chatbot-id", fileData)).rejects.toThrow(
        "El archivo es demasiado grande"
      );
      expect(chatbotModel.addContextItem).not.toHaveBeenCalled();
    });
  });

  describe("addUrlContext", () => {
    beforeEach(() => {
      vi.mocked(chatbotModel.addContextItem).mockClear();
    });

    it("should add a valid URL context", async () => {
      const urlData = {
        url: "https://example.com",
        title: "Example Website",
        content: "Test content",
        sizeKB: 2,
      };

      await addUrlContext("chatbot-id", urlData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "LINK",
        ...urlData,
      });
    });

    it("should use the URL as title if not provided", async () => {
      const urlData = {
        url: "https://example.com",
        content: "Test content",
        sizeKB: 2,
      };

      await addUrlContext("chatbot-id", urlData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "LINK",
        url: urlData.url,
        title: urlData.url,
        content: urlData.content,
        sizeKB: urlData.sizeKB,
      });
    });

    it("should estimate size from content if not provided", async () => {
      const content = "A".repeat(2048); // 2KB of content
      const urlData = {
        url: "https://example.com",
        title: "Example Website",
        content,
      };

      await addUrlContext("chatbot-id", urlData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "LINK",
        url: urlData.url,
        title: urlData.title,
        content: urlData.content,
        sizeKB: 2, // 2KB
      });
    });

    it("should use default size for URLs without content", async () => {
      const urlData = {
        url: "https://example.com",
        title: "Example Website",
      };

      await addUrlContext("chatbot-id", urlData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "LINK",
        url: urlData.url,
        title: urlData.title,
        content: undefined,
        sizeKB: 1, // Default 1KB
      });
    });

    it("should throw an error for invalid URLs", async () => {
      const urlData = {
        url: "invalid-url",
        title: "Invalid URL",
      };

      await expect(addUrlContext("chatbot-id", urlData)).rejects.toThrow(
        "URL inválida"
      );
      expect(chatbotModel.addContextItem).not.toHaveBeenCalled();
    });
  });

  describe("addTextContext", () => {
    beforeEach(() => {
      vi.mocked(chatbotModel.addContextItem).mockClear();
    });

    it("should add a valid text context", async () => {
      const textData = {
        title: "Test Text",
        content: "This is a test content",
      };

      await addTextContext("chatbot-id", textData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "TEXT",
        title: textData.title,
        content: textData.content,
        sizeKB: 1, // Small text, rounds up to 1KB
      });
    });

    it("should calculate correct size for larger text", async () => {
      const content = "A".repeat(3072); // 3KB of content
      const textData = {
        title: "Large Text",
        content,
      };

      await addTextContext("chatbot-id", textData);

      expect(chatbotModel.addContextItem).toHaveBeenCalledWith("chatbot-id", {
        type: "TEXT",
        title: textData.title,
        content: textData.content,
        sizeKB: 3, // 3KB
      });
    });
  });
});
