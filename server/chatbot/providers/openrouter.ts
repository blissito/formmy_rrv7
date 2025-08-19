import { AIProvider, ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para OpenRouter (múltiples modelos)
 */
export class OpenRouterProvider extends AIProvider {
  // OpenRouter soporta muchos modelos, pero excluimos Anthropic y OpenAI directo
  private static readonly UNSUPPORTED_MODELS = [
    // Anthropic models (usar API directa)
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    // Google/Gemini models (temporal hasta implementar API directo)
    'google/gemini-2.5-flash-lite',
    'google/gemini-flash-1.5',
    // Meta, Mistral y otros terceros
    'meta-llama/llama-2-70b-chat',
    'mistralai/mistral-7b-instruct'
  ];

  supportsModel(model: string): boolean {
    // OpenRouter SOLO para Google/Gemini, Meta, Mistral y otros terceros
    // NO para GPT (usar OpenAI directo) ni Anthropic (usar Anthropic directo)
    return model.startsWith('google/') || 
           model.startsWith('meta-llama/') || 
           model.startsWith('mistralai/') ||
           model.includes('gemini');
  }

  /**
   * Calcula tokens inteligentemente según el contexto (versión conservadora para OpenRouter)
   */
  private calculateSmartTokens(messages: ChatMessage[]): number {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;
    
    // Detectar tipo de consulta (más conservador para modelos de terceros)
    const isShortQuery = messageLength < 50;
    const isCodeRequest = /código|code|program|script|función|class|method/i.test(lastMessage);
    const isListRequest = /lista|enumera|list|opciones|pasos|steps/i.test(lastMessage);
    const isExplanationRequest = /explica|explain|cómo|how|por qué|why|describe/i.test(lastMessage);
    
    // Cálculo más conservador para OpenRouter
    if (isShortQuery) {
      return 150; // Respuestas cortas
    } else if (isCodeRequest) {
      return 400; // Código controlado
    } else if (isListRequest) {
      return 250; // Listas concisas
    } else if (isExplanationRequest) {
      return 300; // Explicaciones breves
    } else {
      return 200; // Respuestas generales más cortas
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      ...super.getHeaders(),
      'Authorization': `Bearer ${this.config.apiKey}`,
      'HTTP-Referer': 'https://formmy.app',
      'X-Title': 'Formmy Chat',
    };
  }

  /**
   * Convierte mensajes al formato OpenAI/OpenRouter
   */
  private formatMessages(messages: ChatMessage[]): Array<{role: string, content: string}> {
    return messages.map(m => ({
      role: m.role,
      content: m.content
    }));
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    // Cálculo inteligente de tokens
    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);
    
    const body = {
      model: request.model,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature || 0.7, // OpenRouter acepta rango más amplio
      max_tokens: smartMaxTokens,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    const choice = result.choices?.[0];
    
    return {
      content: choice?.message?.content || '',
      usage: {
        inputTokens: result.usage?.prompt_tokens || 0,
        outputTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      model: request.model,
      provider: this.name,
      finishReason: choice?.finish_reason,
    };
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    // Cálculo inteligente de tokens
    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);
    
    const body = {
      model: request.model,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature || 0.7,
      max_tokens: smartMaxTokens,
      stream: true,
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter streaming error: ${response.status} - ${error}`);
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
                const lines = this.buffer.split('\n');
                this.buffer = lines.pop() || '';

                for (const line of lines) {
                  if (line.trim() && line.startsWith('data: ')) {
                    controller.enqueue(line);
                  }
                }
              },
              flush(controller) {
                if (this.buffer.trim()) {
                  controller.enqueue(this.buffer);
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

            const data = value.slice(6).trim(); // Remove 'data: '
            
            if (data === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta?.content) {
                controller.enqueue({
                  content: delta.content,
                });
              }

              // Manejar fin del stream
              if (parsed.choices?.[0]?.finish_reason) {
                console.log(`🏁 OpenRouter stream finished with reason: ${parsed.choices[0].finish_reason}`);
                controller.enqueue({
                  content: '',
                  finishReason: parsed.choices[0].finish_reason,
                  usage: parsed.usage ? {
                    inputTokens: parsed.usage.prompt_tokens || 0,
                    outputTokens: parsed.usage.completion_tokens || 0,
                    totalTokens: parsed.usage.total_tokens || 0,
                  } : undefined,
                });
                controller.close();
                return;
              }
            } catch (parseError) {
              console.warn('Failed to parse OpenRouter stream chunk:', data, parseError);
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