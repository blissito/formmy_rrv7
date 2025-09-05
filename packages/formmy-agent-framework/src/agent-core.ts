/**
 * Core del agente: Retry logic y error handling
 */

import type { RetryConfig, AgentCallbacks } from './types';

export class AgentCore {
  constructor(
    private retryConfig: RetryConfig = { maxRetries: 3, backoffMs: 1000, exponentialBackoff: true },
    private callbacks?: AgentCallbacks
  ) {}

  /**
   * Ejecuta una función con retry automático y manejo de errores
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'unknown'
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();
        
        // Verificar si el resultado es válido (no vacío)
        if (this.isValidResult(result)) {
          if (attempt > 0) {
            console.log(`✅ Retry successful after ${attempt} attempts for ${context}`);
          }
          return result;
        }
        
        // Resultado vacío, tratar como error para retry
        if (attempt < this.retryConfig.maxRetries - 1) {
          const message = `Empty result on attempt ${attempt + 1} for ${context}`;
          console.log(`🔄 ${message}, retrying...`);
          await this.waitForRetry(attempt);
          continue;
        } else {
          throw new Error(`Empty result after all retries for ${context}`);
        }
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        this.callbacks?.onError?.(lastError, `${context} - attempt ${attempt + 1}`);
        
        if (attempt < this.retryConfig.maxRetries - 1) {
          console.log(`🔄 Attempt ${attempt + 1} failed for ${context}:`, lastError.message);
          console.log(`   Retrying in ${this.calculateBackoffMs(attempt)}ms...`);
          await this.waitForRetry(attempt);
          continue;
        }
        
        console.error(`❌ All ${this.retryConfig.maxRetries} attempts failed for ${context}:`, lastError.message);
        throw lastError;
      }
    }
    
    throw lastError || new Error(`Operation failed after ${this.retryConfig.maxRetries} attempts`);
  }

  /**
   * Verifica si un resultado es válido (no vacío o nulo)
   */
  private isValidResult<T>(result: T): boolean {
    if (result === null || result === undefined) {
      return false;
    }
    
    if (typeof result === 'string') {
      return result.trim().length > 0;
    }
    
    if (typeof result === 'object' && 'content' in result) {
      return this.isValidResult((result as any).content);
    }
    
    return true;
  }

  /**
   * Calcula el tiempo de espera para el siguiente intento
   */
  private calculateBackoffMs(attempt: number): number {
    if (!this.retryConfig.exponentialBackoff) {
      return this.retryConfig.backoffMs;
    }
    
    return this.retryConfig.backoffMs * Math.pow(2, attempt);
  }

  /**
   * Espera el tiempo calculado antes del siguiente retry
   */
  private async waitForRetry(attempt: number): Promise<void> {
    const waitTime = this.calculateBackoffMs(attempt);
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }

  /**
   * Maneja errores de manera inteligente y decide si vale la pena retry
   */
  shouldRetry(error: Error, attempt: number): boolean {
    // No retry si hemos alcanzado el máximo
    if (attempt >= this.retryConfig.maxRetries - 1) {
      return false;
    }
    
    const errorMessage = error.message.toLowerCase();
    
    // Errores que NO deben hacer retry
    if (errorMessage.includes('unauthorized') || 
        errorMessage.includes('forbidden') ||
        errorMessage.includes('invalid api key') ||
        errorMessage.includes('quota exceeded')) {
      return false;
    }
    
    // Errores que SÍ deben hacer retry
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('rate limit') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('network') ||
        errorMessage.includes('empty response')) {
      return true;
    }
    
    return true; // Por defecto, intentar retry
  }

  /**
   * Genera un mensaje de error contextual para el usuario
   */
  generateUserFriendlyError(error: Error, context: string): string {
    const errorMessage = error.message.toLowerCase();
    
    if (errorMessage.includes('quota exceeded') || errorMessage.includes('rate limit')) {
      return 'El servicio está temporalmente ocupado. Por favor, intenta en unos minutos.';
    }
    
    if (errorMessage.includes('unauthorized') || errorMessage.includes('invalid api key')) {
      return 'Hay un problema de configuración del servicio. Por favor, contacta al administrador.';
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('connection')) {
      return 'La conexión es lenta en este momento. Por favor, intenta de nuevo.';
    }
    
    if (errorMessage.includes('empty response')) {
      return 'No pude procesar tu solicitud completamente. ¿Podrías reformularla?';
    }
    
    return 'Ocurrió un error inesperado. Por favor, intenta de nuevo o contacta al soporte.';
  }
}