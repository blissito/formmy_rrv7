/**
 * LlamaIndex Engine v0.0.1 - Motor Base
 *
 * Motor reutilizable para todos los agentes de Formmy.
 * Una sola responsabilidad: ejecutar chats con LlamaIndex de forma consistente.
 */

import { openai } from "@llamaindex/openai";
import { anthropic } from "@llamaindex/anthropic";
import { agent } from "@llamaindex/workflow";
import { Settings, FunctionTool } from "llamaindex";
import type { ChatMessage } from "@llamaindex/core/llms";
import type {
  EngineConfig,
  ExecutionContext,
  EngineResponse,
  EngineEvent
} from "./types";

export class LlamaIndexEngine {
  private config: EngineConfig;
  private agentWorkflow: any = null;
  private llm: any;
  private initialized = false;

  // Event system para monitoring
  private eventHandlers: Array<(event: EngineEvent) => void> = [];

  constructor(config: EngineConfig) {
    this.config = config;

    // Configurar LLM con patterns LlamaIndex 2025 (como Ghosty)
    const temperature = this.getTemperatureForModel(config.model, config.temperature);
    console.log(`🔧 Model: ${config.model}, Temperature: ${temperature} (${typeof temperature})`);

    // Detectar provider según modelo (copiado de Ghosty)
    const provider = this.detectProvider(config.model);
    const apiKey = this.getApiKeyForProvider(provider);

    const llmConfig: any = {
      model: config.model,
      apiKey: apiKey,
    };

    // Manejar temperature específico por modelo (como Ghosty)
    if (config.model.startsWith('gpt-5')) {
      // Toda la familia GPT-5 solo soporta temperature=1 (valor por defecto)
      llmConfig.temperature = 1;
      console.log(`🎯 ${config.model}: Using temperature=1 (only supported value for GPT-5 family)`);
    } else {
      // Otros modelos sí soportan temperature personalizada
      llmConfig.temperature = temperature ?? 0.7;
      console.log(`✅ ${config.model}: Using temperature ${llmConfig.temperature}`);
    }

    // Usar tokens correctos según modelo (como Ghosty)
    if (config.model.startsWith('gpt-5')) {
      llmConfig.maxCompletionTokens = config.maxTokens || 2000;
    } else {
      llmConfig.maxTokens = config.maxTokens || 2000;
    }

    // Crear LLM según provider (como Ghosty)
    if (provider === 'anthropic') {
      this.llm = anthropic(llmConfig);
      console.log(`🤖 Using Anthropic provider for ${config.model}`);
    } else {
      this.llm = openai(llmConfig);
      console.log(`🤖 Using OpenAI provider for ${config.model}`);
    }

    // Set global LLM para LlamaIndex
    Settings.llm = this.llm;

    console.log(`🤖 LlamaIndexEngine v0.0.1 created for agent: ${config.agentName || 'Unknown'}`);
    console.log(`📊 Config: ${config.model}, ${config.tools.length} tools, ${config.systemPrompt.length} chars prompt`);
  }

  /**
   * Método principal - ejecutar chat
   */
  async chat(message: string, context: ExecutionContext, streaming = true): Promise<EngineResponse | AsyncIterable<any>> {
    const startTime = Date.now();

    try {
      this.emitEvent({
        type: 'chat_started',
        agentName: this.config.agentName || 'unknown',
        userId: context.user.id,
        timestamp: new Date(),
        metadata: { message: message.substring(0, 100), model: this.config.model }
      });

      // Lazy initialization del agent workflow
      await this.initializeAgent();

      if (!this.agentWorkflow) {
        throw new Error("Failed to initialize LlamaIndex agent workflow");
      }

      console.log(`🚀 Engine v0.0.1: "${message.substring(0, 50)}..." (${this.config.agentName})`);

      // Convertir historial conversacional
      const chatHistory = this.buildChatHistory(context.conversationHistory);

      // Community pattern 2025: Intent-based streaming decision
      const needsTools = await this.analyzeIntent(message);

      // 🚨 STREAMING DESHABILITADO - PROBLEMA CRÍTICO CONFIRMADO
      // SMART STREAMING causa que una vez en streaming, nunca vuelva a tools
      const shouldStream = false; // HARDCODED - NO STREAMING HASTA FIX
      const shouldUseTools = needsTools && this.config.tools.length > 0;

      console.log(`${shouldStream ? '🌊 Streaming' : '🔧 Non-streaming'} mode (intent: ${needsTools ? 'needs tools' : 'conversational'})`);
      console.log(`🎯 Streaming decision: requested=${streaming}, needsTools=${needsTools}, final=${shouldStream}`);

      // ProductivityAssistant: Query Planning + Tool Coordination
      let workflowResult;

      if (shouldUseTools) {
        console.log(`🛠️ ProductivityAssistant: Tool execution mode (non-streaming)`);

        // Forzar tool execution con prompt específico
        const toolPrompt = this.createToolExecutionPrompt(message);
        workflowResult = await this.agentWorkflow.run(toolPrompt, {
          chatHistory: chatHistory
        });

        // Tool mode siempre retorna EngineResponse
        const engineResponse = this.formatResponse(workflowResult, startTime);
        engineResponse.metadata.needsTools = needsTools;
        engineResponse.metadata.streamingSupported = false;
        return engineResponse;

      } else if (shouldStream) {
        console.log(`🌊 ProductivityAssistant: Streaming conversational mode`);

        // STREAMING MODE: Return AsyncIterable using LlamaIndex TS streaming
        return this.createStreamingResponse(message, chatHistory, startTime);

      } else {
        console.log(`💬 ProductivityAssistant: Non-streaming conversational mode`);

        // Non-streaming conversational mode
        workflowResult = await this.agentWorkflow.run(message, {
          chatHistory: chatHistory
        });
      }

      // DEBUGGING: Log workflowResult structure
      console.log(`🔍 workflowResult type: ${typeof workflowResult}`);
      console.log(`🔍 workflowResult keys:`, Object.keys(workflowResult || {}));

      // Formatear respuesta con información de intent
      const engineResponse = this.formatResponse(workflowResult, startTime);

      // Agregar información de intent para el API endpoint
      engineResponse.metadata.needsTools = needsTools;
      engineResponse.metadata.intentAnalysis = {
        supportsStreaming: !needsTools,
        toolsDetected: needsTools,
        streamingRecommendation: streaming && !needsTools
      };

      this.emitEvent({
        type: 'chat_completed',
        agentName: this.config.agentName || 'unknown',
        userId: context.user.id,
        timestamp: new Date(),
        metadata: {
          processingTime: engineResponse.metadata.processingTime,
          toolsUsed: engineResponse.toolsUsed.length,
          contentLength: engineResponse.content.length
        }
      });

      console.log(`✅ Engine v0.0.1 completed: ${engineResponse.content.length} chars, ${engineResponse.toolsUsed.length} tools`);
      console.log(`🛠️ Tools detected: [${engineResponse.toolsUsed.join(', ')}]`);

      return engineResponse;

    } catch (error) {
      console.error(`❌ Engine v0.0.1 error (${this.config.agentName}):`, error);

      const errorResponse = this.createErrorResponse(error as Error, startTime);

      this.emitEvent({
        type: 'error',
        agentName: this.config.agentName || 'unknown',
        userId: context.user.id,
        timestamp: new Date(),
        metadata: { error: (error as Error).message }
      });

      return errorResponse;
    }
  }

  /**
   * Inicializar agent workflow de forma lazy (LlamaIndex 2025 pattern)
   * MEJORADO: ProductivityAssistant-style con tool prompting forzado
   */
  private async initializeAgent(): Promise<void> {
    if (this.initialized && this.agentWorkflow) return;

    try {
      console.log(`🔧 Initializing ProductivityAssistant workflow with ${this.config.tools.length} tools...`);

      // MEJORADO: Agent con prompt optimizado para tool execution
      const productivityPrompt = this.createProductivityPrompt();

      this.agentWorkflow = agent({
        name: `${this.config.agentName || 'chatbot'}-productivity`,
        llm: this.llm,
        tools: this.config.tools,
        systemPrompt: productivityPrompt,
        description: `ProductivityAssistant for ${this.config.agentName}`,
        verbose: process.env.NODE_ENV === 'development'
      });

      this.initialized = true;

      console.log(`✅ ProductivityAssistant workflow initialized: [${this.config.tools.map(t => t.metadata.name).join(', ')}]`);

    } catch (error) {
      console.error('❌ Error initializing productivity workflow:', error);
      throw error;
    }
  }

  /**
   * Convertir historial a formato LlamaIndex
   */
  private buildChatHistory(history?: Array<{ role: string; content: string }>): ChatMessage[] {
    if (!history || history.length === 0) {
      return [];
    }

    return history.map(msg => ({
      role: msg.role as MessageType,
      content: msg.content,
    }));
  }

  /**
   * Formatear respuesta del agent workflow (LlamaIndex 2025)
   */
  private formatResponse(workflowResult: any, startTime: number): EngineResponse {
    const processingTime = Date.now() - startTime;

    return {
      content: this.extractContent(workflowResult),
      toolsUsed: this.extractToolsUsed(workflowResult),

      metadata: {
        model: this.config.model,
        agentName: this.config.agentName,
        processingTime,
        iterations: this.extractIterations(workflowResult),
        tokensUsed: this.extractTokenUsage(workflowResult),
      },

      debug: process.env.NODE_ENV === 'development' ? {
        toolDetails: this.extractToolDetails(workflowResult),
        rawResponse: workflowResult,
      } : undefined,

      warnings: this.extractWarnings(workflowResult),
    };
  }

  /**
   * Crear respuesta de error
   */
  private createErrorResponse(error: Error, startTime: number): EngineResponse {
    return {
      content: this.generateUserFriendlyError(error),
      toolsUsed: [],
      metadata: {
        model: this.config.model,
        agentName: this.config.agentName,
        processingTime: Date.now() - startTime,
        iterations: 0,
      },
      error: error.message,
    };
  }

  /**
   * Extraer contenido de workflowResult (LlamaIndex 2025)
   */
  private extractContent(workflowResult: any): string {
    // Pattern basado en Ghosty: workflowResult.data.result
    if (workflowResult?.data?.result) {
      return workflowResult.data.result;
    }

    // Fallbacks para otros formatos posibles
    if (typeof workflowResult === 'string') {
      return workflowResult;
    }

    if (workflowResult?.response?.message) {
      return workflowResult.response.message;
    }

    if (workflowResult?.message) {
      return workflowResult.message;
    }

    if (workflowResult?.content) {
      return workflowResult.content;
    }

    if (workflowResult?.response) {
      return String(workflowResult.response);
    }

    console.warn('⚠️ Could not extract content from workflowResult:', typeof workflowResult);
    return 'Lo siento, no pude generar una respuesta válida.';
  }

  /**
   * Extraer herramientas usadas (LlamaIndex 2025)
   * MEJORADO: Múltiples patterns de detección para ProductivityAssistant
   */
  private extractToolsUsed(workflowResult: any): string[] {
    const toolsUsed: string[] = [];

    console.log(`🔍 extractToolsUsed: Analyzing workflowResult type=${typeof workflowResult}`);

    // Pattern 1: workflowResult.data.toolsUsed (Ghosty pattern)
    if (workflowResult?.data?.toolsUsed && Array.isArray(workflowResult.data.toolsUsed)) {
      toolsUsed.push(...workflowResult.data.toolsUsed);
      console.log(`✅ Found tools in data.toolsUsed: [${workflowResult.data.toolsUsed.join(', ')}]`);
    }

    // Pattern 2: workflowResult.sources (LlamaIndex agent pattern)
    if (workflowResult?.sources) {
      for (const source of workflowResult.sources) {
        if (source?.tool?.name) {
          toolsUsed.push(source.tool.name);
          console.log(`✅ Found tool in sources: ${source.tool.name}`);
        }
      }
    }

    // Pattern 3: workflowResult.metadata.toolCalls
    if (workflowResult?.metadata?.toolCalls) {
      for (const toolCall of workflowResult.metadata.toolCalls) {
        if (toolCall?.name) {
          toolsUsed.push(toolCall.name);
          console.log(`✅ Found tool in metadata.toolCalls: ${toolCall.name}`);
        }
      }
    }

    // Pattern 4: NUEVO - workflowResult.data.result content analysis
    if (workflowResult?.data?.result) {
      const result = workflowResult.data.result;
      if (typeof result === 'string') {
        // Buscar menciones de herramientas en el resultado
        const availableToolNames = this.config.tools.map(t => t.metadata.name);
        for (const toolName of availableToolNames) {
          if (result.includes(toolName) || result.includes('schedule_reminder') || result.includes('recordatorio')) {
            toolsUsed.push(toolName);
            console.log(`✅ Found tool by content analysis: ${toolName}`);
          }
        }
      }
    }

    // Pattern 5: NUEVO - Agent workflow response structure
    if (workflowResult?.response?.tool_calls) {
      for (const toolCall of workflowResult.response.tool_calls) {
        if (toolCall?.function?.name) {
          toolsUsed.push(toolCall.function.name);
          console.log(`✅ Found tool in response.tool_calls: ${toolCall.function.name}`);
        }
      }
    }

    // Pattern 6: NUEVO - Raw agent response analysis
    if (typeof workflowResult === 'string') {
      const availableToolNames = this.config.tools.map(t => t.metadata.name);
      for (const toolName of availableToolNames) {
        if (workflowResult.includes(toolName)) {
          toolsUsed.push(toolName);
          console.log(`✅ Found tool in raw string response: ${toolName}`);
        }
      }
    }

    const uniqueTools = [...new Set(toolsUsed)];
    console.log(`🔍 extractToolsUsed final result: [${uniqueTools.join(', ')}]`);

    return uniqueTools;
  }

  /**
   * Extraer número de iteraciones
   */
  private extractIterations(rawResponse: any): number {
    if (rawResponse?.metadata?.iterations) {
      return rawResponse.metadata.iterations;
    }

    // Estimar desde tool calls
    const toolCalls = this.extractToolsUsed(rawResponse).length;
    return Math.max(1, toolCalls);
  }

  /**
   * Extraer uso de tokens
   */
  private extractTokenUsage(rawResponse: any): { input: number; output: number; total: number } | undefined {
    if (rawResponse?.usage) {
      return {
        input: rawResponse.usage.prompt_tokens || 0,
        output: rawResponse.usage.completion_tokens || 0,
        total: rawResponse.usage.total_tokens || 0,
      };
    }
    return undefined;
  }

  /**
   * Extraer detalles de herramientas para debugging
   */
  private extractToolDetails(rawResponse: any): Array<{ name: string; parameters: any; result: any; executionTime: number }> | undefined {
    if (!rawResponse?.metadata?.toolCalls) {
      return undefined;
    }

    return rawResponse.metadata.toolCalls.map((toolCall: any) => ({
      name: toolCall.name || 'Unknown Tool',
      parameters: toolCall.parameters || {},
      result: toolCall.result || {},
      executionTime: toolCall.executionTime || 0,
    }));
  }

  /**
   * Extraer warnings
   */
  private extractWarnings(rawResponse: any): string[] {
    const warnings: string[] = [];

    if (rawResponse?.warnings) {
      warnings.push(...rawResponse.warnings);
    }

    // Agregar warnings específicos del modelo
    if (this.config.model === 'gpt-5-nano' && this.extractToolsUsed(rawResponse).length > 0) {
      warnings.push('GPT-5-nano optimizado para velocidad con herramientas');
    }

    return warnings;
  }


  /**
   * Analizar intent del mensaje para determinar si necesita herramientas
   * Community pattern 2025: Intent-based tool detection
   * PUBLIC: Para uso del API endpoint
   */
  public async analyzeIntent(message: string): Promise<boolean> {
    // Si no hay herramientas disponibles, nunca las necesitará
    if (this.config.tools.length === 0) {
      return false;
    }

    // Keywords que indican uso de herramientas (pattern de Formmy Agent Framework)
    const toolKeywords = [
      // Recordatorios
      'recuerda', 'recordatorio', 'recuérdame', 'avísame', 'programa',
      'agenda', 'cita', 'reunión', 'evento', 'alarma',
      // Inglés
      'remind', 'reminder', 'schedule', 'appointment', 'meeting',
      // Comandos directos
      'crea', 'crear', 'programa', 'programar', 'configura', 'configurar',
      'create', 'make', 'set', 'add', 'setup',
    ];

    // Análisis rápido por keywords (0ms latency)
    const lowerMessage = message.toLowerCase();
    const hasToolKeywords = toolKeywords.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // Patrones de comandos directos
    const commandPatterns = [
      /^(crea|programa|configura|agenda|recuerda)/i,
      /^(create|schedule|set|make|add)/i,
      /(recordatorio|reminder|cita|appointment|alarma|alarm)/i
    ];

    const hasCommandPattern = commandPatterns.some(pattern =>
      pattern.test(message)
    );

    const needsTools = hasToolKeywords || hasCommandPattern;

    console.log(`🧠 ProductivityAssistant intent: "${message.substring(0, 30)}..." → ${needsTools ? 'TOOLS' : 'CHAT'}`);
    console.log(`🔍 Available tools: [${this.config.tools.map(t => t.metadata.name).join(', ')}]`);
    console.log(`🌊 Streaming capability: ${!needsTools ? 'SUPPORTED' : 'DISABLED (tools needed)'}`);

    return needsTools;
  }

  /**
   * Detectar provider según modelo (copiado de Ghosty)
   */
  private detectProvider(model: string): 'openai' | 'anthropic' {
    if (model.startsWith('claude-')) {
      return 'anthropic';
    }
    return 'openai';
  }

  /**
   * Obtener API key según provider (copiado de Ghosty)
   */
  private getApiKeyForProvider(provider: 'openai' | 'anthropic'): string {
    switch (provider) {
      case 'openai':
        return process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY || '';
      case 'anthropic':
        return process.env.ANTHROPIC_API_KEY || '';
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }

  /**
   * Obtener temperature correcta para el modelo
   */
  private getTemperatureForModel(model: string, configTemp?: number): number {
    // Toda la familia GPT-5 solo soporta temperature=1
    if (model.startsWith('gpt-5')) {
      return 1;
    }

    return configTemp ?? 0.7;
  }

  /**
   * Generar mensaje de error user-friendly
   */
  private generateUserFriendlyError(error: Error): string {
    if (error.message.includes('insufficient_quota')) {
      return 'Parece que hemos alcanzado el límite de uso. Por favor, intenta de nuevo en unos momentos.';
    }

    if (error.message.includes('rate_limit')) {
      return 'Estamos procesando muchas consultas. Intenta de nuevo en unos segundos.';
    }

    if (error.message.includes('model_not_found')) {
      return 'El modelo de IA no está disponible en este momento. Contacta con soporte.';
    }

    return 'Lo siento, ocurrió un error al procesar tu consulta. Por favor, intenta de nuevo.';
  }

  /**
   * Sistema de eventos para monitoring
   */
  public onEvent(handler: (event: EngineEvent) => void): void {
    this.eventHandlers.push(handler);
  }

  private emitEvent(event: EngineEvent): void {
    this.eventHandlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in event handler:', error);
      }
    });
  }

  /**
   * Obtener configuración actual
   */
  public getConfig(): EngineConfig {
    return { ...this.config };
  }

  /**
   * Test del motor
   */
  public async test(): Promise<{ success: boolean; error?: string; agentReady: boolean; toolsCount: number }> {
    try {
      await this.initializeAgent();

      return {
        success: true,
        agentReady: !!this.agentWorkflow,
        toolsCount: this.config.tools.length,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
        agentReady: false,
        toolsCount: 0,
      };
    }
  }

  /**
   * Reset del agent workflow (útil para cambios de configuración)
   */
  public reset(): void {
    this.agentWorkflow = null;
    this.initialized = false;
    console.log(`🔄 Engine v0.0.1 reset for agent: ${this.config.agentName}`);
  }

  /**
   * Metadata del motor
   */
  public static getVersion(): string {
    return '0.0.1';
  }

  public static getDescription(): string {
    return 'LlamaIndex Engine - Base motor reutilizable para todos los agentes de Formmy';
  }

  /**
   * NUEVO: Crear respuesta streaming para conversación
   *
   * Streaming solo para casos conversacionales sin herramientas.
   * LlamaIndex agent con streaming nativo.
   */
  private async createStreamingResponse(
    message: string,
    chatHistory: ChatMessage[],
    startTime: number
  ): Promise<AsyncIterable<any>> {
    const self = this;

    return {
      async *[Symbol.asyncIterator]() {
        try {
          console.log(`🌊 Starting streaming conversation...`);

          console.log(`\ud83c\udf0a Starting LlamaIndex TS streaming...`);

          // LlamaIndex TypeScript streaming (without tools for conversational mode)
          const streamingAgent = agent({
            name: `${self.config.agentName}-stream`,
            llm: self.llm,
            tools: [], // NO TOOLS for streaming conversational mode
            systemPrompt: self.config.systemPrompt,
            verbose: false
          });

          // Use LlamaIndex TS streaming API with stream: true
          const streamResponse = await streamingAgent.run(message, {
            chatHistory: chatHistory,
            stream: true // StreamingChatEngineParams
          });

          console.log(`\ud83c\udf0a Stream response type: ${typeof streamResponse}`);

          // Stream chunks from LlamaIndex response
          let fullContent = '';

          // Check if it's already an AsyncIterable
          if (streamResponse && typeof streamResponse[Symbol.asyncIterator] === 'function') {
            for await (const chunk of streamResponse) {
              const content = self.extractStreamChunk(chunk);
              if (content) {
                fullContent += content;
                yield {
                  type: 'content',
                  content: content,
                  metadata: {
                    model: self.config.model,
                    agentName: self.config.agentName,
                    streaming: true
                  }
                };
              }
            }
          } else {
            // Fallback: treat as single response
            const content = String(streamResponse || '');
            fullContent = content;
            yield {
              type: 'content',
              content: content,
              metadata: {
                model: self.config.model,
                agentName: self.config.agentName,
                streaming: false
              }
            };
          }

          // Final metadata chunk
          yield {
            type: 'metadata',
            metadata: {
              model: self.config.model,
              agentName: self.config.agentName,
              processingTime: Date.now() - startTime,
              contentLength: fullContent.length,
              toolsUsed: [],
              streaming: true,
              streamingSupported: true
            }
          };

          console.log(`✅ Streaming completed: ${fullContent.length} chars`);

        } catch (error) {
          console.error(`❌ Streaming error:`, error);
          yield {
            type: 'error',
            error: (error as Error).message,
            metadata: {
              model: self.config.model,
              agentName: self.config.agentName,
              processingTime: Date.now() - startTime
            }
          };
        }
      }
    };
  }

  /**
   * Extract content from streaming chunk
   */
  private extractStreamChunk(chunk: any): string {
    // Handle different chunk formats from LlamaIndex streaming
    if (typeof chunk === 'string') {
      return chunk;
    }

    if (chunk?.content) {
      return chunk.content;
    }

    if (chunk?.delta?.content) {
      return chunk.delta.content;
    }

    if (chunk?.choices?.[0]?.delta?.content) {
      return chunk.choices[0].delta.content;
    }

    return '';
  }

  /**
   * Crear prompt optimizado para ProductivityAssistant
   *
   * Inspirado en los patterns oficiales de LlamaIndex 2025:
   * - Query Planning automático
   * - Tool coordination explícito
   * - Structured outputs
   */
  private createProductivityPrompt(): string {
    const basePrompt = this.config.systemPrompt;
    const toolNames = this.config.tools.map(t => t.metadata.name).join(', ');

    return `${basePrompt}

🚨 **INSTRUCCIÓN CRÍTICA** (Basado en Ghosty que SÍ funciona) 🚨
Herramientas disponibles: [${toolNames}]

**REGLAS OBLIGATORIAS DE HERRAMIENTAS**:
1. "recuérdame", "agenda", "avísame", "programa" → EJECUTA schedule_reminder INMEDIATAMENTE
2. "qué recordatorios tengo", "mis citas" → EJECUTA list_reminders
3. "pagar", "cobrar", "link de pago" → EJECUTA create_payment_link
4. NUNCA respondas "te ayudo a crear" o "puedo programar" - EJECUTA DIRECTAMENTE
5. NO pidas confirmación adicional - el usuario ya te pidió la acción
6. NO simules ni describas lo que "harías" - HAZ LA ACCIÓN

**PROCESO ESTRICTO**:
1. Detecta si el mensaje requiere herramienta
2. EJECUTA la herramienta apropiada SIN DEMORA
3. Responde solo con el resultado real
4. PROHIBIDO: frases como "voy a ayudarte", "necesito que", "te haré"`;
  }

  /**
   * Crear prompt específico para forzar tool execution
   */
  private createToolExecutionPrompt(userMessage: string): string {
    const availableTools = this.config.tools.map(t => t.metadata.name).join(', ');

    return `USER REQUEST: ${userMessage}

IMPORTANT: This is a productivity task that requires tool execution.
Available tools: [${availableTools}]

You MUST use the appropriate tools to complete this request. Do not just provide information - take action by executing the tools.

Analyze the request and execute the necessary tools now.`;
  }
}