/**
 * REGISTRO CENTRAL DE HERRAMIENTAS
 * Todas las tools disponibles en el sistema deben registrarse aquí
 */

import { Tool } from "../chatbot/providers/types";
import { createPaymentLinkHandler } from "./handlers/stripe";
import { scheduleReminderHandler } from "./handlers/denik";
import { saveContactInfoHandler } from "./handlers/contact";

export interface ToolDefinition {
  tool: Tool;
  handler: (input: any, context: ToolContext) => Promise<ToolResponse>;
  requiredIntegrations?: string[];
  requiredPlan?: string[];
  enabled?: boolean;
}

export interface ToolContext {
  chatbotId: string;
  userId: string;
  message?: string;
  integrations?: Record<string, any>;
}

export interface ToolResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * REGISTRO MAESTRO DE TODAS LAS HERRAMIENTAS
 * Para agregar una nueva tool:
 * 1. Crear handler en /tools/handlers/
 * 2. Importar handler aquí
 * 3. Agregar entrada al registro
 */
export const TOOLS_REGISTRY: Record<string, ToolDefinition> = {
  // STRIPE - Pagos
  create_payment_link: {
    tool: {
      name: "create_payment_link",
      description: "Crear un link de pago de Stripe para cobrar al cliente",
      input_schema: {
        type: "object",
        properties: {
          amount: {
            type: "number",
            description: "Cantidad a cobrar en números (ej: 500, 1000)",
          },
          description: {
            type: "string",
            description: "Descripción del pago o servicio",
          },
          currency: {
            type: "string",
            enum: ["mxn", "usd"],
            description:
              "Moneda del pago (default: 'mxn' para pesos mexicanos)",
          },
        },
        required: ["amount", "description"],
      },
    },
    handler: createPaymentLinkHandler,
    requiredIntegrations: ["stripe"],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // DENIK - Recordatorios
  schedule_reminder: {
    tool: {
      name: "schedule_reminder",
      description: "Crear un recordatorio o cita en el calendario con Denik",
      input_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título del recordatorio o cita",
          },
          date: {
            type: "string",
            description:
              "Fecha en formato YYYY-MM-DD (ej: 2024-08-20 para mañana). SIEMPRE usar formato YYYY-MM-DD",
          },
          time: {
            type: "string",
            description: "Hora en formato HH:MM (24 horas)",
          },
          email: {
            type: "string",
            description:
              "Email para enviar la notificación (OPCIONAL - solo si el usuario lo proporciona explícitamente, NUNCA inventar)",
          },
        },
        required: ["title", "date", "time"],
      },
    },
    handler: scheduleReminderHandler,
    requiredIntegrations: [], // Denik siempre disponible
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // CONTACT CAPTURE - Guardar información de contactos
  save_contact_info: {
    tool: {
      name: "save_contact_info",
      description: "Guardar información de contacto de leads/prospectos que proporcionen sus datos durante la conversación",
      input_schema: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Nombre completo de la persona",
          },
          email: {
            type: "string",
            description: "Dirección de correo electrónico",
          },
          phone: {
            type: "string", 
            description: "Número de teléfono",
          },
          company: {
            type: "string",
            description: "Nombre de la empresa u organización",
          },
          position: {
            type: "string",
            description: "Cargo o posición en la empresa",
          },
          website: {
            type: "string",
            description: "Sitio web de la persona o empresa",
          },
          notes: {
            type: "string",
            description: "Notas adicionales o contexto sobre el contacto",
          },
        },
        required: [], // Flexibilidad - al menos uno será validado en el handler
      },
    },
    handler: saveContactInfoHandler,
    requiredIntegrations: [], // Siempre disponible
    requiredPlan: ["STARTER", "PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // FUTURAS HERRAMIENTAS
  // send_whatsapp: { ... }
  // search_knowledge: { ... }
  // create_invoice: { ... }
  // schedule_meeting: { ... }
};

/**
 * Obtener herramientas disponibles para un usuario/chatbot
 */
export function getAvailableTools(
  userPlan: string,
  integrations: Record<string, any>,
  modelSupportsTools: boolean
): Tool[] {
  if (!modelSupportsTools) return [];

  const availableTools: Tool[] = [];

  for (const [name, definition] of Object.entries(TOOLS_REGISTRY)) {
    // Verificar si está habilitada
    if (!definition.enabled) continue;

    // Verificar plan
    if (
      definition.requiredPlan &&
      !definition.requiredPlan.includes(userPlan)
    ) {
      continue;
    }

    // Verificar integraciones requeridas
    if (
      definition.requiredIntegrations &&
      definition.requiredIntegrations.length > 0
    ) {
      const hasAllIntegrations = definition.requiredIntegrations.every(
        (integration) => integrations[integration]
      );
      if (!hasAllIntegrations) continue;
    }

    // Tool disponible
    availableTools.push(definition.tool);
  }

  return availableTools;
}

/**
 * Ejecutar un tool call
 */
export async function executeToolCall(
  toolName: string,
  input: any,
  context: ToolContext
): Promise<ToolResponse> {
  const definition = TOOLS_REGISTRY[toolName];

  if (!definition) {
    return {
      success: false,
      message: `Herramienta no encontrada: ${toolName}`,
    };
  }

  if (!definition.enabled) {
    return {
      success: false,
      message: `Herramienta deshabilitada: ${toolName}`,
    };
  }

  try {
    return await definition.handler(input, context);
  } catch (error) {
    console.error(`Error ejecutando ${toolName}:`, error);
    return {
      success: false,
      message: `Error al ejecutar ${toolName}: ${error.message}`,
    };
  }
}

/**
 * Generar prompts dinámicos según tools disponibles
 */
export function generateToolPrompts(availableTools: Tool[]): string {
  let prompt = "";

  const hasStripe = availableTools.some(
    (t) => t.name === "create_payment_link"
  );
  const hasDenik = availableTools.some((t) => t.name === "schedule_reminder");
  const hasContactCapture = availableTools.some((t) => t.name === "save_contact_info");

  if (hasStripe) {
    prompt +=
      "🔥 STRIPE: Cuando detectes solicitud de pago, USA INMEDIATAMENTE create_payment_link.\n";
  }

  if (hasDenik) {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD de hoy
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    prompt +=
      "📅 DENIK: Tienes acceso a recordatorios y agenda.\n";
    prompt += "⚠️ SOLO usa schedule_reminder cuando el usuario SOLICITE EXPLÍCITAMENTE agendar algo.\n";
    prompt += "❌ NO asumas que quiere agendar sin confirmación directa.\n";
    prompt += "❌ NO uses la herramienta si solo menciona fechas o eventos casualmente.\n";
    const currentYear = new Date().getFullYear();
    prompt += `📅 Hoy es ${today}. Formato requerido: YYYY-MM-DD\n`;
    prompt +=
      "🚫 CRÍTICO: NUNCA inventes emails - SIEMPRE solicita el email antes de agendar.\n";
    prompt +=
      "📧 FLUJO: 1) Confirmar si quiere agendar, 2) Solicitar email, 3) Usar herramienta.\n";
  }

  if (hasContactCapture) {
    prompt += "\n📋 CONTACT CAPTURE: Cuando una persona proporcione información personal (nombre, email, teléfono, empresa), USA INMEDIATAMENTE save_contact_info.\n";
    prompt += "✅ CASOS DE USO: 'Mi nombre es Juan', 'Soy María de IBM', 'mi email es...', 'trabajo en...'\n";
    prompt += "❌ NO captures información HASTA que la persona la comparta voluntariamente.\n";
    prompt += "💡 SUTIL: Si la conversación va bien, puedes preguntar: '¿Cómo te puedo contactar?' o '¿En qué empresa trabajas?'\n";
    prompt += "🎯 BENEFICIO: Explica que guardas su info para futuras consultas o seguimiento.\n";
  }

  // Agregar más prompts según se agreguen tools

  return prompt;
}
