/**
 * Google Calendar Tool Handler - Composio Integration
 * Usa Composio SDK para integración nativa con Google Calendar
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import type { ToolContext, ToolResponse } from '../types';

// Initialize Composio con LlamaIndex provider
const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

/**
 * Crear evento en Google Calendar
 * Usa Composio para manejar OAuth y API de Calendar automáticamente
 */
export async function createCalendarEventHandler(
  input: {
    summary: string;
    description?: string;
    startTime: string; // ISO 8601 format: 2025-10-15T14:00:00
    endTime: string;
    attendees?: string[]; // Array de emails
    location?: string;
    chatbotId?: string; // Para Ghosty: especifica de qué chatbot usar el calendar
  },
  context: ToolContext
): Promise<ToolResponse> {
  try {

    // Determinar qué chatbot usar:
    // - Chatbot normal: usa su propio chatbotId
    // - Ghosty: puede especificar de qué chatbot usar el calendar
    const targetChatbotId = context.isGhosty && input.chatbotId
      ? input.chatbotId
      : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: '❌ No se especificó qué chatbot usar para el calendario.',
      };
    }

    const entityId = `chatbot_${targetChatbotId}`;


    // Ejecutar la acción usando Composio
    // Composio maneja automáticamente OAuth, refresh tokens, y llamadas API
    const result = await composio.tools.execute(
      'GOOGLECALENDAR_CREATE_EVENT',
      {
        userId: entityId,
        arguments: {
          summary: input.summary,
          description: input.description || '',
          start_datetime: input.startTime,
          end_datetime: input.endTime,
          attendees_info: input.attendees || [],
          location: input.location || '',
          timezone: 'America/Mexico_City', // GMT-6
        },
      }
    );


    return {
      success: true,
      message: `✅ **Evento agendado en Google Calendar**

📅 **${input.summary}**
🕐 Inicio: ${new Date(input.startTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
🕐 Fin: ${new Date(input.endTime).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}${input.location ? `\n📍 Lugar: ${input.location}` : ''}${input.attendees?.length ? `\n👥 Invitados: ${input.attendees.join(', ')}` : ''}

El evento ha sido creado en tu Google Calendar.`,
      data: result,
    };
  } catch (error: any) {
    console.error(`❌ Error creando evento en Calendar:`, error);

    // Manejar errores específicos de OAuth
    if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
      return {
        success: false,
        message: `🔐 **Necesitas conectar tu Google Calendar primero**

Para agendar eventos automáticamente, debes autorizar el acceso a tu cuenta de Google Calendar.

👉 Ve a tu perfil y conecta Google Calendar en la sección de Integraciones.`,
        data: { needsAuth: true },
      };
    }

    return {
      success: false,
      message: `❌ No pude crear el evento en Google Calendar. ${error.message || 'Error desconocido'}`,
    };
  }
}

/**
 * Calcular rango de fechas basándose en período relativo
 */
function calculateDateRange(period?: string): { timeMin: string; timeMax: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (period) {
    case 'today':
      return {
        timeMin: startOfDay.toISOString(),
        timeMax: endOfDay.toISOString(),
      };

    case 'tomorrow': {
      const tomorrow = new Date(startOfDay);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const endOfTomorrow = new Date(tomorrow);
      endOfTomorrow.setHours(23, 59, 59);
      return {
        timeMin: tomorrow.toISOString(),
        timeMax: endOfTomorrow.toISOString(),
      };
    }

    case 'this_week': {
      // Desde hoy hasta el domingo de esta semana
      const dayOfWeek = now.getDay();
      const daysUntilSunday = 7 - dayOfWeek;
      const endOfWeek = new Date(endOfDay);
      endOfWeek.setDate(endOfWeek.getDate() + daysUntilSunday);
      return {
        timeMin: now.toISOString(),
        timeMax: endOfWeek.toISOString(),
      };
    }

    case 'next_week': {
      // Próximo lunes a domingo
      const dayOfWeek = now.getDay();
      const daysUntilNextMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
      const nextMonday = new Date(startOfDay);
      nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
      const nextSunday = new Date(nextMonday);
      nextSunday.setDate(nextSunday.getDate() + 6);
      nextSunday.setHours(23, 59, 59);
      return {
        timeMin: nextMonday.toISOString(),
        timeMax: nextSunday.toISOString(),
      };
    }

    case 'next_7_days': {
      const next7Days = new Date(endOfDay);
      next7Days.setDate(next7Days.getDate() + 7);
      return {
        timeMin: now.toISOString(),
        timeMax: next7Days.toISOString(),
      };
    }

    case 'next_30_days': {
      const next30Days = new Date(endOfDay);
      next30Days.setDate(next30Days.getDate() + 30);
      return {
        timeMin: now.toISOString(),
        timeMax: next30Days.toISOString(),
      };
    }

    default:
      // Sin período especificado: próximos 30 días desde ahora
      const defaultEnd = new Date(now);
      defaultEnd.setDate(defaultEnd.getDate() + 30);
      return {
        timeMin: now.toISOString(),
        timeMax: defaultEnd.toISOString(),
      };
  }
}

/**
 * Listar próximos eventos de Google Calendar
 */
export async function listCalendarEventsHandler(
  input: {
    maxResults?: number;
    period?: 'today' | 'tomorrow' | 'this_week' | 'next_week' | 'next_7_days' | 'next_30_days';
    timeMin?: string; // ISO 8601
    timeMax?: string; // ISO 8601
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  try {

    const targetChatbotId = context.isGhosty && input.chatbotId
      ? input.chatbotId
      : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: '❌ No se especificó qué chatbot usar.',
      };
    }

    const entityId = `chatbot_${targetChatbotId}`;

    // Calcular rango de fechas basándose en 'period' o usar timeMin/timeMax directamente
    let timeMin: string;
    let timeMax: string | undefined;

    if (input.period) {
      const range = calculateDateRange(input.period);
      timeMin = range.timeMin;
      timeMax = range.timeMax;
    } else {
      timeMin = input.timeMin || new Date().toISOString();
      timeMax = input.timeMax;
    }

    const result = await composio.tools.execute(
      'GOOGLECALENDAR_EVENTS_LIST',
      {
        userId: entityId,
        arguments: {
          calendarId: 'primary',
          maxResults: input.maxResults || 10,
          timeMin,
          timeMax,
          singleEvents: true,
          orderBy: 'startTime',
        },
      }
    );


    // Formatear eventos para respuesta
    const events = (result as any).data?.items || [];

    if (events.length === 0) {
      return {
        success: true,
        message: `📅 No tienes eventos próximos en tu calendario.`,
        data: { events: [] },
      };
    }

    const eventList = events.map((event: any, index: number) => {
      const start = event.start?.dateTime || event.start?.date;
      const end = event.end?.dateTime || event.end?.date;
      return `${index + 1}. **${event.summary || 'Sin título'}**
   🕐 ${new Date(start).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}${event.location ? `\n   📍 ${event.location}` : ''}`;
    }).join('\n\n');

    return {
      success: true,
      message: `📅 **Próximos eventos** (${events.length}):

${eventList}`,
      data: { events },
    };
  } catch (error: any) {
    console.error(`❌ Error listando eventos:`, error);

    if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
      return {
        success: false,
        message: `🔐 Necesitas conectar tu Google Calendar primero. Ve a Integraciones en tu perfil.`,
        data: { needsAuth: true },
      };
    }

    return {
      success: false,
      message: `❌ No pude listar tus eventos de Google Calendar.`,
    };
  }
}

/**
 * Actualizar evento existente en Google Calendar
 */
export async function updateCalendarEventHandler(
  input: {
    eventId: string;
    summary?: string;
    description?: string;
    startTime?: string;
    endTime?: string;
    attendees?: string[];
    location?: string;
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  try {

    const targetChatbotId = context.isGhosty && input.chatbotId
      ? input.chatbotId
      : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: '❌ No se especificó qué chatbot usar.',
      };
    }

    const entityId = `chatbot_${targetChatbotId}`;

    const updateParams: any = {
      event_id: input.eventId,
      calendarId: 'primary',
    };

    if (input.summary) updateParams.summary = input.summary;
    if (input.description) updateParams.description = input.description;
    if (input.startTime) updateParams.start_datetime = input.startTime;
    if (input.endTime) updateParams.end_datetime = input.endTime;
    if (input.attendees) updateParams.attendees_info = input.attendees;
    if (input.location) updateParams.location = input.location;
    if (input.startTime || input.endTime) updateParams.timezone = 'America/Mexico_City';

    const result = await composio.tools.execute(
      'GOOGLECALENDAR_UPDATE_EVENT',
      {
        userId: entityId,
        arguments: updateParams,
      }
    );


    return {
      success: true,
      message: `✅ **Evento actualizado exitosamente**

Los cambios se han guardado en tu Google Calendar.`,
      data: result,
    };
  } catch (error: any) {
    console.error(`❌ Error actualizando evento:`, error);

    return {
      success: false,
      message: `❌ No pude actualizar el evento. ${error.message || 'Error desconocido'}`,
    };
  }
}

/**
 * Eliminar evento de Google Calendar
 */
export async function deleteCalendarEventHandler(
  input: {
    eventId: string;
    chatbotId?: string; // Para Ghosty
  },
  context: ToolContext
): Promise<ToolResponse> {
  try {

    const targetChatbotId = context.isGhosty && input.chatbotId
      ? input.chatbotId
      : context.chatbotId;

    if (!targetChatbotId) {
      return {
        success: false,
        message: '❌ No se especificó qué chatbot usar.',
      };
    }

    const entityId = `chatbot_${targetChatbotId}`;

    const result = await composio.tools.execute(
      'GOOGLECALENDAR_DELETE_EVENT',
      {
        userId: entityId,
        arguments: {
          event_id: input.eventId,
          calendarId: 'primary',
        },
      }
    );


    return {
      success: true,
      message: `✅ **Evento eliminado**

El evento ha sido eliminado de tu Google Calendar.`,
      data: result,
    };
  } catch (error: any) {
    console.error(`❌ Error eliminando evento:`, error);

    return {
      success: false,
      message: `❌ No pude eliminar el evento. ${error.message || 'Error desconocido'}`,
    };
  }
}
