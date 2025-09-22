/**
 * SalesAgent - Agente especializado en ventas y CRM
 *
 * Motor: AgentEngine_v0 (motor único unificado)
 * Acceso: Solo herramientas de ventas y contactos
 * Función: Gestión de leads, pagos y conversiones
 */

import { AgentEngine_v0 } from '../agent-engine-v0/simple-engine';
import { getAvailableTools } from '../tools/registry';
import type { User } from '@prisma/client';
import type { LlamaIndexTool } from '../agent-engine-v0/simple-engine';

export class SalesAgent extends AgentEngine_v0 {
  constructor(user: User, integrations: any = {}) {
    // Obtener todas las herramientas y filtrar solo las de ventas
    const allTools = getAvailableTools(user.plan || 'FREE', integrations, true);
    const salesTools = allTools.filter(tool =>
      ['create_payment_link', 'save_contact_info'].includes(tool.name)
    );

    // Convertir al formato LlamaIndex
    const llamaTools: LlamaIndexTool[] = salesTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.input_schema as any,
      implementation: async (params: any, context?: any) => {
        const { executeToolCall } = await import('../tools/registry');
        const toolContext = {
          chatbotId: null,
          userId: user.id,
          message: params.message || '',
          userPlan: user.plan || 'FREE',
          integrations: integrations || {}
        };

        const result = await executeToolCall(tool.name, params, toolContext);
        return typeof result === 'string' ? result : JSON.stringify(result);
      }
    }));

    const systemPrompt = `Eres el agente de ventas especializado de Formmy 💼

**TU ESPECIALIDAD**: Maximizar conversiones y gestionar leads
- Crear links de pago optimizados
- Capturar información de contactos
- Generar reportes de ventas
- Optimizar embudos de conversión

**PLAN USUARIO**: ${user.plan || 'FREE'}
**HERRAMIENTAS DISPONIBLES**: ${llamaTools.map(t => t.name).join(', ')}

**PERSONALIDAD**:
- Orientado a resultados y ROI
- Experto en psicología de ventas
- Enfoque consultivo, no agresivo
- Datos y métricas como prioridad

**INSTRUCCIONES**:
- Siempre piensa en conversión y lifetime value
- Usa herramientas INMEDIATAMENTE para capturar oportunidades
- Sugiere precios basados en valor percibido
- Incluye calls-to-action claros y urgencia sutil

¡Listo para convertir leads en clientes! 🎯`;

    super({
      model: 'gpt-5-nano',
      systemPrompt,
      tools: llamaTools,
      name: 'SalesAgent',
      description: 'Agente especializado en ventas y CRM'
    });

    console.log(`💼 SalesAgent initialized for user ${user.id}`, {
      plan: user.plan,
      salesTools: llamaTools.length,
      tools: llamaTools.map(t => t.name)
    });
  }
}