import type { ActionFunctionArgs } from "@remix-run/node";
import { WebSearchService } from "~/tools/webSearch.server";
import { getWebSearchService, cleanupWebSearchService } from "~/tools/webSearchPlaywright.server";
import type { SearchResponse } from "~/tools/types";

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
 * Determina si el mensaje requiere búsqueda web basándose en el contexto del chat
 */
function shouldPerformSearch(
  message: string, 
  history: GhostyChatRequest['history'] = []
): boolean {
  const searchKeywords = [
    'busca', 'búsqueda', 'encuentra', 'información sobre',
    'qué es', 'cómo', 'cuál', 'cuáles', 'dónde',
    'últimas', 'reciente', 'actual', 'novedades',
    'documentación', 'docs', 'guía', 'tutorial',
    'precio', 'costo', 'plan', 'comparar'
  ];
  
  const lowerMessage = message.toLowerCase();
  const hasSearchKeywords = searchKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // También buscar si es una pregunta de seguimiento que requiere información actualizada
  const followUpIndicators = [
    'y el precio', 'y el costo', 'cuánto cuesta', 'qué tal',
    'y sobre', 'y qué', 'también', 'además'
  ];
  
  const isFollowUp = followUpIndicators.some(indicator => lowerMessage.includes(indicator));
  
  // Si es seguimiento, revisar si la conversación previa mencionó temas que requieren búsqueda
  if (isFollowUp && history.length > 0) {
    const recentMessages = history.slice(-4).map(h => h.content.toLowerCase()).join(' ');
    const hasSearchableContext = searchKeywords.some(keyword => recentMessages.includes(keyword));
    return hasSearchableContext;
  }
  
  return hasSearchKeywords;
}

/**
 * OpenRouter API call specifically for Ghosty with openai/gpt-oss-120b
 */
async function callGhostyOpenRouter(
  message: string,
  history: GhostyChatRequest['history'] = [],
  stream: boolean = false,
  onChunk?: (chunk: string) => void,
  enableSearch: boolean = true
): Promise<{ content: string; sources?: SearchResponse }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  // Realizar búsqueda web si es necesario
  let searchResults: SearchResponse | undefined;
  let searchContext = '';
  
  if (enableSearch && shouldPerformSearch(message, history)) {
    console.log(`🔍 Realizando búsqueda para: "${message}"`);
    try {
      // Intentar usar Playwright primero
      const playwrightService = await getWebSearchService();
      searchResults = await playwrightService.search(message, 5);
      
      // Si Playwright no devuelve resultados, usar búsqueda básica REAL
      if (!searchResults || searchResults.results.length === 0) {
        console.log("⚠️ Playwright devolvió 0 resultados, intentando búsqueda básica REAL");
        const searchService = new WebSearchService();
        searchResults = await searchService.search(message, 3);
        // Solo usar mocks si la búsqueda real también falla
        if (!searchResults || searchResults.results.length === 0) {
          console.log("⚠️ Búsqueda básica también falló, usando mocks");
          searchResults = playwrightService.getFallbackResults(message);
        }
        searchContext = searchService.formatForLLM(searchResults);
      } else {
        searchContext = playwrightService.formatForLLM(searchResults);
      }
      
      console.log(`✅ Playwright búsqueda: ${searchResults.results.length} resultados`);
      console.log(`📝 Contexto generado (primeros 200 chars): ${searchContext.substring(0, 200)}...`);
    } catch (playwrightError) {
      console.warn("Playwright search failed, falling back to basic search:", playwrightError);
      // Fallback a búsqueda básica
      const searchService = new WebSearchService();
      searchResults = await searchService.search(message, 3);
      searchContext = searchService.formatForLLM(searchResults);
      console.log(`✅ Basic búsqueda exitosa: ${searchResults.results.length} resultados`);
      console.log(`📝 Contexto generado (primeros 200 chars): ${searchContext.substring(0, 200)}...`);
    }
  } else {
    console.log(`❌ No se realizará búsqueda para: "${message}"`);
    console.log(`   enableSearch: ${enableSearch}, shouldPerformSearch: ${shouldPerformSearch(message, history)}`);
  }
  
  if (!apiKey) {
    // Fallback simulado para desarrollo con búsqueda
    console.warn("OPENROUTER_API_KEY not configured, using simulated response");
    const response = await simulateGhostyResponse(message, stream, onChunk);
    
    
    return { ...response, sources: searchResults };
  }

  const systemPrompt = searchContext 
    ? `Eres Ghosty 👻, asistente de Formmy con capacidad de búsqueda web.

**CONTEXTO DE BÚSQUEDA WEB REALIZADA**:
${searchContext}

**MUY IMPORTANTE**: 
- YA SE REALIZÓ LA BÚSQUEDA WEB - no necesitas simular browsing
- Las fuentes anteriores son REALES y están disponibles para usar
- Cuando uses información de las fuentes, SIEMPRE cítalas con [1], [2], [3]
- Prioriza información de las fuentes sobre conocimiento general
- Si las fuentes contradicen tu conocimiento, usa las fuentes

**REGLAS**:
- Nunca digas "no puedo browsear" - ya tienes los resultados de búsqueda
- Nunca inventes datos del usuario
- Sé honesto sobre qué tienes y qué no
- Usa las fuentes web para dar información actualizada
- Máximo 200 palabras + referencias

**FORMATO**:
- Usa markdown
- Cita fuentes como [1], [2], [3] en el texto
- NO listes las fuentes al final - se mostrarán automáticamente`
    : `Eres Ghosty 👻, asistente de Formmy. 

**REGLA DE ORO**: Nunca inventes datos específicos del usuario. SÉ HONESTO sobre qué tienes y qué no.

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

**TONO**: Honesto, útil, conciso. Emojis moderados.`;

  console.log(`📋 System prompt incluye búsqueda: ${!!searchContext}`);
  if (searchContext) {
    console.log(`📝 Contexto de búsqueda length: ${searchContext.length} caracteres`);
  }

  // Construir historial de mensajes para el contexto
  const messages = [
    {
      role: "system" as const,
      content: systemPrompt
    }
  ];

  // Agregar historial previo (últimos 10 mensajes para no saturar el contexto)
  const recentHistory = (history || []).slice(-10);
  for (const historyMessage of recentHistory) {
    messages.push({
      role: historyMessage.role as "user" | "assistant",
      content: historyMessage.content
    });
  }

  // Agregar el mensaje actual
  messages.push({
    role: "user" as const,
    content: message
  });

  const requestBody = {
    model: "openai/gpt-oss-120b",
    messages,
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
    const result = await handleStreamingResponse(response, onChunk);
    
    
    return { ...result, sources: searchResults };
  } else {
    // Handle regular response
    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "Lo siento, no pude generar una respuesta.";
    
    
    return {
      content,
      sources: searchResults
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

// Cleanup en shutdown
if (typeof process !== 'undefined') {
  process.on('SIGINT', async () => {
    await cleanupWebSearchService();
    process.exit();
  });
  
  process.on('SIGTERM', async () => {
    await cleanupWebSearchService();
    process.exit();
  });
}