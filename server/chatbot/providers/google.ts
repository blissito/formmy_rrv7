import { AIProvider } from './types';
import type { ChatRequest, ChatResponse, StreamChunk, ChatMessage } from './types';

/**
 * Proveedor para Google Gemini (API directo)
 *
 * Ventajas vs OpenRouter:
 * - Gemini 2.0 Flash: $0.10/$0.40 (vs $0.125/$0.50 en OpenRouter) = -20% ahorro
 * - Gemini 2.0 Flash Lite: $0.075/$0.30 (igual que OpenRouter)
 * - FREE TIER: Gemini 2.0 Flash gratuito con límites generosos
 * - Context: 1M tokens
 * - Latencia más baja (sin intermediario)
 */
export class GoogleProvider extends AIProvider {
  private static readonly SUPPORTED_MODELS = [
    // Gemini 3.0 family
    'gemini-3-flash-preview',
    'gemini-3-flash-preview-11-2025',

    // Gemini 2.0 family
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash-lite-001',
    'gemini-2.0-flash-exp',

    // Gemini 2.5 family
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',

    // Gemini 1.5 family (legacy pero aún soportado)
    'gemini-1.5-pro',
    'gemini-1.5-flash',
  ];

  private baseUrl: string;

  constructor(name: string, config: any) {
    super(name, config);
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  supportsModel(model: string): boolean {
    // Soporta tanto modelo directo como con prefijo google/
    const cleanModel = model.replace('google/', '');
    return GoogleProvider.SUPPORTED_MODELS.some(m =>
      cleanModel.includes(m) || m.includes(cleanModel)
    );
  }

  /**
   * Calcula tokens inteligentemente según el contexto (optimizado para Gemini)
   */
  private calculateSmartTokens(messages: ChatMessage[]): number {
    const lastMessage = messages[messages.length - 1]?.content || '';
    const messageLength = lastMessage.length;

    // Detectar tipo de consulta
    const isShortQuery = messageLength < 50;
    const isCodeRequest = /código|code|program|script|función|class|method/i.test(lastMessage);
    const isListRequest = /lista|enumera|list|opciones|pasos|steps/i.test(lastMessage);
    const isExplanationRequest = /explica|explain|cómo|how|por qué|why|describe/i.test(lastMessage);

    // Gemini tiene contexto masivo (1M tokens), puede ser más generoso
    if (isShortQuery) {
      return 250;
    } else if (isCodeRequest) {
      return 600;
    } else if (isListRequest) {
      return 400;
    } else if (isExplanationRequest) {
      return 500;
    } else {
      return 350;
    }
  }

  protected getHeaders(): Record<string, string> {
    return {
      ...super.getHeaders(),
      'x-goog-api-key': this.config.apiKey,
    };
  }

  /**
   * Convierte mensajes al formato de Gemini
   */
  private formatMessages(messages: ChatMessage[]): {
    systemInstruction?: { parts: { text: string }[] };
    contents: Array<{ role: string; parts: { text: string }[] }>;
  } {
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    return {
      ...(systemMessage && {
        systemInstruction: {
          parts: [{ text: systemMessage.content }]
        }
      }),
      contents: chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user', // Gemini usa 'model' en lugar de 'assistant'
        parts: [{ text: m.content }]
      }))
    };
  }

  /**
   * Normaliza el nombre del modelo para la API de Google
   */
  private normalizeModelName(model: string): string {
    // Remover prefijo google/ si existe
    return model.replace('google/', '');
  }

  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const { systemInstruction, contents } = this.formatMessages(request.messages);
    const modelName = this.normalizeModelName(request.model);

    // Cálculo inteligente de tokens según contexto
    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);

    const body = {
      ...(systemInstruction && { systemInstruction }),
      contents,
      generationConfig: {
        temperature: this.normalizeTemperature(request.temperature ?? 0.7),
        maxOutputTokens: smartMaxTokens,
      },
      // Tool calling support (si se proporcionan)
      ...(request.tools && request.tools.length > 0 && {
        tools: [{
          functionDeclarations: request.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          }))
        }]
      }),
    };

    const url = `${this.baseUrl}/models/${modelName}:generateContent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    // Extraer respuesta
    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.[0]?.text || '';

    // Extraer function calls si existen
    const functionCall = candidate?.content?.parts?.[0]?.functionCall;
    const toolCalls = functionCall ? [{
      name: functionCall.name,
      input: functionCall.args || {},
      id: `call_${Date.now()}`,
    }] : undefined;

    // Extraer usage
    const usage = data.usageMetadata ? {
      inputTokens: data.usageMetadata.promptTokenCount || 0,
      outputTokens: data.usageMetadata.candidatesTokenCount || 0,
      cachedTokens: data.usageMetadata.cachedContentTokenCount || 0,
      totalTokens: data.usageMetadata.totalTokenCount || 0,
    } : undefined;

    return {
      content,
      usage,
      model: request.model,
      provider: this.name,
      finishReason: candidate?.finishReason?.toLowerCase(),
      toolCalls,
    };
  }

  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const { systemInstruction, contents } = this.formatMessages(request.messages);
    const modelName = this.normalizeModelName(request.model);

    const smartMaxTokens = request.maxTokens || this.calculateSmartTokens(request.messages);

    const body = {
      ...(systemInstruction && { systemInstruction }),
      contents,
      generationConfig: {
        temperature: this.normalizeTemperature(request.temperature ?? 0.7),
        maxOutputTokens: smartMaxTokens,
      },
      ...(request.tools && request.tools.length > 0 && {
        tools: [{
          functionDeclarations: request.tools.map(tool => ({
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
          }))
        }]
      }),
    };

    const url = `${this.baseUrl}/models/${modelName}:streamGenerateContent?alt=sse`;

    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Streaming API error (${response.status}): ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body available for streaming');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCachedTokens = 0;

    return new ReadableStream<StreamChunk>({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              controller.close();
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.trim() || line.startsWith(':')) continue;

              // Google usa formato SSE: "data: {...}"
              if (line.startsWith('data: ')) {
                try {
                  const jsonStr = line.substring(6).trim();
                  const data = JSON.parse(jsonStr);

                  const candidate = data.candidates?.[0];
                  const content = candidate?.content?.parts?.[0]?.text || '';

                  // Acumular usage si está disponible
                  if (data.usageMetadata) {
                    totalInputTokens = data.usageMetadata.promptTokenCount || totalInputTokens;
                    totalOutputTokens = data.usageMetadata.candidatesTokenCount || totalOutputTokens;
                    totalCachedTokens = data.usageMetadata.cachedContentTokenCount || totalCachedTokens;
                  }

                  const finishReason = candidate?.finishReason?.toLowerCase() || null;

                  controller.enqueue({
                    content,
                    finishReason: finishReason as any,
                    usage: totalOutputTokens > 0 ? {
                      inputTokens: totalInputTokens,
                      outputTokens: totalOutputTokens,
                      cachedTokens: totalCachedTokens,
                      totalTokens: totalInputTokens + totalOutputTokens,
                    } : undefined,
                  });
                } catch (parseError) {
                  console.error('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
