import type { Conversation, Message, Contact, Lead } from "@prisma/client";

/**
 * Extended types that include relations
 */
type ConversationWithMessages = Conversation & {
  messages: Message[];
};

/**
 * Tipo unificado para buscar nombres (Contact o Lead)
 */
type ContactOrLead = Pick<Contact, 'id' | 'name' | 'phone' | 'conversationId'> |
                     Pick<Lead, 'id' | 'name' | 'phone' | 'conversationId'>;

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
  parts?: object[];      // UIMessage.parts - Formato estándar Vercel AI SDK
  picture?: string;      // Contenido multimedia (sticker, imagen, etc)
  avatarUrl?: string;    // Avatar del usuario/bot (foto de perfil)
  createdAt: Date;

  // WhatsApp Reactions
  isReaction?: boolean;      // Si es una reacción
  reactionEmoji?: string;    // Emoji de la reacción
  reactionToMsgId?: string;  // externalMessageId del mensaje reaccionado
  externalMessageId?: string; // ID externo del mensaje (para relacionar reacciones)
}

/**
 * Transform database conversations to UI format
 */
export function transformConversationsToUI(
  conversations: ConversationWithMessages[],
  chatbotAvatarUrl?: string,
  contacts?: Contact[],
  leads?: Lead[]
): UIConversation[] {
  // Create maps for O(1) lookup
  const contactsByPhone = new Map<string, ContactOrLead>();
  const contactsByConversationId = new Map<string, ContactOrLead>();

  // Index WhatsApp contacts by phone
  if (contacts) {
    for (const contact of contacts) {
      if (contact.phone) {
        contactsByPhone.set(contact.phone, contact);
        const normalizedPhone = contact.phone.slice(-10);
        if (normalizedPhone.length === 10) {
          contactsByPhone.set(normalizedPhone, contact);
        }
      }
      if (contact.conversationId) {
        contactsByConversationId.set(contact.conversationId, contact);
      }
    }
  }

  // Index Leads by conversationId y phone
  if (leads) {
    for (const lead of leads) {
      if (lead.conversationId) {
        // Lead tiene prioridad sobre Contact si existe para la misma conversación
        contactsByConversationId.set(lead.conversationId, lead);
      }
      if (lead.phone) {
        contactsByPhone.set(lead.phone, lead);
        const normalizedPhone = lead.phone.slice(-10);
        if (normalizedPhone.length === 10) {
          contactsByPhone.set(normalizedPhone, lead);
        }
      }
    }
  }

  return conversations.map(conversation =>
    transformConversationToUI(conversation, chatbotAvatarUrl, contactsByPhone, contactsByConversationId)
  );
}

/**
 * Transform single conversation to UI format
 */
export function transformConversationToUI(
  conversation: ConversationWithMessages,
  chatbotAvatarUrl?: string,
  contactsByPhone?: Map<string, ContactOrLead>,
  contactsByConversationId?: Map<string, ContactOrLead>
): UIConversation {
  // Extract user info from WhatsApp phone number or visitor ID
  const phoneNumber = extractPhoneNumber(conversation.visitorId || conversation.sessionId);

  // Try to get contact/lead info
  let userName = "Usuario Web";
  let userAvatarUrl: string | undefined;

  // Primero intentar por conversationId (más confiable para leads)
  let contactOrLead = contactsByConversationId?.get(conversation.id);

  // Si no, intentar por teléfono (para WhatsApp)
  if (!contactOrLead && phoneNumber && contactsByPhone) {
    contactOrLead = contactsByPhone.get(phoneNumber);

    // Fallback: last 10 digits
    if (!contactOrLead && phoneNumber.length >= 10) {
      const normalizedPhone = phoneNumber.slice(-10);
      contactOrLead = contactsByPhone.get(normalizedPhone);
    }
  }

  // Asignar nombre y avatar
  if (contactOrLead) {
    if (contactOrLead.name) {
      userName = contactOrLead.name;
    } else if (phoneNumber) {
      userName = `Usuario ${phoneNumber.slice(-4)}`;
    }
    // Solo Contact tiene profilePictureUrl
    if ('profilePictureUrl' in contactOrLead) {
      userAvatarUrl = contactOrLead.profilePictureUrl || undefined;
    }
  } else if (phoneNumber) {
    userName = `Usuario ${phoneNumber.slice(-4)}`;
  }

  // Filtrar mensajes SYSTEM pero MANTENER las reacciones
  // Las reacciones no se mostrarán como burbujas, pero el frontend las necesita para el overlay
  const visibleMessages = conversation.messages.filter(msg => {
    // Excluir mensajes SYSTEM
    if (msg.role === "SYSTEM") return false;

    // ✅ MANTENER reacciones (el frontend las filtrará para bubbles, pero las usará para overlay)
    if (msg.isReaction === true) return true;

    // ✅ MANTENER mensajes con parts (artefactos, tool calls) aunque content esté vacío
    if (msg.parts && Array.isArray(msg.parts) && msg.parts.length > 0) return true;

    // Excluir mensajes vacíos que NO sean reacciones NI tengan parts
    // (algunas reacciones antiguas se guardaron como mensajes vacíos antes de la implementación)
    if (!msg.isReaction && (!msg.content || msg.content.trim() === "" || msg.content.trim().length < 2)) {
      return false;
    }

    return true;
  });

  const messages = visibleMessages.map(message =>
    transformMessageToUI(message, chatbotAvatarUrl, userAvatarUrl)
  );
  const lastMessage = getLastUserOrAssistantMessage(conversation.messages);

  const isFromWhatsApp = isWhatsAppConversation(conversation);

  // Obtener el último mensaje del USUARIO específicamente (no del bot)
  const lastUserMessage = conversation.messages
    .filter(msg => msg.role === "USER")
    .slice(-1)[0];

  // Usar el timestamp del último mensaje del usuario, o updatedAt como fallback
  const timeReference = lastUserMessage?.createdAt || conversation.updatedAt;

  return {
    id: conversation.id,
    chatbotId: conversation.chatbotId,
    messages,
    userName,
    userEmail: `user-${conversation.id.slice(-8)}@whatsapp.local`,
    lastMessage: lastMessage?.content || "Nueva conversación",
    time: formatTimeAgo(timeReference),
    date: formatDate(conversation.createdAt),
    unread: 0, // TODO: Implement unread count logic
    avatar: getConversationAvatar(conversation, chatbotAvatarUrl),
    tel: phoneNumber || "N/A",
    isFavorite: conversation.isFavorite || false,
    manualMode: conversation.manualMode || false,
    isWhatsApp: isFromWhatsApp,
  };
}

/**
 * Transform message to UI format
 */
function transformMessageToUI(
  message: Message,
  chatbotAvatarUrl?: string,
  userAvatarUrl?: string
): UIMessage {
  return {
    role: message.role as "USER" | "ASSISTANT" | "SYSTEM",
    content: message.content,
    // ✅ parts = UIMessage.parts - Formato estándar Vercel AI SDK
    parts: message.parts ? (message.parts as object[]) : undefined,
    // ✅ picture = contenido multimedia (sticker, imagen) - viene de message.picture en BD
    picture: message.picture || undefined,
    // ✅ avatarUrl = foto de perfil del usuario/bot
    avatarUrl: message.role === "USER"
      ? (userAvatarUrl || "/assets/chat/user-default.svg")
      : (chatbotAvatarUrl || "/assets/chat/ghosty.svg"),
    createdAt: message.createdAt,
    // WhatsApp Reactions - preservar valores booleanos explícitos
    isReaction: message.isReaction === true ? true : undefined,
    reactionEmoji: message.reactionEmoji || undefined,
    reactionToMsgId: message.reactionToMsgId || undefined,
    externalMessageId: message.externalMessageId || undefined,
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
    return formatCompactDate(date);
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
 * Format compact date in Spanish - Example: 8/Oct/25
 */
function formatCompactDate(date: Date): string {
  const monthNames = [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
  ];

  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2); // Últimos 2 dígitos

  return `${day}/${month}/${year}`;
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