/**
 * REGISTRO CENTRAL DE HERRAMIENTAS
 * Todas las tools disponibles en el sistema deben registrarse aquí
 */

import type { Tool } from "../chatbot/providers/types";
import { createPaymentLinkHandler } from "./handlers/stripe";
import { saveContactInfoHandler } from "./handlers/contact";
// Importar el ReminderToolset completo
import { 
  ReminderToolset, 
  getReminderTools, 
  executeReminderTool,
  generateReminderPrompt,
  isReminderTool
} from "./toolsets/reminder-toolset";

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

  // ===== FAMILIA RECORDATORIOS 📅 (gestionada por ReminderToolset) =====
  ...ReminderToolset,

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
  // Si es una herramienta de recordatorios, usar el toolset especializado
  if (isReminderTool(toolName)) {
    return await executeReminderTool(toolName, input, context);
  }

  // Para otras herramientas, usar el registro general
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

  // STRIPE
  const hasStripe = availableTools.some(
    (t) => t.name === "create_payment_link"
  );
  if (hasStripe) {
    prompt +=
      "🔥 STRIPE: Cuando detectes solicitud de pago, USA INMEDIATAMENTE create_payment_link.\n\n";
  }

  // RECORDATORIOS (usar el toolset especializado)
  const reminderTools = availableTools.filter(t => isReminderTool(t.name));
  if (reminderTools.length > 0) {
    prompt += generateReminderPrompt(reminderTools);
  }

  // CONTACT CAPTURE
  const hasContactCapture = availableTools.some((t) => t.name === "save_contact_info");
  if (hasContactCapture) {
    prompt += "📋 CONTACT CAPTURE: Cuando una persona proporcione información personal (nombre, email, teléfono, empresa), USA INMEDIATAMENTE save_contact_info.\n";
    prompt += "✅ CASOS DE USO: 'Mi nombre es Juan', 'Soy María de IBM', 'mi email es...', 'trabajo en...'\n";
    prompt += "❌ NO captures información HASTA que la persona la comparta voluntariamente.\n";
    prompt += "💡 SUTIL: Si la conversación va bien, puedes preguntar: '¿Cómo te puedo contactar?' o '¿En qué empresa trabajas?'\n";
    prompt += "🎯 BENEFICIO: Explica que guardas su info para futuras consultas o seguimiento.\n\n";
  }

  // Futuros toolsets se agregan aquí...

  return prompt;
}
