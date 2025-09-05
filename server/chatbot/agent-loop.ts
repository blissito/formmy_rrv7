import { getAvailableTools } from '../tools/registry';
import type { User, Chatbot } from '@prisma/client';

export class SimpleAgentLoop {
  async run(message: string, user: User, chatbot: Chatbot, aiProvider: any): Promise<{ response: string; needsTools: boolean }> {
    const tools = await getAvailableTools(user, chatbot);
    
    if (tools.length === 0) {
      return { response: await this.simpleChat(message, aiProvider), needsTools: false };
    }

    // Máximo 3 iteraciones para mantenerlo simple
    for (let i = 0; i < 3; i++) {
      const decision = await this.makeDecision(message, tools, aiProvider);
      
      if (decision.action === 'respond') {
        return { response: decision.response, needsTools: false };
      }
      
      if (decision.action === 'use_tool') {
        const toolResult = await this.executeTool(decision.tool_name, decision.args, tools);
        message = `${message}\n\nResultado de ${decision.tool_name}: ${toolResult}`;
        
        // Generar respuesta final con el resultado de la herramienta
        const finalResponse = await this.generateFinalResponse(message, aiProvider);
        return { response: finalResponse, needsTools: true };
      }
    }

    return { response: "No pude completar la tarea en este momento.", needsTools: false };
  }

  private async makeDecision(message: string, tools: any[], aiProvider: any): Promise<any> {
    const messageLC = message.toLowerCase();
    
    // Detección agresiva para recordatorios
    const reminderKeywords = [
      'recordatorio', 'recordarme', 'agendar', 'cita', 'agenda',
      'mis recordatorios', 'ver recordatorios', 'listar recordatorios',
      'mostrar recordatorios', 'cuales son mis', 'que tengo agendado'
    ];
    
    const isReminderRequest = reminderKeywords.some(kw => messageLC.includes(kw));
    
    // Si detectamos intención de recordatorios, FORZAR uso de herramienta
    if (isReminderRequest) {
      // Determinar qué herramienta de recordatorios usar
      if (messageLC.includes('ver') || messageLC.includes('listar') || 
          messageLC.includes('mostrar') || messageLC.includes('cuales') ||
          messageLC.includes('mis recordatorios')) {
        return {
          action: 'use_tool',
          tool_name: 'list_reminders',
          args: {}
        };
      }
      
      // Si es crear un nuevo recordatorio
      if (messageLC.includes('recordarme') || messageLC.includes('agendar') || 
          messageLC.includes('crear') || messageLC.includes('nuevo')) {
        // Extraer información básica del mensaje
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        return {
          action: 'use_tool',
          tool_name: 'schedule_reminder',
          args: {
            title: message,
            date: tomorrow.toISOString().split('T')[0],
            time: "09:00"
          }
        };
      }
    }
    
    // Para otras herramientas, usar decisión del LLM
    const toolsText = tools.map(t => `${t.name}: ${t.description}`).join('\n');
    
    const prompt = `Mensaje del usuario: "${message}"

Herramientas disponibles:
${toolsText}

IMPORTANTE: Si el usuario pregunta sobre recordatorios, citas o agenda, DEBES usar la herramienta apropiada.
- Para ver recordatorios: usa list_reminders
- Para crear recordatorios: usa schedule_reminder
- Para pagos: usa create_payment_link

Responde SOLO con JSON:
{
  "action": "use_tool" o "respond",
  "tool_name": "nombre exacto de la herramienta" (si action es use_tool),
  "args": {...} (argumentos requeridos si action es use_tool),
  "response": "tu respuesta" (si action es respond)
}`;

    const response = await aiProvider.generateResponse(prompt, false);
    try {
      const decision = JSON.parse(response);
      console.log('🤖 Agent Decision:', decision);
      return decision;
    } catch {
      // Si no puede parsear, asumir que es una respuesta directa
      return { action: 'respond', response: response };
    }
  }

  private async executeTool(toolName: string, args: any, tools: any[]): Promise<string> {
    const tool = tools.find(t => t.name === toolName);
    if (!tool) return `Error: Herramienta ${toolName} no encontrada`;
    
    try {
      return await tool.handler(args);
    } catch (error) {
      return `Error ejecutando ${toolName}: ${error.message}`;
    }
  }

  private async simpleChat(message: string, aiProvider: any): Promise<string> {
    return await aiProvider.generateResponse(message, true);
  }

  private async generateFinalResponse(message: string, aiProvider: any): Promise<string> {
    // Si el mensaje contiene resultados de herramientas, formatearlos bien
    if (message.includes('Resultado de')) {
      // Extraer el resultado de la herramienta
      const parts = message.split('Resultado de ');
      if (parts.length > 1) {
        const toolResult = parts[parts.length - 1];
        
        // Si es resultado de list_reminders con datos
        if (toolResult.includes('list_reminders:')) {
          const resultContent = toolResult.split('list_reminders:')[1].trim();
          
          // Si hay recordatorios, mostrarlos directamente
          if (resultContent.includes('recordatorio') || resultContent.includes('ID:')) {
            return resultContent; // Retornar el resultado directamente
          }
          
          // Si no hay recordatorios
          if (resultContent.includes('No tienes') || resultContent.includes('no hay')) {
            return "No tienes recordatorios pendientes en este momento. ¿Te gustaría crear uno nuevo?";
          }
        }
        
        // Para otros resultados de herramientas
        return toolResult;
      }
    }
    
    // Fallback al prompt original para casos no manejados
    const prompt = `Basándote en esta información, genera una respuesta clara y directa:

${message}

IMPORTANTE: 
- Si hay datos específicos (recordatorios, pagos, etc), muéstralos claramente
- NO preguntes si quieren ver la lista, muéstrala directamente
- Sé específico y útil, no vago`;

    return await aiProvider.generateResponse(prompt, false);
  }
}