import type { ToolContext, ToolResponse } from "../types";

/**
 * Handler para obtener la fecha y hora actual
 * Proporciona información temporal contextual para el agente
 */
export async function getCurrentDateTimeHandler(
  input: {},
  context: ToolContext
): Promise<ToolResponse> {
  try {
    const now = new Date();

    // Configurar timezone México (GMT-6)
    const mexicoTime = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    // Información adicional contextual
    const dayOfWeek = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      weekday: 'long'
    }).format(now);

    const shortDate = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(now);

    const timeOnly = new Intl.DateTimeFormat('es-MX', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(now);

    return {
      success: true,
      message: `📅 **Fecha y hora actual:**\n\nHoy es ${mexicoTime} (GMT-6)\n\n🔧 *Sistema: Información temporal para contexto del agente*`,
      data: {
        fullDateTime: mexicoTime,
        dayOfWeek,
        shortDate,
        timeOnly,
        timezone: 'America/Mexico_City',
        toolUsed: 'get_current_datetime'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: "Error al obtener la fecha y hora actual."
    };
  }
}