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
  // ✅ FIX: Incluir chatbotId en sessionId para permitir que el mismo número tenga conversaciones únicas por chatbot
  // Esto resuelve el problema del constraint UNIQUE en sessionId
  const sessionId = `whatsapp_${phoneNumber}_${chatbotId}`;

  // First, search for ANY conversation with this sessionId (including DELETED)
  const anyConversation = await db.conversation.findFirst({
    where: {
      sessionId,
    },
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

/**
 * Handle WhatsApp reactions (add, update, or remove)
 *
 * WhatsApp reactions have a unique structure:
 * - They reference the original message via message_id
 * - Empty emoji means the user removed their reaction
 * - User can only have ONE reaction per message (replaces previous)
 *
 * @param phoneNumber - User's phone number (from field in webhook)
 * @param chatbotId - Chatbot ID
 * @param emoji - Reaction emoji (empty string if removed)
 * @param originalMessageId - External ID of the message being reacted to
 * @param reactionMessageId - External ID of the reaction message itself
 */
export async function handleReaction(
  phoneNumber: string,
  chatbotId: string,
  emoji: string,
  originalMessageId: string,
  reactionMessageId: string
) {
  // Get conversation
  const conversation = await getOrCreateConversation(phoneNumber, chatbotId);

  // Find the original message that was reacted to
  const originalMessage = await db.message.findFirst({
    where: {
      conversationId: conversation.id,
      externalMessageId: originalMessageId,
    },
  });

  if (!originalMessage) {
    console.warn(`⚠️ [Reaction] Original message not found: ${originalMessageId}. Skipping reaction.`);
    return {
      success: false,
      reason: "original_message_not_found",
    };
  }

  // Check if emoji is empty (user removed reaction)
  if (!emoji || emoji.trim() === "") {

    // Find and delete existing reaction from this user to this message
    const existingReaction = await db.message.findFirst({
      where: {
        conversationId: conversation.id,
        isReaction: true,
        reactionToMsgId: originalMessageId,
        role: "USER", // Reactions are from users
      },
    });

    if (existingReaction) {
      await db.message.delete({
        where: { id: existingReaction.id },
      });
      return {
        success: true,
        action: "deleted",
        reactionId: existingReaction.id,
      };
    } else {
      return {
        success: true,
        action: "no_op",
      };
    }
  }

  // Emoji has value - add or update reaction
  // Check if user already has a reaction to this message
  const existingReaction = await db.message.findFirst({
    where: {
      conversationId: conversation.id,
      isReaction: true,
      reactionToMsgId: originalMessageId,
      role: "USER",
    },
  });

  if (existingReaction) {
    // Update existing reaction
    const updatedReaction = await db.message.update({
      where: { id: existingReaction.id },
      data: {
        reactionEmoji: emoji,
        externalMessageId: reactionMessageId, // Update with new reaction message ID
      },
    });
    return {
      success: true,
      action: "updated",
      reactionId: updatedReaction.id,
    };
  } else {
    // Create new reaction
    const newReaction = await db.message.create({
      data: {
        conversationId: conversation.id,
        content: emoji, // Store emoji in content for display
        role: "USER",
        channel: "whatsapp",
        isReaction: true,
        reactionEmoji: emoji,
        reactionToMsgId: originalMessageId,
        externalMessageId: reactionMessageId,
        tokens: 0,
        responseTime: 0,
      },
    });
    return {
      success: true,
      action: "created",
      reactionId: newReaction.id,
    };
  }
}
