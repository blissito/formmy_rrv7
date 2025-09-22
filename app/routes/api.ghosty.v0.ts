/**
 * Ghosty v0 Endpoint - AgentV0 Implementation
 * Pure LlamaIndex Agent Workflows con context injection real
 */

import type { Route } from "./+types/api.ghosty.v0";
import { streamAgentV0 } from "server/agents/agent-v0.server";
import { getUserOrNull } from "server/getUserUtils.server";

export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message, stream = true, integrations = {} } = body;

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

    console.log('🚀 Ghosty v0 endpoint:', {
      userId: user.id,
      plan: user.plan || 'FREE',
      messageLength: message.length,
      integrationsCount: Object.keys(integrations).length,
      streamMode: stream
    });

    if (stream) {
      // Server-Sent Events streaming con AgentV0
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // runStream con eventos LlamaIndex oficiales y context completo
              for await (const event of streamAgentV0(user, message, null, integrations)) {
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
    } else {
      // Non-streaming mode (collect all responses)
      const responses: string[] = [];
      let toolsUsed: string[] = [];
      let metadata: any = {};

      for await (const event of streamAgentV0(user, message, null, integrations)) {
        if (event.type === "chunk") {
          responses.push(event.content);
        } else if (event.type === "tool-start") {
          toolsUsed.push(event.tool);
        } else if (event.type === "done") {
          metadata = event.metadata || {};
        }
      }

      return Response.json({
        type: "message",
        content: responses.join(''),
        metadata: {
          toolsUsed: [...new Set(toolsUsed)],
          enhanced: true,
          model: metadata.model || "gpt-5-nano",
          agent: "AgentV0"
        }
      });
    }

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