/**
 * Módulo de manejo de respuestas para LlamaIndex V2
 * Maneja streaming y non-streaming de forma limpia
 */

export interface ResponseMetadata {
  chatbotId: string;
  sessionId?: string;
  model: string;
  streaming: boolean;
  timestamp: string;
}

export function createStreamingResponse(v2Response: any): Response {
  console.log('🌊 LlamaIndex v2.0 streaming response');

  const encoder = new TextEncoder();
  const streamResponse = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of v2Response) {
          const data = `data: ${JSON.stringify({ content: chunk })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      } catch (error) {
        console.error('❌ Streaming error:', error);
        controller.error(error);
      }
    }
  });

  return new Response(streamResponse, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive"
    }
  });
}

export function createRegularResponse(v2Response: any, metadata: ResponseMetadata): Response {
  console.log('📦 LlamaIndex v2.0 regular response');

  const response = typeof v2Response === 'string' ? v2Response : v2Response.content;

  return new Response(
    JSON.stringify({
      success: true,
      response: response,
      engine: "llamaindex-v2",
      model: metadata.model,
      streaming: false,
      metadata: {
        chatbotId: metadata.chatbotId,
        sessionId: metadata.sessionId,
        timestamp: metadata.timestamp
      }
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}

export function createErrorResponse(error: any): Response {
  console.error('❌ LlamaIndex v2.0 error:', error);

  return new Response(
    JSON.stringify({
      error: "Error en LlamaIndex V2",
      details: error?.message || "Motor no disponible",
      engine: "llamaindex-v2"
    }),
    { status: 500, headers: { "Content-Type": "application/json" } }
  );
}

export function createValidationError(message: string): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}

export function createUnsupportedIntentError(): Response {
  return new Response(
    JSON.stringify({
      error: "Intent no soportado",
      supportedIntents: ["chat"],
      hint: "Solo se soporta intent=chat en LlamaIndex V2"
    }),
    { status: 400, headers: { "Content-Type": "application/json" } }
  );
}