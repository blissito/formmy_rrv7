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

  return json({
    success: true,
    messageId: assistantMessage.id,
    whatsappSent: whatsappResult?.success || false,
    whatsappMessageId: whatsappResult?.messageId,
    whatsappError: whatsappResult?.error,
    message: whatsappResult?.success
      ? "Respuesta enviada por WhatsApp exitosamente"
      : "Respuesta guardada (WhatsApp no disponible)"
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
    throw new Error("Integración de WhatsApp no encontrada o inactiva");
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