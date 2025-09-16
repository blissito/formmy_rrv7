/**
 * Chatbot Tools - Herramientas especializadas para ChatbotAgent
 *
 * Reutiliza código existente y funcionando del sistema actual
 */

import { FunctionTool } from "llamaindex";
import type { User, Chatbot } from "@prisma/client";

interface ChatbotToolsContext {
  user: User;
  chatbot: Chatbot;
  userPlan: string;
  integrations: Record<string, any>;
}

/**
 * Crear todas las herramientas disponibles para un chatbot
 */
export function createChatbotTools(context: ChatbotToolsContext): FunctionTool[] {
  const tools: FunctionTool[] = [];

  console.log('🔧 Creating chatbot tools:', {
    chatbotName: context.chatbot.name,
    userPlan: context.userPlan,
    integrations: Object.keys(context.integrations),
  });

  // REMINDER TOOLS - Disponible para PRO, ENTERPRISE, TRIAL
  if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(context.userPlan)) {
    tools.push(createReminderTool(context));
  }

  // STRIPE TOOLS - Solo si el usuario tiene Stripe configurado
  if (context.integrations.stripe?.enabled) {
    tools.push(createPaymentTool(context));
  }

  console.log(`✅ Created ${tools.length} tools for ${context.chatbot.name}: [${tools.map(t => t.metadata.name).join(', ')}]`);

  return tools;
}

/**
 * Crear herramienta de recordatorios - REUTILIZA CÓDIGO FUNCIONANDO
 */
function createReminderTool(context: ChatbotToolsContext): FunctionTool {
  return FunctionTool.from(
    async ({
      title,
      date,
      time,
      email,
    }: {
      title: string;
      date: string; // YYYY-MM-DD format
      time: string; // HH:MM format
      email?: string;
    }) => {
      console.log(`📅 ChatbotAgent REMINDER: ${title} for ${date} ${time}`);

      try {
        // IMPORTANTE: Reutilizar el código exacto que ya funciona
        const { executeToolCall } = await import('../../tools/registry');

        const toolContext = {
          user: context.user,
          chatbotId: context.chatbot.id,
          userId: context.user.id,
          message: `Programar recordatorio: ${title}`,
        };

        const result = await executeToolCall('schedule_reminder', {
          title,
          date,
          time,
          email: email || context.user.email,
        }, toolContext);

        // Formatear respuesta para UI simple del chatbot
        return `✅ Perfecto! Te recordaré "${title}" el ${date} a las ${time}. Recibirás un email de confirmación.`;

      } catch (error) {
        console.error('❌ Error in chatbot reminder tool:', error);

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return `❌ No pude programar el recordatorio: ${errorMessage}`;
      }
    },
    {
      name: 'schedule_reminder',
      description: 'Programar un recordatorio o cita con notificación por email',
      parameters: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Título del recordatorio o cita'
          },
          date: {
            type: 'string',
            description: 'Fecha en formato YYYY-MM-DD'
          },
          time: {
            type: 'string',
            description: 'Hora en formato HH:MM (24 horas)'
          },
          email: {
            type: 'string',
            description: 'Email para notificación (opcional, usa el del usuario por defecto)'
          }
        },
        required: ['title', 'date', 'time']
      }
    }
  );
}

/**
 * Crear herramienta de pagos - REUTILIZA CÓDIGO FUNCIONANDO
 */
function createPaymentTool(context: ChatbotToolsContext): FunctionTool {
  return FunctionTool.from(
    async ({
      amount,
      description,
      currency = 'mxn',
    }: {
      amount: number;
      description: string;
      currency?: string;
    }) => {
      console.log(`💳 ChatbotAgent PAYMENT: $${amount} ${currency} - ${description}`);

      try {
        // IMPORTANTE: Reutilizar el código exacto que ya funciona
        const { executeToolCall } = await import('../../tools/registry');

        const toolContext = {
          user: context.user,
          chatbotId: context.chatbot.id,
          userId: context.user.id,
          message: `Crear link de pago: ${description}`,
        };

        const result = await executeToolCall('create_payment_link', {
          amount,
          description,
          currency,
        }, toolContext);

        // Formatear respuesta para UI simple del chatbot
        return `💳 Link de pago creado: ${result.url}\n\nDescripción: ${description}\nMonto: $${amount} ${currency.toUpperCase()}`;

      } catch (error) {
        console.error('❌ Error in chatbot payment tool:', error);

        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        return `❌ No pude crear el link de pago: ${errorMessage}`;
      }
    },
    {
      name: 'create_payment_link',
      description: 'Crear un link de pago seguro con Stripe',
      parameters: {
        type: 'object',
        properties: {
          amount: {
            type: 'number',
            description: 'Monto a cobrar (en la moneda especificada)'
          },
          description: {
            type: 'string',
            description: 'Descripción del pago'
          },
          currency: {
            type: 'string',
            description: 'Moneda (mxn, usd, etc.)',
            default: 'mxn'
          }
        },
        required: ['amount', 'description']
      }
    }
  );
}

/**
 * Obtener herramientas disponibles por plan (para debugging)
 */
export function getAvailableToolsByPlan(userPlan: string, hasStripe: boolean): string[] {
  const tools = [];

  if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(userPlan)) {
    tools.push('schedule_reminder');
  }

  if (hasStripe) {
    tools.push('create_payment_link');
  }

  return tools;
}

/**
 * Validar contexto de herramientas
 */
export function validateToolsContext(context: ChatbotToolsContext): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (!context.user) {
    return { valid: false, warnings: ['Usuario requerido'] };
  }

  if (!context.chatbot) {
    return { valid: false, warnings: ['Chatbot requerido'] };
  }

  // Warnings no críticos
  if (context.userPlan === 'FREE') {
    warnings.push('Plan FREE: herramientas limitadas');
  }

  if (!context.integrations.stripe && context.userPlan !== 'FREE') {
    warnings.push('Stripe no configurado: herramientas de pago no disponibles');
  }

  return { valid: true, warnings };
}