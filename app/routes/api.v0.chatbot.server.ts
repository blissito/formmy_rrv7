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

    // 🔑 Autenticación
    const { user, isTestUser } = await authenticateRequest(request, formData);

    if (!user) {
      return createAuthError();
    }

    const intent = formData.get("intent") as string;

    switch (intent) {
      case "chat": {
        // 💬 Solo manejar chat con AgentEngine_v0
        return await handleChatV0({
          chatbotId: formData.get("chatbotId") as string,
          message: formData.get("message") as string,
          sessionId: formData.get("sessionId") as string,
          conversationHistory: formData.get("conversationHistory") as string,
          requestedStream: formData.get("stream") === "true",
          userId: user.id,
          user: user,
          isTestUser: isTestUser
        });
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
 */
async function handleChatV0(params: {
  chatbotId: string;
  message: string;
  sessionId?: string;
  conversationHistory?: string;
  requestedStream: boolean;
  userId: string;
  user: { id: string; plan: string };
  isTestUser: boolean;
}): Promise<Response> {

  const { chatbotId, message, sessionId, conversationHistory, requestedStream, userId, user, isTestUser } = params;

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

  // Obtener chatbot
  const { getChatbot } = await import("../../server/chatbot-v0/chatbot");
  const chatbot = await getChatbot(chatbotId, userId);

  if (!chatbot) {
    return new Response(
      JSON.stringify({
        error: "Chatbot no disponible",
        userMessage: "El asistente no está disponible en este momento. Por favor contacta al administrador."
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  // 🛠️ Development token bypass - Skip ownership check for test users
  const isOwner = chatbot.userId === userId;
  if (!isOwner && !isTestUser) {
    return new Response(
      JSON.stringify({
        error: "Acceso denegado",
        userMessage: "No tienes permisos para usar este asistente."
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  // ✅ Validar isActive solo en producción (no en preview del owner)
  if (chatbot.isActive === false && !isOwner && !isTestUser) {
    return new Response(
      JSON.stringify({
        error: "Chatbot desactivado",
        userMessage: "Este asistente está temporalmente desactivado. Por favor intenta más tarde."
      }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  // Parsear historial conversacional
  let history: Array<{ role: "user" | "assistant"; content: string }> = [];
  if (conversationHistory) {
    try {
      history = JSON.parse(conversationHistory);
    } catch (e) {
      console.warn("Error parsing conversation history:", e);
    }
  }

  // Validar modelo según plan del usuario
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

  try {
    // 🚀 AgentWorkflow - 100% Streaming como requiere CLAUDE.md

    const { streamAgentWorkflow } = await import("../../server/agents/agent-workflow.server");

    // Resolver configuración usando configResolver
    const { resolveChatbotConfig, createAgentExecutionContext } = await import("../../server/chatbot/configResolver.server");

    const resolvedConfig = resolveChatbotConfig(chatbot, user);
    const agentContext = createAgentExecutionContext(user, chatbotId, message, {
      sessionId,
      conversationHistory: history
    });

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

            // Consumir stream del AgentWorkflow
            for await (const event of streamGenerator) {
              if (event.type === "chunk" && event.content) {
                hasContent = true;
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
                // Metadata final
                const data = JSON.stringify({
                  type: "metadata",
                  metadata: {
                    ...event.metadata,
                    toolsUsed,
                    model: chatbot.aiModel,
                    engine: "agentworkflow-llamaindex",
                    sessionId,
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
              const defaultData = JSON.stringify({
                type: "chunk",
                content: welcomeMessage
              });
              controller.enqueue(
                encoder.encode(`data: ${defaultData}\n\n`)
              );
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

    const errorMessage = error instanceof Error ? error.message : String(error);
    let userMessage = 'El servicio del asistente no está disponible. Por favor intenta más tarde.';
    let statusCode = 503;

    if (errorMessage.includes('rate')) {
      userMessage = 'Demasiadas solicitudes. Por favor espera un momento.';
      statusCode = 429;
    } else if (errorMessage.includes('auth')) {
      userMessage = 'Problema de autenticación. Por favor recarga la página.';
      statusCode = 401;
    }

    return new Response(
      JSON.stringify({
        error: userMessage,
        userMessage: userMessage,
        engine: "agent-v0-llamaindex",
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