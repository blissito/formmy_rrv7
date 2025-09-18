import type { Conversation, Message } from "@prisma/client";

/**
 * Extended types that include relations
 */
type ConversationWithMessages = Conversation & {
  messages: Message[];
};

/**
 * UI format expected by Conversations component
 */
export interface UIConversation {
  id: string;
  chatbotId: string;
  messages: UIMessage[];
  userName: string;
  userEmail: string;
  lastMessage: string;
  time: string;
  date: string;
  unread: number;
  avatar: string;
  tel: string;
  isFavorite: boolean;
  manualMode: boolean;
  isWhatsApp: boolean;
}

export interface UIMessage {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  picture?: string;
}

/**
 * Transform database conversations to UI format
 */
export function transformConversationsToUI(
  conversations: ConversationWithMessages[],
  chatbotAvatarUrl?: string
): UIConversation[] {
  return conversations.map(conversation => transformConversationToUI(conversation, chatbotAvatarUrl));
}

/**
 * Transform single conversation to UI format
 */
export function transformConversationToUI(
  conversation: ConversationWithMessages,
  chatbotAvatarUrl?: string
): UIConversation {
  // Filtrar mensajes SYSTEM - solo mostrar USER y ASSISTANT en la UI
  const visibleMessages = conversation.messages.filter(msg => msg.role !== "SYSTEM");
  const messages = visibleMessages.map(message => transformMessageToUI(message, chatbotAvatarUrl));
  const lastMessage = getLastUserOrAssistantMessage(conversation.messages);

  // Extract user info from WhatsApp phone number or visitor ID
  const phoneNumber = extractPhoneNumber(conversation.visitorId || conversation.sessionId);
  const userName = phoneNumber ? `Usuario ${phoneNumber.slice(-4)}` : "Usuario Web";

  const isFromWhatsApp = isWhatsAppConversation(conversation);

  return {
    id: conversation.id,
    chatbotId: conversation.chatbotId,
    messages,
    userName,
    userEmail: `user-${conversation.id.slice(-8)}@whatsapp.local`,
    lastMessage: lastMessage?.content || "Nueva conversación",
    time: formatTimeAgo(conversation.updatedAt),
    date: formatDate(conversation.createdAt),
    unread: 0, // TODO: Implement unread count logic
    avatar: getConversationAvatar(conversation, chatbotAvatarUrl),
    tel: phoneNumber || "N/A",
    isFavorite: false, // TODO: Implement favorites system
    manualMode: conversation.manualMode || false,
    isWhatsApp: isFromWhatsApp,
  };
}

/**
 * Transform message to UI format
 */
function transformMessageToUI(message: Message, chatbotAvatarUrl?: string): UIMessage {
  return {
    role: message.role as "USER" | "ASSISTANT" | "SYSTEM",
    content: message.content,
    picture: message.role === "USER"
      ? "/assets/chat/user-default.svg"
      : (chatbotAvatarUrl || "/assets/chat/ghosty.svg")
  };
}

/**
 * Get the last user or assistant message (ignore SYSTEM messages)
 */
function getLastUserOrAssistantMessage(messages: Message[]): Message | undefined {
  return messages
    .filter(msg => msg.role === "USER" || msg.role === "ASSISTANT")
    .slice(-1)[0];
}

/**
 * Extract phone number from visitorId or sessionId
 * WhatsApp sessions have format: "whatsapp_+1234567890"
 */
function extractPhoneNumber(identifier?: string): string | null {
  if (!identifier) return null;

  if (identifier.startsWith("whatsapp_")) {
    return identifier.replace("whatsapp_", "");
  }

  // Check if it looks like a phone number (numbers and + sign)
  if (/^\+?[\d\s-()]{10,}$/.test(identifier)) {
    return identifier;
  }

  return null;
}

/**
 * Check if conversation is from WhatsApp
 */
function isWhatsAppConversation(conversation: ConversationWithMessages): boolean {
  // Check sessionId format
  if (conversation.sessionId?.startsWith("whatsapp_")) {
    return true;
  }

  // Check if any message has WhatsApp channel
  if (conversation.messages.some(msg => msg.channel === "whatsapp")) {
    return true;
  }

  // Check if visitorId looks like a phone number
  if (conversation.visitorId && /^\+[\d\s-()]{10,}$/.test(conversation.visitorId)) {
    return true;
  }

  return false;
}

/**
 * Get avatar for conversation based on channel
 */
function getConversationAvatar(conversation: ConversationWithMessages, chatbotAvatarUrl?: string): string {
  // Use the centralized WhatsApp detection
  if (isWhatsAppConversation(conversation)) {
    return "/assets/chat/whatsapp-user.svg";
  }

  // Default web user avatar
  return "/assets/chat/user-default.svg";
}

/**
 * Format time ago in Spanish
 */
function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMinutes < 1) {
    return "Ahora";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h`;
  } else if (diffInDays === 1) {
    return "Ayer";
  } else if (diffInDays < 7) {
    return `${diffInDays}d`;
  } else {
    return formatDate(date);
  }
}

/**
 * Format full date in Spanish
 */
function formatDate(date: Date): string {
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];

  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day} de ${month} de ${year}`;
}

/**
 * Check if conversation has unread messages (placeholder for future implementation)
 */
export function getUnreadCount(conversation: ConversationWithMessages): number {
  // TODO: Implement unread count logic
  // This could track the last time the admin viewed this conversation
  // and count messages after that timestamp
  return 0;
}

/**
 * Check if conversation is favorited (placeholder for future implementation)
 */
export function isFavoriteConversation(conversationId: string): boolean {
  // TODO: Implement favorites system
  // This could be stored in a separate table or as a field in the conversation
  return false;
}