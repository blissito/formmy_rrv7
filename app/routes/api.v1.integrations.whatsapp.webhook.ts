import { json } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  addWhatsAppUserMessage,
  addWhatsAppAssistantMessage,
} from "server/chatbot/messageModel.server";

// GET handler - WhatsApp webhook verification
export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // TODO: Verify token against stored webhook verify token
    // For now, we'll accept any verification request
    if (mode === "subscribe" && token && challenge) {
      console.log("WhatsApp webhook verification successful");
      return new Response(challenge, { status: 200 });
    }

    return json({ error: "Invalid webhook verification" }, { status: 403 });
  } catch (error) {
    console.error("Error in WhatsApp webhook verification:", error);
    return json({ error: "Webhook verification failed" }, { status: 500 });
  }
}

// POST handler - WhatsApp webhook events
export async function action({ request }: ActionFunctionArgs) {
  try {
    const body = await request.json();

    // Process WhatsApp webhook payload
    if (body.object === "whatsapp_business_account") {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === "messages") {
            await processWhatsAppMessage(change.value);
          }
        }
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error("Error processing WhatsApp webhook:", error);
    return json({ error: "Failed to process webhook" }, { status: 500 });
  }
}

async function processWhatsAppMessage(messageData: any) {
  try {
    // Extract message information
    const messages = messageData.messages || [];
    const contacts = messageData.contacts || [];

    for (const message of messages) {
      const contact = contacts.find((c: any) => c.wa_id === message.from);

      // TODO: Find or create conversation based on phone number
      // TODO: Find chatbot integration based on phone number ID
      const conversationId = "temp-conversation-id"; // This would be resolved from phone number

      // Process different message types
      if (message.type === "text") {
        await addWhatsAppUserMessage(
          conversationId,
          message.text.body,
          message.id
        );

        // TODO: Generate bot response and send back via WhatsApp API
        // For now, just log the received message
        console.log("Received WhatsApp message:", {
          from: message.from,
          text: message.text.body,
          messageId: message.id,
          contact: contact?.profile?.name || "Unknown",
        });
      }

      // TODO: Handle other message types (image, audio, document, etc.)
    }

    // Process message status updates
    const statuses = messageData.statuses || [];
    for (const status of statuses) {
      console.log("WhatsApp message status update:", {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
      });

      // TODO: Update message status in database
    }
  } catch (error) {
    console.error("Error processing WhatsApp message:", error);
    throw error;
  }
}
