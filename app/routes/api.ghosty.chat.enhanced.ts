import type { Route } from "./+types/api.ghosty.chat.enhanced";
import { GhostyAgent } from "server/agents/ghosty-agent";
import { getUserOrNull } from "server/getUserUtils.server";
import type { User } from "@prisma/client";

/**
 * Endpoint Ghosty - Nueva Arquitectura con AgentEngine_v0
 * Motor único: AgentEngine_v0 + Agentes especializados
 */
export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message, stream = true, history = [] } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Obtener usuario autenticado
    const user = await getUserOrNull(request);
    if (!user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (stream) {
      // Streaming response usando AgentEngine_v0
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              console.log('🚀 Using GhostyAgent with AgentEngine_v0');

              // Crear instancia de Ghosty con motor unificado
              const ghosty = new GhostyAgent(user);

              // Status inicial
              const thinkingData = JSON.stringify({
                type: "status",
                status: "thinking",
                message: "🤔 Analizando tu pregunta..."
              });
              controller.enqueue(encoder.encode(`data: ${thinkingData}\n\n`));

              // Ejecutar chat con AgentEngine_v0
              const response = await ghosty.chat(message, history);

              // Si hay herramientas usadas, mostrar feedback
              if (response.toolsUsed && response.toolsUsed.length > 0) {
                for (const tool of response.toolsUsed) {
                  const toolData = JSON.stringify({
                    type: "tool-start",
                    tool: tool,
                    message: `Ejecutando ${tool}...`
                  });
                  controller.enqueue(encoder.encode(`data: ${toolData}\n\n`));

                  await new Promise(resolve => setTimeout(resolve, 150));

                  const toolCompleteData = JSON.stringify({
                    type: "tool-complete",
                    tool: tool,
                    message: "Completado"
                  });
                  controller.enqueue(encoder.encode(`data: ${toolCompleteData}\n\n`));
                }
              }

              // Stream del contenido de la respuesta
              if (response.content) {
                const words = response.content.split(' ');
                for (const word of words) {
                  const chunk = word + ' ';
                  const data = JSON.stringify({
                    type: "chunk",
                    content: chunk,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  await new Promise(resolve => setTimeout(resolve, 15));
                }
              }

              // Metadata de herramientas usadas
              if (response.toolsUsed && response.toolsUsed.length > 0) {
                const toolsData = JSON.stringify({
                  type: "metadata",
                  toolsUsed: response.toolsUsed
                });
                controller.enqueue(encoder.encode(`data: ${toolsData}\n\n`));
              }

              // Completion signal
              const completionData = JSON.stringify({
                type: "done",
                metadata: response.metadata
              });
              controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));

              controller.close();
            } catch (error) {
              console.error("GhostyAgent error:", error);

              let errorMessage = "Lo siento, hubo un error procesando tu mensaje.";

              if (error instanceof Error) {
                if (error.message.includes('timeout') || error.message.includes('fetch')) {
                  errorMessage = "La conexión tardó demasiado. Por favor intenta de nuevo.";
                } else if (error.message.includes('API')) {
                  errorMessage = "El servicio de IA está temporalmente no disponible. Por favor intenta de nuevo.";
                }
              }

              const errorData = JSON.stringify({
                type: "error",
                content: errorMessage,
              });
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              controller.close();
            }
          },
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
          },
        }
      );
    } else {
      // Regular JSON response
      const ghosty = new GhostyAgent(user);
      const response = await ghosty.chat(message, history);

      return new Response(
        JSON.stringify({
          type: "message",
          content: response.content,
          metadata: {
            toolsUsed: response.toolsUsed,
            enhanced: true,
            model: response.metadata?.model || "gpt-5-nano"
          }
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Ghosty enhanced endpoint error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};