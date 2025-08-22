import { MessageRole, type Message, ConversationStatus } from "@prisma/client";
import { db } from "~/utils/db.server";
import {
  incrementMessageCount,
  getConversationById,
} from "./conversationModel.server";

/**
 * Interface for creating a new message
 */
interface CreateMessageParams {
  conversationId: string;
  content: string;
  role: MessageRole;
  tokens?: number;
  inputTokens?: number; // Tokens de entrada
  outputTokens?: number; // Tokens de salida
  cachedTokens?: number; // Cached input tokens (GPT-5-nano: 90% descuento)
  totalCost?: number; // Costo total en USD
  provider?: string; // Proveedor: openai, anthropic, openrouter
  responseTime?: number;
  firstTokenLatency?: number; // Tiempo hasta el primer chunk en ms
  aiModel?: string; // Modelo de IA usado para generar la respuesta (solo para ASSISTANT messages)
  visitorIp?: string; // Added for rate limiting
  channel?: string; // 'web', 'whatsapp', 'telegram'
  externalMessageId?: string; // WhatsApp message ID, etc.
}

/**
 * Error class for rate limiting
 */
export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RateLimitError";
  }
}

/**
 * Creates a new message in a conversation
 */
export async function createMessage({
  conversationId,
  content,
  role,
  tokens,
  inputTokens,
  outputTokens,
  cachedTokens,
  totalCost,
  provider,
  responseTime,
  firstTokenLatency,
  aiModel,
  visitorIp,
  channel,
  externalMessageId,
}: CreateMessageParams): Promise<Message> {
  // Check if the conversation exists and is active
  const conversation = await getConversationById(conversationId);
  if (!conversation) {
    throw new Error(`Conversation with ID ${conversationId} not found`);
  }

  if (conversation.status !== ConversationStatus.ACTIVE) {
    throw new Error(
      `Cannot add message to a ${conversation.status?.toLowerCase() || 'unknown'} conversation`
    );
  }

  // Apply rate limiting if IP is provided
  if (visitorIp && role === MessageRole.USER) {
    const isAllowed = checkRateLimit(visitorIp);
    if (!isAllowed) {
      throw new RateLimitError("Rate limit exceeded. Please try again later.");
    }
  }

  // Create the message
  const message = await db.message.create({
    data: {
      conversationId,
      content,
      role,
      tokens,
      inputTokens,
      outputTokens,
      cachedTokens,
      totalCost,
      provider,
      responseTime,
      firstTokenLatency,
      aiModel,
      channel,
      externalMessageId,
    },
  });

  // Increment the message count for the conversation
  await incrementMessageCount(conversationId);

  return message;
}

/**
 * Gets all messages for a conversation
 */
export async function getMessagesByConversationId(
  conversationId: string
): Promise<Message[]> {
  return db.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Gets a message by ID
 */
export async function getMessageById(id: string): Promise<Message | null> {
  return db.message.findUnique({
    where: { id },
  });
}

/**
 * Deletes a message
 */
export async function deleteMessage(id: string): Promise<Message> {
  return db.message.update({
    where: { id },
    data: { deleted: true },
  });
}

/**
 * Rate limiting implementation for messages by IP address
 * Returns true if the request should be allowed, false if it should be rate limited
 */
const ipRequestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  if (!ip) return true; // If no IP is provided, skip rate limiting

  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  // If no record exists or the reset time has passed, create a new record
  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs,
    });
    return true;
  }

  // If the request count is below the limit, increment and allow
  if (record.count < maxRequests) {
    record.count++;
    return true;
  }

  // Otherwise, rate limit
  return false;
}

/**
 * Clean up expired rate limit records
 * This should be called periodically to prevent memory leaks
 */
export function cleanupRateLimits(): void {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}

/**
 * Adds a user message to a conversation and handles rate limiting
 */
export async function addUserMessage(
  conversationId: string,
  content: string,
  visitorIp?: string,
  channel?: string,
  externalMessageId?: string
): Promise<Message> {
  return createMessage({
    conversationId,
    content,
    role: MessageRole.USER,
    visitorIp,
    channel,
    externalMessageId,
  });
}

/**
 * Adds an assistant (bot) message to a conversation with tracking
 */
export async function addAssistantMessage(
  conversationId: string,
  content: string,
  tokens?: number,
  responseTime?: number,
  firstTokenLatency?: number,
  aiModel?: string,
  channel?: string,
  externalMessageId?: string,
  inputTokens?: number,
  outputTokens?: number,
  totalCost?: number,
  provider?: string,
  cachedTokens?: number
): Promise<Message> {
  return createMessage({
    conversationId,
    content,
    role: MessageRole.ASSISTANT,
    tokens,
    inputTokens,
    outputTokens,
    cachedTokens,
    totalCost,
    provider,
    responseTime,
    firstTokenLatency,
    aiModel,
    channel,
    externalMessageId,
  });
}

/**
 * Adds a system message to a conversation (for internal use)
 */
export async function addSystemMessage(
  conversationId: string,
  content: string
): Promise<Message> {
  return createMessage({
    conversationId,
    content,
    role: MessageRole.SYSTEM,
  });
}

/**
 * Adds a WhatsApp user message to a conversation
 */
export async function addWhatsAppUserMessage(
  conversationId: string,
  content: string,
  whatsappMessageId: string
): Promise<Message> {
  return createMessage({
    conversationId,
    content,
    role: MessageRole.USER,
    channel: "whatsapp",
    externalMessageId: whatsappMessageId,
  });
}

/**
 * Adds a WhatsApp assistant message to a conversation
 */
export async function addWhatsAppAssistantMessage(
  conversationId: string,
  content: string,
  whatsappMessageId?: string,
  tokens?: number,
  responseTime?: number,
  firstTokenLatency?: number,
  aiModel?: string
): Promise<Message> {
  return createMessage({
    conversationId,
    content,
    role: MessageRole.ASSISTANT,
    channel: "whatsapp",
    externalMessageId: whatsappMessageId,
    tokens,
    responseTime,
    firstTokenLatency,
    aiModel,
  });
}

/**
 * Gets the message count for a conversation
 */
export async function getMessageCount(conversationId: string): Promise<number> {
  const result = await db.message.count({
    where: { conversationId },
  });

  return result;
}
