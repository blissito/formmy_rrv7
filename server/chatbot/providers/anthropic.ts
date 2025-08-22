import { AIProvider, ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para Anthropic Claude (API directo)
 */
export class AnthropicProvider extends AIProvider {
  private static readonly SUPPORTED_MODELS = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022',
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ];

  supportsModel(model: string): boolean {
    return AnthropicProvider.SUPPORTED_MODELS.includes(model);
  }

  /**
   * Calcula tokens inteligentemente según el contexto (optimizado para Anthropic)
   */
  private calculateSmartTokens(messages: ChatMessage[]): number {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;
    
    // Detectar tipo de consulta (Anthropic es muy eficiente)
    const isShortQuery = messageLength < 50;
    const isCodeRequest = /código|code|program|script|función|class|method/i.test(lastMessage);
    const isListRequest = /lista|enumera|list|opciones|pasos|steps/i.test(lastMessage);
    const isExplanationRequest = /explica|explain|cómo|how|por qué|why|describe/i.test(lastMessage);
    
    // Anthropic es más eficiente en tokens, puede permitir más
    if (isShortQuery) {
      return 300; // Respuestas cortas con margen generoso
    } else if (isCodeRequest) {
      return 700; // Código con espacio amplio
    } else if (isListRequest) {
      return 450; // Listas detalladas
    } else if (isExplanationRequest) {
      return 500; // Explicaciones completas
    } else {
      return 400; // Respuestas generales amplias
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      ...super.getHeaders(),
      'x-api-key': this.config.apiKey,
      'anthropic-version': '2023-06-01',
    };
  }

  /**
   * Convierte mensajes al formato de Anthropic
   */
  private formatMessages(messages: ChatMessage[]): { 
    system?: string; 
    messages: Array<{role: 'user' | 'assistant', content: string}>; 
  } {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }));

    return {
      system: systemMessage?.content,
      messages: chatMessages
    };
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    return this.chatCompletionWithRetry(request);
  }

  private async chatCompletionWithRetry(request: ChatRequest, retryCount: number = 0): Promise<ChatResponse> {
    const { system, messages } = this.formatMessages(request.messages);
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);
    
    // En retry: temperatura más baja para más consistencia
    // Anthropic recomienda temperature=1 como default (2025)
    const baseTemperature = request.temperature ?? 1.0;
    const effectiveTemperature = retryCount > 0 ? 0.1 : baseTemperature;
    
    const body = {
      model: request.model,
      max_tokens: smartMaxTokens,
      temperature: this.normalizeTemperature(effectiveTemperature),
      ...(system && { system }),
      messages,
      ...(request.tools && request.tools.length > 0 && { tools: request.tools }),
    };

    console.log(`🔍 [Anthropic Request] Model: ${request.model}, Body:`, JSON.stringify(body, null, 2));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    
    // Extraer contenido de texto
    let textContent = result.content?.find((c: any) => c.type === 'text')?.text || '';
    
    // Extraer tool calls si existen
    const toolCalls = result.content?.filter((c: any) => c.type === 'tool_use').map((tool: any) => ({
      name: tool.name,
      input: tool.input,
      id: tool.id
    })) || [];
    
    // Si no hay contenido pero hay tool calls, generar respuesta contextual
    if ((!textContent || textContent.trim().length === 0) && toolCalls.length > 0) {
      if (retryCount === 0) {
        // Primer intento falló - hacer retry con temperatura baja
        console.log(`🔄 Anthropic retry: Empty response with tools, attempting with lower temperature`);
        return this.chatCompletionWithRetry(request, 1);
      } else {
        // Retry también falló - generar respuesta contextual
        textContent = this.generateContextualResponse(toolCalls);
      }
    } else if (!textContent || textContent.trim().length === 0) {
      // No hay contenido ni tool calls
      if (retryCount === 0) {
        console.log(`🔄 Anthropic retry: Completely empty response, attempting with lower temperature`);
        return this.chatCompletionWithRetry(request, 1);
      } else {
        textContent = 'Entiendo tu solicitud, pero no puedo proporcionar una respuesta específica en este momento.';
      }
    }
    
    return {
      content: textContent,
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
      },
      model: request.model,
      provider: this.name,
      finishReason: result.stop_reason,
      ...(toolCalls.length > 0 && { toolCalls }),
    };
  }

  private generateContextualResponse(toolCalls: any[]): string {
    if (toolCalls.length === 0) return 'Procesando tu solicitud...';
    
    const toolCall = toolCalls[0];
    
    switch (toolCall.name) {
      case 'create_payment_link':
        return 'Perfecto, voy a generar tu link de pago ahora mismo.';
      case 'schedule_reminder':
        return 'Entendido, procediendo a programar tu recordatorio.';
      case 'schedule_appointment':
        return 'Entendido, procediendo a agendar tu cita.';
      case 'search_knowledge':
        return 'Buscando la información que necesitas...';
      default:
        return 'Procesando tu solicitud, un momento por favor.';
    }
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { system, messages } = this.formatMessages(request.messages);
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);
    
    const body = {
      model: request.model,
      max_tokens: smartMaxTokens,
      temperature: this.normalizeTemperature(request.temperature ?? 1.0), // Anthropic default 2025
      stream: true,
      ...(system && { system }),
      messages,
      ...(request.tools && request.tools.length > 0 && { tools: request.tools }),
    };

    console.log(`🔍 [Anthropic Stream] Model: ${request.model}, Body:`, JSON.stringify(body, null, 2));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic streaming error: ${response.status} - ${error}`);
    }

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        if (!response.body) {
          controller.error(new Error('No response body'));
          return;
        }

        // Usar TransformStream con TextDecoderStream para manejo correcto de UTF-8
        const textStream = response.body
          .pipeThrough(new TextDecoderStream())
          .pipeThrough(
            new TransformStream({
              start() {
                this.buffer = '';
              },
              transform(chunk, controller) {
                this.buffer += chunk;
                const events = this.buffer.split('\n\n'); // Anthropic usa doble salto para separar eventos
                this.buffer = events.pop() || '';

                for (const event of events) {
                  if (event.trim()) {
                    controller.enqueue(event.trim());
                  }
                }
              },
              flush(controller) {
                if (this.buffer.trim()) {
                  controller.enqueue(this.buffer.trim());
                }
              }
            })
          );

        const reader = textStream.getReader();
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            // Procesar eventos de Server-Sent Events (formato de Anthropic)
            const lines = value.split('\n');
            let eventData = '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                eventData = line.slice(6).trim();
                break;
              }
            }

            if (!eventData) continue;

            if (eventData === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(eventData);
              
              // Anthropic envía diferentes tipos de eventos en su streaming
              if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                controller.enqueue({
                  content: parsed.delta.text,
                });
              }
              
              // Manejar fin del stream
              else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                console.log(`🏁 Anthropic stream finished with reason: ${parsed.delta.stop_reason}`);
                controller.enqueue({
                  content: '',
                  finishReason: parsed.delta.stop_reason,
                  usage: parsed.usage ? {
                    inputTokens: parsed.usage.input_tokens || 0,
                    outputTokens: parsed.usage.output_tokens || 0,
                    totalTokens: (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0),
                  } : undefined,
                });
                controller.close();
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse Anthropic stream chunk:', eventData, parseError);
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
  }
}