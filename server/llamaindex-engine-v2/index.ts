/**
 * LlamaIndex Engine v2.0 - Clean Implementation
 *
 * Implementación correcta basada en LlamaIndex 0.11.29
 * Focus: Streaming por defecto, tools cuando necesario
 *
 * ⚠️ PROBLEMA CRÍTICO (Septiembre 2025):
 * Una vez en streaming mode, no detecta tools en mensajes posteriores.
 * Síntoma: Primera detección funciona, después mantiene streaming.
 * Workaround: Usar /dashboard/ghosty con LlamaIndex 2025 AgentWorkflow.
 */

import dotenv from "dotenv";
dotenv.config();

import { Settings, FunctionTool } from "llamaindex";
import { openai } from "@llamaindex/openai";
import { agent } from "@llamaindex/workflow";
import type { ChatMessage } from "@llamaindex/core/llms";
import OpenAI from "openai";

export interface StreamingChatOptions {
  message: string;
  chatbot: any;
  user: any;
  options: {
    contexts?: any[];
    conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>;
    integrations?: any;
    model?: string;
    temperature?: number;
    sessionId?: string;
    stream?: boolean;
  };
}

export interface ChatResponse {
  content: string;
  processingTime: number;
  toolsUsed: string[];
  success: boolean;
  error?: string;
  metadata?: any;
}

/**
 * Core LlamaIndex Chat Engine con Streaming
 */
export class LlamaIndexChatEngine {
  private llm: any; // LlamaIndex LLM instance
  private openaiClient: OpenAI; // OpenAI client for streaming
  private tools: FunctionTool[] = [];
  private model: string;
  private temperature?: number;

  constructor(model: string = "gpt-5-nano", temperature?: number) {
    this.model = model;
    this.temperature = temperature;

    // Create OpenAI client for streaming
    this.openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Create LlamaIndex LLM wrapper for tools
    const llmConfig: any = {
      model: this.model,
      apiKey: process.env.OPENAI_API_KEY,
    };

    // GPT-5 models use maxCompletionTokens instead of maxTokens
    if (model.startsWith('gpt-5')) {
      llmConfig.maxCompletionTokens = 1000;
    } else {
      llmConfig.maxTokens = 1000;
    }

    // Temperature config - GPT-5 nano only supports temperature = 1
    if (model === 'gpt-5-nano') {
      llmConfig.temperature = 1; // GPT-5 nano solo soporta temperature = 1
    } else if (temperature !== undefined) {
      llmConfig.temperature = temperature;
    }

    this.llm = openai(llmConfig);
  }

  /**
   * Agregar herramientas al engine
   */
  addTool(tool: FunctionTool) {
    this.tools.push(tool);
  }

  /**
   * Chat con streaming automático
   * Streaming ON por defecto, OFF solo si hay herramientas y el mensaje las requiere
   */
  async chat(options: StreamingChatOptions): Promise<AsyncGenerator<string> | ChatResponse> {
    const { message, options: chatOptions } = options;

    // 🧠 SMART APPROACH: Dejar que el LLM decida cuándo usar herramientas
    // En lugar de detectar keywords restrictivamente, confiamos en el agent
    const hasTools = this.tools.length > 0;

    // 🚨 STREAMING DESHABILITADO para compatibilidad con tools
    const shouldStream = false; // NO STREAMING para permitir tool execution


    if (shouldStream) {
      console.log('🌊 LlamaIndex v2: Usando modo STREAMING');
      return this.streamingChat(message, chatOptions);
    } else {
      console.log(`⚡ LlamaIndex v2: Usando modo AGENT ${hasTools ? `con ${this.tools.length} herramientas` : 'sin herramientas'}`);
      return this.regularChat(message, chatOptions);
    }
  }

  /**
   * Detectar si el mensaje necesita herramientas
   */
  private detectToolNeed(message: string): boolean {
    const lowerMessage = message.toLowerCase();

    // Palabras clave para recordatorios (incluye variantes sin acentos)
    const reminderKeywords = [
      'recordar', 'recordatorio', 'recuérdame', 'recuerdame', 'agendar', 'agenda',
      'cita', 'avísame', 'avisame', 'notifícame', 'notificame', 'programar', 'alarma',
      'reminder', 'schedule', 'appointment', 'alert'
    ];

    // Palabras clave para pagos (cuando se reactive Stripe)
    const paymentKeywords = [
      'pagar', 'cobrar', 'link de pago', 'payment', 'stripe'
    ];

    // Verificar si el mensaje contiene palabras clave de herramientas
    const hasReminderKeywords = reminderKeywords.some(kw => lowerMessage.includes(kw));
    const hasPaymentKeywords = paymentKeywords.some(kw => lowerMessage.includes(kw));

    const needsTools = hasReminderKeywords || hasPaymentKeywords;

    // 🔍 DEBUG: Enhanced logging para debugging
    console.log('🔍 Engine v2 detectToolNeed:', {
      message: message.substring(0, 50) + '...',
      lowerMessage: lowerMessage.substring(0, 50) + '...',
      hasReminderKeywords,
      hasPaymentKeywords,
      needsTools,
      toolsAvailable: this.tools.length,
      toolNames: this.tools.map(t => t.metadata.name)
    });

    return needsTools;
  }

  /**
   * Streaming chat (sin herramientas)
   */
  private async *streamingChat(message: string, options: any): AsyncGenerator<string> {
    try {
      // Convertir historial a formato OpenAI
      const messages = this.buildMessages(message, options.conversationHistory, false, options.chatbot);

      // OpenAI streaming API
      const chatParams: any = {
        model: this.model,
        messages,
        stream: true
      };

      // GPT-5-nano solo soporta temperature = 1 (default)
      if (this.model !== 'gpt-5-nano' && this.temperature !== undefined) {
        chatParams.temperature = this.temperature;
      }

      const response = await this.openaiClient.chat.completions.create(chatParams);

      // Yield cada chunk del stream
      for await (const chunk of response) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }
    } catch (error) {
      console.error('❌ Streaming error:', error);
      yield `Error en streaming: ${error.message}`;
    }
  }

  /**
   * Chat regular (con herramientas)
   */
  private async regularChat(message: string, options: any): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      if (this.tools.length > 0) {
        // Usar agent workflow para herramientas
        console.log('🤖 LlamaIndex v2: Iniciando Agent Workflow con herramientas');
        console.log(`📋 Herramientas disponibles: ${this.tools.map(t => t.metadata.name).join(', ')}`);

        // Configurar Settings globalmente para LlamaIndex
        // IMPORTANTE: Settings global afecta a todos los componentes
        Settings.llm = this.llm;

        // Construir mensajes con system prompt completo (chatbot + herramientas)
        const messages = this.buildMessages(message, options.conversationHistory, true, options.chatbot);
        const systemPrompt = messages.find(m => m.role === 'system')?.content;
        console.log(`💬 System prompt: ${systemPrompt?.substring(0, 100)}...`);

        // 🧠 IMPROVED: agent() con verbose + better prompting
        console.log('🚀 Creating enhanced agent workflow with reasoning...');
        const agentWorkflow = agent({
          name: 'llamaindex-v2-enhanced',
          llm: this.llm,
          tools: this.tools,
          systemPrompt,
          description: 'Enhanced LlamaIndex v2 with explicit reasoning and tool usage',
          verbose: true // ✅ VERBOSE = TRUE para ver proceso de pensamiento
        });

        console.log(`📤 Enviando mensaje al agente: "${message}"`);

        // Preparar chat history en formato LlamaIndex
        const chatHistory: ChatMessage[] = messages
          .filter(m => m.role !== 'system')
          .map(m => ({
            role: m.role as "user" | "assistant",
            content: m.content
          } as ChatMessage));

        // Ejecutar el workflow
        const response = await agentWorkflow.run(message, {
          chatHistory: chatHistory.slice(0, -1) // Excluir el mensaje actual
        });

        console.log('📥 Respuesta recibida del agente');

        // Extraer contenido de la respuesta
        let content = '';

        // LlamaIndex workflow devuelve un objeto con estructura específica
        if (response?.data?.message?.content) {
          content = response.data.message.content;
        } else if (response?.data?.result) {
          content = response.data.result;
        } else if (response.message?.content) {
          content = response.message.content;
        } else if (response.response) {
          content = response.response;
        } else if (typeof response === 'string') {
          content = response;
        } else {
          console.log('🔍 Respuesta completa del agente:', JSON.stringify(response, null, 2));
          content = JSON.stringify(response);
        }

        return {
          content,
          processingTime: Date.now() - startTime,
          toolsUsed: this.extractToolsUsed(response),
          success: true,
          metadata: {
            model: this.model,
            provider: 'llamaindex-v2',
            hasTools: this.tools.length > 0
          }
        };
      } else {
        // Chat simple sin herramientas
        const messages = this.buildMessages(message, options.conversationHistory, false, options.chatbot);
        const chatParams: any = {
          model: this.model,
          messages,
          stream: false
        };

        // GPT-5-nano solo soporta temperature = 1 (default)
        if (this.model !== 'gpt-5-nano' && this.temperature !== undefined) {
          chatParams.temperature = this.temperature;
        }

        const response = await this.openaiClient.chat.completions.create(chatParams);

        return {
          content: response.choices[0]?.message?.content || "",
          processingTime: Date.now() - startTime,
          toolsUsed: [],
          success: true,
          metadata: {
            model: this.model,
            provider: 'llamaindex-v2',
            hasTools: false
          }
        };
      }
    } catch (error) {
      console.error('❌ Error en regularChat:', error);
      return {
        content: `Error: ${error.message}`,
        processingTime: Date.now() - startTime,
        toolsUsed: [],
        success: false,
        error: error.message,
        metadata: { provider: 'llamaindex-v2' }
      };
    }
  }

  /**
   * Construir mensajes para LlamaIndex
   */
  private buildMessages(message: string, history: any[] = [], includeToolsPrompt: boolean = false, chatbot?: any) {
    const messages = [];

    // Construir system prompt completo
    let systemPrompt = '';

    // 1. Agregar personalidad y instrucciones del chatbot
    if (chatbot) {
      if (chatbot.personality) {
        systemPrompt += `Personalidad: ${chatbot.personality}\n\n`;
      }
      if (chatbot.instructions) {
        systemPrompt += `Instrucciones: ${chatbot.instructions}\n\n`;
      }
      if (chatbot.customInstructions) {
        systemPrompt += `Instrucciones adicionales: ${chatbot.customInstructions}\n\n`;
      }
    }

    // 2. Si hay herramientas, agregar INSTRUCCIONES CRÍTICAS (basado en Ghosty que SÍ funciona)
    if (includeToolsPrompt && this.tools.length > 0) {
      const toolsInfo = this.tools.map(t => `- ${t.metadata.name}: ${t.metadata.description}`).join('\n');
      systemPrompt += `

**🚨 INSTRUCCIÓN CRÍTICA**: SIEMPRE evalúa si el usuario necesita ayuda con acciones concretas. Para CUALQUIER solicitud relacionada con recordatorios, agenda, eventos, pagos, tareas o planificación, SIEMPRE usa las herramientas disponibles.

**🧠 RAZONAMIENTO REQUERIDO**: Antes de responder, EXPLICA tu proceso de pensamiento paso a paso:
1. ¿Qué quiere el usuario exactamente?
2. ¿Qué herramientas podrían ser útiles?
3. ¿Por qué eliges esta acción?

**HERRAMIENTAS DISPONIBLES**:
${toolsInfo}

**REGLAS DE USO DE HERRAMIENTAS**:
1. Si dicen "recuérdame", "agenda", "avísame", "programa", "misa", "fiesta", "evento" → USA schedule_reminder INMEDIATAMENTE
2. Si preguntan "qué recordatorios tengo", "mis citas" → USA list_reminders
3. Si quieren "pagar", "cobrar", "link de pago" → USA create_payment_link
4. **CRÍTICO**: Si falta información (hora), USA valores por defecto sensatos:
   - Hora faltante → "09:00" (mañana)
   - Eventos religiosos (misa) → "10:00"
   - Fiestas → "20:00" (noche)
5. **PROHIBIDO**: NUNCA pidas más información - EJECUTA con defaults inteligentes
6. **FORMATO**: Después de ejecutar tool, pregunta si quiere ajustar la hora
5. NO pidas confirmación adicional - el usuario ya te pidió la acción

**PROCESO OBLIGATORIO**:
1. Identifica si el mensaje requiere una herramienta
2. USA la herramienta apropiada INMEDIATAMENTE
3. Responde con el resultado de la herramienta
4. NO simules ni describas lo que "harías"`;
    }

    // Agregar system prompt si hay contenido
    if (systemPrompt.trim()) {
      messages.push({
        role: "system",
        content: systemPrompt.trim()
      });
    }

    // Agregar historial
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    }

    // Agregar mensaje actual
    messages.push({
      role: "user",
      content: message
    });

    return messages;
  }

  /**
   * Extraer herramientas usadas de la respuesta
   * Implementación basada en Engine core que SÍ funciona
   */
  private extractToolsUsed(response: any): string[] {
    const toolsUsed: string[] = [];

    console.log(`🔍 extractToolsUsed: Analyzing workflowResult type=${typeof response}`);

    // LlamaIndex AgentWorkflow Pattern: response.data.state.memory.messages
    if (response?.data?.state?.memory?.messages) {
      console.log(`🔍 Analyzing memory messages: ${response.data.state.memory.messages.length} messages`);

      for (const message of response.data.state.memory.messages) {
        // Pattern 1: Assistant message with toolCall
        if (message.role === 'assistant' && message.options?.toolCall) {
          for (const toolCall of message.options.toolCall) {
            if (toolCall.name) {
              toolsUsed.push(toolCall.name);
              console.log(`✅ Found tool in memory.toolCall: ${toolCall.name}`);
            }
          }
        }

        // Pattern 2: User message with toolResult
        if (message.role === 'user' && message.options?.toolResult) {
          const toolResult = message.options.toolResult;
          if (toolResult.result) {
            try {
              // Try to parse the result to find toolUsed
              const cleanResult = toolResult.result.replace(/\\\\/g, '\\').replace(/\\"/g, '"');
              if (cleanResult.includes('toolUsed')) {
                const match = cleanResult.match(/toolUsed[":]+([^"',}]+)/);
                if (match && match[1]) {
                  toolsUsed.push(match[1].trim());
                  console.log(`✅ Found tool in toolResult: ${match[1].trim()}`);
                }
              }
            } catch (e) {
              console.log(`⚠️ Could not parse toolResult: ${e.message}`);
            }
          }
        }
      }
    }

    // Fallback: Content analysis for tool names
    if (toolsUsed.length === 0 && response?.data?.result) {
      const result = response.data.result;
      if (typeof result === 'string') {
        const availableToolNames = this.tools.map(t => t.metadata.name);
        for (const toolName of availableToolNames) {
          if (result.includes('ID:') && (toolName === 'schedule_reminder' || toolName === 'create_payment_link')) {
            toolsUsed.push(toolName);
            console.log(`✅ Found tool by content analysis (ID found): ${toolName}`);
            break; // Only add one tool per response
          }
        }
      }
    }

    const uniqueTools = [...new Set(toolsUsed)];
    console.log(`🔍 extractToolsUsed final result: [${uniqueTools.join(', ')}]`);

    return uniqueTools;
  }
}

/**
 * Factory function para crear engine configurado
 */
export async function createStreamingEngine(
  chatbot: any,
  user: any,
  options: any = {}
): Promise<LlamaIndexChatEngine> {
  const model = chatbot.aiModel || "gpt-5-nano";
  const temperature = chatbot.temperature;

  const engine = new LlamaIndexChatEngine(model, temperature);

  // Agregar herramientas según el plan del usuario
  if (user.plan === 'TRIAL' || user.plan === 'PRO' || user.plan === 'ENTERPRISE') {
    console.log(`🔧 Engine v2: Agregando herramientas para plan ${user.plan}`);
    const tools = await createChatbotTools(chatbot, user);
    console.log(`🔧 Engine v2: ${tools.length} herramientas creadas, agregando al engine...`);
    for (const tool of tools) {
      engine.addTool(tool);
    }
    console.log(`🔧 Engine v2: Engine ahora tiene ${engine.tools.length} herramientas`);
  } else {
    console.log(`⚠️ Engine v2: Plan ${user.plan} sin acceso a herramientas`);
  }

  return engine;
}

/**
 * Crear herramientas de chatbot usando el registry central
 */
async function createChatbotTools(chatbot: any, user: any): Promise<FunctionTool[]> {
  const tools: FunctionTool[] = [];

  try {
    // Importar el registry de herramientas
    const { getAvailableTools } = await import('../tools/registry');

    // Obtener las herramientas disponibles para el usuario
    // GPT-5-nano y GPT-5-mini soportan herramientas
    const modelSupportsTools = ['gpt-5-nano', 'gpt-5-mini', 'claude-3-haiku-20240307', 'claude-3-5-haiku-20241022'].includes(chatbot.aiModel || 'gpt-5-nano');
    const availableTools = getAvailableTools(user.plan || 'FREE', chatbot.integrations || {}, modelSupportsTools);

    console.log(`📦 LlamaIndex v2: ${availableTools.length} herramientas disponibles para plan ${user.plan}`);

    // Convertir cada herramienta al formato LlamaIndex FunctionTool
    for (const toolDef of availableTools) {
      // Las herramientas del registry devuelven Tool[] no ToolDefinition[]
      // Tool tiene propiedades: name, description, input_schema
      const llamaTool = FunctionTool.from(
        async (args: any) => {
          console.log(`🔧 Ejecutando herramienta: ${toolDef.name}`, args);

          // Crear contexto para la herramienta
          const toolContext = {
            chatbotId: chatbot.id,
            userId: user.id,
            message: args.message || '',
            userPlan: user.plan,
            integrations: chatbot.integrations || {}
          };

          // Ejecutar el handler de la herramienta
          const { executeToolCall } = await import('../tools/registry');
          const result = await executeToolCall(
            toolDef.name,
            args,
            toolContext
          );

          console.log(`✅ Herramienta ${toolDef.name} completada:`, result);

          // Retornar el resultado en formato string para LlamaIndex
          if (typeof result === 'string') {
            return result;
          }
          return JSON.stringify(result);
        },
        {
          name: toolDef.name,
          description: toolDef.description,
          parameters: toolDef.input_schema
        }
      );

      tools.push(llamaTool);
    }

    console.log(`✅ ${tools.length} herramientas LlamaIndex creadas`);
  } catch (error) {
    console.error('❌ Error creando herramientas:', error);
  }

  return tools;
}

/**
 * Función principal para el API - Compatibility layer
 */
export async function chatWithLlamaIndexV2(
  message: string,
  chatbot: any,
  user: any,
  options: any
): Promise<AsyncGenerator<string> | ChatResponse> {
  console.log('🚀 LlamaIndex v2 Engine starting...');

  const engine = await createStreamingEngine(chatbot, user, options);

  const result = await engine.chat({
    message,
    chatbot,
    user,
    options: {
      ...options,
      chatbot // Pasar chatbot en options para acceso en buildMessages
    }
  });

  console.log('✅ LlamaIndex v2 Engine completed');
  return result;
}

export default LlamaIndexChatEngine;