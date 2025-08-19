import { getUnifiedWebSearchService } from "~/tools/webSearchUnified.server";
import { DEFAULT_AI_MODEL } from "~/utils/aiModels";
import { action as fetchWebsiteAction } from "~/routes/api.v1.fetch-website";

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
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.error("❌ OPENROUTER_API_KEY not found in environment");
    throw new Error("OPENROUTER_API_KEY is required - no simulations allowed");
  }
  
  console.log("🔑 API Key found, length:", apiKey.length);
  console.log("🔑 API Key prefix:", apiKey.substring(0, 10) + "...");

  // Construir el array de mensajes con el historial de conversación
  const systemMessage = {
    role: "system",
    content: `Eres Ghosty 👻, asistente inteligente de Formmy.

**CAPACIDADES ESPECIALES**:
- Tienes acceso a herramientas que puedes usar automáticamente
- Puedes buscar información actualizada en la web
- Puedes acceder a datos del usuario (cuando estén disponibles)
- Puedes generar links de pago de Stripe cuando el usuario lo solicite

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
- Mantén un tono conversacional

**FORMATO**:
- Respuestas concisas y útiles
- Usa markdown para mejor legibilidad
- Máximo 300 palabras por respuesta`
  };

  // Si hay historial de conversación, usarlo; si no, crear array nuevo
  const messages = conversationHistory && conversationHistory.length > 0
    ? [systemMessage, ...conversationHistory, { role: "user", content: message }]
    : [systemMessage, { role: "user", content: message }];

  const toolsUsed: string[] = [];
  let currentMessages = [...messages];
  let attempts = 0;
  const maxAttempts = 2; // Solo 2 llamadas: inicial con tools + final sin tools
  let allSources: any[] = [];

  while (attempts < maxAttempts) {
    attempts++;
    
    // Solo usar streaming en la ÚLTIMA llamada (cuando no esperamos más tool calls)
    const shouldStream = !!onChunk && attempts > 1;
    
    const requestBody: any = {
      model: DEFAULT_AI_MODEL,
      messages: currentMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: shouldStream,
    };

    // Incluir herramientas solo si están habilitadas
    if (enableTools) {
      requestBody.tools = AVAILABLE_TOOLS;
      requestBody.tool_choice = "auto"; // Dejar que el modelo decida
      // OpenRouter no puede hacer streaming Y tool calls simultáneamente
      requestBody.stream = false; // Siempre no-streaming cuando hay tools
    }

    console.log("🚀 Sending request to OpenRouter...");
    console.log("📊 Request body preview:", JSON.stringify({
      model: requestBody.model,
      messagesCount: requestBody.messages.length,
      hasTools: !!requestBody.tools,
      stream: requestBody.stream,
      temperature: requestBody.temperature
    }));
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("⏰ Request timeout after 30s");
      controller.abort();
    }, 30000);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://formmy.app",
        "X-Title": "Formmy Ghosty Assistant Enhanced",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    console.log("✅ Response received, status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error ${response.status}:`, errorText);
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    // Verificar el Content-Type para determinar si es streaming o JSON
    const contentType = response.headers.get('content-type');
    console.log(`🔍 Response content-type: ${contentType}, attempt: ${attempts}, stream requested: ${requestBody.stream}`);
    
    const isStreamingResponse = contentType?.includes('text/event-stream') || 
                                (requestBody.stream && attempts > 1);
    
    if (isStreamingResponse) {
      console.log('📡 Processing streaming response...');
      // Procesar respuesta streaming (segunda llamada después de tools)
      const streamResult = await handleStreamingResponse(response, onChunk, toolsUsed, allSources);
      // Devolver el resultado final con las fuentes acumuladas
      return {
        ...streamResult,
        sources: allSources.length > 0 ? allSources : streamResult.sources
      };
    }

    // Procesar respuesta JSON (primera llamada con tools o sin streaming)
    console.log('📦 Processing JSON response...');
    let data;
    try {
      const responseText = await response.text();
      console.log('📄 Response text length:', responseText.length);
      console.log('📄 Response text preview:', responseText.substring(0, 200));
      
      if (!responseText || responseText.trim().length === 0) {
        console.error('❌ Empty response from OpenRouter');
        throw new Error('Empty response from OpenRouter API');
      }
      
      data = JSON.parse(responseText);
      console.log('✅ JSON parsed successfully');
      console.log('📊 Choices available:', data.choices?.length || 0);
      
      if (data.error) {
        console.error('❌ OpenRouter API error:', data.error);
        throw new Error(`OpenRouter API error: ${JSON.stringify(data.error)}`);
      }
      
    } catch (parseError) {
      console.error('❌ Failed to parse JSON response:', parseError);
      console.error('❌ Response status:', response.status);
      console.error('❌ Response headers:', Object.fromEntries(response.headers.entries()));
      throw new Error(`Failed to parse OpenRouter response: ${parseError}`);
    }
    
    const choice = data.choices?.[0];
    
    if (!choice) {
      throw new Error("No response from model");
    }

    // Si el modelo llamó herramientas
    if (choice?.message?.tool_calls && attempts === 1) {
      console.log("🔧 Modelo solicitó herramientas:", 
        choice.message.tool_calls.map((tc: ToolCall) => tc.function.name)
      );
      
      // Registrar qué herramientas se usaron
      choice.message.tool_calls.forEach((tc: ToolCall) => {
        toolsUsed.push(tc.function.name);
      });

      // Notificar que estamos ejecutando herramientas (si tenemos callback)
      if (onChunk) {
        onChunk("🔍 Buscando información actualizada en la web...\n\n");
      }
      
      // Ejecutar las herramientas
      console.log("🔨 Ejecutando herramientas...");
      const { toolResults, searchSources } = await executeToolCalls(choice.message.tool_calls);
      console.log(`✅ Herramientas ejecutadas. Resultados: ${toolResults.length}, Fuentes: ${searchSources?.length || 0}`);
      
      // Guardar fuentes si hay búsquedas
      if (searchSources) {
        allSources = [...allSources, ...searchSources];
      }
      
      // Agregar la respuesta del modelo y los resultados de las herramientas
      currentMessages.push(choice.message);
      currentMessages.push(...toolResults);
      
      // Forzar al modelo a dar una respuesta final sin herramientas
      console.log(`🎯 Forzando respuesta final sin herramientas...`);
      const finalRequestBody = {
        model: DEFAULT_AI_MODEL,
        messages: currentMessages,
        temperature: 0.7,
        max_tokens: 2000,
        stream: false,
      };

      const finalResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://formmy.app",
          "X-Title": "Formmy Ghosty Assistant Enhanced",
        },
        body: JSON.stringify(finalRequestBody),
      });

      console.log('📊 Final response status:', finalResponse.status);

      if (finalResponse.ok) {
        const finalData = await finalResponse.json();
        const finalChoice = finalData.choices?.[0];
        
        console.log('✅ Final response received, has content:', !!finalChoice?.message?.content);
        console.log('📝 Content length:', finalChoice?.message?.content?.length || 0);
        console.log('🔍 Full finalData structure:', JSON.stringify(finalData, null, 2));
        
        if (finalChoice?.message?.content) {
          const finalContent = finalChoice.message.content;
          console.log('📄 Final content preview:', finalContent.substring(0, 200));
          
          // Si necesitamos streaming para la respuesta final
          if (onChunk) {
            console.log('📡 Streaming final content word by word...');
            const words = finalContent.split(' ');
            
            for (let i = 0; i < words.length; i++) {
              const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
              onChunk(chunk);
              await new Promise(resolve => setTimeout(resolve, 15));
            }
            console.log('✅ Streaming completed');
          } else {
            console.log('⚠️ No onChunk callback provided, content will be returned directly');
          }
          
          return {
            content: finalContent,
            toolsUsed,
            sources: allSources.length > 0 ? allSources : undefined
          };
        } else {
          console.log('⚠️ No content in final response:', JSON.stringify(finalData, null, 2));
        }
      } else {
        const errorText = await finalResponse.text();
        console.error('❌ Final response failed:', finalResponse.status, errorText);
      }
      
      // Fallback si la llamada final falla
      console.log('⚠️ Using fallback response');
      const fallbackContent = "Encontré información relacionada con tu consulta, pero no pude procesar la respuesta final.";
      
      if (onChunk) {
        onChunk(fallbackContent);
      }
      
      return {
        content: fallbackContent,
        toolsUsed,
        sources: allSources.length > 0 ? allSources : undefined
      };
    }

    // Si el modelo dio una respuesta final (sin más tool calls)
    if (choice.message?.content) {
      // Si necesitamos streaming para la respuesta final
      if (onChunk && toolsUsed.length > 0) {
        // Simular streaming de la respuesta ya generada
        const content = choice.message.content;
        const words = content.split(' ');
        
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          onChunk(chunk);
          // Small delay to simulate natural streaming
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
      
      return {
        content: choice.message.content,
        toolsUsed,
        sources: allSources.length > 0 ? allSources : undefined
      };
    }
  }

  return {
    content: "Lo siento, no pude procesar tu solicitud después de varios intentos.",
    toolsUsed,
    sources: allSources.length > 0 ? allSources : undefined
  };
}

/**
 * Handle streaming response from OpenRouter
 */
async function handleStreamingResponse(
  response: Response,
  onChunk: (chunk: string) => void,
  toolsUsed: string[],
  allSources: any[]
): Promise<{ content: string; toolsUsed?: string[]; sources?: any[] }> {
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
            return { 
              content: fullContent, 
              toolsUsed,
              sources: allSources.length > 0 ? allSources : undefined
            };
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;

            if (content) {
              fullContent += content;
              onChunk(content);
            }
          } catch (parseError) {
            // Ignore invalid JSON lines
            console.warn("Enhanced Ghosty: Invalid SSE line:", line);
          }
        }
      }
    }

    return { 
      content: fullContent, 
      toolsUsed,
      sources: allSources.length > 0 ? allSources : undefined
    };
  } finally {
    reader.releaseLock();
  }
}