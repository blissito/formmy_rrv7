/**
 * Server logic para API Chatbot V0
 * Contiene toda la lógica de backend separada del route
 */

import type { ActionFunctionArgs } from "react-router";
import { authenticateRequest, createAuthError, createUnsupportedIntentError } from "../../server/chatbot-v0/auth";
// Rate limiting removed - imports cleaned up
import { validateModelForPlan, applyModelCorrection } from "../../server/chatbot/modelValidator.server";

export async function handleChatbotV0Action({ request }: ActionFunctionArgs) {
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

  // Si el usuario es anónimo, validar que el chatbot esté activo
  if (isAnonymous) {
    // ✅ Permitir preview desde el dashboard de Formmy (owner preview)
    const origin = new URL(request.url).origin;
    const isFormmyDashboard = origin.includes('formmy-v2.fly.dev') ||
                              origin.includes('localhost') ||
                              origin.includes('formmy.app');

    if (!chatbot.isActive && !isFormmyDashboard) {
      return new Response(
        JSON.stringify({
          error: "Chatbot inactivo",
          userMessage: "Este asistente no está disponible en este momento."
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    if (isFormmyDashboard) {
      console.log('👁️ Permitiendo preview desde dashboard de Formmy (sin autenticación)');
    }

    // Opcional: Validar allowedDomains si está configurado (patrón Flowise)
    const allowedDomains = chatbot.settings?.security?.allowedDomains;
    if (allowedDomains && allowedDomains.length > 0) {
      const origin = request.headers.get('origin');
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          const isDomainAllowed = allowedDomains.some(domain => {
            try {
              const allowedHost = new URL(domain).host;
              return originHost === allowedHost;
            } catch {
              return false;
            }
          });

          if (!isDomainAllowed) {
            return new Response(
              JSON.stringify({
                error: "Dominio no autorizado",
                userMessage: "Este asistente no está disponible desde tu sitio web."
              }),
              { status: 403, headers: { "Content-Type": "application/json" } }
            );
          }
        } catch {
          // Si no se puede parsear el origin, permitir acceso
        }
      }
    }

    console.log('👤 Usuario anónimo accediendo a chatbot público:', chatbotId);
  } else {
    // Usuario autenticado - validar ownership
    if (!isOwner && !isTestUser) {
      return new Response(
        JSON.stringify({
          error: "Acceso denegado",
          userMessage: "No tienes permisos para usar este asistente."
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Owner preview - permitir incluso si está inactivo
    if (chatbot.isActive === false && !isOwner && !isTestUser) {
      return new Response(
        JSON.stringify({
          error: "Chatbot desactivado",
          userMessage: "Este asistente está temporalmente desactivado. Por favor intenta más tarde."
        }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
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
    console.log('👤 Usuario anónimo usando modelo:', chatbot.aiModel);
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
      sessionIdProvided = true;
      conversation = await getConversationBySessionId(sessionId);
    }

    // 🔑 CRÍTICO: Solo buscar última conversación si NO se proporcionó sessionId
    // Si se proporcionó sessionId pero no existe → crear NUEVA conversación (no recuperar antigua)
    if (!conversation && !sessionIdProvided && effectiveVisitorId) {
      // No hay sessionId → buscar última activa del visitor (recuperación de sesión)
      console.log(`🔍 Buscando última conversación activa para visitorId: ${effectiveVisitorId}, chatbotId: ${chatbotId} ${isAnonymous ? '(anónimo)' : '(autenticado)'}`);
      conversation = await findLastActiveConversation({
        chatbotId,
        visitorId: effectiveVisitorId
      });

      if (conversation) {
        console.log(`✅ Conversación activa encontrada: ${conversation.sessionId} (recuperada automáticamente)`);
      }
    }

    if (!conversation) {
      // No existe conversación previa → crear nueva
      console.log(`🆕 Creando nueva conversación para visitorId: ${effectiveVisitorId}, chatbotId: ${chatbotId} ${isAnonymous ? '(anónimo)' : '(autenticado)'}`);
      conversation = await createConversation({
        chatbotId,
        visitorId: effectiveVisitorId
      });
    }

    // 📚 Cargar historial desde DB ANTES de guardar el mensaje actual
    const { getMessagesByConversationId } = await import("../../server/chatbot/messageModel.server");
    const allMessages = await getMessagesByConversationId(conversation.id);

    console.log(`📚 Historial cargado: ${allMessages.length} mensajes totales (ANTES del mensaje actual)`);

    // Truncar a últimos 50 mensajes (todos los planes)
    const recentMessages = allMessages.slice(-50);

    // Formatear historial para el agente (SOLO mensajes anteriores)
    const history = recentMessages.map(msg => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content
    }));

    console.log(`🔹 Historial para agente: ${history.length} mensajes (truncado a 50, SIN mensaje actual)`);

    // Ahora sí guardar mensaje del usuario (después de cargar historial)
    await addUserMessage(conversation.id, message, undefined, "web");

    // 🚀 AgentWorkflow - 100% Streaming como requiere CLAUDE.md

    const { streamAgentWorkflow } = await import("../../server/agents/agent-workflow.server");

    // Resolver configuración usando configResolver
    const { resolveChatbotConfig, createAgentExecutionContext } = await import("../../server/chatbot/configResolver.server");

    const resolvedConfig = resolveChatbotConfig(chatbot, user);

    console.log(`🎯 Pasando historial al agentContext: ${history.length} mensajes`);
    if (history.length > 0) {
      console.log(`  Primera mensaje: ${history[0].role} - "${history[0].content.substring(0, 60)}..."`);
    }

    const agentContext = createAgentExecutionContext(user, chatbotId, message, {
      sessionId: conversation.sessionId,
      conversationId: conversation.id, // Para rate limiting de herramientas
      conversationHistory: history // Desde DB, no desde cliente
    });

    console.log(`✅ AgentContext creado con conversationHistory:`, agentContext.conversationHistory?.length || 0);

    // ✅ SIEMPRE STREAMING - CLAUDE.md compliance
    // Eliminado modo JSON - SOLO SSE streaming

    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // Usar AgentWorkflow con configuración personalizada
            const streamGenerator = streamAgentWorkflow(user, message, chatbotId, {
              resolvedConfig,
              agentContext
            });

            let hasContent = false;
            let toolsUsed: string[] = [];
            let fullResponse = ""; // Acumular respuesta completa

            // Consumir stream del AgentWorkflow
            for await (const event of streamGenerator) {
              if (event.type === "chunk" && event.content) {
                hasContent = true;
                fullResponse += event.content; // Acumular contenido
                // Emitir chunk como SSE event
                const data = JSON.stringify({
                  type: "chunk",
                  content: event.content
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              } else if (event.type === "tool-start") {
                // Emitir tool start events
                const data = JSON.stringify({
                  type: "tool-start",
                  tool: event.tool,
                  message: event.message
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );

                if (event.tool) {
                  toolsUsed.push(event.tool);
                }
              } else if (event.type === "status") {
                // Emitir status updates
                const data = JSON.stringify(event);
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              } else if (event.type === "error") {
                // Emitir errores
                const data = JSON.stringify({
                  type: "error",
                  content: event.content
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              } else if (event.type === "done") {
                // 🔑 Metadata final - SIEMPRE incluir sessionId (industry-standard pattern)
                const data = JSON.stringify({
                  type: "metadata",
                  metadata: {
                    ...event.metadata,
                    toolsUsed,
                    model: chatbot.aiModel,
                    engine: "agentworkflow-llamaindex",
                    sessionId: conversation.sessionId, // ✅ SIEMPRE enviar sessionId real de la conversación
                    timestamp: new Date().toISOString()
                  }
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
              }
            }

            // Si no hubo contenido, enviar welcome message
            if (!hasContent) {
              const welcomeMessage = resolvedConfig.welcomeMessage || "¡Hola! ¿En qué puedo ayudarte?";
              fullResponse = welcomeMessage;
              const defaultData = JSON.stringify({
                type: "chunk",
                content: welcomeMessage
              });
              controller.enqueue(
                encoder.encode(`data: ${defaultData}\n\n`)
              );
            }

            // 💾 Guardar respuesta del asistente en la base de datos
            // ✅ CRÍTICO: Guardar ANTES de cerrar el stream
            if (fullResponse && fullResponse.trim().length > 0) {
              console.log(`💾 Guardando respuesta del asistente (${fullResponse.length} caracteres) para conversación ${conversation.id}`);

              const { addAssistantMessage } = await import("../../server/chatbot/messageModel.server");

              // Reintentar hasta 3 veces si falla
              let saved = false;
              let lastError = null;

              for (let attempt = 1; attempt <= 3 && !saved; attempt++) {
                try {
                  await addAssistantMessage(
                    conversation.id,
                    fullResponse,
                    undefined, // tokens (por ahora)
                    undefined, // responseTime
                    undefined, // firstTokenLatency
                    chatbot.aiModel,
                    "web"
                  );

                  console.log(`✅ Mensaje del asistente guardado exitosamente (intento ${attempt})`);
                  saved = true;
                } catch (err) {
                  lastError = err;
                  console.error(`❌ Error guardando mensaje del asistente (intento ${attempt}/3):`, err);

                  if (attempt < 3) {
                    // Esperar 100ms antes de reintentar
                    await new Promise(resolve => setTimeout(resolve, 100));
                  }
                }
              }

              if (!saved) {
                console.error(`🚨 CRÍTICO: No se pudo guardar mensaje del asistente después de 3 intentos`);
                console.error(`   Conversación ID: ${conversation.id}`);
                console.error(`   Longitud respuesta: ${fullResponse.length}`);
                console.error(`   Último error:`, lastError);
                // No fallar el stream, pero enviar advertencia
                const warningData = JSON.stringify({
                  type: "warning",
                  content: "Respuesta generada pero hubo un problema al guardarla. Por favor contacta soporte si esto persiste."
                });
                controller.enqueue(
                  encoder.encode(`data: ${warningData}\n\n`)
                );
              }
            } else {
              console.warn(`⚠️  No se guardó mensaje del asistente: respuesta vacía`);
            }

            // Señal de finalización
            const doneData = JSON.stringify({ type: "done" });
            controller.enqueue(
              encoder.encode(`data: ${doneData}\n\n`)
            );

            controller.close();

          } catch (streamError) {
            console.error('❌ Error en AgentWorkflow streaming:', streamError);

            // Error handling personalizado por tipo
            const errorMessage = streamError instanceof Error ? streamError.message : String(streamError);
            let userMessage = 'Hubo un problema procesando tu mensaje. Por favor intenta de nuevo.';

            if (errorMessage.includes('rate') || errorMessage.includes('429')) {
              userMessage = 'Límite de solicitudes alcanzado. Espera un momento antes de intentar de nuevo.';
            } else if (errorMessage.includes('timeout')) {
              userMessage = 'La respuesta está tardando más de lo esperado. Por favor intenta de nuevo.';
            } else if (errorMessage.includes('model')) {
              userMessage = 'Problema temporal con el modelo AI. Por favor contacta soporte si persiste.';
            } else if (errorMessage.includes('configuration')) {
              userMessage = 'Error en la configuración del asistente. Por favor contacta soporte.';
            }

            const errorData = JSON.stringify({
              type: "error",
              content: userMessage
            });
            controller.enqueue(
              encoder.encode(`data: ${errorData}\n\n`)
            );
            controller.close();
          }
        },
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type",
          "X-Accel-Buffering": "no" // Nginx buffering disabled
        }
      }
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