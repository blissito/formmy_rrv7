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
    const { system, messages } = this.formatMessages(request.messages);
    
    const body = {
      model: request.model,
      max_tokens: request.maxTokens || 1000,
      temperature: this.normalizeTemperature(request.temperature || 0.7),
      ...(system && { system }),
      messages,
    };

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
    
    return {
      content: result.content?.[0]?.text || '',
      usage: {
        inputTokens: result.usage?.input_tokens || 0,
        outputTokens: result.usage?.output_tokens || 0,
        totalTokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0),
      },
      model: request.model,
      provider: this.name,
      finishReason: result.stop_reason,
    };
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { system, messages } = this.formatMessages(request.messages);
    
    const body = {
      model: request.model,
      max_tokens: request.maxTokens || 1000,
      temperature: this.normalizeTemperature(request.temperature || 0.7),
      stream: true,
      ...(system && { system }),
      messages,
    };

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
              if (line.trim() === '' || line.startsWith('event:')) continue;

              let data: string;
              if (line.startsWith('data: ')) {
                data = line.slice(6).trim();
              } else if (line.startsWith('{')) {
                data = line.trim();
              } else {
                continue;
              }

              if (data === '[DONE]') {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                
                // Manejar eventos de contenido
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  console.log(`🤖 Anthropic chunk: "${parsed.delta.text}"`);
                  controller.enqueue({
                    content: parsed.delta.text,
                  });
                }
                
                // Manejar fin del mensaje
                else if (parsed.type === 'message_delta' && parsed.delta?.stop_reason) {
                  controller.enqueue({
                    content: '',
                    finishReason: parsed.delta.stop_reason,
                    usage: parsed.usage ? {
                      inputTokens: parsed.usage.input_tokens || 0,
                      outputTokens: parsed.usage.output_tokens || 0,
                      totalTokens: (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0),
                    } : undefined,
                  });
                }
              } catch (parseError) {
                console.warn('Failed to parse Anthropic stream chunk:', parseError);
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