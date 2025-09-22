/**
 * GhostyAgent - Agente principal de Formmy
 *
 * Motor: AgentEngine_v0 (motor único unificado)
 * Acceso: Todas las herramientas disponibles según plan del usuario
 * Función: Asistente conversacional principal de la plataforma
 */

import { AgentEngine_v0 } from '../agent-engine-v0/simple-engine';
import { getAvailableTools } from '../tools/registry';
import type { User } from '@prisma/client';
import type { LlamaIndexTool } from '../agent-engine-v0/simple-engine';
import { z } from 'zod';

export class GhostyAgent extends AgentEngine_v0 {
  constructor(user: User, integrations: any = {}) {
    // Obtener todas las herramientas disponibles para el usuario
    const availableTools = getAvailableTools(user.plan || 'FREE', integrations, true);

    // Convertir tools del registry al formato LlamaIndex
    const llamaTools: LlamaIndexTool[] = availableTools.map(tool => {
      // Convertir JSON Schema a estructura ZOD compatible
      const zodCompatibleSchema = convertJsonSchemaToZod(tool.input_schema);

      return {
        name: tool.name,
        description: tool.description,
        parameters: zodCompatibleSchema,
        implementation: async (params: any, context?: any) => {
          // Ejecutar herramienta usando el registry
          const { executeToolCall } = await import('../tools/registry');
          const toolContext = {
            chatbotId: null, // Ghosty es global
            userId: user.id,
            message: params.message || '',
            userPlan: user.plan || 'FREE',
            integrations: integrations || {}
          };

          const result = await executeToolCall(tool.name, params, toolContext);
          return typeof result === 'string' ? result : JSON.stringify(result);
        }
      };
    });

    // Construir system prompt optimizado para Ghosty
    const systemPrompt = buildGhostySystemPrompt(user, availableTools);

    // Determinar modelo según el plan del usuario
    const model = getModelForUserPlan(user.plan || 'FREE');

    super({
      model,
      systemPrompt,
      tools: llamaTools,
      name: 'Ghosty',
      description: 'Asistente IA principal de Formmy - Acceso completo a herramientas',
      toolBindings: llamaTools.map(tool => ({
        tool,
        context: {
          userId: user.id,
          userPlan: user.plan,
          integrations
        }
      }))
    });

    console.log(`🤖 GhostyAgent initialized for user ${user.id}`, {
      plan: user.plan,
      model,
      toolsAvailable: llamaTools.length,
      tools: llamaTools.map(t => t.name)
    });
  }
}

/**
 * System prompt optimizado para Ghosty
 */
function buildGhostySystemPrompt(user: User, availableTools: any[]): string {
  const toolsCount = availableTools.length;
  const userPlan = user.plan || 'FREE';

  let prompt = `Eres Ghosty 👻, el asistente IA principal de Formmy.

**TU MISIÓN**: Ayudar a usuarios de Formmy con:
- Gestión de chatbots y formularios
- Análisis de datos y métricas
- Optimización SEO y contenido
- Automatización de tareas
- Insights de rendimiento

**CONTEXTO DEL USUARIO**:
- Plan: ${userPlan}
- Herramientas disponibles: ${toolsCount}
- ID: ${user.id}

**PERSONALIDAD**:
- Profesional pero amigable
- Proactivo en sugerir mejoras
- Enfocado en ROI y resultados
- Experto en marketing digital y automatización

`;

  // Agregar información específica de herramientas si están disponibles
  if (toolsCount > 0) {
    const toolNames = availableTools.map(t => t.name).join(', ');
    prompt += `**HERRAMIENTAS ACTIVAS**: ${toolNames}

**INSTRUCCIONES PARA HERRAMIENTAS**:
- USA herramientas INMEDIATAMENTE cuando sean relevantes
- NO pidas confirmación adicional para acciones obvias
- Si el usuario pide crear algo, CRÉALO directamente
- Después de usar herramientas, explica qué hiciste brevemente

`;
  }

  prompt += `**REGLAS DE RESPUESTA**:
- Respuestas concisas y accionables
- Incluye métricas cuando sea relevante
- Sugiere próximos pasos específicos
- Usa emojis apropiados pero con moderación

¡Listo para ayudar! 🚀`;

  return prompt;
}

/**
 * Determinar modelo AI según plan del usuario
 */
function getModelForUserPlan(plan: string): string {
  switch (plan) {
    case 'ENTERPRISE':
      return 'gpt-5-mini'; // Modelo premium para Enterprise
    case 'PRO':
    case 'TRIAL':
      return 'gpt-5-nano'; // Modelo optimizado para PRO
    case 'STARTER':
      return 'gpt-5-nano'; // Modelo básico pero eficiente
    case 'FREE':
    default:
      return 'gpt-5-nano'; // Después del trial, acceso limitado
  }
}

/**
 * Convertir JSON Schema del registry a objeto ZOD real
 */
function convertJsonSchemaToZod(jsonSchema: any): z.ZodSchema<any> {
  if (jsonSchema.type === 'object' && jsonSchema.properties) {
    const shape: Record<string, z.ZodTypeAny> = {};
    const required = jsonSchema.required || [];

    for (const [key, prop] of Object.entries(jsonSchema.properties)) {
      const property = prop as any;
      let zodType: z.ZodTypeAny;

      // Convertir según el tipo
      switch (property.type) {
        case 'string':
          zodType = z.string();
          if (property.description) {
            zodType = zodType.describe(property.description);
          }
          break;
        case 'number':
          zodType = z.number();
          if (property.description) {
            zodType = zodType.describe(property.description);
          }
          break;
        case 'boolean':
          zodType = z.boolean();
          if (property.description) {
            zodType = zodType.describe(property.description);
          }
          break;
        default:
          zodType = z.string(); // fallback
      }

      // Si no es requerido, hacerlo opcional
      if (!required.includes(key)) {
        zodType = zodType.optional();
      }

      shape[key] = zodType;
    }

    return z.object(shape);
  }

  // Para otros tipos, crear un schema básico
  return z.object({});
}