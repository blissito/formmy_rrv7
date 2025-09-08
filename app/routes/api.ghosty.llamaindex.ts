/**
 * Ghosty LlamaIndex API Endpoint - New implementation using LlamaIndex.ts
 */

import type { Route } from "./+types/api.ghosty.llamaindex";
import { json } from "@react-router/node";
import { GhostyLlamaIndex, GhostyLlamaAdapter } from "server/ghosty-llamaindex";
import { getUserFromCookies } from "~/lib/google.server";
import type { User } from "@prisma/client";

/**
 * Test endpoint for LlamaIndex implementation
 */
export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message, stream = false, history = [], mode = 'adaptive' } = body;

    if (!message?.trim()) {
      return json({ error: "Message is required" }, { status: 400 });
    }

    // Get user from session
    const user = await getUserFromCookies(request);
    if (!user) {
      return json({ error: "Authentication required" }, { status: 401 });
    }

    console.log(`🤖 Ghosty LlamaIndex API: "${message.substring(0, 50)}..." (${mode})`);

    if (stream) {
      // Streaming response for real-time UI
      const encoder = new TextEncoder();

      return new Response(
        new ReadableStream({
          async start(controller) {
            try {
              // Initialize Ghosty
              const ghosty = new GhostyLlamaIndex({
                mode: process.env.GHOSTY_MODE === 'remote' ? 'remote' : 'local',
              });

              // Send thinking status
              const thinkingData = JSON.stringify({
                type: "status",
                status: "thinking",
                message: "🤔 Analizando tu pregunta con LlamaIndex..."
              });
              controller.enqueue(encoder.encode(`data: ${thinkingData}\n\n`));

              // Send tool analyzing status
              const analyzingData = JSON.stringify({
                type: "status",
                status: "tool-analyzing",
                message: "🔧 Decidiendo qué herramientas usar..."
              });
              controller.enqueue(encoder.encode(`data: ${analyzingData}\n\n`));

              let fullContent = '';
              const response = await ghosty.chat(message, user, {
                conversationHistory: history,
                stream: false, // Handle streaming manually for now
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
                  
                  // Small delay for UX
                  await new Promise(resolve => setTimeout(resolve, 300));
                  
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
                
                await new Promise(resolve => setTimeout(resolve, 500));
              }

              // Send content
              if (response.content) {
                const words = response.content.split(' ');
                for (const word of words) {
                  const chunk = word + ' ';
                  const data = JSON.stringify({
                    type: "chunk",
                    content: chunk,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  fullContent += chunk;
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

              controller.close();

            } catch (error) {
              console.error('❌ Streaming error:', error);
              const errorData = JSON.stringify({
                type: "error",
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
              controller.close();
            }
          }
        }),
        {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
          }
        }
      );
    } else {
      // Non-streaming response
      const ghosty = new GhostyLlamaIndex({
        mode: mode === 'local' ? 'local' : 
              mode === 'remote' ? 'remote' : 
              process.env.GHOSTY_MODE === 'remote' ? 'remote' : 'local',
      });

      const response = await ghosty.chat(message, user, {
        conversationHistory: history,
        stream: false,
      });

      return json({
        success: true,
        content: response.content,
        toolsUsed: response.toolsUsed,
        sources: response.sources,
        metadata: response.metadata,
      });
    }

  } catch (error) {
    console.error('❌ Ghosty LlamaIndex API error:', error);
    return json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      content: "Disculpa, tuve un problema procesando tu solicitud. Intenta de nuevo.",
    }, { status: 500 });
  }
};

/**
 * GET endpoint for testing and health checks
 */
export const loader = async ({ request }: Route.LoaderArgs): Promise<Response> => {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  switch (action) {
    case 'health':
      return json({ 
        status: 'ok', 
        implementation: 'llamaindex',
        timestamp: new Date().toISOString()
      });

    case 'test-remote':
      try {
        const ghosty = new GhostyLlamaIndex();
        const result = await ghosty.testRemoteConnection();
        return json({ remote: result });
      } catch (error) {
        return json({ 
          remote: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          } 
        });
      }

    case 'config':
      const ghosty = new GhostyLlamaIndex();
      const config = ghosty.getConfig();
      return json({ 
        config: {
          mode: config.mode,
          model: config.model,
          llmProvider: config.llmProvider,
          hasRemoteEndpoint: !!config.remoteEndpoint,
        }
      });

    default:
      return json({ 
        message: 'Ghosty LlamaIndex API',
        endpoints: [
          'POST / - Chat with Ghosty',
          'GET /?action=health - Health check',
          'GET /?action=test-remote - Test remote connection',
          'GET /?action=config - Get configuration'
        ]
      });
  }
};