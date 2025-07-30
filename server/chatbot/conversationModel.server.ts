import { ConversationStatus, type Conversation } from "@prisma/client";
import { nanoid } from "nanoid";
import { db } from "~/utils/db.server";
import { incrementConversationCount } from "./chatbotModel.server";
import { validateMonthlyConversationLimit } from "./planLimits.server";
import { pauseChatbotIfLimitReached } from "./usageTracking.server";
import { addSystemMessage } from "./messageModel.server";
import { getChatbotById } from "./chatbotModel.server";

/**
 * Creates a new conversation for a chatbot
 */
export async function createConversation({
  chatbotId,
  visitorIp,
  visitorId,
}: {
  chatbotId: string;
  visitorIp?: string;
  visitorId?: string;
}): Promise<Conversation> {
  // Validar límites mensuales de conversaciones
  const limitValidation = await validateMonthlyConversationLimit(chatbotId);
  if (!limitValidation.canCreate) {
    throw new Error(
      `Se ha alcanzado el límite mensual de ${limitValidation.maxAllowed} conversaciones para este chatbot.`
    );
  }

  // Generate a unique session ID
  const sessionId = nanoid();

  // Create the conversation
  const conversation = await db.conversation.create({
    data: {
      sessionId,
      chatbotId,
      visitorIp,
      visitorId,
      status: ConversationStatus.ACTIVE,
      startedAt: new Date(),
      messageCount: 0,
    },
  });

  // Guardar el mensaje SYSTEM con el prompt general (instructions)
  const chatbot = await getChatbotById(chatbotId);
  if (chatbot?.instructions) {
    await addSystemMessage(conversation.id, chatbot.instructions);
  }

  // Increment the conversation count for the chatbot
  await incrementConversationCount(chatbotId);

  // Check if the chatbot has reached its limit after incrementing the count
  // This will automatically pause the chatbot if the limit is reached
  await pauseChatbotIfLimitReached(chatbotId);

  return conversation;
}

/**
 * Gets a conversation by ID
 */
export async function getConversationById(
  id: string
): Promise<Conversation | null> {
  return db.conversation.findUnique({
    where: { id },
  });
}

/**
 * Gets a conversation by session ID
 */
export async function getConversationBySessionId(
  sessionId: string
): Promise<Conversation | null> {
  return db.conversation.findUnique({
    where: { sessionId },
  });
}

/**
 * Finds a conversation by session ID (alias for getConversationBySessionId)
 */
export async function findConversationBySessionId(
  sessionId: string
): Promise<Conversation | null> {
  return getConversationBySessionId(sessionId);
}

/**
 * Gets all conversations for a chatbot
 */
export async function getConversationsByChatbotId(
  chatbotId: string
): Promise<Conversation[]> {
  return db.conversation.findMany({
    where: { chatbotId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Updates the status of a conversation
 */
export async function updateConversationStatus(
  id: string,
  status: ConversationStatus
): Promise<Conversation> {
  const data: any = {
    status,
  };

  // If the conversation is being completed or timed out, set the endedAt timestamp
  if (
    status === ConversationStatus.COMPLETED ||
    status === ConversationStatus.TIMEOUT
  ) {
    data.endedAt = new Date();
  }

  return db.conversation.update({
    where: { id },
    data,
  });
}

/**
 * Increments the message count for a conversation
 */
export async function incrementMessageCount(id: string): Promise<Conversation> {
  return db.conversation.update({
    where: { id },
    data: {
      messageCount: {
        increment: 1,
      },
    },
  });
}

/**
 * Deletes a conversation
 */
export async function deleteConversation(id: string): Promise<Conversation> {
  return db.conversation.update({
    where: { id },
    data: { status: "DELETED" },
  });
}
/**
 * Marks conversations as timed out if they've been inactive for a certain period
 * This function should be called periodically by a cron job or similar
 */
export async function handleConversationTimeouts(
  inactiveMinutes: number = 30
): Promise<number> {
  const cutoffTime = new Date();
  cutoffTime.setMinutes(cutoffTime.getMinutes() - inactiveMinutes);

  // Find active conversations that haven't been updated recently
  const inactiveConversations = await db.conversation.findMany({
    where: {
      status: ConversationStatus.ACTIVE,
      updatedAt: {
        lt: cutoffTime,
      },
    },
    select: {
      id: true,
    },
  });

  if (inactiveConversations.length === 0) {
    return 0;
  }

  // Update all inactive conversations to TIMEOUT status
  await db.conversation.updateMany({
    where: {
      id: {
        in: inactiveConversations.map((conv) => conv.id),
      },
    },
    data: {
      status: ConversationStatus.TIMEOUT,
      endedAt: new Date(),
    },
  });

  return inactiveConversations.length;
}

// The resetAllMonthlyUsage function has been moved to usageTracking.ts
