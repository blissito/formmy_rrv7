/**
 * Remote Ghosty Agent - Client for outsourced agent service
 */

import type { GhostyConfig, GhostyContext, GhostyResponse, RemoteAgentRequest, RemoteAgentResponse } from "../types";

export class GhostyRemoteAgent {
  private config: GhostyConfig;
  private endpoint: string;
  private apiKey?: string;

  constructor(config: GhostyConfig) {
    this.config = config;
    this.endpoint = config.remoteEndpoint || 'https://agents.formmy.app/api/chat';
    this.apiKey = config.remoteApiKey;

    if (!this.apiKey) {
      console.warn('⚠️ No API key provided for remote agent');
    }

    console.log(`🌐 GhostyRemoteAgent initialized with endpoint: ${this.endpoint}`);
  }

  /**
   * Main chat method - calls external agent service
   */
  async chat(message: string, context: GhostyContext, stream?: boolean): Promise<GhostyResponse> {
    const startTime = Date.now();
    console.log(`🌐 Remote agent chat: "${message.substring(0, 50)}..."`);

    try {
      // Prepare request payload
      const requestPayload: RemoteAgentRequest = {
        message,
        context: {
          ...context,
          // Don't send sensitive data to external service
          user: {
            ...context.user,
            access_token: undefined,
            refresh_token: undefined,
          } as any,
        },
        config: {
          ...this.config,
          // Don't send API keys to external service
          remoteApiKey: undefined,
        }
      };

      // Prepare headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'User-Agent': 'Formmy-Ghosty-Client/1.0',
      };

      if (this.apiKey) {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }

      // Make request to remote agent service
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestPayload),
        // Timeout for external service
        signal: AbortSignal.timeout(30000), // 30 seconds
      });

      if (!response.ok) {
        throw new Error(`Remote agent responded with ${response.status}: ${response.statusText}`);
      }

      const data: RemoteAgentResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Remote agent returned error without details');
      }

      console.log(`✅ Remote agent response received in ${Date.now() - startTime}ms`);
      console.log(`🔧 Tools used: ${data.toolsUsed?.join(', ') || 'none'}`);

      // Return response in expected format
      return {
        content: data.content,
        toolsUsed: data.toolsUsed || [],
        sources: data.sources || [],
        metadata: {
          tokensUsed: data.metadata?.tokensUsed,
          processingTime: Date.now() - startTime,
          model: data.metadata?.model || 'remote-agent',
        }
      };

    } catch (error) {
      console.error('❌ Remote agent error:', error);
      
      // Return error response
      return {
        content: this.generateErrorResponse(error as Error),
        toolsUsed: [],
        sources: [],
        metadata: {
          processingTime: Date.now() - startTime,
          model: 'remote-agent-error',
        }
      };
    }
  }

  /**
   * Check if remote service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        headers: {
          'User-Agent': 'Formmy-Ghosty-Client/1.0',
        },
        signal: AbortSignal.timeout(5000), // 5 seconds for health check
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ Remote agent health check failed:', error);
      return false;
    }
  }

  /**
   * Generate user-friendly error response for remote failures
   */
  private generateErrorResponse(error: Error): string {
    const genericMessage = "Disculpa, el servicio de asistente está temporalmente no disponible. ";
    
    if (error.message.includes('timeout') || error.message.includes('AbortError')) {
      return genericMessage + "La consulta tomó demasiado tiempo. Intenta con una pregunta más específica.";
    } else if (error.message.includes('401') || error.message.includes('403')) {
      return genericMessage + "Hay un problema de autenticación con el servicio externo.";
    } else if (error.message.includes('429')) {
      return genericMessage + "Hemos alcanzado el límite de consultas. Intenta de nuevo en unos minutos.";
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return genericMessage + "El servicio externo está experimentando problemas. Intenta de nuevo más tarde.";
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      return genericMessage + "Hay un problema de conectividad. Verifica tu conexión a internet.";
    } else {
      return genericMessage + "He cambiado automáticamente al modo local. Tu consulta se procesará internamente.";
    }
  }

  /**
   * Test connection to remote service
   */
  async testConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    const startTime = Date.now();
    
    try {
      const isHealthy = await this.healthCheck();
      const latency = Date.now() - startTime;
      
      if (isHealthy) {
        return { success: true, latency };
      } else {
        return { success: false, error: 'Health check failed' };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Update configuration
   */
  public updateConfig(newConfig: Partial<GhostyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.remoteEndpoint) {
      this.endpoint = newConfig.remoteEndpoint;
    }
    
    if (newConfig.remoteApiKey) {
      this.apiKey = newConfig.remoteApiKey;
    }
    
    console.log(`⚙️ Remote agent config updated`);
  }
}