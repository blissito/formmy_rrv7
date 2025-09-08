/**
 * Local Ghosty Agent - LlamaIndex 2025 compliant implementation
 * Using agent() workflow pattern with FunctionAgent
 */

import { openai } from "@llamaindex/openai";
import { agent } from "@llamaindex/workflow";
import { Settings } from "llamaindex";
import type { GhostyConfig, GhostyContext, GhostyResponse } from "../types";
import { getGhostyTools } from "../tools";
import type { ChatMessage } from "@llamaindex/core/llms";

export class GhostyLocalAgent {
  private config: GhostyConfig;
  private llm: any;
  private agentWorkflow: any;

  constructor(config: GhostyConfig) {
    this.config = config;
    
    // Initialize OpenAI LLM based on config
    const llmConfig: any = {
      model: config.model,
      temperature: config.temperature,
      apiKey: this.getApiKey(),
    };

    // Use correct token parameter based on model
    if (config.model.startsWith('gpt-5')) {
      llmConfig.maxCompletionTokens = config.maxTokens;
    } else {
      llmConfig.maxTokens = config.maxTokens;
    }

    this.llm = openai(llmConfig);

    // IMPORTANT: Configure LlamaIndex Settings globally before using any components
    Settings.llm = this.llm;

    console.log(`🤖 GhostyLocalAgent initialized with ${config.model} [LlamaIndex 2025]`);
  }

  /**
   * Get API key based on provider
   */
  private getApiKey(): string {
    switch (this.config.llmProvider) {
      case 'openai':
        return process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY || '';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY || '';
      default:
        throw new Error(`Unsupported LLM provider: ${this.config.llmProvider}`);
    }
  }

  /**
   * Main chat method - LlamaIndex 2025 compliant
   * Uses agent() workflow with FunctionAgent pattern
   */
  async chat(message: string, context: GhostyContext, stream?: boolean): Promise<GhostyResponse> {
    const startTime = Date.now();
    console.log(`💬 Ghosty chat: "${message.substring(0, 50)}..." [LlamaIndex 2025]`);

    try {
      // Get available tools for this context
      const tools = getGhostyTools(context);
      console.log(`🛠️ Available tools: ${tools.map(t => t.metadata.name).join(', ')}`);

      // Build contextual system prompt
      const contextualPrompt = this.buildContextualPrompt(context);

      // Create AgentWorkflow using LlamaIndex 2025 pattern
      console.log('🚀 Creating LlamaIndex AgentWorkflow...');
      this.agentWorkflow = agent({
        name: 'ghosty',
        llm: this.llm,
        tools: tools,
        systemPrompt: contextualPrompt,
        description: 'Ghosty - Asistente inteligente de Formmy con acceso a herramientas avanzadas',
        verbose: true
      });

      // Prepare chat history in LlamaIndex format
      const chatHistory: ChatMessage[] = [];
      
      if (context.conversationHistory && context.conversationHistory.length > 0) {
        for (const msg of context.conversationHistory.slice(-10)) { // Keep last 10 messages
          chatHistory.push({
            role: msg.role as "user" | "assistant" | "system",
            content: msg.content,
          } as ChatMessage);
        }
      }

      console.log('🎯 Running AgentWorkflow...');
      
      // Run the agent workflow - this handles tool execution automatically
      const workflowResult = await this.agentWorkflow.run(message, {
        chatHistory: chatHistory
      });

      console.log('✅ AgentWorkflow completed:', {
        hasResult: !!workflowResult,
        resultType: typeof workflowResult,
        dataKeys: workflowResult?.data ? Object.keys(workflowResult.data) : []
      });

      // Extract response from workflow result
      const responseContent = workflowResult?.data?.result || 
                             workflowResult?.data?.message?.content || 
                             'No response generated';

      // Extract tools used and sources from workflow
      const toolsUsed = workflowResult?.data?.toolsUsed || [];
      const sources = this.buildSourcesFromWorkflow(workflowResult);

      // Build response in expected format
      const result: GhostyResponse = {
        content: responseContent,
        toolsUsed: toolsUsed,
        sources: sources,
        metadata: {
          processingTime: Date.now() - startTime,
          model: this.config.model,
          llamaIndexWorkflow: true
        }
      };

      console.log(`✅ Ghosty LlamaIndex response generated in ${Date.now() - startTime}ms`);
      
      return result;

    } catch (error) {
      console.error('❌ Ghosty LlamaIndex Agent error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
      
      return {
        content: this.generateErrorResponse(error as Error),
        toolsUsed: [],
        sources: [],
        metadata: {
          processingTime: Date.now() - startTime,
          model: this.config.model,
          error: true
        }
      };
    }
  }

  /**
   * Build contextual system prompt
   */
  private buildContextualPrompt(context: GhostyContext): string {
    const userInfo = `
**CONTEXTO DEL USUARIO**:
- Usuario: ${context.user.name || context.user.email}
- Plan: ${context.user.plan}
- ID de sesión: ${context.sessionId || 'nueva sesión'}
`;

    return `${this.config.systemPrompt}

${userInfo}

Responde de manera útil y proactiva, usando las herramientas disponibles cuando sea necesario.`;
  }

  /**
   * Build sources array from workflow result (LlamaIndex 2025 pattern)
   */
  private buildSourcesFromWorkflow(workflowResult: any): GhostyResponse['sources'] {
    const sources: GhostyResponse['sources'] = [];

    // LlamaIndex workflow may provide sources in the result
    if (workflowResult?.data?.sources) {
      for (const source of workflowResult.data.sources) {
        sources.push({
          type: source.type || 'chatbot',
          title: source.title || 'Tool Result',
          data: source.data,
          url: source.url
        });
      }
    }

    return sources;
  }

  /**
   * Generate user-friendly error response
   */
  private generateErrorResponse(error: Error): string {
    const genericMessage = "Disculpa, tuve un problema procesando tu solicitud. ";
    
    if (error.message.includes('API key')) {
      return genericMessage + "Parece que hay un problema con la configuración de la API.";
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      return genericMessage + "He alcanzado el límite de uso temporalmente. Intenta de nuevo en unos minutos.";
    } else if (error.message.includes('network') || error.message.includes('timeout')) {
      return genericMessage + "Hay un problema de conectividad. Intenta de nuevo.";
    } else {
      return genericMessage + "Intenta reformular tu pregunta o contacta soporte si el problema persiste.";
    }
  }

  /**
   * Reset conversation memory (LlamaIndex workflow handles memory internally)
   */
  public resetMemory(): void {
    // LlamaIndex workflow manages memory automatically
    // Reset the workflow to clear memory
    this.agentWorkflow = null;
    console.log('🧠 Ghosty memory reset - workflow cleared');
  }

  /**
   * Update configuration and recreate workflow if needed
   */
  public updateConfig(newConfig: Partial<GhostyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Clear current workflow so it gets recreated with new config
    this.agentWorkflow = null;
    
    console.log(`⚙️ Ghosty config updated - workflow will be recreated`);
  }
}