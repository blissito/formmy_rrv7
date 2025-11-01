import { AIProvider } from './types';
import type { ProviderConfig, ChatRequest, ChatResponse, StreamChunk } from './types';
import { AnthropicProvider } from './anthropic';
import { OpenRouterProvider } from './openrouter';
import { OpenAIProvider } from './openai';

/**
 * Manager central para todos los proveedores de IA
 * Maneja la selección automática del proveedor correcto según el modelo
 */
export class AIProviderManager {
  private providers: Map<string, AIProvider> = new Map();
  
  constructor(configs: { 
    anthropic?: ProviderConfig;
    openrouter?: ProviderConfig;
    // Preparado para futuros proveedores
    openai?: ProviderConfig;
    chinese?: ProviderConfig;
  }) {
    // Inicializar proveedores disponibles
    // IMPORTANTE: El orden importa - proveedores directos tienen prioridad sobre OpenRouter
    if (configs.anthropic) {
      this.providers.set('anthropic', new AnthropicProvider('anthropic', configs.anthropic));
    }

    if (configs.openai) {
      this.providers.set('openai', new OpenAIProvider('openai', configs.openai));
    }
    
    if (configs.openrouter) {
      this.providers.set('openrouter', new OpenRouterProvider('openrouter', configs.openrouter));
    }
  }

  /**
   * Encuentra el proveedor correcto para un modelo específico
   */
  private findProviderForModel(model: string): AIProvider {
    // Buscar el primer proveedor que soporte el modelo
    for (const provider of this.providers.values()) {
      if (provider.supportsModel(model)) {
        return provider;
      }
    }
    
    // Fallback a OpenRouter si está disponible (soporta casi todo)
    const openrouter = this.providers.get('openrouter');
    if (openrouter) {
      return openrouter;
    }
    
    throw new Error(`No provider found for model: ${model}`);
  }

  /**
   * Lista todos los proveedores disponibles
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Obtiene un proveedor específico por nombre
   */
  getProvider(name: string): AIProvider | null {
    return this.providers.get(name) || null;
  }

  /**
   * Genera respuesta de chat sin streaming
   */
  async chatCompletion(request: ChatRequest): Promise<ChatResponse> {
    const provider = this.findProviderForModel(request.model);
    
    try {
      return await provider.chatCompletion(request);
    } catch (error) {
      console.error(`❌ Provider ${provider.getName()} failed:`, error);
      throw error;
    }
  }

  /**
   * Genera respuesta de chat con streaming
   */
  async chatCompletionStream(request: ChatRequest): Promise<ReadableStream<StreamChunk>> {
    const provider = this.findProviderForModel(request.model);
    
    try {
      return await provider.chatCompletionStream(request);
    } catch (error) {
      console.error(`❌ Provider ${provider.getName()} streaming failed:`, error);
      throw error;
    }
  }

  /**
   * Intenta con múltiples proveedores hasta que uno funcione
   * Útil para fallbacks automáticos
   */
  async chatCompletionWithFallback(
    request: ChatRequest, 
    fallbackModels: string[]
  ): Promise<{ response: ChatResponse; modelUsed: string; providerUsed: string; usedFallback: boolean }> {
    const modelsToTry = [request.model, ...fallbackModels.filter(m => m !== request.model)];
    
    for (let i = 0; i < modelsToTry.length; i++) {
      const modelToTry = modelsToTry[i];
      const isFirstAttempt = i === 0;
      
      try {
        const provider = this.findProviderForModel(modelToTry);
        
        const response = await provider.chatCompletion({
          ...request,
          model: modelToTry
        });
        
        
        return {
          response,
          modelUsed: modelToTry,
          providerUsed: provider.getName(),
          usedFallback: !isFirstAttempt
        };
      } catch (error) {
        console.error(`❌ Model ${modelToTry} failed:`, error);
        continue;
      }
    }
    
    throw new Error(`All models failed: ${modelsToTry.join(', ')}`);
  }

  /**
   * Streaming con fallback automático
   */
  async chatCompletionStreamWithFallback(
    request: ChatRequest,
    fallbackModels: string[]
  ): Promise<{ stream: ReadableStream<StreamChunk>; modelUsed: string; providerUsed: string; usedFallback: boolean }> {
    const modelsToTry = [request.model, ...fallbackModels.filter(m => m !== request.model)];
    
    for (let i = 0; i < modelsToTry.length; i++) {
      const modelToTry = modelsToTry[i];
      const isFirstAttempt = i === 0;
      
      try {
        const provider = this.findProviderForModel(modelToTry);
        
        const stream = await provider.chatCompletionStream({
          ...request,
          model: modelToTry
        });
        
        
        return {
          stream,
          modelUsed: modelToTry,
          providerUsed: provider.getName(),
          usedFallback: !isFirstAttempt
        };
      } catch (error) {
        console.error(`❌ Streaming model ${modelToTry} failed:`, error);
        continue;
      }
    }
    
    throw new Error(`All streaming models failed: ${modelsToTry.join(', ')}`);
  }
}