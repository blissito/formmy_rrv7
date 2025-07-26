import { describe, it, expect } from "vitest";
import { Schema } from "@effect/schema";
import {
  WhatsAppError,
  ConfigurationError,
  ValidationError,
  ApiError,
  PhoneNumberSchema,
  MessageTextSchema,
  TemplateNameSchema,
  MimeTypeSchema,
  LanguageCodeSchema,
  MessageIdSchema,
  MediaIdSchema,
} from "../types";

describe("WhatsApp Types", () => {
  describe("Error Classes", () => {
    it("should create WhatsAppError with correct properties", () => {
      const error = new WhatsAppError({
        cause: new Error("test"),
        message: "Test error",
        code: "TEST_ERROR",
      });

      expect(error._tag).toBe("WhatsAppError");
      expect(error.message).toBe("Test error");
      expect(error.code).toBe("TEST_ERROR");
    });

    it("should create ConfigurationError with correct properties", () => {
      const error = new ConfigurationError({
        field: "phoneNumberId",
        message: "Missing phone number ID",
      });

      expect(error._tag).toBe("ConfigurationError");
      expect(error.field).toBe("phoneNumberId");
      expect(error.message).toBe("Missing phone number ID");
    });

    it("should create ValidationError with correct properties", () => {
      const error = new ValidationError({
        field: "phoneNumber",
        value: "invalid",
        message: "Invalid phone number format",
      });

      expect(error._tag).toBe("ValidationError");
      expect(error.field).toBe("phoneNumber");
      expect(error.value).toBe("invalid");
      expect(error.message).toBe("Invalid phone number format");
    });

    it("should create ApiError with correct properties", () => {
      const error = new ApiError({
        status: 400,
        response: { error: "Bad request" },
        message: "API error",
      });

      expect(error._tag).toBe("ApiError");
      expect(error.status).toBe(400);
      expect(error.message).toBe("API error");
    });
  });

  describe("Schema Validations", () => {
    describe("PhoneNumberSchema", () => {
      it("should validate correct phone numbers", () => {
        const validNumbers = [
          "+1234567890",
          "+521234567890",
          "+12345678901234",
        ];

        validNumbers.forEach((number) => {
          const result = Schema.decodeUnknownSync(PhoneNumberSchema)(number);
          expect(result).toBe(number);
        });
      });

      it("should reject invalid phone numbers", () => {
        const invalidNumbers = [
          "",
          "abc",
          "+",
          "123",
          "+0123456789",
          "12345",
          "1234567890",
          "+1234567",
        ];

        invalidNumbers.forEach((number) => {
          expect(() => {
            Schema.decodeUnknownSync(PhoneNumberSchema)(number);
          }).toThrow();
        });
      });
    });

    describe("MessageTextSchema", () => {
      it("should validate correct message text", () => {
        const validTexts = ["Hello", "Hello world!", "A".repeat(4096)];

        validTexts.forEach((text) => {
          const result = Schema.decodeUnknownSync(MessageTextSchema)(text);
          expect(result).toBe(text);
        });
      });

      it("should reject invalid message text", () => {
        const invalidTexts = ["", "A".repeat(4097)];

        invalidTexts.forEach((text) => {
          expect(() => {
            Schema.decodeUnknownSync(MessageTextSchema)(text);
          }).toThrow();
        });
      });
    });

    describe("TemplateNameSchema", () => {
      it("should validate correct template names", () => {
        const validNames = ["hello_world", "template_123", "simple"];

        validNames.forEach((name) => {
          const result = Schema.decodeUnknownSync(TemplateNameSchema)(name);
          expect(result).toBe(name);
        });
      });

      it("should reject invalid template names", () => {
        const invalidNames = ["", "Hello-World", "template.name", "UPPERCASE"];

        invalidNames.forEach((name) => {
          expect(() => {
            Schema.decodeUnknownSync(TemplateNameSchema)(name);
          }).toThrow();
        });
      });
    });

    describe("MimeTypeSchema", () => {
      it("should validate correct MIME types", () => {
        const validTypes = ["image/jpeg", "text/plain", "application/pdf"];

        validTypes.forEach((type) => {
          const result = Schema.decodeUnknownSync(MimeTypeSchema)(type);
          expect(result).toBe(type);
        });
      });

      it("should reject invalid MIME types", () => {
        const invalidTypes = ["", "image", "image/", "/jpeg"];

        invalidTypes.forEach((type) => {
          expect(() => {
            Schema.decodeUnknownSync(MimeTypeSchema)(type);
          }).toThrow();
        });
      });
    });

    describe("LanguageCodeSchema", () => {
      it("should validate correct language codes", () => {
        const validCodes = ["en", "es", "en_US", "es_MX"];

        validCodes.forEach((code) => {
          const result = Schema.decodeUnknownSync(LanguageCodeSchema)(code);
          expect(result).toBe(code);
        });
      });

      it("should reject invalid language codes", () => {
        const invalidCodes = ["", "ENG", "en-US", "english"];

        invalidCodes.forEach((code) => {
          expect(() => {
            Schema.decodeUnknownSync(LanguageCodeSchema)(code);
          }).toThrow();
        });
      });
    });
  });
});
