/**
 * WhatsApp Conversation Management
 * Server-side functions for handling WhatsApp conversations
 */

import { ConversationStatus } from "@prisma/client";
import { db } from "../../../app/utils/db.server";
import { createConversation } from "../../chatbot/conversationModel.server";

/**
 * Get or create conversation - with auto-reactivation for DELETED conversations
 *
 * Strategy: WhatsApp conversations are continuous per phone number.
 * If a user deletes a conversation but receives a new message from the same number,
 * we reactivate the conversation instead of creating a duplicate.
 */
export async function getOrCreateConversation(
  phoneNumber: string,
  chatbotId: string
) {
  const sessionId = `whatsapp_${phoneNumber}`;

  // First, search for ANY conversation with this sessionId (including DELETED)
  const anyConversation = await db.conversation.findFirst({
    where: { sessionId },
  });

  if (anyConversation) {
    // If found but DELETED, reactivate it
    if (anyConversation.status === ConversationStatus.DELETED) {
      console.log(`🔄 [Conversation] Reactivating DELETED conversation ${anyConversation.id} for ${phoneNumber}`);
      const reactivatedConversation = await db.conversation.update({
        where: { id: anyConversation.id },
        data: {
          status: ConversationStatus.ACTIVE,
          updatedAt: new Date(), // Update timestamp to show recent activity
        },
      });
      console.log(`✅ [Conversation] Conversation ${reactivatedConversation.id} reactivated`);
      return reactivatedConversation;
    }

    // If found and ACTIVE (or other status), use it
    console.log(`✅ [Conversation] Found existing conversation ${anyConversation.id} for ${phoneNumber} (status: ${anyConversation.status})`);
    return anyConversation;
  }

  // No conversation exists - create new one
  console.log(`🆕 [Conversation] Creating new conversation for ${phoneNumber}, chatbot: ${chatbotId}`);
  const newConversation = await createConversation({
    chatbotId,
    visitorId: phoneNumber,
    visitorIp: undefined,
  });

  // Update the sessionId to our custom format for WhatsApp
  const updatedConversation = await db.conversation.update({
    where: { id: newConversation.id },
    data: { sessionId },
  });

  console.log(`✅ [Conversation] New conversation created: ${updatedConversation.id}, sessionId: ${sessionId}`);
  return updatedConversation;
}
