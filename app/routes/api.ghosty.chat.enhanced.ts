import type { Route } from "./+types/api.ghosty.chat.enhanced";
import { getWebSearchService } from "~/tools/webSearchPlaywright.server";

/**
 * VERSIÓN MEJORADA: Aprovecha las capacidades de herramientas nativas de GPT-OSS-120B
 * En lugar de hacer la búsqueda ANTES, le damos la herramienta al modelo para que decida
 */

interface ToolDefinition {
  type: string;
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required: string[];
    };
  };
}

interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: string;
  };
}

/**
 * Define las herramientas disponibles para GPT-OSS-120B
 */
const AVAILABLE_TOOLS: ToolDefinition[] = [
  {
    type: "function",
    function: {
      name: "web_search",
      description: "Busca información actualizada en la web. Úsala cuando necesites información reciente, precios, documentación, o cualquier dato que podría haber cambiado después de tu fecha de corte de conocimiento.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "La consulta de búsqueda a realizar"
          },
          num_results: {
            type: "integer",
            description: "Número de resultados a obtener (1-10)",
            default: 5
          }
        },
        required: ["query"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_user_data",
      description: "Obtiene datos específicos del usuario de Formmy (métricas, configuración, etc)",
      parameters: {
        type: "object",
        properties: {
          data_type: {
            type: "string",
            enum: ["metrics", "chatbots", "forms", "conversations"],
            description: "Tipo de datos a obtener"
          },
          filters: {
            type: "object",
            description: "Filtros opcionales para los datos"
          }
        },
        required: ["data_type"]
      }
    }
  }
];

/**
 * Ejecuta las herramientas llamadas por el modelo
 */
async function executeToolCalls(toolCalls: ToolCall[]): Promise<any[]> {
  const results = [];
  
  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments);
    
    switch (toolCall.function.name) {
      case "web_search": {
        const searchService = await getWebSearchService();
        const searchResults = await searchService.search(
          args.query, 
          args.num_results || 5
        );
        
        results.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "web_search",
          content: JSON.stringify({
            query: searchResults.query,
            results: searchResults.results.map((r, i) => ({
              index: i + 1,
              title: r.title,
              url: r.url,
              snippet: r.snippet,
              content: r.content
            }))
          })
        });
        break;
      }
      
      case "get_user_data": {
        // Aquí iría la lógica real para obtener datos del usuario
        results.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: "get_user_data",
          content: JSON.stringify({
            error: "No hay datos reales disponibles en modo demo",
            suggestion: "Para datos reales, conecta tu cuenta de Formmy"
          })
        });
        break;
      }
      
      default:
        results.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify({
            error: `Herramienta desconocida: ${toolCall.function.name}`
          })
        });
    }
  }
  
  return results;
}

/**
 * Llama a GPT-OSS-120B con capacidades de herramientas nativas
 */
export async function callGhostyWithTools(
  message: string,
  enableTools: boolean = true
): Promise<{ content: string; toolsUsed?: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    return {
      content: "⚠️ API key no configurada. Modo demo activo.",
      toolsUsed: []
    };
  }

  const messages = [
    {
      role: "system",
      content: `Eres Ghosty 👻, asistente inteligente de Formmy.

**CAPACIDADES ESPECIALES**:
- Tienes acceso a herramientas que puedes usar automáticamente
- Puedes buscar información actualizada en la web
- Puedes acceder a datos del usuario (cuando estén disponibles)

**IMPORTANTE**:
- USA las herramientas cuando sea necesario, no adivines
- Si buscas información, SIEMPRE cita las fuentes como [1], [2], etc.
- Sé transparente sobre qué herramientas usaste

**FORMATO**:
- Respuestas concisas y útiles
- Usa markdown para mejor legibilidad
- Máximo 300 palabras por respuesta`
    },
    {
      role: "user",
      content: message
    }
  ];

  const toolsUsed: string[] = [];
  let currentMessages = [...messages];
  let attempts = 0;
  const maxAttempts = 3; // Máximo 3 llamadas (inicial + 2 tool calls)

  while (attempts < maxAttempts) {
    attempts++;
    
    const requestBody: any = {
      model: "openai/gpt-oss-120b",
      messages: currentMessages,
      temperature: 0.7,
      max_tokens: 2000,
    };

    // Solo incluir herramientas en la primera llamada
    if (enableTools && attempts === 1) {
      requestBody.tools = AVAILABLE_TOOLS;
      requestBody.tool_choice = "auto"; // Dejar que el modelo decida
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://formmy.app",
        "X-Title": "Formmy Ghosty Assistant Enhanced",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    
    if (!choice) {
      throw new Error("No response from model");
    }

    // Si el modelo llamó herramientas
    if (choice.message?.tool_calls) {
      console.log("🔧 Modelo solicitó herramientas:", 
        choice.message.tool_calls.map((tc: ToolCall) => tc.function.name)
      );
      
      // Registrar qué herramientas se usaron
      choice.message.tool_calls.forEach((tc: ToolCall) => {
        toolsUsed.push(tc.function.name);
      });

      // Ejecutar las herramientas
      const toolResults = await executeToolCalls(choice.message.tool_calls);
      
      // Agregar la respuesta del modelo y los resultados de las herramientas
      currentMessages.push(choice.message);
      currentMessages.push(...toolResults);
      
      // Continuar el loop para que el modelo procese los resultados
      continue;
    }

    // Si el modelo dio una respuesta final
    if (choice.message?.content) {
      return {
        content: choice.message.content,
        toolsUsed
      };
    }
  }

  return {
    content: "Lo siento, no pude procesar tu solicitud después de varios intentos.",
    toolsUsed
  };
}

/**
 * Endpoint mejorado que aprovecha capacidades nativas del modelo
 */
export const action = async ({ request }: Route.ActionArgs): Promise<Response> => {
  try {
    const body = await request.json();
    const { message } = body;

    if (!message?.trim()) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await callGhostyWithTools(message, true);
    
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