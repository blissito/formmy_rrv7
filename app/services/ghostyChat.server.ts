import { getWebSearchBetaService } from "~/tools/webSearchBeta.server";
import type { SearchResponse } from "~/tools/types";
import { DEFAULT_AI_MODEL } from "~/utils/aiModels";

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
export async function callGhostyOpenRouter(
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
    try {
      const searchService = await getWebSearchBetaService();
      searchResults = await searchService.search(message, 5);
      
      if (searchResults && searchResults.results.length > 0) {
        searchContext = searchService.formatForLLM(searchResults);
      } else {
        searchResults = { query: message, timestamp: new Date().toISOString(), results: [] };
        searchContext = '';
      }
    } catch (searchError) {
      searchResults = { query: message, timestamp: new Date().toISOString(), results: [] };
      searchContext = '';
    }
  }
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required - no simulations allowed");
  }

  const systemPrompt = searchContext && searchContext.length > 0
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

${searchContext && searchContext.length === 0 ? '**NOTA**: Se intentó realizar una búsqueda web pero no se encontraron resultados relevantes.' : ''}

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
    model: DEFAULT_AI_MODEL,
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