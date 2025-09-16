import type { Route } from "./+types/api.ghosty.chat.enhanced";
import { callGhostyWithTools } from "~/services/ghostyEnhanced.server";
import { GhostyLlamaIndex } from "server/ghosty-llamaindex";
import { getUserOrNull } from "server/getUserUtils.server";
import type { User } from "@prisma/client";

/**
 * Endpoint mejorado que aprovecha capacidades nativas del modelo
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

    if (stream) {
      // Streaming response for real-time UI
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // Try to get user for LlamaIndex version
              const user = await getUserOrNull(request);
              
              // Use LlamaIndex if user is available, fallback to old system
              if (user) {
                // LlamaIndex enhanced version
                console.log('🚀 Using enhanced Ghosty with agent framework');
                
                const ghosty = new GhostyLlamaIndex({
                  mode: process.env.GHOSTY_MODE === 'remote' ? 'remote' : 'local',
                });

                // Send enhanced status messages
                const thinkingData = JSON.stringify({
                  type: "status", 
                  status: "thinking",
                  message: "🤔 Analizando tu pregunta con IA avanzada..."
                });
                controller.enqueue(encoder.encode(`data: ${thinkingData}\n\n`));

                const analyzingData = JSON.stringify({
                  type: "status",
                  status: "tool-analyzing", 
                  message: "🔧 Evaluando qué herramientas necesito..."
                });
                controller.enqueue(encoder.encode(`data: ${analyzingData}\n\n`));

                const response = await ghosty.chat(message, user, {
                  conversationHistory: history,
                  stream: false,
                });

                // Simulate tool execution feedback
                if (response.toolsUsed && response.toolsUsed.length > 0) {
                  for (const tool of response.toolsUsed) {
                    // Tool start
                    const toolStartData = JSON.stringify({
                      type: "tool-start",
                      tool: tool,
                      message: `Ejecutando ${tool}...`
                    });
                    controller.enqueue(encoder.encode(`data: ${toolStartData}\n\n`));
                    
                    await new Promise(resolve => setTimeout(resolve, 200));
                    
                    // Tool complete
                    const toolCompleteData = JSON.stringify({
                      type: "tool-complete", 
                      tool: tool,
                      message: "Completado"
                    });
                    controller.enqueue(encoder.encode(`data: ${toolCompleteData}\n\n`));
                  }

                  // Synthesizing
                  const synthesizingData = JSON.stringify({
                    type: "synthesizing",
                    message: "🧠 Organizando la información encontrada..."
                  });
                  controller.enqueue(encoder.encode(`data: ${synthesizingData}\n\n`));
                  
                  await new Promise(resolve => setTimeout(resolve, 300));
                }

                // Stream the response content
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

                // Send tools used metadata
                if (response.toolsUsed && response.toolsUsed.length > 0) {
                  const toolsData = JSON.stringify({
                    type: "metadata",
                    toolsUsed: response.toolsUsed
                  });
                  controller.enqueue(encoder.encode(`data: ${toolsData}\n\n`));
                }

                // Send sources if available
                if (response.sources && response.sources.length > 0) {
                  const sourcesData = JSON.stringify({
                    type: "sources",
                    sources: response.sources
                  });
                  controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
                }

                // Send completion
                const completionData = JSON.stringify({
                  type: "done",
                  metadata: response.metadata
                });
                controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
                
              } else {
                // Fallback to old system
                console.log('⚠️ Using fallback Ghosty system');
                
                const thinkingData = JSON.stringify({
                  type: "status",
                  status: "thinking",
                  message: "🤔 Analizando tu pregunta..."
                });
                controller.enqueue(encoder.encode(`data: ${thinkingData}\n\n`));
                
                let fullContent = '';
                const result = await callGhostyWithTools(
                  message, 
                  true,
                  (chunk: string) => {
                    const data = JSON.stringify({
                      type: "chunk", 
                      content: chunk,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                    fullContent += chunk;
                  },
                  history
                );
                
                // Handle old system metadata
                if (result.toolsUsed && result.toolsUsed.length > 0) {
                  const toolsData = JSON.stringify({
                    type: "metadata",
                    toolsUsed: result.toolsUsed
                  });
                  controller.enqueue(encoder.encode(`data: ${toolsData}\n\n`));
                }

                if (result.sources && result.sources.length > 0) {
                  const sourcesData = JSON.stringify({
                    type: "sources",
                    sources: result.sources
                  });
                  controller.enqueue(encoder.encode(`data: ${sourcesData}\n\n`));
                }

                // Send completion signal
                const doneData = JSON.stringify({ type: "done" });
                controller.enqueue(encoder.encode(`data: ${doneData}\n\n`));
              }
              controller.close();
            } catch (error) {
              console.error("Enhanced Ghosty streaming error:", error);
              console.error("Error details:", {
                message: error instanceof Error ? error.message : 'Unknown error',
                stack: error instanceof Error ? error.stack : undefined,
                name: error instanceof Error ? error.name : undefined
              });
              
              let errorMessage = "Lo siento, hubo un error procesando tu mensaje.";
              
              if (error instanceof Error) {
                if (error.message.includes('OpenRouter')) {
                  errorMessage = "El servicio de IA está temporalmente no disponible. Por favor intenta de nuevo en unos momentos.";
                } else if (error.message.includes('timeout') || error.message.includes('fetch')) {
                  errorMessage = "La conexión tardó demasiado. Por favor intenta de nuevo.";
                } else if (error.message.includes('parse')) {
                  errorMessage = "Hubo un problema procesando la respuesta. Por favor intenta de nuevo.";
                }
              }
              
              const errorData = JSON.stringify({
                type: "error",
                content: errorMessage,
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
          },
        }
      );
    } else {
      // Regular JSON response
      const result = await callGhostyWithTools(message, true, undefined, history);
      
      return new Response(
        JSON.stringify({
          type: "message",
          content: result.content,
          metadata: {
            toolsUsed: result.toolsUsed,
            enhanced: true,
            model: "gpt-oss-120b"
          }
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Enhanced Ghosty error:", error);
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