import type { Route } from "./+types/api.ghosty.chat";
import { callGhostyOpenRouter } from "~/services/ghostyChat.server";

interface GhostyChatRequest {
  message: string;
  history?: Array<{
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    sources?: Array<{
      title: string;
      url: string;
      snippet: string;
    }>;
  }>;
  stream?: boolean;
  enableSearch?: boolean;
}

/**
 * Ghosty chat endpoint
 */
export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    // Parse request
    const body: GhostyChatRequest = await request.json();
    const { message, history = [], stream = false, enableSearch = true } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { 
          status: 400, 
          headers: { "Content-Type": "application/json" } 
        }
      );
    }

    if (stream) {
      // Streaming response
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              const result = await callGhostyOpenRouter(
                message,
                history,
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
                },
                enableSearch
              );

              // Send sources if available
              if (result.sources) {
                const sourcesData = JSON.stringify({
                  type: "sources",
                  sources: result.sources.results
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
              console.error("Ghosty streaming error:", error);
              const errorData = JSON.stringify({
                type: "error",
                content: "Lo siento, hubo un error procesando tu mensaje.",
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
      try {
        const response = await callGhostyOpenRouter(message, history, false, undefined, enableSearch);
        return new Response(
          JSON.stringify({
            type: "message",
            content: response.content,
            sources: response.sources?.results
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Ghosty error:", error);
        return new Response(
          JSON.stringify({
            type: "error", 
            content: "Lo siento, hubo un error procesando tu mensaje."
          }),
          { 
            status: 500, 
            headers: { "Content-Type": "application/json" } 
          }
        );
      }
    }
  } catch (error) {
    console.error("Ghosty API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { 
        status: 500, 
        headers: { "Content-Type": "application/json" } 
      }
    );
  }
};

/**
 * Handle GET requests (not supported)
 */
export const loader = async () => {
  return new Response(
    JSON.stringify({ error: "This endpoint only supports POST requests" }),
    {
      status: 405,
      headers: { "Content-Type": "application/json" },
    }
  );
};