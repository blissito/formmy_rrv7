/**
 * Agent Executor: Loop ReAct mejorado con memoria y decisiones inteligentes
 */

import type { 
  AgentContext, 
  AgentThought, 
  AgentAction, 
  AgentObservation, 
  AgentMemory, 
  AgentDecision,
  AgentCallbacks 
} from './types';

import { AgentCore } from './agent-core';
import { executeToolCall } from '../tools/registry';

export class AgentExecutor {
  private core: AgentCore;
  private callbacks?: AgentCallbacks;
  private memory: AgentMemory[] = [];

  constructor(core: AgentCore, callbacks?: AgentCallbacks) {
    this.core = core;
    this.callbacks = callbacks;
  }

  /**
   * Ejecuta el loop ReAct mejorado
   */
  async run(context: AgentContext): Promise<{
    response: string;
    toolsUsed: string[];
    iterations: number;
    success: boolean;
  }> {
    this.memory = []; // Reset memory para cada ejecución
    let iterations = 0;
    const maxIterations = this.calculateMaxIterations(context.message);
    const toolsUsed: string[] = [];
    
    console.log(`🤖 Starting agent loop for: "${context.message.substring(0, 50)}..." (max ${maxIterations} iterations)`);

    while (iterations < maxIterations) {
      iterations++;
      console.log(`\n🔄 Iteration ${iterations}/${maxIterations}`);

      try {
        // 1. THINK - Decidir qué hacer
        const thought = await this.core.executeWithRetry(
          () => this.think(context, this.memory),
          `think-iteration-${iterations}`
        );
        
        this.callbacks?.onThought?.(thought);

        // Early exit si la confianza es muy baja
        if (thought.confidence < 0.3) {
          console.log(`🤔 Low confidence (${thought.confidence}), ending loop`);
          break;
        }

        // 2. ACT - Ejecutar la acción decidida
        const action = await this.core.executeWithRetry(
          () => this.act(thought, context),
          `act-iteration-${iterations}`
        );
        
        this.callbacks?.onAction?.(action);

        // 3. OBSERVE - Procesar el resultado
        const observation = this.observe(action);
        this.callbacks?.onObservation?.(observation);

        // Guardar en memoria
        const memoryEntry: AgentMemory = {
          thought,
          action,
          observation,
          iteration: iterations,
          timestamp: new Date()
        };
        this.memory.push(memoryEntry);

        // Si usó herramienta, registrarla
        if (action.type === 'tool_call' && action.tool) {
          toolsUsed.push(action.tool);
        }

        // Verificar si completamos la tarea
        if (observation.isComplete || action.type === 'response') {
          console.log(`✅ Task completed after ${iterations} iterations`);
          
          const response = this.synthesizeResponse();
          return {
            response,
            toolsUsed,
            iterations,
            success: true
          };
        }

      } catch (error) {
        console.error(`❌ Error in iteration ${iterations}:`, error);
        
        // Si es la primera iteración, fallar
        if (iterations === 1) {
          return {
            response: this.core.generateUserFriendlyError(error as Error, 'agent-execution'),
            toolsUsed,
            iterations,
            success: false
          };
        }
        
        // Si no, intentar sintetizar con lo que tenemos
        break;
      }
    }

    console.log(`🏁 Loop ended after ${iterations} iterations`);
    
    // Sintetizar respuesta con la información disponible
    const response = this.synthesizeResponse();
    return {
      response,
      toolsUsed,
      iterations,
      success: this.memory.some(m => m.observation.success)
    };
  }

  /**
   * THINK: Decide qué acción tomar basado en contexto y memoria
   */
  private async think(context: AgentContext, memory: AgentMemory[]): Promise<AgentThought> {
    // Construir prompt de pensamiento
    const thinkingPrompt = this.buildThinkingPrompt(context, memory);
    
    // Solicitar decisión al LLM (sin temperature para GPT-5-nano y Haiku)
    const decision = await this.requestDecision(thinkingPrompt, context);
    
    // Convertir decisión a pensamiento
    return {
      content: decision.response || `Voy a ${decision.action}`,
      confidence: decision.confidence,
      reasoning: this.explainReasoning(decision, context),
      needsTools: decision.action === 'use_tool',
      nextAction: decision.action
    };
  }

  /**
   * ACT: Ejecuta la acción decidida en el pensamiento
   */
  private async act(thought: AgentThought, context: AgentContext): Promise<AgentAction> {
    switch (thought.nextAction) {
      case 'use_tool':
        return await this.executeTool(thought, context);
      
      case 'respond':
        return await this.generateResponse(thought, context);
      
      case 'retry':
        return {
          type: 'retry',
          retryReason: 'Previous action failed, trying different approach'
        };
      
      default:
        return await this.generateResponse(thought, context);
    }
  }

  /**
   * OBSERVE: Analiza el resultado de la acción
   */
  private observe(action: AgentAction): AgentObservation {
    switch (action.type) {
      case 'tool_call':
        return {
          success: !action.content?.includes('Error'),
          content: action.content || 'Tool executed',
          isComplete: this.isTaskComplete(action.content || ''),
          data: action.content
        };
      
      case 'response':
        return {
          success: true,
          content: action.content || '',
          isComplete: true
        };
      
      case 'retry':
        return {
          success: false,
          content: action.retryReason || 'Retrying...',
          isComplete: false
        };
      
      default:
        return {
          success: false,
          content: 'Unknown action type',
          isComplete: false
        };
    }
  }

  /**
   * Calcula iteraciones máximas según complejidad del mensaje
   */
  private calculateMaxIterations(message: string): number {
    const messageLength = message.length;
    const complexity = this.estimateComplexity(message);
    
    // Base: 3 iteraciones
    let iterations = 3;
    
    // +1 si el mensaje es largo
    if (messageLength > 100) iterations++;
    
    // +1-2 según complejidad
    if (complexity === 'high') iterations += 2;
    else if (complexity === 'medium') iterations += 1;
    
    return Math.min(iterations, 7); // Máximo 7 iteraciones
  }

  /**
   * Estima complejidad del mensaje
   */
  private estimateComplexity(message: string): 'low' | 'medium' | 'high' {
    const complexWords = [
      'crear', 'generar', 'analizar', 'comparar', 'explicar', 'calcular',
      'buscar', 'encontrar', 'lista', 'pasos', 'proceso', 'cómo', 'por qué'
    ];
    
    const toolKeywords = [
      'pago', 'recordatorio', 'agenda', 'email', 'contacto', 'cobrar'
    ];
    
    const messageLC = message.toLowerCase();
    const hasComplexWords = complexWords.some(word => messageLC.includes(word));
    const hasToolKeywords = toolKeywords.some(word => messageLC.includes(word));
    
    if (hasToolKeywords) return 'high'; // Herramientas siempre son complejas
    if (hasComplexWords && message.length > 50) return 'high';
    if (hasComplexWords || message.length > 100) return 'medium';
    
    return 'low';
  }

  /**
   * Construye prompt específico para ejecución de herramientas
   */
  private buildToolExecutionPrompt(context: AgentContext, memory: AgentMemory[]): string {
    let prompt = `El usuario solicitó: "${context.message}"

Herramientas disponibles:
${context.tools.map(t => `- ${t.name}: ${t.description}`).join('\n')}

`;

    if (memory.length > 0) {
      const lastMemory = memory[memory.length - 1];
      prompt += `Contexto previo: ${lastMemory.thought.reasoning}

`;
    }

    prompt += `EJECUTAR HERRAMIENTA:
Decide qué herramienta usar y con qué argumentos. Responde EXACTAMENTE en formato JSON:
{
  "action": "use_tool",
  "tool_name": "nombre_exacto_de_herramienta",
  "args": {
    "argumento1": "valor1",
    "argumento2": "valor2"
  },
  "confidence": 0.1-1.0
}

REGLAS IMPORTANTES:
- Para recordatorios: usar "schedule_reminder" con title, date (YYYY-MM-DD), time (HH:MM)
- Para ver recordatorios: usar "list_reminders" sin argumentos
- Para pagos: usar "create_payment_link" con amount, description, currency
- SIEMPRE usar nombres exactos de herramientas
- Si no estás seguro, confidence < 0.5`;

    return prompt;
  }

  /**
   * Construye prompt para el pensamiento
   */
  private buildThinkingPrompt(context: AgentContext, memory: AgentMemory[]): string {
    let prompt = `CONTEXTO:
Usuario: "${context.message}"
Herramientas disponibles: ${context.tools.map(t => t.name).join(', ') || 'ninguna'}

`;

    if (memory.length > 0) {
      prompt += `HISTORIAL PREVIO:
`;
      memory.forEach((m, i) => {
        prompt += `${i + 1}. Pensé: ${m.thought.reasoning}
   Acción: ${m.action.type} ${m.action.tool || ''}
   Resultado: ${m.observation.success ? '✅' : '❌'} ${m.observation.content.substring(0, 100)}...

`;
      });
    }

    prompt += `DECISIÓN REQUERIDA:
Analiza la situación y decide qué hacer. Responde EXACTAMENTE en formato JSON:
{
  "action": "use_tool" | "respond" | "retry",
  "tool_name": "nombre_exacto" (solo si action es use_tool),
  "args": {...} (solo si action es use_tool),
  "response": "tu respuesta" (solo si action es respond),
  "confidence": 0.1-1.0,
  "reasoning": "explicación breve"
}

REGLAS:
- Si detectas palabras como "recordatorio", "agenda", "pago" y hay herramientas, SIEMPRE usa "use_tool"
- Si el usuario pregunta algo simple sin necesidad de herramientas, usa "respond"
- Si la iteración anterior falló, usa "retry" con diferente enfoque
- Confidence alto (>0.8) para acciones claras, bajo (<0.5) si no estás seguro`;

    return prompt;
  }

  /**
   * Solicita decisión al LLM
   */
  private async requestDecision(prompt: string, context: AgentContext): Promise<AgentDecision> {
    // Usar el proveedor actual del contexto
    const providerWrapper = this.createProviderWrapper(context);
    
    const response = await providerWrapper.generateResponse(prompt, false);
    
    try {
      const decision = JSON.parse(response);
      
      // Validar estructura
      if (!decision.action || !decision.confidence) {
        throw new Error('Invalid decision format');
      }
      
      return {
        action: decision.action,
        tool_name: decision.tool_name,
        args: decision.args,
        response: decision.response,
        confidence: Math.max(0.1, Math.min(1.0, decision.confidence))
      };
      
    } catch (parseError) {
      console.log('🔄 Failed to parse LLM decision, using fallback');
      
      // Fallback: decision basada en keywords
      return this.makeFallbackDecision(context.message, context.tools);
    }
  }

  /**
   * Decision de fallback basada en keywords
   */
  private makeFallbackDecision(message: string, tools: any[]): AgentDecision {
    const messageLC = message.toLowerCase();
    
    // Detectar intención de herramientas
    const toolKeywords = {
      'schedule_reminder': ['recordatorio', 'recordarme', 'agendar', 'agenda'],
      'create_payment_link': ['pago', 'cobrar', 'link', 'stripe'],
      'list_reminders': ['ver recordatorios', 'mis recordatorios', 'mostrar agenda']
    };
    
    for (const [toolName, keywords] of Object.entries(toolKeywords)) {
      if (keywords.some(kw => messageLC.includes(kw)) && 
          tools.some(t => t.name === toolName)) {
        return {
          action: 'use_tool',
          tool_name: toolName,
          args: this.generateToolArgs(toolName, message),
          confidence: 0.8
        };
      }
    }
    
    return {
      action: 'respond',
      response: 'Entiendo tu consulta. Déjame procesarla...',
      confidence: 0.6
    };
  }

  /**
   * Genera argumentos básicos para herramientas
   */
  private generateToolArgs(toolName: string, message: string): any {
    switch (toolName) {
      case 'schedule_reminder':
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return {
          title: message.substring(0, 100),
          date: tomorrow.toISOString().split('T')[0],
          time: '09:00'
        };
      
      case 'create_payment_link':
        return {
          amount: 500,
          description: 'Pago solicitado',
          currency: 'mxn'
        };
      
      default:
        return {};
    }
  }

  /**
   * Ejecuta herramienta utilizando el registry real
   */
  private async executeTool(thought: AgentThought, context: AgentContext): Promise<AgentAction> {
    const decision = await this.requestDecision(
      this.buildToolExecutionPrompt(context, this.memory),
      context
    );
    
    if (!decision.tool_name) {
      return {
        type: 'response',
        content: 'No pude determinar qué herramienta usar.'
      };
    }
    
    // Buscar la herramienta en el contexto
    const tool = context.tools.find(t => t.name === decision.tool_name);
    if (!tool) {
      return {
        type: 'tool_call',
        tool: decision.tool_name,
        content: `Error: Herramienta ${decision.tool_name} no disponible`
      };
    }
    
    try {
      console.log(`🔧 Executing tool: ${tool.name} with args:`, decision.args);
      
      // Ejecutar herramienta (aquí necesitarías importar el registry real)
      const toolContext = {
        chatbotId: context.chatbotId || 'unknown',
        userId: context.user?.id || 'unknown',
        message: context.message
      };
      
      // ✅ EJECUTAR HERRAMIENTA REAL
      const toolResult = await executeToolCall(tool.name, decision.args, toolContext);
      const result = toolResult.success ? toolResult.message : `❌ ${toolResult.message}`;
      
      return {
        type: 'tool_call',
        tool: tool.name,
        input: decision.args,
        content: result
      };
      
    } catch (error) {
      console.error(`❌ Error executing tool ${tool.name}:`, error);
      return {
        type: 'tool_call',
        tool: tool.name,
        input: decision.args,
        content: `Error ejecutando ${tool.name}: ${(error as Error).message}`
      };
    }
  }

  /**
   * Genera respuesta final
   */
  private async generateResponse(thought: AgentThought, context: AgentContext): Promise<AgentAction> {
    const providerWrapper = this.createProviderWrapper(context);
    
    let responsePrompt = `Basándote en esta conversación, genera una respuesta útil y directa:

Usuario: "${context.message}"
`;

    if (this.memory.length > 0) {
      responsePrompt += `\nResultados previos: ${this.memory.map(m => m.observation.content).join('. ')}`;
    }

    responsePrompt += `\n\nResponde de forma natural y helpful. NO preguntes si quiere hacer algo más.`;
    
    const response = await providerWrapper.generateResponse(responsePrompt, false);
    
    return {
      type: 'response',
      content: response
    };
  }

  /**
   * Sintetiza respuesta final del loop
   */
  private synthesizeResponse(): string {
    if (this.memory.length === 0) {
      return 'No pude procesar tu solicitud en este momento.';
    }
    
    const lastMemory = this.memory[this.memory.length - 1];
    
    // Si la última acción fue respuesta, usarla
    if (lastMemory.action.type === 'response') {
      return lastMemory.action.content || '';
    }
    
    // Si usamos herramientas, sintetizar resultado
    const toolResults = this.memory
      .filter(m => m.action.type === 'tool_call')
      .map(m => m.observation.content)
      .join('. ');
    
    if (toolResults) {
      return toolResults;
    }
    
    return 'He procesado tu solicitud.';
  }

  /**
   * Wrapper para compatibilidad con proveedores actuales
   */
  private createProviderWrapper(context: AgentContext) {
    return {
      generateResponse: async (prompt: string, allowStreaming: boolean) => {
        // Importar dinámicamente tus proveedores
        const { AIProviderManager } = await import('../chatbot/providers/manager');
        
        try {
          const providerConfigs = {
            openai: process.env.CHATGPT_API_KEY ? {
              apiKey: process.env.CHATGPT_API_KEY
            } : undefined,
            anthropic: process.env.ANTHROPIC_API_KEY ? {
              apiKey: process.env.ANTHROPIC_API_KEY  
            } : undefined,
            openrouter: process.env.OPENROUTER_API_KEY ? {
              apiKey: process.env.OPENROUTER_API_KEY
            } : undefined
          };
          
          const manager = new AIProviderManager(providerConfigs);
          
          // Construir mensajes incluyendo historial si está disponible
          const messages = [];
          
          if (context.conversationHistory && context.conversationHistory.length > 0) {
            messages.push(...context.conversationHistory);
          }
          
          messages.push({ role: 'user' as const, content: prompt });

          const chatRequest = {
            model: context.model,
            messages,
            temperature: context.model === 'gpt-5-nano' ? undefined : 0.7,
            maxTokens: 800,
            stream: false // Siempre no-streaming para agent loop
          };
          
          const result = await manager.chatCompletion(chatRequest);
          return result.content || 'Sin respuesta del modelo';
          
        } catch (error) {
          console.error('❌ Error in provider wrapper:', error);
          return `Error: ${(error as Error).message}`;
        }
      }
    };
  }

  /**
   * Explica el razonamiento de una decisión
   */
  private explainReasoning(decision: AgentDecision, context: AgentContext): string {
    switch (decision.action) {
      case 'use_tool':
        return `Detecté que necesitas usar la herramienta ${decision.tool_name} para resolver tu solicitud`;
      case 'respond':
        return 'Puedo responder directamente sin necesidad de herramientas adicionales';
      case 'retry':
        return 'El intento anterior no funcionó, voy a probar un enfoque diferente';
      default:
        return 'Analizando la mejor forma de ayudarte';
    }
  }

  /**
   * Determina si una tarea está completa
   */
  private isTaskComplete(content: string): boolean {
    const completionIndicators = [
      'completado', 'terminado', 'finalizado', 'éxito', 'listo',
      'created', 'generated', 'sent', 'saved', 'programado',
      'exitosamente', 'successfully', 'agendado', 'recordatorio programado'
    ];
    
    return completionIndicators.some(indicator => 
      content.toLowerCase().includes(indicator)
    );
  }
}