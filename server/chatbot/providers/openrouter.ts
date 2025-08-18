import { AIProvider, ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para OpenRouter (múltiples modelos)
 */
export class OpenRouterProvider extends AIProvider {
  // OpenRouter soporta muchos modelos, mejor validar por exclusión
  private static readonly UNSUPPORTED_MODELS = [
    'claude-3-5-sonnet-20241022',
    'claude-3-5-haiku-20241022', 
    'claude-3-haiku-20240307',
    'claude-3-sonnet-20240229',
    'claude-3-opus-20240229'
  ];

  supportsModel(model: string): boolean {
    // OpenRouter soporta casi todos los modelos excepto los de Anthropic directo
    return !OpenRouterProvider.UNSUPPORTED_MODELS.includes(model);
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
    const body = {
      model: request.model,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature || 0.7, // OpenRouter acepta rango más amplio
      max_tokens: request.maxTokens || 150, // EMERGENCIA: Reducir de 1000 a 150
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
    const body = {
      model: request.model,
      messages: this.formatMessages(request.messages),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 150, // EMERGENCIA: Reducir de 1000 a 150
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
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        let buffer = '';
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            
            // Procesar líneas completas del buffer
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Guardar línea incompleta para el próximo chunk

            for (const line of lines) {
              if (line.trim() === '' || !line.startsWith('data: ')) continue;

              const data = line.slice(6).trim();
              
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
                  controller.enqueue({
                    content: '',
                    finishReason: parsed.choices[0].finish_reason,
                    usage: parsed.usage ? {
                      inputTokens: parsed.usage.prompt_tokens || 0,
                      outputTokens: parsed.usage.completion_tokens || 0,
                      totalTokens: parsed.usage.total_tokens || 0,
                    } : undefined,
                  });
                }
              } catch (parseError) {
                console.warn('Failed to parse OpenRouter stream chunk:', parseError);
              }
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