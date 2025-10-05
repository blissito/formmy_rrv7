/**
 * Ghosty v0 Endpoint - AgentV0 Implementation
 * Pure LlamaIndex Agent Workflows con context injection real
 */

import type { Route } from "./+types/api.ghosty.v0";
import { streamAgentWorkflow } from "server/agents/agent-workflow.server";
import { getUserOrNull } from "server/getUserUtils.server";
import { resolveChatbotConfig, createAgentExecutionContext } from "server/chatbot/configResolver.server";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message, integrations = {} } = body;

    if (!message?.trim()) {
      return Response.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // 🛠️ Development Token Authentication (para testing con usuario real)
    const authHeader = request.headers.get('authorization');
    const devToken = authHeader?.replace('Bearer ', '');

    let user = null;

    if (devToken && process.env.DEVELOPMENT_TOKEN && devToken === process.env.DEVELOPMENT_TOKEN) {
      console.log('🛠️ Development token authenticated - fetching admin user');
      const { db } = await import("../../app/utils/db.server");

      // Buscar usuario admin real (fixtergeek@gmail.com)
      user = await db.user.findFirst({
        where: {
          email: 'fixtergeek@gmail.com'
        }
      });

      if (!user) {
        // Fallback: buscar cualquier usuario con plan PRO
        user = await db.user.findFirst({
          where: { plan: 'PRO' }
        });
      }

      if (!user) {
        return Response.json(
          { error: "No admin or PRO user found for development testing" },
          { status: 500 }
        );
      }

      console.log('✅ Using real user for testing:', {
        id: user.id,
        email: user.email,
        plan: user.plan
      });
    } else {
      // Autenticación normal por cookie
      user = await getUserOrNull(request);
    }

    if (!user) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    console.log('🚀 Ghosty v0 endpoint:', {
      userId: user.id,
      plan: user.plan || 'FREE',
      messageLength: message.length,
      integrationsCount: Object.keys(integrations).length
    });

    // Crear configuración Ghosty mock para AgentWorkflow
    const ghostyChatbot = {
      id: 'ghosty-main',
      name: 'Ghosty',
      slug: 'ghosty',
      instructions: 'Eres Ghosty 👻, el asistente principal de Formmy. Ayudas a los usuarios con todas las funcionalidades de la plataforma.',
      customInstructions: 'Eres amigable, directo y conoces perfectamente todas las herramientas disponibles.',
      personality: 'friendly',
      aiModel: 'gpt-5-nano',
      temperature: 1,
      maxTokens: 4000,
      welcomeMessage: '¡Hola! Soy Ghosty 👻, tu asistente de Formmy. ¿En qué puedo ayudarte?',
      goodbyeMessage: '¡Hasta la vista! Si necesitas ayuda, aquí estaré 👻',
      primaryColor: '#9A99EA',
      avatarUrl: '',
      contexts: [],
      isActive: true,
      userId: user.id
    };

    const resolvedConfig = resolveChatbotConfig(ghostyChatbot as any, user);
    const agentContext = createAgentExecutionContext(user, 'ghosty-main', message, {
      integrations
    });

    // Server-Sent Events streaming con AgentV0 (100% streaming)
    const encoder = new TextEncoder();

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            // runStream con eventos LlamaIndex oficiales y context completo
            for await (const event of streamAgentWorkflow(user, message, 'ghosty-main', {
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
            console.error("❌ Ghosty v0 streaming error:", error);

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
    console.error("❌ Ghosty v0 endpoint error:", error);
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