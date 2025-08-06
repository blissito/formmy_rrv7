import type { ActionFunctionArgs } from "@remix-run/node";

interface GhostyChatRequest {
  message: string;
  stream?: boolean;
}

/**
 * Simulate Ghosty response for development when API key is not available
 */
async function simulateGhostyResponse(
  message: string,
  stream: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<{ content: string }> {
  const responses = [
    `¡Hola! 👋 Soy **Ghosty**, tu asistente de Formmy.

| Área | Qué puedo hacer | Cómo te ayudo |
|------|----------------|---------------|
| 🤖 Chatbots | Configurar respuestas automáticas | Guías paso a paso, plantillas |
| 📄 Formularios | Optimizar conversión y UX | Análisis de campos, mejoras |  
| 📊 Métricas | Generar reportes y análisis | Dashboards, alertas, insights |
| 🛠️ Problemas | Resolver errores técnicos | Diagnóstico rápido, soluciones |

¿En qué necesitas ayuda específicamente?`,

    `Sobre **"${message}"** te puedo ayudar con:

### 🎯 Opciones rápidas:
- **Configuración**: Te guío paso a paso
- **Métricas**: Explico cómo interpretarlas  
- **Técnico**: Doy soluciones directas

### ⚡ Siguiente paso:
Dame más contexto de tu proyecto y te doy una respuesta específica.

*Modo demo activo - pronto acceso a datos reales.*`,

    `Para **"${message}"**, no tengo tus datos reales, pero puedo ayudarte:

| Escenario Típico | Lo que suele pasar | Qué hacer |
|------------------|-------------------|-----------|
| 📊 Sin métricas | No hay tracking | Configuremos analytics |
| 🤖 Bot nuevo | Pocas interacciones | Necesitas más tiempo |
| 📋 Forms complejos | Abandono alto | Simplificar campos |

**¿Te identificas con alguno?** Dame más contexto de tu situación específica.

*Nota: Para análisis precisos necesito acceso a tus datos reales.*`
  ];

  const response = responses[Math.floor(Math.random() * responses.length)];

  if (stream && onChunk) {
    // Simulate streaming
    for (let i = 0; i < response.length; i += 3) {
      const chunk = response.slice(i, i + 3);
      onChunk(chunk);
      await new Promise(resolve => setTimeout(resolve, 30));
    }
  }

  return { content: response };
}

/**
 * OpenRouter API call specifically for Ghosty with openai/gpt-oss-120b
 */
async function callGhostyOpenRouter(
  message: string,
  stream: boolean = false,
  onChunk?: (chunk: string) => void
): Promise<{ content: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    // Fallback simulado para desarrollo
    console.warn("OPENROUTER_API_KEY not configured, using simulated response");
    return simulateGhostyResponse(message, stream, onChunk);
  }

  const requestBody = {
    model: "openai/gpt-oss-120b", // Modelo específico para Ghosty
    messages: [
      {
        role: "system",
        content: `Eres Ghosty 👻, asistente de Formmy. 

**REGLA DE ORO**: Nunca inventes datos específicos del usuario. SÉ HONESTO sobre qué tienes y qué no.

**CUANDO NO TIENES DATOS REALES**:
- ✅ "No tengo acceso a tus datos, PERO basado en chatbots similares..."
- ✅ "Sin datos reales no puedo ser preciso, pero típicamente..."  
- ❌ NUNCA inventes números, métricas o análisis específicos

**AYUDAS CON**:
- 🤖 Configuración de chatbots
- 📄 Optimización de formularios  
- 📊 Análisis (con disclaimer si no hay datos)
- 🛠️ Troubleshooting técnico
- ✨ Funciones de Formmy

**FORMATO**:
- Usa markdown (tablas, listas, **bold**)
- Máximo 200 palabras por respuesta
- Ejemplos concretos cuando sea apropiado
- Disclaimer claro cuando des ejemplos generales

**TONO**: Honesto, útil, conciso. Emojis moderados.`
      },
      {
        role: "user", 
        content: message
      }
    ],
    temperature: 0.7,
    max_tokens: 2000,
    stream: stream,
  };

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://formmy.app",
      "X-Title": "Formmy Ghosty Assistant",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Ghosty OpenRouter error ${response.status}: ${errorText}`);
    throw new Error(`OpenRouter API error: ${errorText}`);
  }

  if (stream) {
    // Handle streaming response
    return await handleStreamingResponse(response, onChunk);
  } else {
    // Handle regular response
    const data = await response.json();
    return {
      content: data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.",
    };
  }
}

/**
 * Handle streaming response from OpenRouter
 */
async function handleStreamingResponse(
  response: Response,
  onChunk?: (chunk: string) => void
): Promise<{ content: string }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body stream");
  }

  const decoder = new TextDecoder();
  let fullContent = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      buffer += chunk;

      // Process complete lines
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6); // Remove "data: "

          if (data === "[DONE]") {
            return { content: fullContent };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;
              if (onChunk) {
                onChunk(content);
              }
            }
          } catch (parseError) {
            // Ignore invalid JSON lines
            console.warn("Ghosty: Invalid SSE line:", line);
          }
        }
      }
    }

    return { content: fullContent };
  } finally {
    reader.releaseLock();
  }
}

/**
 * Ghosty chat endpoint
 */
export const action = async ({ request }: ActionFunctionArgs): Promise<Response> => {
  try {
    // Parse request
    const body: GhostyChatRequest = await request.json();
    const { message, stream = false } = body;

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
              await callGhostyOpenRouter(
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
                }
              );

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
        const response = await callGhostyOpenRouter(message, false);
        return new Response(
          JSON.stringify({
            type: "message",
            content: response.content,
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