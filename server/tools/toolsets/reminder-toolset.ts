/**
 * REMINDER TOOLSET 📅
 * Conjunto completo de herramientas para gestión de recordatorios
 * Todas las herramientas viven dentro de este toolset unificado
 */

import type { Tool } from "../../chatbot/providers/types";
import type { ToolDefinition, ToolContext, ToolResponse } from "../registry";
import { classifyReminderIntentCached } from "./reminder-intent-classifier";
// Importar handlers de recordatorios
import { 
  listRemindersHandler,
  cancelReminderHandler,
  updateReminderHandler,
  deleteReminderHandler
} from "../handlers/reminder-management";

// Importar el handler original de creación de recordatorios
import { scheduleReminderHandler } from "../handlers/denik";

/**
 * DEFINICIÓN DEL TOOLSET DE RECORDATORIOS
 */
export const ReminderToolset: Record<string, ToolDefinition> = {
  // Crear recordatorios
  schedule_reminder: {
    tool: {
      name: "schedule_reminder",
      description: "Crear un nuevo recordatorio o cita en el calendario",
      input_schema: {
        type: "object",
        properties: {
          title: {
            type: "string",
            description: "Título del recordatorio o cita",
          },
          date: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD (ej: 2025-08-23). SIEMPRE usar formato YYYY-MM-DD",
          },
          time: {
            type: "string",
            description: "Hora en formato HH:MM (24 horas)",
          },
          email: {
            type: "string",
            description: "Email para enviar la notificación (OPCIONAL - solo si el usuario lo proporciona explícitamente, NUNCA inventar)",
          },
        },
        required: ["title", "date", "time"],
      },
    },
    handler: scheduleReminderHandler, // Usar el handler original que ya funciona
    requiredIntegrations: [],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // Consultar recordatorios 
  list_reminders: {
    tool: {
      name: "list_reminders",
      description: "Consultar todos los recordatorios pendientes del usuario",
      input_schema: {
        type: "object",
        properties: {},
        required: [],
      },
    },
    handler: listRemindersHandler,
    requiredIntegrations: [],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // Actualizar recordatorios
  update_reminder: {
    tool: {
      name: "update_reminder",
      description: "Modificar un recordatorio existente (fecha, hora, título, email)",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID del recordatorio a actualizar",
          },
          title: {
            type: "string",
            description: "Nuevo título del recordatorio (opcional)",
          },
          date: {
            type: "string",
            description: "Nueva fecha en formato YYYY-MM-DD (opcional)",
          },
          time: {
            type: "string",
            description: "Nueva hora en formato HH:MM (opcional)",
          },
          email: {
            type: "string",
            description: "Nuevo email para notificación (opcional)",
          },
        },
        required: ["id"],
      },
    },
    handler: updateReminderHandler,
    requiredIntegrations: [],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // Cancelar recordatorios (soft delete)
  cancel_reminder: {
    tool: {
      name: "cancel_reminder", 
      description: "Cancelar un recordatorio (mantiene en DB como 'cancelled')",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID del recordatorio a cancelar",
          },
        },
        required: ["id"],
      },
    },
    handler: cancelReminderHandler,
    requiredIntegrations: [],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },

  // Borrar recordatorios (hard delete)
  delete_reminder: {
    tool: {
      name: "delete_reminder",
      description: "Eliminar permanentemente un recordatorio de la base de datos",
      input_schema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "ID del recordatorio a eliminar permanentemente",
          },
        },
        required: ["id"],
      },
    },
    handler: deleteReminderHandler,
    requiredIntegrations: [],
    requiredPlan: ["PRO", "ENTERPRISE", "TRIAL"],
    enabled: true,
  },
};

/**
 * OBTENER HERRAMIENTAS DE RECORDATORIOS DISPONIBLES
 */
export function getReminderTools(
  userPlan: string,
  integrations: Record<string, any>,
  modelSupportsTools: boolean
): Tool[] {
  if (!modelSupportsTools) return [];

  const availableTools: Tool[] = [];

  for (const [name, definition] of Object.entries(ReminderToolset)) {
    // Verificar si está habilitada
    if (!definition.enabled) continue;

    // Verificar plan
    if (
      definition.requiredPlan &&
      !definition.requiredPlan.includes(userPlan)
    ) {
      continue;
    }

    // Verificar integraciones requeridas (recordatorios no requieren integraciones)
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
 * EJECUTAR HERRAMIENTA DE RECORDATORIOS
 */
export async function executeReminderTool(
  toolName: string,
  input: any,
  context: ToolContext
): Promise<ToolResponse> {
  const definition = ReminderToolset[toolName];

  if (!definition) {
    return {
      success: false,
      message: `Herramienta de recordatorio no encontrada: ${toolName}`,
    };
  }

  if (!definition.enabled) {
    return {
      success: false,
      message: `Herramienta de recordatorio deshabilitada: ${toolName}`,
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
 * GENERAR PROMPT ESPECÍFICO PARA RECORDATORIOS
 */
export function generateReminderPrompt(availableReminderTools: Tool[]): string {
  if (availableReminderTools.length === 0) return "";

  const today = new Date().toISOString().split("T")[0];
  let prompt = "📅 **FAMILIA RECORDATORIOS** - Tienes acceso completo a gestión de recordatorios:\n\n";

  const toolNames = availableReminderTools.map(t => t.name);

  if (toolNames.includes("schedule_reminder")) {
    prompt += "✅ **CREAR**: USA `schedule_reminder` para comandos como: 'agenda', 'recordame', 'avísame', 'envíame recordatorio'\n";
  }
  if (toolNames.includes("list_reminders")) {
    prompt += "📋 **CONSULTAR**: USA `list_reminders` cuando pregunten '¿qué recordatorios tengo?', 'mis citas'\n";  
  }
  if (toolNames.includes("update_reminder")) {
    prompt += "📝 **ACTUALIZAR**: USA `update_reminder` para cambiar fecha/hora/título de recordatorios existentes\n";
  }
  if (toolNames.includes("cancel_reminder")) {
    prompt += "❌ **CANCELAR**: USA `cancel_reminder` para cancelar recordatorios (los mantiene como 'cancelled')\n";
  }
  if (toolNames.includes("delete_reminder")) {
    prompt += "🗑️ **ELIMINAR**: USA `delete_reminder` para borrar permanentemente recordatorios\n";
  }

  prompt += `\n📅 Hoy es ${today}. Formato requerido: YYYY-MM-DD\n`;
  prompt += "🚫 CRÍTICO: NUNCA inventes emails que no fueron proporcionados.\n";
  prompt += "✅ USA emails ya proporcionados en la conversación - NO solicites repetir información.\n";
  prompt += "🎯 **FLUJO SIMPLE**: \n";
  prompt += "   1️⃣ Si piden 'actualizar' → USA `list_reminders` primero → copia ID → `update_reminder`\n";
  prompt += "   2️⃣ Si piden 'cancelar/eliminar' → USA `list_reminders` primero → copia ID → `delete_reminder`\n";
  prompt += "   3️⃣ Si piden crear → USA `schedule_reminder` inmediatamente\n\n";

  return prompt;
}

/**
 * VERIFICAR SI UNA HERRAMIENTA PERTENECE AL TOOLSET DE RECORDATORIOS
 */
export function isReminderTool(toolName: string): boolean {
  return toolName in ReminderToolset;
}

/**
 * EXTRACTOR DE FECHAS DEL MENSAJE
 */
function extractDateFromMessage(message: string): string | null {
  const messageLC = message.toLowerCase();
  
  // Patterns para detectar fechas
  const datePatterns = [
    // "del 29" -> "2025-08-29" (asume mes y año actual)
    /del\s+(\d{1,2})(?!\d)/,
    /de\s+(\d{1,2})(?!\d)/,
    // "del 29 de agosto" -> "2025-08-29"
    /del\s+(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/,
    // "29 de agosto" -> "2025-08-29"
    /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/,
    // "2025-08-29"
    /(\d{4}-\d{2}-\d{2})/
  ];
  
  const monthMap: Record<string, string> = {
    'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
    'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
    'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
  };
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = (today.getMonth() + 1).toString().padStart(2, '0');
  
  // Intentar cada pattern
  for (const pattern of datePatterns) {
    const match = messageLC.match(pattern);
    if (match) {
      if (match[0].includes('-')) {
        // Ya es formato YYYY-MM-DD
        return match[1];
      } else if (match[2]) {
        // "del X de MONTH"
        const day = match[1].padStart(2, '0');
        const month = monthMap[match[2]];
        return `${currentYear}-${month}-${day}`;
      } else {
        // "del X" - asumir mes actual
        const day = match[1].padStart(2, '0');
        return `${currentYear}-${currentMonth}-${day}`;
      }
    }
  }
  
  return null;
}

/**
 * DETECCIÓN SYNC DE INTENCIONES DE RECORDATORIOS (FUNCIONA)
 * Versión con keywords mejoradas que sabemos que funciona
 */
export function detectReminderIntentSync(message: string): {
  needsTools: boolean;
  confidence: number;
  suggestedTool: string | null;
  keywords: string[];
  extractedDate?: string;
} {
  const messageLC = message.toLowerCase();
  const detectedKeywords: string[] = [];
  let confidence = 0;
  let suggestedTool: string | null = null;

  // 1. CREAR RECORDATORIOS (alta confianza)
  const createKeywords = [
    'agenda', 'envíame recordatorio', 'envíame un recordatorio', 
    'mándame recordatorio', 'ponme recordatorio', 'recordame', 'recuerdame',
    'avísame', 'notifícame', 'programa recordatorio', 'crea recordatorio'
  ];

  for (const keyword of createKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 60;
      suggestedTool = 'schedule_reminder';
    }
  }

  // 2. CONSULTAR RECORDATORIOS (alta confianza)
  const listKeywords = [
    'qué recordatorios tengo', 'que recordatorios tengo', 'mis recordatorios', 'mis citas', 
    'recordatorios pendientes', 'lista de recordatorios', 'ver recordatorios',
    'consultar recordatorios', 'mostrar recordatorios', 'tengo recordatorios',
    'recordatorios programados', 'check recordatorios', 'cuántos recordatorios',
    'cuantos recordatorios', 'recordatorios tengo', 'qué recordatorios', 'que recordatorios',
    'listar recordatorios', 'enlistar recordatorios', 'todos los recordatorios',
    'ver todos', 'ver próximos', 'próximos recordatorios', 'agenda actual',
    'calendario', 'cuales son mis', 'cuáles son mis', 'todos', 'próximos',
    'ver agenda', 'mi agenda', 'agenda programada'
  ];

  for (const keyword of listKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 70;
      suggestedTool = 'list_reminders';
    }
  }

  // 3. ACTUALIZAR RECORDATORIOS (media-alta confianza)
  const updateKeywords = [
    'actualizar recordatorio', 'cambiar recordatorio', 'modificar recordatorio',
    'editar recordatorio', 'cambiar fecha', 'cambiar hora', 'mover recordatorio'
  ];

  for (const keyword of updateKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 55;
      suggestedTool = 'list_reminders'; // Primero listar, luego actualizar
    }
  }

  // 4. CANCELAR/ELIMINAR RECORDATORIOS (media confianza)
  const cancelKeywords = [
    'cancelar recordatorio', 'eliminar recordatorio', 'borrar recordatorio',
    'quitar recordatorio', 'delete recordatorio', 'elimina el', 'borra el'
  ];

  for (const keyword of cancelKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 60;
      suggestedTool = 'list_reminders'; // Volver al flujo simple
    }
  }

  // 5. DETECTORES DE CONTEXTO (menor confianza pero relevantes)
  const contextKeywords = ['recordatorio', 'cita', 'calendario', 'agenda', 'avisar'];
  for (const keyword of contextKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 10; // Bonus contextual
    }
  }

  // Extraer fecha si es delete directo
  const extractedDate = suggestedTool === 'delete_reminder' ? extractDateFromMessage(message) : undefined;

  return {
    needsTools: confidence >= 50, // Threshold para activar herramientas
    confidence: Math.min(confidence, 100), // Cap a 100
    suggestedTool,
    keywords: detectedKeywords,
    extractedDate
  };
}

/**
 * FALLBACK: Detección legacy con keywords (solo para emergencias)
 */
function detectReminderIntentFallback(message: string): {
  needsTools: boolean;
  confidence: number;
  suggestedTool: string | null;
  keywords: string[];
} {
  const messageLC = message.toLowerCase();
  const detectedKeywords: string[] = [];
  let confidence = 0;
  let suggestedTool: string | null = null;

  // 1. CREAR RECORDATORIOS (alta confianza)
  const createKeywords = [
    'agenda', 'envíame recordatorio', 'envíame un recordatorio', 
    'mándame recordatorio', 'ponme recordatorio', 'recordame', 'recuerdame',
    'avísame', 'notifícame', 'programa recordatorio', 'crea recordatorio'
  ];

  for (const keyword of createKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 60; // Alta confianza para creación
      suggestedTool = 'schedule_reminder';
    }
  }

  // 2. CONSULTAR RECORDATORIOS (alta confianza)
  const listKeywords = [
    'qué recordatorios tengo', 'que recordatorios tengo', 'mis recordatorios', 'mis citas', 
    'recordatorios pendientes', 'lista de recordatorios', 'ver recordatorios',
    'consultar recordatorios', 'mostrar recordatorios', 'tengo recordatorios',
    'recordatorios programados', 'check recordatorios', 'cuántos recordatorios',
    'cuantos recordatorios', 'recordatorios tengo', 'qué recordatorios', 'que recordatorios'
  ];

  for (const keyword of listKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 70; // Muy alta confianza para listado
      suggestedTool = 'list_reminders';
    }
  }

  // 3. ACTUALIZAR RECORDATORIOS (media-alta confianza)
  const updateKeywords = [
    'actualizar recordatorio', 'cambiar recordatorio', 'modificar recordatorio',
    'editar recordatorio', 'cambiar fecha', 'cambiar hora', 'mover recordatorio'
  ];

  for (const keyword of updateKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 55;
      suggestedTool = 'list_reminders'; // Primero listar, luego actualizar
    }
  }

  // 4. CANCELAR/ELIMINAR RECORDATORIOS (media confianza)
  const cancelKeywords = [
    'cancelar recordatorio', 'eliminar recordatorio', 'borrar recordatorio',
    'quitar recordatorio', 'delete recordatorio'
  ];

  for (const keyword of cancelKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 50;
      suggestedTool = 'list_reminders'; // Primero listar, luego cancelar
    }
  }

  // 5. DETECTORES DE CONTEXTO (menor confianza pero relevantes)
  const contextKeywords = ['recordatorio', 'cita', 'calendario', 'agenda', 'avisar'];
  for (const keyword of contextKeywords) {
    if (messageLC.includes(keyword)) {
      detectedKeywords.push(keyword);
      confidence += 10; // Bonus contextual
    }
  }

  return {
    needsTools: confidence >= 50, // Threshold para activar herramientas
    confidence: Math.min(confidence, 100), // Cap a 100
    suggestedTool,
    keywords: detectedKeywords
  };
}