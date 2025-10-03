/**
 * AgentV0 Endpoint - Server-Sent Events Streaming
 * 100% LlamaIndex Agent Workflows con feedback estilo Claude Code
 */

import type { Route } from "./+types/api.agent.v0";
import { streamAgentWorkflow } from "server/agents/agent-workflow.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { resolveChatbotConfig, createAgentExecutionContext } from "server/chatbot/configResolver.server";
import { getChatbot } from "server/chatbot-v0/chatbot";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message, chatbotId, integrations = {} } = body;

    if (!message?.trim()) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Obtener usuario autenticado
    const user = await getUserOrNull(request);
    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('🚀 AgentV0 endpoint:', {
      userId: user.id,
      plan: user.plan || 'FREE',
      messageLength: message.length,
      chatbotId: chatbotId || 'none',
      integrationsCount: Object.keys(integrations).length
    });

    // Obtener chatbot o usar configuración por defecto
    let targetChatbot;
    if (chatbotId) {
      targetChatbot = await getChatbot(chatbotId, user.id);
      if (!targetChatbot) {
        return Response.json(
          { error: "Chatbot not found" },
          { status: 404 }
        );
      }
    } else {
      // Configuración por defecto para AgentV0 genérico
      targetChatbot = {
        id: 'agent-v0-default',
        name: 'AgentV0',
        slug: 'agent-v0',
        instructions: 'Eres un asistente AI avanzado con acceso a herramientas. Ayudas a los usuarios con cualquier tarea que requieran.',
        customInstructions: '',
        personality: 'professional',
        aiModel: 'gpt-5-nano',
        temperature: 1,
        maxTokens: 4000,
        welcomeMessage: '¡Hola! Soy tu asistente AI. ¿En qué puedo ayudarte?',
        goodbyeMessage: '¡Hasta luego! Si necesitas más ayuda, no dudes en preguntar.',
        primaryColor: '#9A99EA',
        avatarUrl: '',
        contexts: [],
        isActive: true,
        userId: user.id
      };
    }

    const resolvedConfig = resolveChatbotConfig(targetChatbot as any, user);
    const agentContext = createAgentExecutionContext(user, targetChatbot.id, message, {
      integrations
    });

    // Server-Sent Events streaming response
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // runStream con eventos LlamaIndex oficiales y context completo
            for await (const event of streamAgentWorkflow(user, message, targetChatbot.id, {
              resolvedConfig,
              agentContext
            })) {
              const data = JSON.stringify(event);
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            // Final completion signal
            const doneData = JSON.stringify({
              type: "complete",
              timestamp: new Date().toISOString()
            });
            controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
            controller.close();

          } catch (error) {
            console.error("❌ AgentV0 streaming error:", error);

            // Error event
            const errorData = JSON.stringify({
              type: "error",
              content: "Error procesando tu mensaje. Por favor intenta de nuevo.",
              details: error instanceof Error ? error.message : "Unknown error"
            });
            controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
            controller.close();
          }
        }
      }),
      {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Connection": "keep-alive",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization"
        }
      }
    );

  } catch (error) {
    console.error("❌ AgentV0 endpoint error:", error);
    return Response.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
};

// Handle OPTIONS for CORS
export const options = async (): Promise<Response> => {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization"
    }
  });
};