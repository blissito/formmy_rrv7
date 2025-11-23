/**
 * Server logic para API Chatbot V0
 * Contiene toda la lógica de backend separada del route
 */

import { authenticateRequest, createAuthError, createUnsupportedIntentError } from "../../server/chatbot-v0/auth";
// Rate limiting removed - imports cleaned up
import { validateModelForPlan, applyModelCorrection } from "../../server/chatbot/modelValidator.server";
import { validateDomainAccess } from "../../server/utils/domain-validator.server";

export async function handleChatbotV0Action({ request }: Route.ActionArgs) {
  try {
    // Rate limiting removed - was causing critical blocking issues
    // Can be re-added later if needed with proper implementation

    // 📝 Parsear request con validación
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('❌ Error parsing form data:', parseError);
      return new Response(
        JSON.stringify({
          error: "Formato de solicitud inválido",
          userMessage: "Hubo un problema con tu solicitud. Por favor intenta de nuevo."
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 🔑 Autenticación (permite usuarios anónimos)
    const { user, isTestUser, isAnonymous } = await authenticateRequest(request, formData);

    if (!user) {
      return createAuthError();
    }

    const intent = formData.get("intent") as string;

    switch (intent) {
      case "chat": {
        // 💬 Solo manejar chat con AgentEngine_v0
        return await handleChatV0({
          request,
          chatbotId: formData.get("chatbotId") as string,
          message: formData.get("message") as string,
          sessionId: formData.get("sessionId") as string,
          visitorId: formData.get("visitorId") as string,
          requestedStream: formData.get("stream") === "true",
          userId: user.id,
          user: user,
          isTestUser: isTestUser,
          isAnonymous: isAnonymous || false
        });
      }

      case "get_history": {
        // 📚 Cargar historial de conversación
        const chatbotId = formData.get("chatbotId") as string;

        if (!chatbotId) {
          return new Response(
            JSON.stringify({ messages: [], error: "chatbotId requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        const { findLastActiveConversation } = await import("../../server/chatbot/conversationModel.server");
        const { getMessagesByConversationId } = await import("../../server/chatbot/messageModel.server");

        const conversation = await findLastActiveConversation({
          chatbotId,
          visitorId: user.id
        });

        if (!conversation) {
          return new Response(
            JSON.stringify({ messages: [], sessionId: null }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        const allMessages = await getMessagesByConversationId(conversation.id);

        // Filtrar mensajes system (solo para UI)
        const formattedMessages = allMessages
          .filter(msg => msg.role.toLowerCase() !== 'system')
          .map(msg => ({
            role: msg.role.toLowerCase() as "user" | "assistant",
            content: msg.content
          }));

        return new Response(
          JSON.stringify({
            messages: formattedMessages,
            sessionId: conversation.sessionId
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "get_conversations_count": {
        // 📊 Obtener conteo de conversaciones de un chatbot
        const chatbotId = formData.get("chatbotId") as string;

        if (!chatbotId) {
          return new Response(
            JSON.stringify({ success: false, error: "chatbotId requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verificar acceso al chatbot
        const { getChatbot } = await import("../../server/chatbot-v0/chatbot");
        const chatbot = await getChatbot(chatbotId, user.id, false);

        if (!chatbot) {
          return new Response(
            JSON.stringify({ success: false, needsUpgrade: true, count: 0 }),
            { status: 403, headers: { "Content-Type": "application/json" } }
          );
        }

        const { getConversationsCountByChatbotId } = await import("../../server/chatbot/conversationModel.server");
        const count = await getConversationsCountByChatbotId(chatbotId);

        return new Response(
          JSON.stringify({ success: true, count }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      case "get_conversations_count_batch": {
        // 📊 Obtener conteo de conversaciones para múltiples chatbots
        const chatbotIdsStr = formData.get("chatbotIds") as string;

        if (!chatbotIdsStr) {
          return new Response(
            JSON.stringify({ success: false, error: "chatbotIds requerido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        let chatbotIds: string[];
        try {
          chatbotIds = JSON.parse(chatbotIdsStr);
        } catch {
          return new Response(
            JSON.stringify({ success: false, error: "chatbotIds debe ser un array JSON válido" }),
            { status: 400, headers: { "Content-Type": "application/json" } }
          );
        }

        // Verificar acceso a cada chatbot y obtener conteos
        const { getChatbot } = await import("../../server/chatbot-v0/chatbot");
        const { getConversationsCountByChatbotId } = await import("../../server/chatbot/conversationModel.server");

        const counts: Record<string, number> = {};

        for (const chatbotId of chatbotIds) {
          try {
            // Verificar acceso al chatbot
            const chatbot = await getChatbot(chatbotId, user.id, false);

            if (chatbot) {
              const count = await getConversationsCountByChatbotId(chatbotId);
              counts[chatbotId] = count;
            } else {
              counts[chatbotId] = 0;
            }
          } catch (error) {
            console.error(`Error obteniendo conteo para chatbot ${chatbotId}:`, error);
            counts[chatbotId] = 0;
          }
        }

        return new Response(
          JSON.stringify({ success: true, counts }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }

      default: {
        return createUnsupportedIntentError();
      }
    }

  } catch (error) {
    console.error('❌ Chatbot V0 API Error:', error);

    // Nunca exponer errores 500 directamente al usuario
    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = 'Estamos experimentando problemas técnicos. Por favor intenta más tarde.';
    let statusCode = 503; // Service Unavailable por defecto

    if (errorMessage.includes('rate') || errorMessage.includes('429')) {
      userMessage = 'Límite de solicitudes alcanzado. Por favor espera unos momentos.';
      statusCode = 429;
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'La solicitud tardó demasiado. Por favor intenta de nuevo.';
      statusCode = 408;
    } else if (errorMessage.includes('auth') || errorMessage.includes('401')) {
      userMessage = 'Sesión expirada. Por favor vuelve a iniciar sesión.';
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
        userMessage: userMessage,
        retryAfter: statusCode === 429 ? 60 : undefined // Segundos para reintentar
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          ...(statusCode === 429 ? { "Retry-After": "60" } : {})
        }
      }
    );
  }
}

/**
 * Manejar chat específicamente con AgentEngine_v0
 * Historial se carga desde DB, no desde cliente
 * Soporta usuarios anónimos para widgets públicos
 */
async function handleChatV0(params: {
  request: Request;
  chatbotId: string;
  message: string;
  sessionId?: string;
  visitorId?: string;
  requestedStream: boolean;
  userId: string;
  user: { id: string; plan: string };
  isTestUser: boolean;
  isAnonymous: boolean;
}): Promise<Response> {

  const { request, chatbotId, message, sessionId, visitorId, requestedStream, userId, user, isTestUser, isAnonymous } = params;

  // Validar parámetros requeridos con mensajes amigables
  if (!chatbotId || !message) {
    return new Response(
      JSON.stringify({
        error: "Información incompleta",
        userMessage: "Por favor escribe un mensaje para continuar.",
        missingFields: {
          chatbotId: !chatbotId,
          message: !message
        }
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validar longitud del mensaje
  if (message.length > 4000) {
    return new Response(
      JSON.stringify({
        error: "Mensaje demasiado largo",
        userMessage: "Tu mensaje es muy largo. Por favor reduce el texto a menos de 4000 caracteres.",
        currentLength: message.length,
        maxLength: 4000
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Obtener chatbot (pasar flag isAnonymous)
  const { getChatbot } = await import("../../server/chatbot-v0/chatbot");
  const chatbot = await getChatbot(chatbotId, userId, isAnonymous);

  if (!chatbot) {
    return new Response(
      JSON.stringify({
        error: "Chatbot no disponible",
        userMessage: "El asistente no está disponible en este momento. Por favor contacta al administrador."
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 🔓 Validación de acceso público (patrón Flowise)
  const isOwner = chatbot.userId === userId;

  // 🔒 VALIDACIÓN DE DOMINIOS PERMITIDOS
  // TEMPORALMENTE DESHABILITADO: Oct 16, 2025
  // Feature siendo revisado para mejorar funcionamiento en casos edge
  // TODO: Re-habilitar después de resolver issues con validación de dominios
  /*
  const allowedDomains = chatbot.settings?.security?.allowedDomains;

  if (allowedDomains && allowedDomains.length > 0) {
    const referer = request.headers.get('referer');
    const origin = request.headers.get('origin');

    // Excluir dashboard de Formmy de la validación
    const isFormmyDashboard = referer?.includes('formmy.app') ||
                              origin?.includes('formmy.app');

    if (!isFormmyDashboard) {
      // Validar dominio usando referer (funciona en iframes)
      const validation = validateDomainAccess(referer || origin, allowedDomains);


      if (!validation.allowed) {
        return new Response(
          JSON.stringify({
            error: "Dominio no autorizado",
            userMessage: `Acceso bloqueado desde '${validation.originHost}'.\n\nDominios permitidos: ${validation.normalizedAllowed.join(', ')}\n\nVerifica la configuración de seguridad en tu chatbot.`,
            debug: {
              origin: validation.originHost,
              allowedDomains: validation.normalizedAllowed,
              reason: validation.reason
            }
          }),
          {
            status: 403,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
    } else {
    }
  }
  */

  // Validar chatbot activo
  if (!chatbot.isActive && !isOwner && !isTestUser) {
    return new Response(
      JSON.stringify({
        error: "Chatbot inactivo",
        userMessage: "Este asistente no está disponible en este momento."
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validar modelo según plan del usuario (excepto anónimos)
  if (!isAnonymous) {
    const modelValidation = validateModelForPlan(user.plan, chatbot.aiModel, chatbotId);

    if (!modelValidation.isValid && user.plan === 'FREE') {
      return new Response(
        JSON.stringify({
          error: "Acceso denegado",
          userMessage: modelValidation.userMessage || "Tu plan no incluye acceso a modelos AI."
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Aplicar corrección automática de modelo si es necesario
    const modelCorrection = applyModelCorrection(user.plan, chatbot.aiModel, true);

    if (modelCorrection.wasCorreected) {
      // Actualizar el modelo en el objeto chatbot para esta sesión
      chatbot.aiModel = modelCorrection.finalModel;
    }
  } else {
    // Usuarios anónimos: usar el modelo configurado del chatbot sin validaciones
  }

  try {
    // 💾 Guardar mensaje del usuario en la base de datos
    const { addUserMessage } = await import("../../server/chatbot/messageModel.server");
    const {
      getConversationBySessionId,
      createConversation,
      findLastActiveConversation
    } = await import("../../server/chatbot/conversationModel.server");

    // 🔑 Industry-standard session management (ChatGPT/Intercom pattern):
    // 1. Si hay sessionId: buscar esa conversación específica
    // 2. Si NO hay sessionId: buscar última conversación ACTIVA del usuario/visitor
    // 3. Si no existe ninguna: crear nueva conversación

    // Para usuarios anónimos, usar visitorId; para autenticados, usar userId
    const effectiveVisitorId = isAnonymous ? (visitorId || userId) : userId;

    let conversation = null;
    let sessionIdProvided = false;

    if (sessionId) {
      // Cliente envió sessionId explícito → buscar esa conversación
      // ✅ FIX: Filtrar por chatbotId para evitar colisiones cross-chatbot
      sessionIdProvided = true;
      conversation = await getConversationBySessionId(sessionId, chatbotId);
    }

    // 🔑 CRÍTICO: Solo buscar última conversación si NO se proporcionó sessionId
    // Si se proporcionó sessionId pero no existe → crear NUEVA conversación (no recuperar antigua)
    if (!conversation && !sessionIdProvided && effectiveVisitorId) {
      // No hay sessionId → buscar última activa del visitor (recuperación de sesión)
      conversation = await findLastActiveConversation({
        chatbotId,
        visitorId: effectiveVisitorId
      });

      if (conversation) {
      }
    }

    if (!conversation) {
      // No existe conversación previa → crear nueva
      conversation = await createConversation({
        chatbotId,
        visitorId: effectiveVisitorId,
        sessionId: sessionId || undefined // ✅ CRÍTICO: Pasar sessionId del cliente
      });
    }

    // 📚 Cargar historial desde DB ANTES de guardar el mensaje actual
    const { getMessagesByConversationId } = await import("../../server/chatbot/messageModel.server");
    const allMessages = await getMessagesByConversationId(conversation.id);


    // Truncar a últimos 20 mensajes (window estándar - cabe en 8K tokens)
    const recentMessages = allMessages.slice(-20);

    // Formatear historial para el agente (SOLO mensajes anteriores)
    const history = recentMessages.map(msg => {
      const role = msg.role.toLowerCase() as "user" | "assistant";
      let content = msg.content;

      // 📱 Marcar mensajes echo (respuestas manuales del negocio en WhatsApp)
      if (role === "assistant" && (msg as any).channel === "whatsapp_echo") {
        content = `📱 [Respuesta manual del negocio]: ${content}`;
      }

      return { role, content };
    });


    // Ahora sí guardar mensaje del usuario (después de cargar historial)
    await addUserMessage(conversation.id, message, undefined, "web");

    // TODO: MIGRAR A VERCEL AI SDK
    // Esta ruta usaba LlamaIndex Agent Workflows que fue eliminado.
    // Usar /chat/vercel/public como referencia de implementación.
    // Ver: app/routes/chat.vercel.public.tsx
    throw new Error(
      "Esta API está temporalmente fuera de servicio. " +
      "Migración a Vercel AI SDK en progreso. " +
      "Por favor usa el endpoint /chat/vercel/public como alternativa."
    );

  } catch (error) {
    console.error('❌ Agent-v0 error:', error);
    console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    console.error('❌ Error details:', {
      chatbotId,
      userId,
      isAnonymous,
      message: message.substring(0, 100)
    });

    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = 'El servicio del asistente no está disponible. Por favor intenta más tarde.';
    let statusCode = 503;

    if (errorMessage.includes('rate')) {
      userMessage = 'Demasiadas solicitudes. Por favor espera un momento.';
      statusCode = 429;
    } else if (errorMessage.includes('auth')) {
      userMessage = 'Problema de autenticación. Por favor recarga la página.';
      statusCode = 401;
    } else if (errorMessage.includes('model') || errorMessage.includes('API')) {
      userMessage = 'Error en la configuración del modelo AI. Por favor contacta al administrador.';
      statusCode = 500;
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
        userMessage: userMessage,
        engine: "agent-v0-llamaindex",
        debugInfo: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        retryAfter: statusCode === 429 ? 60 : undefined
      }),
      {
        status: statusCode,
        headers: {
          "Content-Type": "application/json",
          ...(statusCode === 429 ? { "Retry-After": "60" } : {})
        }
      }
    );
  }
}