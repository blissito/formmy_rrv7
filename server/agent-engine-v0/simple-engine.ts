/**
 * @deprecated - USAR SOLO PARA REFERENCIA HISTÓRICA
 *
 * Este motor usa lógica custom y NO sigue patrones oficiales LlamaIndex.
 * Para nuevas implementaciones usar: /server/agents/agent-v0.server.ts
 *
 * Documentación oficial obligatoria:
 * https://developers.llamaindex.ai/typescript/framework/modules/agents/agent_workflow/
 *
 * AgentEngine_v0 - Motor simple con implementación custom
 * NOTA: Este archivo se mantiene para referencia histórica pero NO debe usarse en producción
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

// LlamaIndex-style tool definition
export interface LlamaIndexTool {
  name: string;
  description: string;
  parameters: z.ZodSchema<any>;
  implementation: (params: any, context?: any) => Promise<string> | string;
}

// Tool binding for context (following LlamaIndex patterns)
export interface ToolBinding {
  tool: LlamaIndexTool;
  context?: Record<string, any>;
}

export interface AgentEngineConfig {
  model: string;
  temperature?: number;
  systemPrompt: string;
  tools?: LlamaIndexTool[]; // LlamaIndex-style tools
  name?: string; // Nombre del agente
  description?: string; // Descripción del agente
  toolBindings?: ToolBinding[]; // Context-bound tools
}

export interface AgentResponse {
  content: string;
  toolsUsed?: string[];
  metadata?: {
    tokensUsed?: number;
    model?: string;
    agent?: string;
  };
}

export class AgentEngine_v0 {
  private config: AgentEngineConfig;
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private availableTools: LlamaIndexTool[] = [];
  private toolBindings: Map<string, any> = new Map();

  constructor(config: AgentEngineConfig) {
    this.config = config;

    // Initialize providers based on model - más robusto
    if (config.model.includes('claude')) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Process tools following LlamaIndex patterns
    this.initializeTools();

    console.log(`🤖 AgentEngine_v0 initialized: ${config.name || 'Agent'} with ${config.model}`, {
      toolsCount: this.availableTools.length,
      tools: this.availableTools.map(t => t.name)
    });
  }

  private initializeTools(): void {
    // Add direct tools
    if (this.config.tools) {
      this.availableTools.push(...this.config.tools);
    }

    // Process tool bindings (LlamaIndex pattern)
    if (this.config.toolBindings) {
      for (const binding of this.config.toolBindings) {
        this.availableTools.push(binding.tool);
        if (binding.context) {
          this.toolBindings.set(binding.tool.name, binding.context);
        }
      }
    }

    console.log(`🔧 Tools initialized: ${this.availableTools.length} tools available`);
  }

  async chat(
    message: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<AgentResponse> {

    // Workflow step 1: Prepare context
    const systemMessage = this.buildSystemMessage();
    const messages = this.buildMessageHistory(systemMessage, conversationHistory, message);

    console.log('🚀 AgentEngine_v0 workflow started:', {
      agent: this.config.name || 'Agent',
      model: this.config.model,
      temperature: this.config.temperature,
      messagesCount: messages.length,
      hasTools: !!this.config.tools?.length
    });

    try {
      // Workflow step 2: Route to appropriate provider
      const response = await this.executeAgentCall(messages);

      // Workflow step 3: Process and return response
      console.log('✅ AgentEngine_v0 workflow completed:', {
        contentLength: response.content.length,
        toolsUsed: response.toolsUsed?.length || 0,
        model: response.metadata?.model
      });

      return response;
    } catch (error) {
      console.error('❌ AgentEngine_v0 workflow error:', error);
      return this.createErrorResponse(error);
    }
  }

  private buildSystemMessage(): string {
    let systemPrompt = this.config.systemPrompt;

    // Enhance system prompt with agent capabilities
    if (this.config.tools?.length) {
      systemPrompt += `\n\nHerramientas disponibles: ${this.config.tools.length} funciones especializadas.`;
    }

    if (this.config.description) {
      systemPrompt += `\n\nDescripción del agente: ${this.config.description}`;
    }

    return systemPrompt;
  }

  private buildMessageHistory(
    systemMessage: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    message: string
  ) {
    return [
      { role: 'system' as const, content: systemMessage },
      ...conversationHistory.slice(-10), // Últimos 10 mensajes para mantener contexto
      { role: 'user' as const, content: message }
    ];
  }

  private async executeAgentCall(messages: any[]): Promise<AgentResponse> {
    if (this.config.model.includes('claude')) {
      return await this.callAnthropic(messages);
    } else {
      return await this.callOpenAI(messages);
    }
  }

  private createErrorResponse(error: any): AgentResponse {
    return {
      content: 'Lo siento, ocurrió un error procesando tu mensaje. Por favor, intenta de nuevo.',
      toolsUsed: [],
      metadata: {
        model: this.config.model,
        agent: this.config.name || 'AgentEngine_v0'
      }
    };
  }

  // Convert LlamaIndex tools to OpenAI function calling format
  private convertToolsToOpenAI(): any[] {
    return this.availableTools.map(tool => ({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: this.zodToJsonSchema(tool.parameters)
      }
    }));
  }

  // Convert LlamaIndex tools to Anthropic tools format
  private convertToolsToAnthropic(): any[] {
    return this.availableTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      input_schema: this.zodToJsonSchema(tool.parameters)
    }));
  }

  // Convert Zod schema to JSON Schema (simplified)
  private zodToJsonSchema(schema: z.ZodSchema<any>): any {
    // Simplified Zod to JSON Schema conversion
    // In a real implementation, you'd use a library like zod-to-json-schema
    try {
      // Basic conversion for common Zod types
      if (schema instanceof z.ZodObject) {
        const shape = schema.shape;
        const properties: any = {};
        const required: string[] = [];

        for (const [key, value] of Object.entries(shape)) {
          if (value instanceof z.ZodString) {
            properties[key] = { type: 'string' };
          } else if (value instanceof z.ZodNumber) {
            properties[key] = { type: 'number' };
          } else if (value instanceof z.ZodBoolean) {
            properties[key] = { type: 'boolean' };
          } else {
            properties[key] = { type: 'string' }; // fallback
          }

          // Check if required (not optional)
          if (!value.isOptional?.()) {
            required.push(key);
          }
        }

        return {
          type: 'object',
          properties,
          required
        };
      }

      return { type: 'object' }; // fallback
    } catch (error) {
      console.warn('Error converting Zod schema to JSON:', error);
      return { type: 'object' };
    }
  }

  // Execute tool following LlamaIndex patterns
  private async executeTool(toolName: string, parameters: any): Promise<string> {
    const tool = this.availableTools.find(t => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`);
    }

    try {
      // Validate parameters using Zod
      const validatedParams = tool.parameters.parse(parameters);

      // Get tool binding context
      const context = this.toolBindings.get(toolName);

      // Execute tool implementation
      const result = await tool.implementation(validatedParams, context);

      console.log(`🔧 Tool executed: ${toolName}`, {
        parameters: validatedParams,
        hasContext: !!context,
        resultLength: typeof result === 'string' ? result.length : 0
      });

      return typeof result === 'string' ? result : JSON.stringify(result);
    } catch (error) {
      console.error(`❌ Tool execution error (${toolName}):`, error);
      throw new Error(`Tool ${toolName} failed: ${error.message}`);
    }
  }

  private async callOpenAI(messages: any[]): Promise<AgentResponse> {
    if (!this.openai) {
      throw new Error('OpenAI not initialized');
    }

    // Build parameters following OpenAI best practices
    const params: any = {
      model: this.config.model,
      messages: messages,
    };

    // Temperature handling for different GPT models
    if (this.config.model !== 'gpt-5-nano') {
      // GPT-5 nano doesn't support temperature - don't add the parameter at all
      params.temperature = this.config.temperature ?? 0.7;
    }
    // Para gpt-5-nano: NO agregamos temperature parameter en absoluto

    // Token limits based on model family
    if (this.config.model.startsWith('gpt-5')) {
      params.max_completion_tokens = 1500; // More generous limit
    } else {
      params.max_tokens = 1500;
    }

    // Add tools if available (LlamaIndex pattern)
    if (this.availableTools.length > 0) {
      params.tools = this.convertToolsToOpenAI();
      params.tool_choice = 'auto'; // Let the model decide when to use tools
    }

    console.log('🔧 OpenAI call params:', {
      model: params.model,
      temperature: params.temperature ?? 'not_supported',
      maxTokens: params.max_completion_tokens || params.max_tokens,
      messagesCount: messages.length,
      hasTemperature: 'temperature' in params,
      toolsCount: this.availableTools.length
    });

    const completion = await this.openai.chat.completions.create(params);

    // Handle tool calls following LlamaIndex workflow
    return await this.processOpenAIResponse(completion, messages);
  }

  // Process OpenAI response with tool calling support
  private async processOpenAIResponse(completion: any, originalMessages: any[]): Promise<AgentResponse> {
    const choice = completion.choices[0];
    if (!choice || !choice.message) {
      throw new Error('No response choice available from OpenAI');
    }

    const message = choice.message;
    const toolsUsed: string[] = [];

    // Handle tool calls (LlamaIndex workflow)
    if (message.tool_calls && message.tool_calls.length > 0) {
      console.log(`🔧 Processing ${message.tool_calls.length} tool calls`);

      const toolResults: string[] = [];

      for (const toolCall of message.tool_calls) {
        try {
          const toolName = toolCall.function.name;
          const parameters = JSON.parse(toolCall.function.arguments);

          const result = await this.executeTool(toolName, parameters);
          toolResults.push(`${toolName}: ${result}`);
          toolsUsed.push(toolName);
        } catch (error) {
          console.error(`❌ Tool call failed:`, error);
          toolResults.push(`Error: ${error.message}`);
        }
      }

      // If tools were executed, the final response should incorporate tool results
      const toolSummary = toolResults.join('\n');
      return {
        content: toolSummary,
        toolsUsed,
        metadata: {
          tokensUsed: completion.usage?.total_tokens,
          model: this.config.model,
          agent: this.config.name || 'AgentEngine_v0',
          toolCalls: message.tool_calls.length
        }
      };
    }

    // Handle regular text response
    const content = message.content;

    // Log para debug
    console.log('🔍 OpenAI response details:', {
      hasChoice: !!choice,
      hasMessage: !!message,
      hasContent: !!content,
      contentType: typeof content,
      contentLength: content?.length || 0,
      hasToolCalls: !!(message.tool_calls && message.tool_calls.length > 0)
    });

    // Manejo más flexible del contenido
    if (!content) {
      console.warn('⚠️ OpenAI returned null/undefined content, usando fallback');
      return {
        content: 'Hola, ¿en qué puedo ayudarte?',
        toolsUsed,
        metadata: {
          tokensUsed: completion.usage?.total_tokens,
          model: this.config.model,
          agent: this.config.name || 'AgentEngine_v0',
          fallback: true
        }
      };
    }

    const trimmedContent = content.trim();
    if (trimmedContent.length === 0) {
      console.warn('⚠️ OpenAI returned empty content, usando fallback');
      return {
        content: 'Hola, ¿en qué puedo ayudarte?',
        toolsUsed,
        metadata: {
          tokensUsed: completion.usage?.total_tokens,
          model: this.config.model,
          agent: this.config.name || 'AgentEngine_v0',
          fallback: true
        }
      };
    }

    return {
      content: trimmedContent,
      toolsUsed,
      metadata: {
        tokensUsed: completion.usage?.total_tokens,
        model: this.config.model,
        agent: this.config.name || 'AgentEngine_v0'
      }
    };
  }

  private async callAnthropic(messages: any[]): Promise<AgentResponse> {
    if (!this.anthropic) {
      throw new Error('Anthropic not initialized');
    }

    // Separate system prompt from chat messages - Anthropic requirement
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const chatMessages = messages.filter(m => m.role !== 'system');

    if (chatMessages.length === 0) {
      throw new Error('No chat messages provided to Anthropic');
    }

    console.log('🔧 Anthropic call params:', {
      model: this.config.model,
      temperature: this.config.temperature || 0.7,
      systemLength: systemPrompt.length,
      messagesCount: chatMessages.length
    });

    const completion = await this.anthropic.messages.create({
      model: this.config.model,
      system: systemPrompt,
      messages: chatMessages,
      temperature: this.config.temperature || 0.7,
      max_tokens: 1500,
    });

    // Robust response extraction for Anthropic
    if (!completion.content || completion.content.length === 0) {
      throw new Error('No content received from Anthropic');
    }

    const textContent = completion.content.find(c => c.type === 'text');
    if (!textContent || !textContent.text) {
      throw new Error('No text content available from Anthropic response');
    }

    const content = textContent.text.trim();
    if (content.length === 0) {
      throw new Error('Empty text content received from Anthropic');
    }

    return {
      content,
      toolsUsed: [],
      metadata: {
        tokensUsed: (completion.usage?.input_tokens || 0) + (completion.usage?.output_tokens || 0),
        model: this.config.model,
        agent: this.config.name || 'AgentEngine_v0'
      }
    };
  }
}