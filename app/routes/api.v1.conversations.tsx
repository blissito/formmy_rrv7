import { data as json } from "react-router";
import { db } from "~/utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
import { addAssistantMessage } from "server/chatbot/messageModel.server";
import type { Route } from "./+types/api.v1.conversations";

/**
 * API para gestión de conversaciones
 * - GET: Lista conversaciones con cursor-based infinity scroll (FASE 1)
 * - POST: Toggle manual mode, Enviar respuesta manual
 */

export const loader = async ({ request }: Route.LoaderArgs) => {
  try {
    const user = await getUserOrRedirect(request);
    const url = new URL(request.url);

    // Query params para infinity scroll
    const chatbotId = url.searchParams.get("chatbotId");
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const cursorDate = url.searchParams.get("cursor"); // updatedAt de la última conversación cargada

    if (!chatbotId) {
      return json(
        { error: "chatbotId es requerido" },
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validar acceso al chatbot
    const accessValidation = await validateChatbotAccess(user.id, chatbotId);
    if (!accessValidation.canAccess) {
      return json(
        { error: "Sin acceso a este chatbot" },
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ⚡ FASE 1: Cargar conversaciones sin mensajes (solo metadata)
    const conversations = await db.conversation.findMany({
      where: {
        chatbotId,
        status: { not: "DELETED" },
        ...(cursorDate ? { updatedAt: { lt: new Date(cursorDate) } } : {}), // Cursor-based pagination por fecha
      },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        createdAt: true,
        updatedAt: true,
        isFavorite: true,
        manualMode: true,
        chatbotId: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: limit + 1, // Cargar uno extra para saber si hay más
    });

    // Determinar si hay más conversaciones
    const hasMore = conversations.length > limit;
    const conversationsToReturn = hasMore ? conversations.slice(0, limit) : conversations;
    const nextCursor = hasMore
      ? conversationsToReturn[conversationsToReturn.length - 1].updatedAt.toISOString()
      : null;

    // Si no hay conversaciones, retornar vacío
    if (conversationsToReturn.length === 0) {
      return json({
        conversations: [],
        nextCursor: null,
        hasMore: false,
        total: 0,
      }, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, max-age=10' }
      });
    }

    // ⚡ Cargar último mensaje de cada conversación (query eficiente con subquery)
    const conversationIds = conversationsToReturn.map(c => c.id);

    // Query para obtener el mensaje más reciente de cada conversación usando subquery
    // (Compatible con Prisma + MongoDB/PostgreSQL)
    const lastMessagesPromises = conversationIds.map(async (convId) => {
      const lastMsg = await db.message.findFirst({
        where: {
          conversationId: convId,
          deleted: { not: true },
          role: { in: ["USER", "ASSISTANT"] },
        },
        orderBy: { createdAt: "desc" },
        select: {
          conversationId: true,
          content: true,
          role: true,
          createdAt: true,
        },
      });
      return lastMsg;
    });

    const lastMessagesResults = await Promise.all(lastMessagesPromises);
    const lastMessages = lastMessagesResults.filter((msg): msg is NonNullable<typeof msg> => msg !== null);

    // Crear map de últimos mensajes
    const lastMessageMap = new Map(
      lastMessages.map(msg => [msg.conversationId, msg])
    );

    // Cargar contactos de WhatsApp para nombres y avatares
    const whatsappContacts = await db.contact.findMany({
      where: { chatbotId },
      select: {
        id: true,
        name: true,
        phone: true,
        profilePictureUrl: true,
        conversationId: true,
      },
    });

    // Crear map de contactos
    const contactsByConversationId = new Map(
      whatsappContacts
        .filter(c => c.conversationId)
        .map(c => [c.conversationId!, c])
    );
    const contactsByPhone = new Map<string, typeof whatsappContacts[0]>();
    for (const contact of whatsappContacts) {
      if (contact.phone) {
        contactsByPhone.set(contact.phone, contact);
        const normalizedPhone = contact.phone.slice(-10);
        if (normalizedPhone.length === 10) {
          contactsByPhone.set(normalizedPhone, contact);
        }
      }
    }

    // Obtener chatbot para avatar
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: { avatarUrl: true },
    });

    // ⚡ Transformar a formato UI ligero (sin cargar todos los mensajes)
    const uiConversations = conversationsToReturn.map(conversation => {
      const lastMsg = lastMessageMap.get(conversation.id);
      const isWhatsApp = conversation.sessionId?.includes("whatsapp") ?? false;

      // Buscar nombre del contacto
      let contactName = "Visitante";
      let contactPhone = "";
      let avatarUrl = "";

      if (isWhatsApp && conversation.visitorId) {
        contactPhone = conversation.visitorId;

        // Buscar por conversationId primero
        let contact = contactsByConversationId.get(conversation.id);

        // Si no, buscar por teléfono
        if (!contact) {
          contact = contactsByPhone.get(contactPhone);
          if (!contact) {
            const normalizedPhone = contactPhone.slice(-10);
            contact = contactsByPhone.get(normalizedPhone);
          }
        }

        if (contact) {
          contactName = contact.name || contactPhone;
          avatarUrl = contact.profilePictureUrl || "";
        } else {
          contactName = contactPhone;
        }
      } else {
        // Conversación web - usar sessionId formateado (últimos 3 caracteres)
        const sessionIdSuffix = conversation.sessionId?.slice(-3) || "???";
        contactName = `Usuario web ${sessionIdSuffix}`;
      }

      // Calcular tiempo relativo
      const now = new Date();
      const updatedAt = new Date(conversation.updatedAt);
      const diffMs = now.getTime() - updatedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      let timeText = "Ahora";
      if (diffMins < 1) timeText = "Ahora";
      else if (diffMins < 60) timeText = `Hace ${diffMins}m`;
      else if (diffHours < 24) timeText = `Hace ${diffHours}h`;
      else if (diffDays === 1) timeText = "Ayer";
      else timeText = `Hace ${diffDays}d`;

      // Formato legible de fecha: "23 Nov 2025, 18:53"
      const dateText = updatedAt.toLocaleString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });

      return {
        id: conversation.id,
        chatbotId: conversation.chatbotId,
        userName: contactName,
        userEmail: "",
        lastMessage: lastMsg?.content || "Sin mensajes",
        time: timeText,
        date: dateText,
        unread: 0, // TODO: Implementar conteo de no leídos si se necesita
        avatar: avatarUrl || (isWhatsApp ? "/dash/default-whatsapp-avatar.svg" : "/dash/default-user-avatar.svg"),
        tel: contactPhone,
        isFavorite: conversation.isFavorite ?? false,
        manualMode: conversation.manualMode ?? false,
        isWhatsApp,
        messages: [], // ⚡ FASE 2: Mensajes se cargan on-demand
      };
    });

    return json({
      conversations: uiConversations,
      nextCursor,
      hasMore,
      total: conversationsToReturn.length,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, max-age=10', // Cache 10 segundos
      }
    });

  } catch (error) {
    console.error("❌ Error en GET /api/v1/conversations:", error);
    return json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
export const action = async ({ request }: Route.ActionArgs) => {

  try {
    const user = await getUserOrRedirect(request);

    // Read intent from URL query params OR body (support both)
    const url = new URL(request.url);
    const body = await request.json();
    const intent = url.searchParams.get("intent") || body.intent;
    const { conversationId, message, chatbotId, isManual } = body;

    // Intent toggle_all_whatsapp_manual no requiere conversationId
    if (intent === "toggle_all_whatsapp_manual") {
      if (!chatbotId) {
        return json({ error: "ID de chatbot requerido" }, {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Validar acceso al chatbot
      const accessValidation = await validateChatbotAccess(user.id, chatbotId);
      if (!accessValidation.canAccess) {
        return json({ error: "Sin acceso a este chatbot" }, {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return await handleToggleAllWhatsAppManual(chatbotId, isManual ?? false);
    }

    // Para otros intents, conversationId es requerido
    if (!conversationId) {
      return json({ error: "ID de conversación requerido" }, {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Obtener conversación y validar acceso
    const conversation = await db.conversation.findUnique({
      where: { id: conversationId },
      include: { chatbot: true }
    });

    if (!conversation) {
      return json({ error: "Conversación no encontrada" }, {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Validar que el usuario tenga acceso al chatbot
    const accessValidation = await validateChatbotAccess(user.id, conversation.chatbotId);
    if (!accessValidation.canAccess) {
      return json({ error: "Sin acceso a esta conversación" }, {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Router de intents
    switch (intent) {
      case "toggle_manual":
        return await handleToggleManualMode(conversationId);

      case "send_manual_response":
        if (!message) {
          return json({ error: "Mensaje requerido para respuesta manual" }, {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return await handleManualResponse(conversationId, { message }, conversation);

      case "delete_conversation":
        return await handleDeleteConversation(conversationId);

      case "toggle_favorite":
        return await handleToggleFavorite(conversationId);

      case "send_template":
        const { templateName, templateLanguage } = body;
        if (!templateName) {
          return json({ error: "Template name required" }, {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return await handleSendTemplate(conversationId, templateName, templateLanguage || 'en_US', conversation);

      default:
        return json({ error: "Intent no reconocido" }, {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error("❌ Error en API conversaciones:", error);
    return json(
      { error: "Error interno del servidor", details: error.message },
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

/**
 * Toggle manual mode para una conversación
 */
async function handleToggleManualMode(conversationId: string) {

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    return json({ error: "Conversación no encontrada" }, {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }


  const updatedConversation = await db.conversation.update({
    where: { id: conversationId },
    data: { manualMode: !conversation.manualMode }
  });


  return json({
    success: true,
    manualMode: updatedConversation.manualMode,
    message: updatedConversation.manualMode ?
      "Modo manual activado - Bot deshabilitado" :
      "Modo automático activado - Bot habilitado"
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Enviar respuesta manual y por WhatsApp
 */
async function handleManualResponse(
  conversationId: string,
  body: { message: string },
  conversation: any
) {
  const { message } = body;

  if (!message || message.trim().length === 0) {
    return json({ error: "Mensaje no puede estar vacío" }, { status: 400 });
  }

  if (message.length > 4096) {
    return json({ error: "Mensaje muy largo (máximo 4096 caracteres)" }, { status: 400 });
  }

  // Verificar que esté en modo manual
  if (!conversation.manualMode) {
    return json({
      error: "Esta conversación debe estar en modo manual para enviar respuestas manuales"
    }, { status: 400 });
  }

  // Guardar mensaje en BD
  const assistantMessage = await addAssistantMessage(
    conversationId,
    message.trim(),
    undefined, // tokens - no aplica para respuesta manual
    undefined, // responseTime
    undefined, // firstTokenLatency
    "manual", // aiModel - indicar que es manual
    conversation.sessionId?.includes("whatsapp") ? "whatsapp" : "web"
  );

  // Enviar por WhatsApp si es conversación de WhatsApp
  let whatsappResult = null;

  // Debug logging para diagnosticar problemas de envío

  if (conversation.sessionId?.includes("whatsapp") && conversation.visitorId) {
    try {
      whatsappResult = await sendManualWhatsAppMessage(
        conversation.visitorId,
        message.trim(),
        conversation.chatbotId
      );

      // Actualizar mensaje con ID de WhatsApp si se envió exitosamente
      if (whatsappResult.messageId) {
        await db.message.update({
          where: { id: assistantMessage.id },
          data: { externalMessageId: whatsappResult.messageId }
        });
      }
    } catch (whatsappError) {
      console.error("❌ Error enviando mensaje por WhatsApp:", whatsappError);
      // Log for monitoring but don't fail the entire response
      whatsappResult = {
        success: false,
        error: whatsappError.message || "Error desconocido de WhatsApp"
      };
    }
  }

  // Determinar canal de la conversación
  const isWhatsAppConversation = conversation.sessionId?.includes("whatsapp");
  const isWebConversation = !isWhatsAppConversation;

  // Mensaje apropiado según el canal
  let responseMessage: string;
  if (whatsappResult?.success) {
    responseMessage = "Respuesta enviada por WhatsApp exitosamente";
  } else if (isWhatsAppConversation && whatsappResult?.error) {
    responseMessage = `Error enviando por WhatsApp: ${whatsappResult.error}`;
  } else if (isWebConversation) {
    responseMessage = "Respuesta enviada - Usuario verá mensaje en tiempo real vía SSE";
  } else {
    responseMessage = "Respuesta guardada en base de datos";
  }


  return json({
    success: true,
    messageId: assistantMessage.id,
    channel: isWhatsAppConversation ? "whatsapp" : "web",
    whatsappSent: whatsappResult?.success || false,
    whatsappMessageId: whatsappResult?.messageId,
    whatsappError: whatsappResult?.error,
    message: responseMessage
  });
}

/**
 * Enviar mensaje manual por WhatsApp
 */
async function sendManualWhatsAppMessage(
  phoneNumber: string,
  message: string,
  chatbotId: string
) {

  // Obtener integración de WhatsApp para este chatbot
  const integration = await db.integration.findFirst({
    where: {
      chatbotId,
      platform: "WHATSAPP",
      isActive: true
    }
  });


  if (!integration) {
    console.error("❌ WhatsApp integration not found or inactive for chatbot:", chatbotId);
    throw new Error("Integración de WhatsApp no encontrada o inactiva");
  }

  if (!integration.token) {
    console.error("❌ WhatsApp integration missing token");
    throw new Error("Integración de WhatsApp sin token de acceso");
  }

  if (!integration.phoneNumberId) {
    console.error("❌ WhatsApp integration missing phoneNumberId");
    throw new Error("Integración de WhatsApp sin phoneNumberId");
  }

  const url = `https://graph.facebook.com/v18.0/${integration.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: phoneNumber,
    text: {
      body: message.substring(0, 4096) // WhatsApp limit
    }
  };


  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${integration.token}`
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000) // 10 second timeout
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error WhatsApp API:', response.status, errorText);
    throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();

  return {
    messageId: result.messages?.[0]?.id,
    success: true
  };
}

/**
 * Send WhatsApp template message
 */
async function handleSendTemplate(
  conversationId: string,
  templateName: string,
  templateLanguage: string,
  conversation: any
) {

  // Verify conversation is WhatsApp
  if (!conversation.sessionId?.includes("whatsapp") || !conversation.visitorId) {
    return json({
      error: "This is not a WhatsApp conversation or phone number is missing"
    }, { status: 400 });
  }

  // Verify conversation is in manual mode
  if (!conversation.manualMode) {
    return json({
      error: "Conversation must be in manual mode to send templates"
    }, { status: 400 });
  }

  // Get WhatsApp integration
  const integration = await db.integration.findFirst({
    where: {
      chatbotId: conversation.chatbotId,
      platform: "WHATSAPP",
      isActive: true
    }
  });

  if (!integration || !integration.token || !integration.phoneNumberId) {
    return json({
      error: "WhatsApp integration not found or not configured"
    }, { status: 400 });
  }

  // Send template via Graph API
  const url = `https://graph.facebook.com/v18.0/${integration.phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: conversation.visitorId,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: templateLanguage
      }
    }
  };


  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${integration.token}`
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error WhatsApp API:', response.status, errorText);
      return json({
        error: `WhatsApp API error: ${response.status}`,
        details: errorText
      }, { status: 500 });
    }

    const result = await response.json();

    // Fetch template details to get the actual content
    let templateContent = `📨 WhatsApp Template: ${templateName}`;

    try {
      const templatesUrl = `https://graph.facebook.com/v18.0/${integration.businessAccountId}/message_templates?name=${templateName}`;
      const templateResponse = await fetch(templatesUrl, {
        headers: {
          'Authorization': `Bearer ${integration.token}`
        }
      });

      if (templateResponse.ok) {
        const templateData = await templateResponse.json();
        const template = templateData.data?.[0];
        if (template) {
          // Extract body text from template components
          const bodyComponent = template.components?.find((c: any) => c.type === 'BODY');
          if (bodyComponent?.text) {
            templateContent = `📨 Template enviado:\n\n${bodyComponent.text}`;
          }
        }
      }
    } catch (error) {
    }

    // Save assistant message to DB
    const assistantMessage = await addAssistantMessage(
      conversationId,
      templateContent,
      undefined,
      undefined,
      undefined,
      "manual",
      "whatsapp"
    );

    // Update message with WhatsApp message ID
    if (result.messages?.[0]?.id) {
      await db.message.update({
        where: { id: assistantMessage.id },
        data: { externalMessageId: result.messages[0].id }
      });
    }

    return json({
      success: true,
      messageId: assistantMessage.id,
      whatsappMessageId: result.messages?.[0]?.id,
      message: "Template sent successfully"
    });

  } catch (error) {
    console.error("❌ Error sending WhatsApp template:", error);
    return json({
      error: "Error sending template",
      details: error.message
    }, { status: 500 });
  }
}

/**
 * Soft delete de conversación (marca como DELETED)
 */
async function handleDeleteConversation(conversationId: string) {

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    return json({ error: "Conversación no encontrada" }, {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Soft delete: marcar como DELETED en vez de eliminar
  const updatedConversation = await db.conversation.update({
    where: { id: conversationId },
    data: { status: "DELETED" }
  });


  return json({
    success: true,
    message: "Conversación eliminada exitosamente"
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Toggle favorite status para una conversación
 */
async function handleToggleFavorite(conversationId: string) {

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    return json({ error: "Conversación no encontrada" }, {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }


  const updatedConversation = await db.conversation.update({
    where: { id: conversationId },
    data: { isFavorite: !conversation.isFavorite }
  });


  return json({
    success: true,
    isFavorite: updatedConversation.isFavorite,
    message: updatedConversation.isFavorite ?
      "Conversación marcada como favorita" :
      "Conversación desmarcada como favorita"
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
}

/**
 * Toggle modo manual para TODAS las conversaciones de WhatsApp de un chatbot
 * Actualiza: 1) Configuración del chatbot, 2) Conversaciones existentes
 */
async function handleToggleAllWhatsAppManual(chatbotId: string, isManual: boolean) {

  // 1. Actualizar configuración del chatbot
  const chatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: { whatsappAutoManual: isManual }
  });

  // 2. Actualizar TODAS las conversaciones de WhatsApp EXISTENTES (detectadas por sessionId)
  const result = await db.conversation.updateMany({
    where: {
      chatbotId,
      sessionId: { contains: "whatsapp_" },
      status: { not: "DELETED" }
    },
    data: { manualMode: isManual }
  });

  const mode = isManual ? "manual" : "automático";

  return json({
    success: true,
    chatbotUpdated: true,
    conversationsUpdated: result.count,
    whatsappAutoManual: chatbot.whatsappAutoManual,
    message: `Modo ${mode} ${isManual ? 'activado' : 'desactivado'} para ${result.count} conversaciones de WhatsApp`
  }, {
    headers: { 'Content-Type': 'application/json' }
  });
}