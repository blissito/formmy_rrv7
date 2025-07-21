import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateContextSize,
  validateFileType,
  validateFileSize,
  validateUrl,
  validateTextContent,
  validateFileContext,
  validateUrlContext,
  validateTextContext,
} from "../contextValidator";
import * as planLimits from "../planLimits";
import { MAX_FILE_SIZE_KB, ALLOWED_FILE_TYPES } from "../contextManager";

// Mock the planLimits module
vi.mock("../planLimits", () => {
  return {
    validateContextSizeLimit: vi.fn(),
  };
});

describe("Context Validator", () => {
  describe("validateContextSize", () => {
    beforeEach(() => {
      vi.mocked(planLimits.validateContextSizeLimit).mockClear();
    });

    it("should return valid when context size is within limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      const result = await validateContextSize("user-id", 500, 100);
      expect(result.isValid).toBe(true);
      expect(result.details).toEqual({
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
        requestedSize: 100,
      });
    });

    it("should return invalid when context size exceeds limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: false,
        currentSize: 900,
        maxAllowed: 1000,
        remainingSize: 100,
      });

      const result = await validateContextSize("user-id", 900, 200);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Has alcanzado el límite");
      expect(result.details).toEqual({
        currentSize: 900,
        maxAllowed: 1000,
        remainingSize: 100,
        requestedSize: 200,
      });
    });

    it("should handle errors from validateContextSizeLimit", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockRejectedValue(
        new Error("Usuario no encontrado")
      );

      const result = await validateContextSize("user-id", 500, 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe("Usuario no encontrado");
    });
  });

  describe("validateFileType", () => {
    it("should return valid for allowed file types", () => {
      const result = validateFileType("application/pdf");
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for disallowed file types", () => {
      const result = validateFileType("image/jpeg");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Tipo de archivo no permitido");
      expect(result.details?.providedType).toBe("image/jpeg");
      expect(result.details?.allowedTypes).toEqual(ALLOWED_FILE_TYPES);
    });
  });

  describe("validateFileSize", () => {
    it("should return valid for files within size limit", () => {
      const result = validateFileSize(MAX_FILE_SIZE_KB - 100);
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for files exceeding size limit", () => {
      const result = validateFileSize(MAX_FILE_SIZE_KB + 100);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("El archivo es demasiado grande");
      expect(result.details?.providedSize).toBe(MAX_FILE_SIZE_KB + 100);
      expect(result.details?.maxSize).toBe(MAX_FILE_SIZE_KB);
    });
  });

  describe("validateUrl", () => {
    it("should return valid for valid URLs", () => {
      const result = validateUrl("https://example.com");
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for invalid URLs", () => {
      const result = validateUrl("invalid-url");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("URL inválida");
      expect(result.details?.providedUrl).toBe("invalid-url");
    });
  });

  describe("validateTextContent", () => {
    it("should return valid for non-empty text", () => {
      const result = validateTextContent("This is a valid text content");
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for empty text", () => {
      const result = validateTextContent("");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("no puede estar vacío");
    });

    it("should return invalid for text exceeding size limit", () => {
      // Create a text that exceeds the MAX_FILE_SIZE_KB
      const largeText = "A".repeat((MAX_FILE_SIZE_KB + 1) * 1024);
      const result = validateTextContent(largeText);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("El texto es demasiado grande");
      expect(result.details?.providedSize).toBe(MAX_FILE_SIZE_KB + 1);
      expect(result.details?.maxSize).toBe(MAX_FILE_SIZE_KB);
    });
  });

  describe("validateFileContext", () => {
    beforeEach(() => {
      vi.mocked(planLimits.validateContextSizeLimit).mockClear();
    });

    it("should validate file type, size, and context size limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      const result = await validateFileContext(
        "user-id",
        500,
        "application/pdf",
        100
      );
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for disallowed file type", async () => {
      const result = await validateFileContext(
        "user-id",
        500,
        "image/jpeg",
        100
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Tipo de archivo no permitido");
      // Should not call validateContextSizeLimit if file type is invalid
      expect(planLimits.validateContextSizeLimit).not.toHaveBeenCalled();
    });

    it("should return invalid for file exceeding size limit", async () => {
      const result = await validateFileContext(
        "user-id",
        500,
        "application/pdf",
        MAX_FILE_SIZE_KB + 100
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("El archivo es demasiado grande");
      // Should not call validateContextSizeLimit if file size is invalid
      expect(planLimits.validateContextSizeLimit).not.toHaveBeenCalled();
    });

    it("should return invalid when context size exceeds plan limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: false,
        currentSize: 900,
        maxAllowed: 1000,
        remainingSize: 100,
      });

      const result = await validateFileContext(
        "user-id",
        900,
        "application/pdf",
        200
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Has alcanzado el límite");
    });
  });

  describe("validateUrlContext", () => {
    beforeEach(() => {
      vi.mocked(planLimits.validateContextSizeLimit).mockClear();
    });

    it("should validate URL and context size limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      const result = await validateUrlContext(
        "user-id",
        500,
        "https://example.com",
        100
      );
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for invalid URL", async () => {
      const result = await validateUrlContext(
        "user-id",
        500,
        "invalid-url",
        100
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("URL inválida");
      // Should not call validateContextSizeLimit if URL is invalid
      expect(planLimits.validateContextSizeLimit).not.toHaveBeenCalled();
    });

    it("should return invalid when context size exceeds plan limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: false,
        currentSize: 900,
        maxAllowed: 1000,
        remainingSize: 100,
      });

      const result = await validateUrlContext(
        "user-id",
        900,
        "https://example.com",
        200
      );
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Has alcanzado el límite");
    });

    it("should use default size when not provided", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      await validateUrlContext("user-id", 500, "https://example.com");
      expect(planLimits.validateContextSizeLimit).toHaveBeenCalledWith(
        "user-id",
        500,
        1 // Default size
      );
    });
  });

  describe("validateTextContext", () => {
    beforeEach(() => {
      vi.mocked(planLimits.validateContextSizeLimit).mockClear();
    });

    it("should validate text content and context size limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      const result = await validateTextContext(
        "user-id",
        500,
        "This is a valid text content"
      );
      expect(result.isValid).toBe(true);
    });

    it("should return invalid for empty text", async () => {
      const result = await validateTextContext("user-id", 500, "");
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("no puede estar vacío");
      // Should not call validateContextSizeLimit if text is invalid
      expect(planLimits.validateContextSizeLimit).not.toHaveBeenCalled();
    });

    it("should return invalid when context size exceeds plan limits", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: false,
        currentSize: 900,
        maxAllowed: 1000,
        remainingSize: 100,
      });

      // Create a text that would be 200KB
      const largeText = "A".repeat(200 * 1024);
      const result = await validateTextContext("user-id", 900, largeText);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain("Has alcanzado el límite");
    });

    it("should calculate correct size from text content", async () => {
      vi.mocked(planLimits.validateContextSizeLimit).mockResolvedValue({
        canAdd: true,
        currentSize: 500,
        maxAllowed: 1000,
        remainingSize: 500,
      });

      // Create a text that would be 3KB
      const text = "A".repeat(3 * 1024);
      await validateTextContext("user-id", 500, text);
      expect(planLimits.validateContextSizeLimit).toHaveBeenCalledWith(
        "user-id",
        500,
        3 // 3KB
      );
    });
  });
});
