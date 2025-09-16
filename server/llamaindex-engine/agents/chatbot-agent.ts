/**
 * ChatbotAgent v1.0 - Agente especializado para chatbots de usuario
 *
 * Usa el LlamaIndexEngine v0.0.1 como base
 * Reemplaza el Formmy Agent Framework manteniendo compatibilidad completa
 */

import type { User, Chatbot } from "@prisma/client";
import type { Agent, ExecutionContext, EngineResponse, AgentProfile } from "../core/types";
import { LlamaIndexEngine } from "../core/engine";
import { createChatbotTools } from "../tools/chatbot-tools";

export class ChatbotAgent implements Agent {
  name = 'ChatbotAgent';
  version = '1.0';
  description = 'Agente especializado para chatbots de usuarios con modelo configurable';

  private engine: LlamaIndexEngine;
  private chatbot: Chatbot;
  private user: User;
  private profile: AgentProfile;

  constructor(chatbot: Chatbot, user: User, options: {
    contexts?: any[];
    integrations?: Record<string, any>;
  } = {}) {
    this.chatbot = chatbot;
    this.user = user;

    // Crear perfil del agente
    this.profile = this.createAgentProfile();

    console.log(`🤖 Creating ChatbotAgent for chatbot: ${chatbot.name} (${chatbot.aiModel})`);

    // Crear herramientas específicas para este chatbot
    const tools = createChatbotTools({
      user,
      chatbot,
      userPlan: user.plan,
      integrations: options.integrations || {},
    });

    // Configurar motor con las especificaciones del chatbot
    this.engine = new LlamaIndexEngine({
      model: chatbot.aiModel || 'gpt-5-nano',
      temperature: this.getTemperatureForModel(chatbot.aiModel, chatbot.temperature),
      systemPrompt: this.createSystemPrompt(options.contexts),
      tools,
      maxIterations: this.getMaxIterationsForPlan(user.plan),
      agentName: this.name,
      version: this.version,
    });

    console.log(`✅ ChatbotAgent created: ${tools.length} tools, model: ${chatbot.aiModel}`);
  }

  /**
   * Chat principal - interface del agente
   */
  async chat(message: string, context: ExecutionContext, streaming = false): Promise<EngineResponse | AsyncIterable<any>> {
    // Agregar metadata específica del chatbot
    const chatbotContext: ExecutionContext = {
      ...context,
      chatbot: this.chatbot,
      metadata: {
        ...context.metadata,
        chatbotId: this.chatbot.id,
        agentType: 'chatbot',
        userModel: this.chatbot.aiModel,
      }
    };

    // Ejecutar con el motor (pasar streaming)
    const response = await this.engine.chat(message, chatbotContext, streaming);

    // Handle streaming vs non-streaming response
    if (this.isAsyncIterable(response)) {
      // Streaming mode: return AsyncIterable directly
      return response;
    } else {
      // Non-streaming mode: post-process EngineResponse
      return this.postProcessResponse(response);
    }
  }

  /**
   * Crear perfil del agente
   */
  private createAgentProfile(): AgentProfile {
    return {
      name: this.name,
      version: this.version,
      description: `Agente para chatbot: ${this.chatbot.name}`,

      // Configuración de modelo - EL USUARIO DECIDE
      defaultModel: this.chatbot.aiModel || 'gpt-5-nano',
      allowModelOverride: false, // Respetamos la elección del usuario

      // Herramientas basadas en plan del usuario
      allowedTools: this.getAllowedToolsForPlan(this.user.plan),

      // Prompts personalizables
      systemPromptTemplate: this.chatbot.instructions || 'Eres un asistente útil.',

      // Configuraciones optimizadas para chatbot
      maxIterations: this.getMaxIterationsForPlan(this.user.plan),
      temperature: this.chatbot.temperature,

      // UI simple para usuarios finales
      uiLevel: 'simple',
      capabilities: [
        'conversacion_natural',
        'contexto_personalizado',
        ...(this.hasToolsAvailable() ? ['herramientas_inteligentes'] : [])
      ],
    };
  }

  /**
   * Crear system prompt personalizado del chatbot
   */
  private createSystemPrompt(contexts?: any[]): string {
    let prompt = this.chatbot.instructions || "Eres un asistente útil.";

    // Agregar instrucciones personalizadas del usuario
    if (this.chatbot.customInstructions && this.chatbot.customInstructions.trim()) {
      prompt += "\n\n=== INSTRUCCIONES ESPECÍFICAS ===\n";
      prompt += this.chatbot.customInstructions;
      prompt += "\n=== FIN INSTRUCCIONES ESPECÍFICAS ===\n";
    }

    // Agregar contexto si está disponible
    if (contexts && contexts.length > 0) {
      prompt += "\n\n=== CONTEXTO RELEVANTE ===\n";
      contexts.forEach((context, index) => {
        prompt += `${index + 1}. ${context.title || 'Contexto'}\n`;
        if (context.content) {
          prompt += `${context.content.substring(0, 1000)}...\n\n`;
        }
      });
      prompt += "=== FIN CONTEXTO ===\n";
    }

    // Instrucciones de comportamiento para chatbot de usuario final
    prompt += `\nComportamiento:
- Eres el chatbot personalizado del usuario, sigue sus instrucciones específicas
- Mantén el tono y personalidad definidos en las instrucciones
- Si tienes herramientas disponibles, úsalas cuando sea apropiado
- Responde de forma útil y concisa para el usuario final`;

    return prompt;
  }

  /**
   * Post-procesar respuesta para UI simple
   */
  private postProcessResponse(response: EngineResponse): EngineResponse {
    // Para ChatPreview, simplificar metadata
    return {
      ...response,
      metadata: {
        model: response.metadata.model,
        agentName: response.metadata.agentName,
        processingTime: response.metadata.processingTime,
        iterations: response.metadata.iterations,
        // Mantener tokensUsed si está disponible
        tokensUsed: response.metadata.tokensUsed,
      },
      // Remover debug info en producción
      debug: process.env.NODE_ENV === 'development' ? response.debug : undefined,
    };
  }

  /**
   * Herramientas permitidas por plan
   */
  private getAllowedToolsForPlan(plan: string): string[] {
    const baseTool = [];

    if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(plan)) {
      baseTool.push('schedule_reminder');
    }

    // Stripe solo si el usuario lo configuró
    // Esto se maneja en createChatbotTools

    return baseTool;
  }

  /**
   * Iteraciones máximas por plan
   */
  private getMaxIterationsForPlan(plan: string): number {
    switch (plan) {
      case 'ENTERPRISE':
        return 6; // Más iteraciones para Enterprise
      case 'PRO':
        return 5;
      case 'TRIAL':
      case 'STARTER':
        return 4;
      default:
        return 3; // FREE limitado
    }
  }

  /**
   * Check si el chatbot tiene herramientas disponibles
   */
  private hasToolsAvailable(): boolean {
    return ['PRO', 'ENTERPRISE', 'TRIAL'].includes(this.user.plan);
  }

  /**
   * Obtener temperature correcta para el modelo
   */
  private getTemperatureForModel(model?: string, configTemp?: number): number {
    // Toda la familia GPT-5 solo soporta temperature=1
    if (model?.startsWith('gpt-5')) {
      return 1;
    }

    return configTemp ?? 0.7;
  }

  /**
   * Obtener configuración actual
   */
  getConfig() {
    return this.engine.getConfig();
  }

  /**
   * Test del agente
   */
  async test(): Promise<{ success: boolean; error?: string }> {
    try {
      const engineTest = await this.engine.test();

      if (!engineTest.success) {
        return engineTest;
      }

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Información del agente para debugging
   */
  getInfo(): {
    name: string;
    version: string;
    chatbotName: string;
    model: string;
    userPlan: string;
    toolsCount: number;
    capabilities: string[];
  } {
    const config = this.getConfig();

    return {
      name: this.name,
      version: this.version,
      chatbotName: this.chatbot.name,
      model: config.model,
      userPlan: this.user.plan,
      toolsCount: config.tools.length,
      capabilities: this.profile.capabilities,
    };
  }

  /**
   * Analizar intent del mensaje (delegado al motor)
   */
  async analyzeIntent(message: string): Promise<boolean> {
    return await this.engine.analyzeIntent(message);
  }

  /**
   * Check if response is AsyncIterable (streaming)
   */
  private isAsyncIterable(obj: any): obj is AsyncIterable<any> {
    return obj != null && typeof obj[Symbol.asyncIterator] === 'function';
  }

  /**
   * Resetear agente (útil para cambios de configuración)
   */
  reset(): void {
    this.engine.reset();
    console.log(`🔄 ChatbotAgent reset for: ${this.chatbot.name}`);
  }
}