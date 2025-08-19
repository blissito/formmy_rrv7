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
  private calculateSmartTokens(messages: ChatMessage[]): number {
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
    
    // Ajustar según contexto disponible (máximo 4096 tokens para GPT-4o mini)
    const maxContextWindow = 4096;
    const availableTokens = maxContextWindow - totalContextTokens - 100; // 100 tokens de margen
    
    // Retornar el menor entre baseTokens y tokens disponibles, pero mínimo 200
    return Math.max(200, Math.min(baseTokens, availableTokens));
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
    const { model, messages, temperature = 0.7, maxTokens, tools } = request;
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = maxTokens || this.calculateSmartTokens(messages);

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      temperature: model === 'gpt-5-nano' ? Math.max(0, Math.min(1, temperature)) : Math.max(0, Math.min(2, temperature)),
      ...(model.startsWith('gpt-5') ? { max_completion_tokens: smartMaxTokens } : { max_tokens: smartMaxTokens }),
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

    return {
      content: message?.content || 'Sin respuesta',
      usage: {
        promptTokens: result.usage?.prompt_tokens || 0,
        completionTokens: result.usage?.completion_tokens || 0,
        totalTokens: result.usage?.total_tokens || 0,
      },
      finishReason: result.choices?.[0]?.finish_reason || 'unknown',
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
    };
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { model, messages, temperature = 0.7, maxTokens } = request;
    
    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = maxTokens || this.calculateSmartTokens(messages);

    if (!this.supportsModel(model)) {
      throw new Error(`Modelo ${model} no soportado por OpenAI provider`);
    }

    const formattedMessages = this.formatMessages(messages);
    const systemMessage = formattedMessages.find(m => m.role === 'system');
    const conversationMessages = formattedMessages.filter(m => m.role !== 'system');

    const requestBody = {
      model,
      messages: systemMessage ? [systemMessage, ...conversationMessages] : conversationMessages,
      temperature: model === 'gpt-5-nano' ? Math.max(0, Math.min(1, temperature)) : Math.max(0, Math.min(2, temperature)),
      ...(model.startsWith('gpt-5') ? { max_completion_tokens: smartMaxTokens } : { max_tokens: smartMaxTokens }),
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
        if (!reader) {
          controller.error(new Error('No response body'));
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.close();
                  return;
                }

                try {
                  const parsed = JSON.parse(data);
                  const content = parsed.choices?.[0]?.delta?.content;
                  
                  if (content) {
                    controller.enqueue({ content });
                  }
                  
                  if (parsed.choices?.[0]?.finish_reason) {
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
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      }
    });
  }
}