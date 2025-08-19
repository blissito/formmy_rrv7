import type { Route } from "./+types/api.ghosty.chat.enhanced";
import { callGhostyWithTools } from "~/services/ghostyEnhanced.server";

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
              // Enviar estado inicial indicando que está pensando
              const thinkingData = JSON.stringify({
                type: "status",
                status: "thinking",
                message: "🤔 Analizando tu pregunta..."
              });
              controller.enqueue(
                encoder.encode(`data: ${thinkingData}\n\n`)
              );
              
              let fullContent = '';
              const result = await callGhostyWithTools(
                message, 
                true,
                (chunk: string) => {
                  // Send each chunk as SSE
                  const data = JSON.stringify({
                    type: "chunk",
                    content: chunk,
                  });
                  controller.enqueue(
                    encoder.encode(`data: ${data}\n\n`)
                  );
                  fullContent += chunk;
                },
                history // Pasar el historial de conversación
              );
              
              // Debug: log what we got back
              console.log('🔍 Enhanced Ghosty result:', {
                hasContent: !!result.content,
                contentLength: result.content?.length || 0,
                contentPreview: result.content?.substring(0, 100) || 'NO CONTENT',
                toolsUsed: result.toolsUsed,
                sourcesCount: result.sources?.length || 0,
                fullContentLength: fullContent?.length || 0
              });
              
              console.log('🔍 Full result object:', JSON.stringify(result, null, 2));
              
              // If no content was streamed but we have result.content, send it now
              if (!fullContent && result.content) {
                console.log('⚠️ No chunks were streamed, sending full content now');
                console.log('📄 Content being sent:', result.content.substring(0, 200) + '...');
                const data = JSON.stringify({
                  type: "chunk",
                  content: result.content,
                });
                controller.enqueue(
                  encoder.encode(`data: ${data}\n\n`)
                );
                fullContent = result.content; // Track that we sent it
              }

              // Send tools used metadata if any tools were used
              if (result.toolsUsed && result.toolsUsed.length > 0) {
                const toolsData = JSON.stringify({
                  type: "metadata",
                  toolsUsed: result.toolsUsed
                });
                controller.enqueue(
                  encoder.encode(`data: ${toolsData}\n\n`)
                );
              }

              // Send sources if available
              if (result.sources && result.sources.length > 0) {
                const sourcesData = JSON.stringify({
                  type: "sources",
                  sources: result.sources
                });
                controller.enqueue(
                  encoder.encode(`data: ${sourcesData}\n\n`)
                );
              }

              // Send completion signal
              const doneData = JSON.stringify({ type: "done" });
              controller.enqueue(
                encoder.encode(`data: ${doneData}\n\n`)
              );
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