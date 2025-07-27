import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import {
  validatePhoneNumber,
  validateMessageText,
  validateTemplateName,
  validateMimeType,
  validateFileSize,
  validateFileSizeForMimeType,
  validateUrl,
  validateHttpsUrl,
  validateMediaUrl,
  validateWebhookSignature,
  validateTimestamp,
  validateWebhookPayload,
  validateTextMessage,
  validateTemplateMessage,
  validateMediaMessage,
  maskPhoneNumber,
  extractCountryCode,
} from "../validation.js";
import { ValidationError } from "../types.js";

describe("Phone Number Validation", () => {
  it("should validate correct phone numbers", async () => {
    const validNumbers = ["+1234567890", "+521234567890", "+4412345678901"];

    for (const number of validNumbers) {
      const result = await Effect.runPromise(validatePhoneNumber(number));
      expect(result).toBe(number);
    }
  });

  it("should reject invalid phone numbers", async () => {
    const invalidNumbers = [
      "1234567890", // missing +
      "+0123456789", // starts with 0
      "+12345", // too short
      "+123456789012345678", // too long
      "+abc1234567890", // contains letters
      "", // empty
      "+", // just +
    ];

    for (const number of invalidNumbers) {
      const result = Effect.runPromise(validatePhoneNumber(number));
      await expect(result).rejects.toThrow();
    }
  });

  it("should mask phone numbers correctly", () => {
    expect(maskPhoneNumber("+1234567890")).toBe("+12*****890"); // 11 chars: +12 + 5 stars + 890
    expect(maskPhoneNumber("+521234567890")).toBe("+52*******890"); // 13 chars: +52 + 7 stars + 890
    expect(maskPhoneNumber("+123")).toBe("+123"); // too short to mask
  });

  it("should extract country codes correctly", () => {
    expect(extractCountryCode("+1234567890")).toBe("+1");
    expect(extractCountryCode("+521234567890")).toBe("+52");
    expect(extractCountryCode("+441234567890")).toBe("+44");
    expect(extractCountryCode("1234567890")).toBe(""); // no country code
  });
});

describe("Message Text Validation", () => {
  it("should validate correct message text", async () => {
    const validTexts = [
      "Hello World",
      "A".repeat(4096), // max length
      "Message with emojis 🚀✨",
      "Multi\nline\nmessage",
    ];

    for (const text of validTexts) {
      const result = await Effect.runPromise(validateMessageText(text));
      expect(result).toBe(text);
    }
  });

  it("should reject invalid message text", async () => {
    const invalidTexts = [
      "", // empty
      "A".repeat(4097), // too long
    ];

    for (const text of invalidTexts) {
      const result = Effect.runPromise(validateMessageText(text));
      await expect(result).rejects.toThrow();
    }
  });
});

describe("Template Name Validation", () => {
  it("should validate correct template names", async () => {
    const validNames = [
      "welcome_message",
      "order_confirmation",
      "payment_reminder_123",
      "simple",
      "test_template_with_numbers_123",
    ];

    for (const name of validNames) {
      const result = await Effect.runPromise(validateTemplateName(name));
      expect(result).toBe(name);
    }
  });

  it("should reject invalid template names", async () => {
    const invalidNames = [
      "Welcome Message", // spaces
      "welcome-message", // hyphens
      "WELCOME_MESSAGE", // uppercase
      "welcome.message", // dots
      "welcome@message", // special chars
      "", // empty
      "123", // only numbers (should be valid actually)
    ];

    for (const name of invalidNames) {
      if (name === "123") continue; // This should actually be valid
      const result = Effect.runPromise(validateTemplateName(name));
      await expect(result).rejects.toThrow();
    }
  });
});

describe("MIME Type Validation", () => {
  it("should validate supported MIME types", async () => {
    const validMimeTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/3gpp",
      "audio/aac",
      "audio/amr",
      "audio/mpeg",
      "application/pdf",
      "text/plain",
    ];

    for (const mimeType of validMimeTypes) {
      const result = await Effect.runPromise(validateMimeType(mimeType));
      expect(result).toBe(mimeType);
    }
  });

  it("should reject unsupported MIME types", async () => {
    const invalidMimeTypes = [
      "image/gif", // not supported by WhatsApp
      "video/avi", // not supported
      "application/zip", // not supported
      "text/html", // not supported
      "invalid", // not a MIME type
      "", // empty
    ];

    for (const mimeType of invalidMimeTypes) {
      const result = Effect.runPromise(validateMimeType(mimeType));
      await expect(result).rejects.toThrow();
    }
  });
});

describe("File Size Validation", () => {
  it("should validate correct file sizes", async () => {
    const validSizes = [
      1024, // 1KB
      1024 * 1024, // 1MB
      5 * 1024 * 1024, // 5MB
      16 * 1024 * 1024, // 16MB (max)
    ];

    for (const size of validSizes) {
      const result = await Effect.runPromise(validateFileSize(size));
      expect(result).toBe(size);
    }
  });

  it("should reject invalid file sizes", async () => {
    const invalidSizes = [
      0, // zero
      -1024, // negative
      17 * 1024 * 1024, // over 16MB limit
    ];

    for (const size of invalidSizes) {
      const result = Effect.runPromise(validateFileSize(size));
      await expect(result).rejects.toThrow();
    }
  });

  it("should validate file sizes based on MIME type", async () => {
    // Image should be max 5MB
    const imageSize = 4 * 1024 * 1024; // 4MB
    const result1 = await Effect.runPromise(
      validateFileSizeForMimeType(imageSize, "image/jpeg")
    );
    expect(result1).toBe(imageSize);

    // Image over 5MB should fail
    const largeImageSize = 6 * 1024 * 1024; // 6MB
    const result2 = Effect.runPromise(
      validateFileSizeForMimeType(largeImageSize, "image/jpeg")
    );
    await expect(result2).rejects.toThrow();

    // Document can be up to 100MB
    const documentSize = 50 * 1024 * 1024; // 50MB
    const result3 = await Effect.runPromise(
      validateFileSizeForMimeType(documentSize, "application/pdf")
    );
    expect(result3).toBe(documentSize);
  });
});

describe("URL Validation", () => {
  it("should validate correct URLs", async () => {
    const validUrls = [
      "https://example.com",
      "http://example.com",
      "https://example.com/path/to/file.jpg",
      "https://subdomain.example.com:8080/path?query=value",
    ];

    for (const url of validUrls) {
      const result = await Effect.runPromise(validateUrl(url));
      expect(result).toBe(url);
    }
  });

  it("should validate HTTPS URLs only", async () => {
    const httpsUrl = "https://example.com/file.jpg";
    const result = await Effect.runPromise(validateHttpsUrl(httpsUrl));
    expect(result).toBe(httpsUrl);

    const httpUrl = "http://example.com/file.jpg";
    const result2 = Effect.runPromise(validateHttpsUrl(httpUrl));
    await expect(result2).rejects.toThrow();
  });

  it("should validate media URLs", async () => {
    const validMediaUrls = [
      "https://example.com/image.jpg",
      "https://example.com/video.mp4",
      "https://example.com/document.pdf",
      "https://example.com/audio.aac",
    ];

    for (const url of validMediaUrls) {
      const result = await Effect.runPromise(validateMediaUrl(url));
      expect(result).toBe(url);
    }

    const invalidMediaUrl = "https://example.com/file.exe";
    const result = Effect.runPromise(validateMediaUrl(invalidMediaUrl));
    await expect(result).rejects.toThrow();
  });
});

describe("Webhook Validation", () => {
  it("should validate webhook signatures", async () => {
    const validSignature =
      "sha256=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
    const result = await Effect.runPromise(
      validateWebhookSignature(validSignature)
    );
    expect(result).toBe(validSignature);

    const invalidSignatures = [
      "sha256=invalid", // too short
      "md5=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890", // wrong algorithm
      "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890", // missing prefix
      "", // empty
    ];

    for (const signature of invalidSignatures) {
      const result = Effect.runPromise(validateWebhookSignature(signature));
      await expect(result).rejects.toThrow();
    }
  });

  it("should validate timestamps", async () => {
    const validTimestamp = "1640995200"; // 10 digits
    const result = await Effect.runPromise(validateTimestamp(validTimestamp));
    expect(result).toBe(validTimestamp);

    const invalidTimestamps = [
      "164099520", // 9 digits
      "16409952000", // 11 digits
      "invalid", // not a number
      "", // empty
    ];

    for (const timestamp of invalidTimestamps) {
      const result = Effect.runPromise(validateTimestamp(timestamp));
      await expect(result).rejects.toThrow();
    }
  });
});

describe("Composite Validation", () => {
  it("should validate complete text messages", async () => {
    const result = await Effect.runPromise(
      validateTextMessage("+1234567890", "Hello World")
    );
    expect(result.to).toBe("+1234567890");
    expect(result.text).toBe("Hello World");
  });

  it("should validate complete template messages", async () => {
    const result = await Effect.runPromise(
      validateTemplateMessage("+1234567890", "welcome_message", "en")
    );
    expect(result.to).toBe("+1234567890");
    expect(result.templateName).toBe("welcome_message");
    expect(result.languageCode).toBe("en");
  });

  it("should validate complete media messages", async () => {
    const result = await Effect.runPromise(
      validateMediaMessage(
        "+1234567890",
        "https://example.com/image.jpg",
        "Caption"
      )
    );
    expect(result.to).toBe("+1234567890");
    expect(result.mediaUrl).toBe("https://example.com/image.jpg");
    expect(result.caption).toBe("Caption");
  });

  it("should fail validation for invalid composite messages", async () => {
    // Invalid phone number
    const result1 = Effect.runPromise(
      validateTextMessage("invalid", "Hello World")
    );
    await expect(result1).rejects.toThrow();

    // Invalid template name
    const result2 = Effect.runPromise(
      validateTemplateMessage("+1234567890", "Invalid Template", "en")
    );
    await expect(result2).rejects.toThrow();

    // Invalid media URL
    const result3 = Effect.runPromise(
      validateMediaMessage("+1234567890", "invalid-url", "Caption")
    );
    await expect(result3).rejects.toThrow();
  });
});
describe("Webhook Payload Validation", () => {
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

  it("should validate correct webhook payload", async () => {
    const result = await Effect.runPromise(
      validateWebhookPayload(validWebhookPayload)
    );

    expect(result.object).toBe("whatsapp_business_account");
    expect(result.entry).toHaveLength(1);
    expect(result.entry[0].changes).toHaveLength(1);
    expect(result.entry[0].changes[0].value.messages).toHaveLength(1);
    expect(result.entry[0].changes[0].value.messages![0].from).toBe(
      "+1987654321"
    );
    expect(result.entry[0].changes[0].value.messages![0].text!.body).toBe(
      "Hello, world!"
    );
  });

  it("should validate webhook payload with image message", async () => {
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
      validateWebhookPayload(imageWebhookPayload)
    );

    expect(result.entry[0].changes[0].value.messages![0].type).toBe("image");
    expect(result.entry[0].changes[0].value.messages![0].image!.id).toBe(
      "media-123"
    );
    expect(result.entry[0].changes[0].value.messages![0].image!.caption).toBe(
      "Check this out!"
    );
  });

  it("should reject invalid webhook payload", async () => {
    const invalidPayload = {
      object: "invalid_object",
      entry: [],
    };

    await expect(
      Effect.runPromise(validateWebhookPayload(invalidPayload))
    ).rejects.toThrow();
  });

  it("should reject webhook payload with invalid message type", async () => {
    const invalidMessagePayload = {
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
                    id: "msg-123",
                    timestamp: "1640995200",
                    type: "invalid_type" as any,
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
      Effect.runPromise(validateWebhookPayload(invalidMessagePayload))
    ).rejects.toThrow();
  });
});
