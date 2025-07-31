import type { ActionFunctionArgs } from "react-router";
import { Effect, pipe } from "effect";
import { addWhatsAppAssistantMessage } from "server/chatbot/messageModel.server";
import { json, failWithError, type ApiError, isApiError } from "../utils/effect-utils";

// Types
interface SendWhatsAppMessageInput {
  conversationId: string;
  phoneNumber: string;
  message: string;
  integrationId: string;
  messageType?: string;
}

interface WhatsAppResponse {
  messaging_product: string;
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string; message_status: string }>;
}

// Error handling
class WhatsAppSendError extends Error {
  constructor(
    message: string,
    public readonly status: number = 500,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'WhatsAppSendError';
  }
}

// Validation
export const validateInput = (input: unknown): Effect.Effect<SendWhatsAppMessageInput, WhatsAppSendError> =>
  Effect.gen(function*() {
    if (!input || typeof input !== 'object') {
      return yield* Effect.fail(new WhatsAppSendError('Invalid request body', 400));
    }

    const { conversationId, phoneNumber, message, integrationId, messageType = 'text' } = input as Partial<SendWhatsAppMessageInput>;

    if (!conversationId || !phoneNumber || !message || !integrationId) {
      return yield* Effect.fail(
        new WhatsAppSendError('conversationId, phoneNumber, message, and integrationId are required', 400)
      );
    }

    return { conversationId, phoneNumber, message, integrationId, messageType };
  });

// Mock WhatsApp API call - Replace with actual implementation
const sendWhatsAppMessage = (input: SendWhatsAppMessageInput): Effect.Effect<WhatsAppResponse, WhatsAppSendError> =>
  Effect.try({
    try: () => ({
      messaging_product: "whatsapp",
      contacts: [
        {
          input: input.phoneNumber,
          wa_id: input.phoneNumber,
        },
      ],
      messages: [
        {
          id: `whatsapp_msg_${Date.now()}`,
          message_status: "sent",
        },
      ],
    }),
    catch: (error) => new WhatsAppSendError("Failed to send WhatsApp message", 500, error)
  });

// Main effect for sending WhatsApp message
const sendMessageEffect = (input: SendWhatsAppMessageInput) =>
  Effect.gen(function*() {
    // 1. Send message via WhatsApp API
    const whatsappResponse = yield* sendWhatsAppMessage(input);
    
    // 2. Store message in database
    const savedMessage = yield* Effect.tryPromise({
      try: () => 
        addWhatsAppAssistantMessage(
          input.conversationId,
          input.message,
          whatsappResponse.messages[0].id,
          input.integrationId
        ),
      catch: (error) => {
        console.error("Error saving message to database:", error);
        return new WhatsAppSendError("Failed to save message to database", 500, error);
      }
    });

    return {
      success: true as const,
      messageId: savedMessage.id,
      whatsappResponse,
    };
  });

// Main handler
export async function action({ request }: ActionFunctionArgs) {
  const program = pipe(
    // 1. Parse and validate request
    Effect.tryPromise({
      try: () => request.json() as Promise<unknown>,
      catch: (error) => new WhatsAppSendError("Invalid JSON payload", 400, error),
    }),
    // 2. Validate input
    Effect.flatMap(validateInput),
    // 3. Send message and handle result
    Effect.flatMap(sendMessageEffect),
    // 4. Handle success/error
    Effect.match({
      onSuccess: (result) => json(200, result),
      onFailure: (error) => {
        console.error("Error in WhatsApp send endpoint:", error);
        const status = (typeof error.status === 'number' ? error.status : 500) as number;
        const response = { 
          error: error.message,
          ...(error.details ? { details: error.details } : {}) 
        };
        
        return json(status, response);
      },
    })
  );

  return Effect.runPromise(program);
}
