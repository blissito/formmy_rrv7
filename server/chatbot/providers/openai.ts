import { AIProvider, ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para OpenAI (API directo)
 */
export class OpenAIProvider extends AIProvider {
  private static readonly SUPPORTED_MODELS = [
    'gpt-4o-mini',
    'gpt-4o',
    'gpt-4',
    'gpt-3.5-turbo'
  ];

  supportsModel(model: string): boolean {
    return OpenAIProvider.SUPPORTED_MODELS.includes(model);
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
    const { model, messages, temperature = 0.7, maxTokens = 150 } = request;

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: maxTokens,
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
    
    return {
      content: result.choices?.[0]?.message?.content || 'Sin respuesta',
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      finishReason: result.choices?.[0]?.finish_reason || 'unknown',
    };
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { model, messages, temperature = 0.7, maxTokens = 150 } = request;

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      temperature: Math.max(0, Math.min(2, temperature)),
      max_tokens: maxTokens,
      stream: true,
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

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          controller.error(new Error('No se pudo obtener el stream'));
          return;
        }

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim();
                
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content || '';
                  const finishReason = parsed.choices?.[0]?.finish_reason;

                  if (content) {
                    controller.enqueue({
                      content,
                      finishReason: null,
                    });
                  }

                  if (finishReason) {
                    controller.enqueue({
                      content: '',
                      finishReason,
                    });
                  }
                } catch (e) {
                  // Ignorar errores de parsing de chunks individuales
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }
}