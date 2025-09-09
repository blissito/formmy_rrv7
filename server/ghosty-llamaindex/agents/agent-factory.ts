/**
 * Agent Factory - Decides between local and remote agents with fallback
 */

import type { GhostyConfig, GhostyContext, GhostyResponse } from "../types";
import { GhostyLocalAgent } from "./local-agent";
import { GhostyRemoteAgent } from "./remote-agent";

export interface IGhostyAgent {
  chat(message: string, context: GhostyContext, stream?: boolean): Promise<GhostyResponse>;
}

export class GhostyAgentFactory {
  private static localAgent: GhostyLocalAgent | null = null;
  private static remoteAgent: GhostyRemoteAgent | null = null;

  /**
   * Create or get agent based on configuration
   */
  static async createAgent(config: GhostyConfig): Promise<IGhostyAgent> {
    if (config.mode === 'remote') {
      return this.createRemoteAgent(config);
    } else {
      return this.createLocalAgent(config);
    }
  }

  /**
   * Create local agent (singleton pattern for performance)
   */
  private static createLocalAgent(config: GhostyConfig): GhostyLocalAgent {
    if (!this.localAgent) {
      console.log('🏠 Creating new local Ghosty agent');
      this.localAgent = new GhostyLocalAgent(config);
    } else {
      // Update config if needed
      this.localAgent.updateConfig(config);
    }
    
    return this.localAgent;
  }

  /**
   * Create remote agent (singleton pattern for performance)
   */
  private static createRemoteAgent(config: GhostyConfig): GhostyRemoteAgent {
    if (!this.remoteAgent) {
      console.log('🌐 Creating new remote Ghosty agent');
      this.remoteAgent = new GhostyRemoteAgent(config);
    } else {
      // Update config if needed
      this.remoteAgent.updateConfig(config);
    }
    
    return this.remoteAgent;
  }

  /**
   * Create agent with smart fallback
   */
  static async createAgentWithFallback(config: GhostyConfig): Promise<IGhostyAgent> {
    if (config.mode === 'remote') {
      // Try remote first, fallback to local
      const remoteAgent = this.createRemoteAgent(config);
      
      // Test connection to remote service
      const connectionTest = await remoteAgent.testConnection();
      
      if (connectionTest.success) {
        console.log(`✅ Remote agent connection successful (${connectionTest.latency}ms)`);
        return remoteAgent;
      } else {
        console.log(`⚠️ Remote agent connection failed: ${connectionTest.error}`);
        console.log('🔄 Falling back to local agent');
        
        // Fallback to local agent
        const localConfig = { ...config, mode: 'local' as const };
        return this.createLocalAgent(localConfig);
      }
    } else {
      return this.createLocalAgent(config);
    }
  }

  /**
   * Adaptive agent that switches based on context and availability
   */
  static async createAdaptiveAgent(config: GhostyConfig): Promise<IGhostyAgent> {
    return new AdaptiveGhostyAgent(config);
  }

  /**
   * Reset singletons (useful for testing or config changes)
   */
  static reset(): void {
    this.localAgent = null;
    this.remoteAgent = null;
    console.log('🔄 Agent factory reset');
  }
}

/**
 * Adaptive agent that can switch between local and remote dynamically
 */
class AdaptiveGhostyAgent implements IGhostyAgent {
  private config: GhostyConfig;
  private preferRemote: boolean;
  private remoteFailureCount: number = 0;
  private lastRemoteCheck: number = 0;
  private readonly REMOTE_RETRY_INTERVAL = 5 * 60 * 1000; // 5 minutes
  private readonly MAX_REMOTE_FAILURES = 3;

  constructor(config: GhostyConfig) {
    this.config = config;
    this.preferRemote = config.mode === 'remote';
  }

  async chat(message: string, context: GhostyContext, stream?: boolean): Promise<GhostyResponse> {
    const startTime = Date.now();
    
    try {
      // Decide which agent to use
      const shouldTryRemote = this.shouldTryRemote();
      
      if (shouldTryRemote) {
        console.log('🌐 Trying remote agent first');
        const remoteAgent = GhostyAgentFactory.createRemoteAgent(this.config);
        
        try {
          const response = await remoteAgent.chat(message, context, stream);
          
          // Reset failure count on success
          this.remoteFailureCount = 0;
          
          return response;
        } catch (error) {
          console.log('⚠️ Remote agent failed, trying local fallback');
          this.handleRemoteFailure();
          
          // Fallback to local
          return this.useLocalAgent(message, context, stream);
        }
      } else {
        console.log('🏠 Using local agent');
        return this.useLocalAgent(message, context, stream);
      }
    } catch (error) {
      console.error('❌ Adaptive agent error:', error);
      
      // Last resort error response
      return {
        content: "Disculpa, estoy experimentando dificultades técnicas. Intenta de nuevo en unos momentos.",
        toolsUsed: [],
        sources: [],
        metadata: {
          processingTime: Date.now() - startTime,
          model: 'adaptive-agent-error',
        }
      };
    }
  }

  private shouldTryRemote(): boolean {
    // Don't try remote if we've had too many recent failures
    if (this.remoteFailureCount >= this.MAX_REMOTE_FAILURES) {
      const timeSinceLastCheck = Date.now() - this.lastRemoteCheck;
      if (timeSinceLastCheck < this.REMOTE_RETRY_INTERVAL) {
        return false;
      }
    }

    return this.preferRemote;
  }

  private handleRemoteFailure(): void {
    this.remoteFailureCount++;
    this.lastRemoteCheck = Date.now();
    
    console.log(`⚠️ Remote failure count: ${this.remoteFailureCount}/${this.MAX_REMOTE_FAILURES}`);
    
    if (this.remoteFailureCount >= this.MAX_REMOTE_FAILURES) {
      console.log(`🔄 Too many remote failures, switching to local mode for ${this.REMOTE_RETRY_INTERVAL / 1000}s`);
    }
  }

  private async useLocalAgent(message: string, context: GhostyContext, stream?: boolean): Promise<GhostyResponse> {
    const localAgent = GhostyAgentFactory.createLocalAgent(this.config);
    return localAgent.chat(message, context, stream);
  }
}