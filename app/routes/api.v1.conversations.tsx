import { data as json } from "react-router";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { db } from "../utils/db.server";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { validateChatbotAccess } from "server/chatbot/chatbotAccess.server";
import { addAssistantMessage } from "server/chatbot/messageModel.server";

/**
 * API para gestión de conversaciones
 * - GET: Method not allowed (use POST with intents)
 * - POST: Toggle manual mode, Enviar respuesta manual
 */

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return json(
    { error: "Method Not Allowed. Use POST with intent parameter." },
    { status: 405, headers: { 'Content-Type': 'application/json' } }
  );
};
export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("🎯 API Conversations - Method:", request.method);
  console.log("🎯 API Conversations - URL:", request.url);
  console.log("🎯 API Conversations - Headers:", Object.fromEntries(request.headers.entries()));

  try {
    const user = await getUserOrRedirect(request);
    console.log("🎯 API Conversations - User:", user.id);

    const body = await request.json();
    const { intent, conversationId, message } = body;

    console.log("🎯 API Conversations - Intent:", { intent, conversationId, message: message ? `${message.length} chars` : 'none' });

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
  console.log("🔄 [PROD] Toggle manual mode for conversation:", conversationId);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    console.log("❌ Conversation not found:", conversationId);
    return json({ error: "Conversación no encontrada" }, {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log("🔄 Current manual mode:", conversation.manualMode);

  const updatedConversation = await db.conversation.update({
    where: { id: conversationId },
    data: { manualMode: !conversation.manualMode }
  });

  console.log("✅ Updated manual mode:", updatedConversation.manualMode);

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
  console.log("🔍 WhatsApp detection check:", {
    sessionId: conversation.sessionId,
    visitorId: conversation.visitorId,
    chatbotId: conversation.chatbotId,
    isWhatsApp: conversation.sessionId?.includes("whatsapp"),
    hasVisitorId: !!conversation.visitorId,
    willAttemptSend: conversation.sessionId?.includes("whatsapp") && !!conversation.visitorId
  });

  if (conversation.sessionId?.includes("whatsapp") && conversation.visitorId) {
    console.log("📱 Attempting to send manual WhatsApp message...");
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

  console.log("✅ Manual response result:", {
    messageId: assistantMessage.id,
    channel: isWhatsAppConversation ? "whatsapp" : "web",
    whatsappSent: whatsappResult?.success || false,
    message: responseMessage
  });

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
  console.log("📱 sendManualWhatsAppMessage called:", {
    phoneNumber: phoneNumber?.substring(0, 8) + "***",
    messageLength: message.length,
    chatbotId
  });

  // Obtener integración de WhatsApp para este chatbot
  const integration = await db.integration.findFirst({
    where: {
      chatbotId,
      platform: "WHATSAPP",
      isActive: true
    }
  });

  console.log("🔍 WhatsApp integration found:", {
    exists: !!integration,
    isActive: integration?.isActive,
    hasToken: !!integration?.token,
    hasPhoneNumberId: !!integration?.phoneNumberId
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

  console.log(`📱 Enviando mensaje manual WhatsApp a ${phoneNumber.substring(0, 8)}***`);

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
  console.log('Mensaje manual WhatsApp enviado:', result);

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
  console.log("📱 handleSendTemplate called:", {
    conversationId,
    templateName,
    templateLanguage,
    chatbotId: conversation.chatbotId
  });

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

  console.log(`📱 Sending WhatsApp template "${templateName}" to ${conversation.visitorId.substring(0, 8)}***`);

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
    console.log('WhatsApp template sent:', result);

    // Save assistant message to DB
    const assistantMessage = await addAssistantMessage(
      conversationId,
      `[Template: ${templateName}]`,
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
  console.log("🗑️ Deleting conversation:", conversationId);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    console.log("❌ Conversation not found:", conversationId);
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

  console.log("✅ Conversation marked as deleted:", updatedConversation.id);

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
  console.log("⭐ Toggle favorite for conversation:", conversationId);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId }
  });

  if (!conversation) {
    console.log("❌ Conversation not found:", conversationId);
    return json({ error: "Conversación no encontrada" }, {
      status: 404,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  console.log("🔄 Current favorite status:", conversation.isFavorite);

  const updatedConversation = await db.conversation.update({
    where: { id: conversationId },
    data: { isFavorite: !conversation.isFavorite }
  });

  console.log("✅ Updated favorite status:", updatedConversation.isFavorite);

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