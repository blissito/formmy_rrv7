/**
 * Ghosty LlamaIndex - Main entry point
 * 
 * This module provides a complete Ghosty agent implementation using LlamaIndex.ts
 * with tools for querying chatbots, statistics, and web search.
 */

import type { User } from "@prisma/client";
import type { GhostyConfig, GhostyContext, GhostyResponse } from "./types";
import { getGhostyConfig } from "./config";
import { GhostyAgentFactory } from "./agents/agent-factory";

/**
 * Main Ghosty LlamaIndex interface
 */
export class GhostyLlamaIndex {
  private config: GhostyConfig;

  constructor(config?: Partial<GhostyConfig>) {
    this.config = {
      ...getGhostyConfig('PRO'), // Default to PRO plan
      ...config,
    };
    
    console.log(`🤖 GhostyLlamaIndex initialized in ${this.config.mode} mode`);
  }

  /**
   * Process a chat message
   */
  async chat(
    message: string, 
    user: User,
    options: {
      conversationHistory?: Array<{ role: string; content: string }>;
      sessionId?: string;
      stream?: boolean;
      preferredMode?: 'local' | 'remote';
    } = {}
  ): Promise<GhostyResponse> {
    
    // Build context
    const context: GhostyContext = {
      userId: user.id,
      user,
      conversationHistory: options.conversationHistory,
      sessionId: options.sessionId,
    };

    // Override mode if specified
    const config = options.preferredMode 
      ? { ...this.config, mode: options.preferredMode }
      : this.config;

    // Create agent with fallback
    const agent = await GhostyAgentFactory.createAgentWithFallback(config);

    // Execute chat
    return agent.chat(message, context, options.stream);
  }

  /**
   * Create adaptive agent that switches dynamically
   */
  async chatAdaptive(
    message: string,
    user: User,
    options: {
      conversationHistory?: Array<{ role: string; content: string }>;
      sessionId?: string;
      stream?: boolean;
    } = {}
  ): Promise<GhostyResponse> {
    
    const context: GhostyContext = {
      userId: user.id,
      user,
      conversationHistory: options.conversationHistory,
      sessionId: options.sessionId,
    };

    // Create adaptive agent
    const agent = await GhostyAgentFactory.createAdaptiveAgent(this.config);

    return agent.chat(message, context, options.stream);
  }

  /**
   * Test connectivity to remote service
   */
  async testRemoteConnection(): Promise<{ success: boolean; latency?: number; error?: string }> {
    if (this.config.mode !== 'remote' && !this.config.remoteEndpoint) {
      return { success: false, error: 'Remote mode not configured' };
    }

    const remoteConfig = { ...this.config, mode: 'remote' as const };
    const remoteAgent = GhostyAgentFactory.createRemoteAgent(remoteConfig);
    
    return remoteAgent.testConnection();
  }

  /**
   * Switch between local and remote modes
   */
  setMode(mode: 'local' | 'remote'): void {
    this.config.mode = mode;
    console.log(`🔄 Ghosty mode switched to: ${mode}`);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<GhostyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('⚙️ Ghosty configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): GhostyConfig {
    return { ...this.config };
  }

  /**
   * Reset agent instances (useful for config changes)
   */
  reset(): void {
    GhostyAgentFactory.reset();
    console.log('🔄 Ghosty agents reset');
  }
}

/**
 * Compatibility adapter for existing Ghosty implementation
 */
export class GhostyLlamaAdapter {
  private ghosty: GhostyLlamaIndex;

  constructor(config?: Partial<GhostyConfig>) {
    this.ghosty = new GhostyLlamaIndex(config);
  }

  /**
   * Adapter method that matches the existing callGhostyWithTools signature
   */
  async callGhostyWithTools(
    message: string,
    enableTools: boolean = true,
    onChunk?: (chunk: string) => void,
    conversationHistory?: Array<{ role: string; content: string }>,
    user?: User
  ): Promise<{ content: string; toolsUsed?: string[]; sources?: any[] }> {
    
    if (!user) {
      throw new Error("User is required for Ghosty LlamaIndex");
    }

    try {
      // Use LlamaIndex implementation
      const response = await this.ghosty.chat(message, user, {
        conversationHistory,
        stream: !!onChunk,
      });

      // Simulate streaming if callback provided
      if (onChunk && response.content) {
        const words = response.content.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
          onChunk(chunk);
          await new Promise(resolve => setTimeout(resolve, 15));
        }
      }

      // Convert to expected format
      return {
        content: response.content,
        toolsUsed: response.toolsUsed,
        sources: response.sources?.map(source => ({
          title: source.title,
          url: source.url,
          type: source.type,
          data: source.data,
        })),
      };

    } catch (error) {
      console.error('❌ GhostyLlamaAdapter error:', error);
      throw error;
    }
  }
}

// Export everything
export * from "./types";
export * from "./config";
export * from "./agents/agent-factory";
export * from "./tools";

// Default export for convenience
export default GhostyLlamaIndex;