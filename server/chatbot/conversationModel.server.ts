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
  sessionId: clientSessionId,
}: {
  chatbotId: string | null; // ✅ Permitir null para Ghosty
  visitorIp?: string;
  visitorId?: string;
  sessionId?: string; // ✅ NUEVO: Aceptar sessionId del cliente
}): Promise<Conversation> {
  // Validar límites mensuales de conversaciones (solo para chatbots reales)
  if (chatbotId) {
    const limitValidation = await validateMonthlyConversationLimit(chatbotId);
    if (!limitValidation.canCreate) {
      throw new Error(
        `Se ha alcanzado el límite mensual de ${limitValidation.maxAllowed} conversaciones para este chatbot.`
      );
    }
  }

  // ✅ Usar sessionId del cliente si se proporciona, sino generar uno nuevo
  const sessionId = clientSessionId || nanoid();

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

  // Guardar el mensaje SYSTEM con el prompt general (instructions) (solo para chatbots reales)
  if (chatbotId) {
    const chatbot = await getChatbotById(chatbotId);
    if (chatbot?.instructions) {
      await addSystemMessage(conversation.id, chatbot.instructions);
    }

    // Increment the conversation count for the chatbot
    await incrementConversationCount(chatbotId);

    // Check if the chatbot has reached its limit after incrementing the count
    // This will automatically pause the chatbot if the limit is reached
    await pauseChatbotIfLimitReached(chatbotId);
  }

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
 * Gets a conversation by session ID (excludes deleted conversations)
 * ✅ FIX: Agregado filtro por chatbotId para evitar colisiones cross-chatbot
 */
export async function getConversationBySessionId(
  sessionId: string,
  chatbotId?: string | null // ✅ Opcional para backward compatibility con Ghosty
): Promise<Conversation | null> {
  return db.conversation.findFirst({
    where: {
      sessionId,
      ...(chatbotId !== undefined && { chatbotId }), // ✅ Filtrar por chatbotId si se proporciona
      status: { not: ConversationStatus.DELETED }, // ✅ EXCLUDE deleted conversations
    },
  });
}

/**
 * Finds a conversation by session ID (alias for getConversationBySessionId)
 * ✅ FIX: Agregado parámetro chatbotId
 */
export async function findConversationBySessionId(
  sessionId: string,
  chatbotId?: string | null
): Promise<Conversation | null> {
  return getConversationBySessionId(sessionId, chatbotId);
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
 * Gets the count of conversations for a chatbot (excludes deleted conversations)
 */
export async function getConversationsCountByChatbotId(
  chatbotId: string
): Promise<number> {
  return db.conversation.count({
    where: {
      chatbotId,
      status: { not: ConversationStatus.DELETED },
    },
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
 * Finds the last ACTIVE conversation for a specific chatbot and visitor
 * Used for session recovery - if user reloads page, we find their last active conversation
 */
export async function findLastActiveConversation({
  chatbotId,
  visitorId,
}: {
  chatbotId: string | null; // ✅ Permitir null para Ghosty
  visitorId?: string;
}): Promise<Conversation | null> {
  if (!visitorId) return null;

  return db.conversation.findFirst({
    where: {
      chatbotId, // ✅ Prisma maneja null correctamente en where clause
      visitorId,
      status: ConversationStatus.ACTIVE,
    },
    orderBy: {
      updatedAt: "desc", // Most recently updated conversation
    },
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
