import { Schema } from "@effect/schema";
import { PhoneNumberSchema } from "./server/integrations/whatsapp/types";

const testNumbers = [
  "",
  "abc",
  "+",
  "123",
  "+0123456789",
  "12345",
  "1234567890",
  "+1234567",
  "+1234567890",
  "+521234567890",
];

testNumbers.forEach((number) => {
  try {
    const result = Schema.decodeUnknownSync(PhoneNumberSchema)(number);
    console.log(`✓ ${number} -> ${result}`);
  } catch (error) {
    console.log(`✗ ${number} -> ${error.message}`);
  }
});
