import { getUnifiedWebSearchService } from "~/tools/webSearchUnified.server";
import { getModelForPlan } from "~/utils/aiModels";
import { action as fetchWebsiteAction } from "~/routes/api.v1.fetch-website";
import { createProviderManager } from "server/chatbot/apiUtils.server";
import type { ChatMessage } from "server/chatbot/providers/types";

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
      name: "web_fetch",
      description: "Obtiene el contenido completo de una página web específica. Úsala cuando necesites leer el contenido detallado de un sitio web, artículo, documentación específica, o cualquier URL.",
      parameters: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description: "La URL completa del sitio web a obtener (debe incluir http:// o https://)"
          }
        },
        required: ["url"]
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
  },
  {
    type: "function",
    function: {
      name: "generate_payment_link",
      description: "Genera un link de pago de Stripe usando la integración configurada del chatbot. Úsala cuando el usuario solicite crear un cobro, factura, o link de pago para productos/servicios.",
      parameters: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Monto a cobrar en la moneda especificada (ej: 100 para $100 MXN)"
          },
          description: {
            type: "string", 
            description: "Descripción del producto o servicio a cobrar"
          },
          currency: {
            type: "string",
            description: "Código de moneda (mxn, usd, etc)",
            default: "mxn"
          }
        },
        required: ["amount", "description"]
      }
    }
  }
];

/**
 * Ejecuta las herramientas llamadas por el modelo
 */
async function executeToolCalls(toolCalls: ToolCall[]): Promise<{ 
  toolResults: any[], 
  searchSources?: any[] 
}> {
  const toolResults = [];
  let searchSources: any[] | undefined;
  
  for (const toolCall of toolCalls) {
    const args = JSON.parse(toolCall.function.arguments);
    
    switch (toolCall.function.name) {
      case "web_search": {
        console.log(`🔧 Modelo solicitó herramientas: [ 'web_search' ]`);
        try {
          const searchService = await getUnifiedWebSearchService();
          const searchResults = await searchService.search(
            args.query, 
            args.num_results || 5
          );
          
          // Solo proceder si hay resultados
          if (searchResults && searchResults.results && searchResults.results.length > 0) {
            // Guardar las fuentes para el frontend
            searchSources = searchResults.results.map(r => ({
              title: r.title,
              url: r.url,
              snippet: r.snippet,
            }));
            
            toolResults.push({
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
          } else {
            // No hay resultados - devolver mensaje informativo
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "web_search",
              content: JSON.stringify({
                query: args.query,
                results: [],
                error: "No se pudieron obtener resultados de búsqueda en este momento. El servicio podría estar temporalmente limitado."
              })
            });
          }
        } catch (searchError) {
          console.error("Error en web_search:", searchError);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "web_search",
            content: JSON.stringify({
              query: args.query,
              results: [],
              error: "La búsqueda web no está disponible temporalmente. Responderé basándome en mi conocimiento general."
            })
          });
        }
        break;
      }

      case "web_fetch": {
        console.log(`🔧 Modelo solicitó herramientas: [ 'web_fetch' ]`);
        try {
          // Llamar directamente a la función en lugar de HTTP request
          const mockRequest = {
            method: 'POST',
            json: async () => ({ url: args.url })
          } as any;

          const response = await fetchWebsiteAction({ request: mockRequest });
          
          if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status}`);
          }
          
          const fetchData = await response.json();
          
          if (fetchData.error) {
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "web_fetch",
              content: JSON.stringify({
                error: fetchData.error,
                url: args.url
              })
            });
          } else {
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "web_fetch",
              content: JSON.stringify({
                url: args.url,
                content: fetchData.content,
                routes: fetchData.routes
              })
            });
          }
        } catch (error) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool", 
            name: "web_fetch",
            content: JSON.stringify({
              error: error instanceof Error ? error.message : 'Unknown error',
              url: args.url
            })
          });
        }
        break;
      }
      
      case "get_user_data": {
        // Aquí iría la lógica real para obtener datos del usuario
        toolResults.push({
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

      case "generate_payment_link": {
        console.log(`🔧 Modelo solicitó herramientas: [ 'generate_payment_link' ]`);
        try {
          const { amount, description, currency = 'mxn' } = args;
          
          // Obtener la integración de Stripe activa para este chatbot
          const { getActiveStripeIntegration } = await import("server/chatbot/integrationModel.server");
          const stripeIntegration = await getActiveStripeIntegration(chatbotId);
          
          if (!stripeIntegration || !stripeIntegration.stripeApiKey) {
            toolResults.push({
              tool_call_id: toolCall.id,
              role: "tool",
              name: "generate_payment_link",
              content: JSON.stringify({
                success: false,
                error: "No hay integración de Stripe configurada o activa",
                suggestion: "Configura tu integración de Stripe en las configuraciones del chatbot"
              })
            });
            break;
          }
          
          // Importar la función de pagos
          const { createQuickPaymentLink } = await import("server/integrations/stripe-payments");
          
          const paymentUrl = await createQuickPaymentLink(
            stripeIntegration.stripeApiKey,
            amount,
            description,
            currency
          );

          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "generate_payment_link",
            content: JSON.stringify({
              success: true,
              payment_url: paymentUrl,
              amount: amount,
              currency: currency.toUpperCase(),
              description: description,
              formatted_amount: new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: currency.toUpperCase(),
              }).format(amount)
            })
          });
        } catch (error) {
          console.error("Error generating payment link:", error);
          toolResults.push({
            tool_call_id: toolCall.id,
            role: "tool",
            name: "generate_payment_link",
            content: JSON.stringify({
              success: false,
              error: error instanceof Error ? error.message : 'Error generating payment link',
              suggestion: "Verifica que la integración de Stripe esté correctamente configurada"
            })
          });
        }
        break;
      }
      
      default:
        toolResults.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: JSON.stringify({
            error: `Herramienta desconocida: ${toolCall.function.name}`
          })
        });
    }
  }
  
  return { toolResults, searchSources };
}

/**
 * Llama a GPT-OSS-120B con capacidades de herramientas nativas
 */
export async function callGhostyWithTools(
  message: string,
  enableTools: boolean = true,
  onChunk?: (chunk: string) => void,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<{ content: string; toolsUsed?: string[]; sources?: any[] }> {
  // Usar GPT-5 nano para Ghosty (plan PRO por defecto)
  const selectedModel = getModelForPlan('PRO'); // Esto retorna gpt-5-nano
  console.log("🤖 Ghosty usando modelo:", selectedModel);
  
  // Crear provider manager con las API keys disponibles
  const providerManager = createProviderManager(
    process.env.ANTHROPIC_API_KEY,
    process.env.OPENROUTER_API_KEY,
    process.env.CHATGPT_API_KEY
  );
  
  if (!providerManager) {
    console.error("❌ No AI providers configured");
    throw new Error("AI providers are required");
  }

  // Construir el array de mensajes con el historial de conversación
  const systemMessage: ChatMessage = {
    role: "system",
    content: `Eres Ghosty 👻, asistente inteligente de Formmy.

**CONTEXTO IMPORTANTE DE ROLES**:
- El usuario que te habla es el DUEÑO del negocio/empresa que usa Formmy
- Tú eres SU asistente personal para ayudarle a gestionar su negocio
- Cuando generes links de pago, son para que ÉL cobre a SUS clientes
- Habla en segunda persona dirigiéndote al dueño del negocio

**CAPACIDADES ESPECIALES**:
- Tienes acceso a herramientas que puedes usar automáticamente
- Puedes buscar información actualizada en la web
- Puedes acceder a datos del usuario (cuando estén disponibles)
- Puedes generar links de pago de Stripe para que cobres a tus clientes

**PATRÓN DE USO DE HERRAMIENTAS**:
1. Cuando necesites información actualizada, usa las herramientas disponibles
2. Después de usar herramientas, SIEMPRE proporciona una respuesta final completa
3. En tu respuesta final:
   - Incorpora los resultados de forma natural en español
   - Cita las fuentes como [1], [2], etc.
   - Usa markdown para mejor legibilidad
   - Sé conciso pero completo (máximo 300 palabras)

**REGLAS**:
- USA las herramientas cuando sea necesario, no adivines
- Sé transparente y narra tus acciones
- Mantén un tono conversacional y profesional
- Habla como asistente del dueño del negocio

**FORMATO**:
- Respuestas concisas y útiles
- Usa markdown para mejor legibilidad
- Máximo 300 palabras por respuesta`
  };

  // Si hay historial de conversación, usarlo; si no, crear array nuevo
  const messages: ChatMessage[] = conversationHistory && conversationHistory.length > 0
    ? [
        systemMessage,
        ...conversationHistory.map(msg => ({
          role: msg.role as "system" | "user" | "assistant",
          content: msg.content
        })),
        { role: "user" as const, content: message }
      ]
    : [systemMessage, { role: "user" as const, content: message }];

  const toolsUsed: string[] = [];
  let allSources: any[] = [];

  // Preparar herramientas para el provider
  const tools = enableTools ? AVAILABLE_TOOLS.map(tool => ({
    name: tool.function.name,
    description: tool.function.description,
    input_schema: tool.function.parameters
  })) : [];

  try {
    // Primera llamada: con herramientas si están habilitadas
    if (enableTools && tools.length > 0) {
      console.log("🔧 Llamando con herramientas disponibles:", tools.map(t => t.name));
      
      const toolResponse = await providerManager.chatCompletion({
        model: selectedModel,
        messages,
        temperature: 0.7,
        maxTokens: 2000,
        tools
      });
      
      // Si el modelo usó herramientas
      if (toolResponse.toolCalls && toolResponse.toolCalls.length > 0) {
        console.log("🔧 Modelo solicitó herramientas:", toolResponse.toolCalls.map(tc => tc.name));
        
        // Notificar que estamos ejecutando herramientas
        if (onChunk) {
          onChunk("🔍 Buscando información actualizada en la web...\n\n");
        }
        
        // Ejecutar las herramientas
        const toolCallsForExecution = toolResponse.toolCalls.map(tc => ({
          id: tc.id,
          type: "function" as const,
          function: {
            name: tc.name,
            arguments: JSON.stringify(tc.input)
          }
        }));
        
        const { toolResults, searchSources } = await executeToolCalls(toolCallsForExecution);
        
        if (searchSources) {
          allSources = [...allSources, ...searchSources];
        }
        
        // Registrar herramientas usadas
        toolResponse.toolCalls.forEach(tc => toolsUsed.push(tc.name));
        
        // Agregar respuesta del asistente con tool calls y los resultados
        const updatedMessages: ChatMessage[] = [
          ...messages,
          { role: "assistant" as const, content: toolResponse.content || "" },
          ...toolResults.map(tr => ({
            role: "assistant" as const,
            content: tr.content
          }))
        ];
        
        // Segunda llamada: obtener respuesta final
        console.log("🎯 Obteniendo respuesta final después de herramientas...");
        
        const finalResponse = await providerManager.chatCompletion({
          model: selectedModel,
          messages: updatedMessages,
          temperature: 0.7,
          maxTokens: 2000
        });
        
        // Streaming simulado de la respuesta final
        if (onChunk && finalResponse.content) {
          const words = finalResponse.content.split(' ');
          for (let i = 0; i < words.length; i++) {
            const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
            onChunk(chunk);
            await new Promise(resolve => setTimeout(resolve, 15));
          }
        }
        
        return {
          content: finalResponse.content,
          toolsUsed,
          sources: allSources.length > 0 ? allSources : undefined
        };
      }
    }
    
    // Si no hay herramientas o no se usaron, hacer llamada normal con streaming
    console.log("💬 Llamada directa sin herramientas...");
    
    if (onChunk) {
      // Usar streaming
      const stream = await providerManager.chatCompletionStream({
        model: selectedModel,
        messages,
        temperature: 0.7,
        maxTokens: 2000
      });
      
      let fullContent = '';
      const reader = stream.getReader();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          if (value.content) {
            fullContent += value.content;
            onChunk(value.content);
          }
        }
      } finally {
        reader.releaseLock();
      }
      
      return {
        content: fullContent,
        toolsUsed: [],
        sources: undefined
      };
    } else {
      // Sin streaming
      const response = await providerManager.chatCompletion({
        model: selectedModel,
        messages,
        temperature: 0.7,
        maxTokens: 2000
      });
      
      return {
        content: response.content,
        toolsUsed: [],
        sources: undefined
      };
    }
  } catch (error) {
    console.error("❌ Error en Ghosty:", error);
    throw error;
  }

}