import { json } from "@remix-run/node";
import type { ActionFunctionArgs } from "@remix-run/node";
import { addWhatsAppAssistantMessage } from "server/chatbot/messageModel.server";

// POST handler - Send WhatsApp message
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();
    const {
      conversationId,
      phoneNumber,
      message,
      integrationId,
      messageType = "text",
    } = body;

    // Validation
    if (!conversationId || !phoneNumber || !message || !integrationId) {
      return json(
        {
          error:
            "conversationId, phoneNumber, message, and integrationId are required",
        },
        { status: 400 }
      );
    }

    // TODO: Get integration details from database
    // TODO: Use WhatsApp SDK to send message

    // Mock response for now
    const whatsappResponse = {
      messaging_product: "whatsapp",
      contacts: [
        {
          input: phoneNumber,
          wa_id: phoneNumber,
        },
      ],
      messages: [
        {
          id: `whatsapp_msg_${Date.now()}`, // This would come from WhatsApp API
          message_status: "sent",
        },
      ],
    };

    // Store the sent message in database
    const savedMessage = await addWhatsAppAssistantMessage(
      conversationId,
      message,
      whatsappResponse.messages[0].id
    );

    return json({
      success: true,
      message: savedMessage,
      whatsappResponse,
    });
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to send WhatsApp message",
      },
      { status: 500 }
    );
  }
}
