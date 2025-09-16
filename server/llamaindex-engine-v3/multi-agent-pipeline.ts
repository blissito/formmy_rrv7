/**
 * Multi-Agent Pipeline - 3-Stage Architecture
 * Solves the "LlamaIndex AgentWorkflow is too dumb" problem
 */

import { openai } from "@llamaindex/openai";
import { Settings } from "llamaindex";
import type { ChatMessage } from "@llamaindex/core/llms";

interface IntentClassification {
  intent: 'scheduling' | 'information' | 'modification' | 'general';
  confidence: number;
  needsTools: boolean;
  recommendedTools: string[];
  entities: {
    date?: string;
    time?: string;
    title?: string;
    email?: string;
  };
}

interface ToolExecutionResult {
  success: boolean;
  toolsUsed: string[];
  data: any;
  response: string;
  metadata: any;
}

interface PipelineResponse {
  content: string;
  toolsUsed: string[];
  sources: any[];
  metadata: {
    intent: string;
    confidence: number;
    processingTime: number;
    agentsUsed: string[];
  };
}

export class MultiAgentPipeline {
  private llm: any;
  private tools: any[];
  private chatbotConfig: any;
  private userContext: any;

  constructor(model: string, temperature: number, tools: any[], chatbotConfig: any, userContext: any) {
    this.llm = openai({
      model,
      temperature,
      apiKey: process.env.CHATGPT_API_KEY || process.env.OPENAI_API_KEY || '',
      maxCompletionTokens: model.startsWith('gpt-5') ? 4000 : undefined
    });

    Settings.llm = this.llm;
    this.tools = tools;
    this.chatbotConfig = chatbotConfig;
    this.userContext = userContext;
  }

  /**
   * 1. INTENT AGENT - Clasificación inteligente de intenciones
   */
  private async classifyIntent(message: string): Promise<IntentClassification> {
    const intentPrompt = `Eres un experto en clasificación de intenciones para un asistente virtual.

HERRAMIENTAS DISPONIBLES:
${this.tools.map(t => `- ${t.metadata.name}: ${t.metadata.description}`).join('\n')}

ANALIZA el mensaje del usuario y clasifica la intención:

MENSAJE: "${message}"

Responde ÚNICAMENTE en formato JSON:
{
  "intent": "scheduling|information|modification|general",
  "confidence": 0.0-1.0,
  "needsTools": boolean,
  "recommendedTools": ["tool1", "tool2"],
  "entities": {
    "date": "YYYY-MM-DD si se menciona",
    "time": "HH:MM si se menciona",
    "title": "título/descripción si se menciona",
    "email": "email si se menciona"
  }
}

REGLAS:
- "scheduling": recordatorios, citas, agenda, avisos, notificaciones
- "information": consultas, preguntas, búsquedas, listados
- "modification": cambiar, cancelar, actualizar, eliminar
- "general": saludos, conversación, sin acción específica
- needsTools = true solo si requiere ejecutar herramientas
- confidence alto (0.8+) para intenciones claras`;

    try {
      const response = await this.llm.chat({
        messages: [{ role: 'user', content: intentPrompt }]
      });

      const jsonMatch = response.message.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const classification = JSON.parse(jsonMatch[0]);
        console.log('🎯 Intent classification:', classification);
        return classification;
      }

      // Fallback si no puede parsear JSON
      return {
        intent: 'general',
        confidence: 0.3,
        needsTools: false,
        recommendedTools: [],
        entities: {}
      };

    } catch (error) {
      console.error('❌ Intent classification failed:', error);
      return {
        intent: 'general',
        confidence: 0.1,
        needsTools: false,
        recommendedTools: [],
        entities: {}
      };
    }
  }

  /**
   * 2. TOOL AGENT - Ejecución especializada de herramientas
   */
  private async executeWithTools(message: string, intent: IntentClassification): Promise<ToolExecutionResult> {
    console.log('🛠️ Tool Agent executing with recommended tools:', intent.recommendedTools);

    const toolPrompt = `Eres un agente especializado en ejecutar herramientas de forma precisa y eficiente.

INSTRUCCIÓN CRÍTICA: DEBES usar las herramientas disponibles para cumplir con la solicitud del usuario.

MENSAJE ORIGINAL: "${message}"
INTENT DETECTADO: ${intent.intent}
HERRAMIENTAS RECOMENDADAS: ${intent.recommendedTools.join(', ')}
ENTIDADES EXTRAÍDAS: ${JSON.stringify(intent.entities)}

CONTEXTO DEL CHATBOT:
- Nombre: ${this.chatbotConfig.name}
- Instrucciones: ${this.chatbotConfig.instructions}

REGLAS CRÍTICAS:
1. SIEMPRE usa las herramientas cuando sea apropiado
2. Extrae información del mensaje original para completar parámetros
3. Si falta información crítica, usa valores razonables basados en contexto
4. EJECUTA las herramientas, no solo las describas
5. Confirma la ejecución exitosa antes de responder

Ejecuta las herramientas necesarias y proporciona confirmación.`;

    try {
      // Crear mini-agent con solo las herramientas recomendadas
      const relevantTools = this.tools.filter(tool =>
        intent.recommendedTools.includes(tool.metadata.name)
      );

      if (relevantTools.length === 0) {
        return {
          success: false,
          toolsUsed: [],
          data: null,
          response: 'No hay herramientas relevantes disponibles',
          metadata: { error: 'No relevant tools' }
        };
      }

      // Usar LlamaIndex agent() con herramientas específicas
      const { agent } = await import("@llamaindex/workflow");

      const toolAgent = agent({
        name: 'tool-executor',
        llm: this.llm,
        tools: relevantTools,
        systemPrompt: toolPrompt,
        verbose: true
      });

      const result = await toolAgent.run(message);

      console.log('🔧 Tool execution result:', {
        hasResult: !!result,
        dataKeys: result?.data ? Object.keys(result.data) : []
      });

      return {
        success: true,
        toolsUsed: intent.recommendedTools, // Tracking de herramientas usadas
        data: result?.data || {},
        response: result?.data?.result || result?.data?.message?.content || 'Herramientas ejecutadas',
        metadata: {
          agentType: 'tool-executor',
          intentConfidence: intent.confidence
        }
      };

    } catch (error) {
      console.error('❌ Tool execution failed:', error);
      return {
        success: false,
        toolsUsed: [],
        data: null,
        response: `Error ejecutando herramientas: ${error instanceof Error ? error.message : 'Unknown error'}`,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * 3. RESPONSE AGENT - Síntesis natural del resultado final
   */
  private async synthesizeResponse(originalMessage: string, intent: IntentClassification, toolResult?: ToolExecutionResult): Promise<string> {
    if (!toolResult || !toolResult.success) {
      // Respuesta conversacional sin herramientas
      const conversationalPrompt = `Eres ${this.chatbotConfig.name || 'un asistente útil'}.

PERSONALIDAD: ${this.chatbotConfig.instructions || 'Eres amigable y servicial'}

MENSAJE DEL USUARIO: "${originalMessage}"

Responde de forma natural y útil. NO menciones herramientas ni ejecuciones fallidas.
Mantén un tono conversacional apropiado para la situación.`;

      const response = await this.llm.chat({
        messages: [{ role: 'user', content: conversationalPrompt }]
      });

      return response.message.content;
    }

    // Síntesis con resultado de herramientas
    const synthesisPrompt = `Eres ${this.chatbotConfig.name || 'un asistente útil'} que acaba de completar una tarea exitosamente.

PERSONALIDAD: ${this.chatbotConfig.instructions || 'Eres amigable y servicial'}

SOLICITUD ORIGINAL: "${originalMessage}"
ACCIÓN COMPLETADA: ${toolResult.response}
HERRAMIENTAS USADAS: ${toolResult.toolsUsed.join(', ')}

GENERA una respuesta natural que:
1. Confirme que completaste la tarea exitosamente
2. Resuma lo que se hizo
3. Sea útil y amigable
4. NO mencione detalles técnicos como IDs o procesos internos
5. Invite a hacer más consultas si es apropiado

Mantén un tono conversacional natural.`;

    const response = await this.llm.chat({
      messages: [{ role: 'user', content: synthesisPrompt }]
    });

    return response.message.content;
  }

  /**
   * PIPELINE PRINCIPAL - Orquesta los 3 agentes
   */
  async chat(message: string, chatHistory: ChatMessage[] = []): Promise<PipelineResponse> {
    const startTime = Date.now();
    console.log('🚀 Multi-Agent Pipeline starting:', message.substring(0, 50) + '...');

    try {
      // STAGE 1: Clasificación de intención
      console.log('🎯 Stage 1: Intent Classification');
      const intent = await this.classifyIntent(message);

      // STAGE 2: Ejecución de herramientas (si es necesario)
      let toolResult: ToolExecutionResult | undefined;
      if (intent.needsTools && intent.confidence > 0.6) {
        console.log('🛠️ Stage 2: Tool Execution');
        toolResult = await this.executeWithTools(message, intent);
      }

      // STAGE 3: Síntesis de respuesta final
      console.log('💬 Stage 3: Response Synthesis');
      const finalResponse = await this.synthesizeResponse(message, intent, toolResult);

      const result: PipelineResponse = {
        content: finalResponse,
        toolsUsed: toolResult?.toolsUsed || [],
        sources: [], // TODO: Implementar sources si es necesario
        metadata: {
          intent: intent.intent,
          confidence: intent.confidence,
          processingTime: Date.now() - startTime,
          agentsUsed: ['intent-classifier', toolResult ? 'tool-executor' : '', 'response-synthesizer'].filter(Boolean)
        }
      };

      console.log('✅ Multi-Agent Pipeline completed:', {
        intent: intent.intent,
        toolsUsed: result.toolsUsed.length,
        processingTime: result.metadata.processingTime
      });

      return result;

    } catch (error) {
      console.error('❌ Multi-Agent Pipeline failed:', error);
      return {
        content: 'Disculpa, tuve un problema procesando tu solicitud. ¿Podrías intentar de nuevo?',
        toolsUsed: [],
        sources: [],
        metadata: {
          intent: 'error',
          confidence: 0,
          processingTime: Date.now() - startTime,
          agentsUsed: ['error-handler']
        }
      };
    }
  }
}