/**
 * Sistema modular de proveedores de IA
 * Arquitectura escalable para múltiples APIs: Anthropic, OpenAI, proveedores chinos, etc.
 */

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface StreamChunk {
  content: string;
  finishReason?: 'stop' | 'length' | 'content_filter' | null;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    cachedTokens?: number;
    totalTokens?: number;
  };
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  id?: string;
}

export interface ChatResponse {
  content: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
    cachedTokens?: number;
    totalTokens: number;
  };
  model: string;
  provider: string;
  finishReason?: string;
  toolCalls?: ToolCall[];
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ChatRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  systemPrompt?: string;
  tools?: Tool[];
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Interfaz base para todos los proveedores de IA
 */
export abstract class AIProvider {
  protected config: ProviderConfig;
  protected name: string;

  constructor(name: string, config: ProviderConfig) {
    this.name = name;
    this.config = config;
  }

  /**
   * Genera una respuesta de chat sin streaming
   */
  abstract chatCompletion(request: ChatRequest): Promise<ChatResponse>;

  /**
   * Genera una respuesta de chat con streaming
   */
  abstract chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>>;

  /**
   * Valida si el modelo es soportado por este proveedor
   */
  abstract supportsModel(model: string): boolean;

  /**
   * Normaliza la temperatura para el rango soportado por el proveedor
   */
  protected normalizeTemperature(temperature: number): number {
    return Math.max(0, Math.min(1, temperature));
  }

  /**
   * Prepara headers comunes para las requests
   */
  protected getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      ...this.config.headers,
    };
  }

  /**
   * Nombre del proveedor
   */
  getName(): string {
    return this.name;
  }
}

/**
 * Factory para crear proveedores
 */
export interface ProviderFactory {
  createProvider(name: string, config: ProviderConfig): AIProvider;
  getSupportedProviders(): string[];
}