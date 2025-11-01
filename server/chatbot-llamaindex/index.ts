/**
 * CHATBOT LLAMAINDEX ADAPTER
 *
 * Reemplaza el Formmy Agent Framework con LlamaIndex 2025 patterns
 * Mantiene API compatible pero usa LlamaIndex internamente
 */

import {
  FunctionTool,
  OpenAI,
  Settings,
  ReActAgent,
  ChatMessage,
  MessageType
} from "llamaindex";
import type { User, Chatbot } from "@prisma/client";
import { createReminderTools } from "./tools/reminder-tools";
import { createStripeTools } from "./tools/stripe-tools";

export interface ChatbotLlamaIndexOptions {
  chatbot: Chatbot;
  user: User;
  model?: string;
  temperature?: number;
  contexts?: any[];
  integrations?: Record<string, any>;
}

export interface LlamaIndexResponse {
  content: string;
  toolsUsed: string[];
  sources?: any[];
  iterations?: number;
  error?: string;
}

/**
 * CHATBOT USANDO LLAMAINDEX 2025 PATTERNS
 * Drop-in replacement para Formmy Agent Framework
 */
export class ChatbotLlamaIndex {
  private agent: ReActAgent | null = null;
  private llm: OpenAI;
  private tools: FunctionTool[] = [];
  private options: ChatbotLlamaIndexOptions;

  constructor(options: ChatbotLlamaIndexOptions) {
    this.options = options;

    // Configurar LLM con modelo específico
    this.llm = new OpenAI({
      model: options.model || "gpt-5-nano",
      temperature: options.temperature || undefined, // GPT-5-nano no soporta temperature
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Set global LLM
    Settings.llm = this.llm;

  }

  /**
   * Initialize agent with tools - Lazy loading
   */
  private async initializeAgent(): Promise<void> {
    if (this.agent) return;

    try {
      // 1. Create tools based on user plan and integrations
      await this.setupTools();

      // 2. Create system message with chatbot personality
      const systemMessage = this.createSystemMessage();

      // 3. Create ReAct agent with tools
      this.agent = new ReActAgent({
        tools: this.tools,
        llm: this.llm,
        systemPrompt: systemMessage,
      });


    } catch (error) {
      console.error("❌ Error initializing LlamaIndex agent:", error);
      throw error;
    }
  }

  /**
   * Setup tools based on user plan and integrations
   */
  private async setupTools(): Promise<void> {
    const { user, integrations } = this.options;
    this.tools = [];

    // REMINDER TOOLS - Available for PRO, ENTERPRISE, TRIAL
    if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(user.plan)) {
      try {
        const reminderTools = await createReminderTools({
          chatbotId: this.options.chatbot.id,
          userId: user.id,
          userPlan: user.plan,
        });
        this.tools.push(...reminderTools);
      } catch (error) {
        console.error("❌ Error creating reminder tools:", error);
      }
    }

    // STRIPE TOOLS - Available if integration exists
    if (integrations?.stripe) {
      try {
        const stripeTools = await createStripeTools({
          chatbotId: this.options.chatbot.id,
          userId: user.id,
          stripeConfig: integrations.stripe,
        });
        this.tools.push(...stripeTools);
      } catch (error) {
        console.error("❌ Error creating Stripe tools:", error);
      }
    }
  }

  /**
   * Create system message with chatbot personality and context
   */
  private createSystemMessage(): string {
    const { chatbot, contexts } = this.options;

    let systemPrompt = `Eres ${chatbot.name}, un asistente virtual ${chatbot.personality || 'útil y amigable'}.

INSTRUCCIONES BASE:
${chatbot.instructions || 'Responde de manera profesional y clara a las preguntas de los usuarios.'}

${chatbot.customInstructions ? `INSTRUCCIONES ADICIONALES:\n${chatbot.customInstructions}` : ''}

REGLAS CRÍTICAS ANTI-FALSIFICACIÓN:
🚫 JAMÁS digas que "agendaste", "registré", "programé" o "confirmé" algo si NO usaste herramientas
🚫 PROHIBIDO fingir acciones: "Ya agendé...", "He registrado...", "Confirmé..."
✅ SOLO menciona acciones completadas si realmente ejecutaste herramientas y recibiste confirmación
✅ Si detectas comandos de agendado ("agenda", "recordame", "avísame") → USA INMEDIATAMENTE la herramienta correspondiente

MANEJO DE INFORMACIÓN:
- Si no tienes información específica, di claramente: "No tengo esa información específica"
- NUNCA inventes datos como fechas, horas, nombres, lugares
- Usa SOLO información explícitamente proporcionada en el contexto o conversación`;

    // Add context if available
    if (contexts && contexts.length > 0) {
      systemPrompt += "\n\nCONTEXTO DISPONIBLE:\n";
      contexts.forEach((context, index) => {
        systemPrompt += `${index + 1}. ${context.title || 'Documento'}: ${context.content || context.url}\n`;
      });
    }

    return systemPrompt;
  }

  /**
   * Main chat method - Compatible with existing API
   */
  async chat(
    message: string,
    options: {
      conversationHistory?: Array<{ role: string; content: string }>;
      sessionId?: string;
      stream?: boolean;
    } = {}
  ): Promise<LlamaIndexResponse> {

    const startTime = Date.now();

    try {
      // Initialize agent if needed
      await this.initializeAgent();

      if (!this.agent) {
        throw new Error("Agent initialization failed");
      }

      // Convert conversation history to LlamaIndex format
      const chatHistory: ChatMessage[] = [];

      if (options.conversationHistory) {
        for (const msg of options.conversationHistory) {
          chatHistory.push(new ChatMessage({
            role: msg.role as MessageType,
            content: msg.content,
          }));
        }
      }

      // Execute chat with LlamaIndex agent
      const response = await this.agent.chat({
        message,
        chatHistory,
        stream: options.stream || false,
      });

      // Extract tools used from response (if available in metadata)
      const toolsUsed: string[] = [];
      // Note: LlamaIndex provides tool usage info in response metadata
      // This will be populated based on actual LlamaIndex response structure

      const duration = Date.now() - startTime;

      return {
        content: response.response,
        toolsUsed,
        sources: [], // Can be populated from retrieval if used
        iterations: 1, // LlamaIndex handles iterations internally
      };

    } catch (error) {
      console.error("❌ ChatbotLlamaIndex error:", error);

      return {
        content: "Lo siento, ha ocurrido un error inesperado. Por favor, intenta de nuevo.",
        toolsUsed: [],
        iterations: 0,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Get available tools for debugging
   */
  getAvailableTools(): string[] {
    return this.tools.map(t => t.metadata.name);
  }

  /**
   * Reset agent (for testing)
   */
  reset(): void {
    this.agent = null;
    this.tools = [];
  }
}

/**
 * FACTORY FUNCTION - Drop-in replacement para crear agents
 */
export async function createChatbotAgent(options: ChatbotLlamaIndexOptions): Promise<ChatbotLlamaIndex> {
  const agent = new ChatbotLlamaIndex(options);
  return agent;
}

// Export for compatibility
export default ChatbotLlamaIndex;