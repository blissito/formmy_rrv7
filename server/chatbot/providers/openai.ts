import { AIProvider, ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para OpenAI (API directo)
 */
export class OpenAIProvider extends AIProvider {
  private static readonly SUPPORTED_MODELS = [
    'gpt-5-nano',
    'gpt-5-mini', 
    'gpt-5',
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4',
    'gpt-3.5-turbo'
  ];

  supportsModel(model: string): boolean {
    return OpenAIProvider.SUPPORTED_MODELS.includes(model);
  }

  /**
   * Calcula tokens inteligentemente según el contexto de la conversación
   */
  private calculateSmartTokens(messages: ChatMessage[], model: string): number {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;
    
    // Calcular el contexto total usado en tokens aproximados
    const totalContextTokens = messages.reduce((sum, msg) => sum + Math.ceil(msg.content.length / 4), 0);
    
    // Detectar tipo de consulta
    const isShortQuery = messageLength < 50;
    const isCodeRequest = /código|code|program|script|función|class|method/i.test(lastMessage);
    const isListRequest = /lista|enumera|list|opciones|pasos|steps/i.test(lastMessage);
    const isExplanationRequest = /explica|explain|cómo|how|por qué|why|describe/i.test(lastMessage);
    
    // Base tokens según tipo de consulta
    let baseTokens: number;
    if (isShortQuery) {
      baseTokens = 400; // Respuestas cortas pero con espacio
    } else if (isCodeRequest) {
      baseTokens = 800; // Código necesita más espacio
    } else if (isListRequest) {
      baseTokens = 600; // Listas pueden ser largas
    } else if (isExplanationRequest) {
      baseTokens = 700; // Explicaciones detalladas
    } else {
      baseTokens = 500; // Respuestas generales
    }
    
    // Ajustar según contexto disponible - GPT-5-nano tiene context window más grande
    const maxContextWindow = model.startsWith('gpt-5') ? 32000 : 4096; // GPT-5 tiene 32K context window
    const availableTokens = maxContextWindow - totalContextTokens - 200; // 200 tokens de margen
    
    // Para GPT-5, mínimo 300 tokens para permitir respuestas básicas sin quemar tokens
    const minTokens = model.startsWith('gpt-5') ? 300 : 200;
    
    // Retornar el menor entre baseTokens y tokens disponibles, pero respetando mínimo
    return Math.max(minTokens, Math.min(baseTokens, availableTokens));
  }

  protected getHeaders(): Record<string, string> {
    return {
      ...super.getHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
    };
  }

  /**
   * Convierte mensajes al formato de OpenAI
   */
  private formatMessages(messages: ChatMessage[]): Array<{role: string, content: string}> {
    return messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content
    }));
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    return this.chatCompletionWithRetry(request);
  }

  private async chatCompletionWithRetry(request: ChatRequest, retryCount: number = 0): Promise<ChatResponse> {
    const { model, messages, temperature = 0.7, maxTokens, tools } = request;
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = maxTokens || this.calculateSmartTokens(messages, model);

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    // En retry: temperatura más baja para más consistencia, pero GPT-5 no soporta temperature
    const effectiveTemperature = retryCount > 0 ? 0.1 : temperature;

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      // GPT-5 models no soportan temperature - es un parámetro no compatible
      ...(model.startsWith('gpt-5') ? {} : { temperature: Math.max(0, Math.min(2, effectiveTemperature)) }),
      ...(model.startsWith('gpt-5') ? { max_completion_tokens: smartMaxTokens } : { max_tokens: smartMaxTokens }),
      // Parámetros específicos para GPT-5 según mejores prácticas de la comunidad
      ...(model === 'gpt-5-nano' ? { 
        reasoning_effort: "minimal", // Para respuestas rápidas sin reasoning tokens
        verbosity: "low" // Para respuestas más concisas
      } : {}),
      ...(tools && tools.length > 0 ? { 
        tools: tools.map(tool => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema
          }
        }))
      } : {})
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    const message = result.choices?.[0]?.message;
    
    // Extraer tool calls si existen
    const toolCalls = message?.tool_calls?.map((call: any) => ({
      id: call.id,
      name: call.function?.name,
      input: JSON.parse(call.function?.arguments || '{}')
    })) || [];

    // Generar contenido inteligente basado en contexto
    let content = message?.content || '';
    
    // Si no hay contenido pero hay tool calls, generar respuesta contextual
    if ((!content || content.trim().length === 0) && toolCalls.length > 0) {
      if (retryCount === 0) {
        // Primer intento falló - hacer retry con temperatura baja
        console.log(`🔄 OpenAI retry: Empty response with tools, attempting with lower temperature`);
        return this.chatCompletionWithRetry(request, 1);
      } else {
        // Retry también falló - generar respuesta contextual
        content = this.generateContextualResponse(toolCalls);
      }
    } else if (!content || content.trim().length === 0) {
      // No hay contenido ni tool calls
      if (retryCount === 0) {
        console.log(`🔄 OpenAI retry: Completely empty response, attempting with lower temperature`);
        return this.chatCompletionWithRetry(request, 1);
      } else {
        content = 'Entiendo tu solicitud, pero no puedo proporcionar una respuesta específica en este momento.';
      }
    }

    return {
      content,
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        cachedTokens: result.usage?.prompt_tokens_details?.cached_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      finishReason: result.choices?.[0]?.finish_reason || 'unknown',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
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
    try {
      return await this.chatCompletionStreamAttempt(request);
    } catch (error) {
      console.log('🔄 Streaming failed, falling back to non-streaming with retry:', error.message);
      // Fallback: usar non-streaming con retry y convertir a stream
      const response = await this.chatCompletionWithRetry(request);
      return this.convertResponseToStream(response);
    }
  }

  private convertResponseToStream(response: any): ReadableStream<any> {
    return new ReadableStream({
      start(controller) {
        if (response.content && response.content.trim()) {
          // Simular chunks para el contenido
          const words = response.content.split(' ');
          let wordIndex = 0;
          
          const sendNextChunk = () => {
            if (wordIndex < words.length) {
              const chunk = wordIndex === 0 ? words[wordIndex] : ' ' + words[wordIndex];
              controller.enqueue({ content: chunk });
              wordIndex++;
              setTimeout(sendNextChunk, 50); // 50ms delay entre palabras
            } else {
              controller.close();
            }
          };
          
          sendNextChunk();
        } else {
          controller.close();
        }
      }
    });
  }

  private async chatCompletionStreamAttempt(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { model, messages, temperature = 0.7, maxTokens } = request;
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = maxTokens || this.calculateSmartTokens(messages, model);

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      // GPT-5 models no soportan temperature - es un parámetro no compatible
      ...(model.startsWith('gpt-5') ? {} : { temperature: Math.max(0, Math.min(2, temperature)) }),
      ...(model.startsWith('gpt-5') ? { max_completion_tokens: smartMaxTokens } : { max_tokens: smartMaxTokens }),
      // Parámetros específicos para GPT-5 según mejores prácticas de la comunidad
      ...(model === 'gpt-5-nano' ? { 
        reasoning_effort: "minimal", // Para respuestas rápidas sin reasoning tokens
        verbosity: "low" // Para respuestas más concisas
      } : {}),
      stream: true,
    };

    console.log(`🔍 [OpenAI Request] Model: ${model}, Body:`, JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`🔍 [OpenAI Stream Error] Status: ${response.status}, Response: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';
        let contentReceived = false;
        let timeout: NodeJS.Timeout;

        // Timeout para detectar stream vacío
        timeout = setTimeout(() => {
          if (!contentReceived) {
            controller.error(new Error('Stream timeout: no content received'));
          }
        }, 5000); // 5 segundos timeout

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              clearTimeout(timeout);
              if (!contentReceived) {
                controller.error(new Error('Empty stream: no content received'));
              }
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  clearTimeout(timeout);
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  // console.log(`🔍 [OpenAI Stream] Raw response:`, JSON.stringify(parsed, null, 2));
                  
                  const content = parsed.choices?.[0]?.delta?.content;
                  const finishReason = parsed.choices?.[0]?.finish_reason;
                  
                  // console.log(`🔍 [OpenAI Stream] Content: "${content}", FinishReason: "${finishReason}"`); 
                  
                  if (content) {
                    contentReceived = true;
                    clearTimeout(timeout);
                    controller.enqueue({ content });
                  }
                  
                  if (finishReason) {
                    // console.log(`🔍 [OpenAI Stream] Stream finished with reason: ${finishReason}`); 
                    clearTimeout(timeout);
                    
                    // Detectar respuesta vacía por límite de tokens (problema conocido de GPT-5-nano)
                    if (finishReason === 'length' && !contentReceived) {
                      controller.error(new Error(`GPT-5-nano empty response: finish_reason=${finishReason}, no content received`));
                      return;
                    }
                    
                    // Enviar chunk final con usage data si está disponible
                    if (parsed.usage) {
                      controller.enqueue({
                        content: '',
                        finishReason,
                        usage: {
                          inputTokens: parsed.usage.prompt_tokens || 0,
                          outputTokens: parsed.usage.completion_tokens || 0,
                          cachedTokens: parsed.usage.prompt_tokens_details?.cached_tokens || 0,
                          totalTokens: parsed.usage.total_tokens || 0,
                        }
                      });
                    }
                    
                    controller.close();
                    return;
                  }
                } catch {
                  // Skip malformed JSON
                }
              }
            }
          }
        } catch (error) {
          clearTimeout(timeout);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }
}