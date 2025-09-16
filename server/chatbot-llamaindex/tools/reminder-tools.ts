/**
 * REMINDER TOOLS - LLAMAINDEX PATTERNS
 *
 * Reemplaza el sistema de tools roto con FunctionTool patterns
 */

import { FunctionTool } from "llamaindex";
import { Scheduler } from "../../integrations/scheduler";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

export interface ReminderToolContext {
  chatbotId: string;
  userId: string;
  userPlan: string;
}

/**
 * CREATE REMINDER TOOL
 */
export async function createScheduleReminderTool(context: ReminderToolContext): Promise<FunctionTool> {
  return FunctionTool.from({
    name: "schedule_reminder",
    description: "Crear un recordatorio o cita en el calendario con notificación por email",
    fn: async ({
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
      console.log(`📅 LLAMAINDEX TOOL: schedule_reminder ejecutándose...`);
      console.log(`📧 Datos:`, { title, date, time, email, chatbotId: context.chatbotId });

      try {
        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
          throw new Error(`Formato de fecha inválido: ${date}. Debe ser YYYY-MM-DD`);
        }

        // AUTO-CORRECCIÓN: Año actual si es necesario
        let correctedDate = date;
        const currentYear = new Date().getFullYear().toString();

        if (date.startsWith('2023') || date.startsWith('2024')) {
          correctedDate = date.replace(/^(2023|2024)/, currentYear);
          console.log(`🔧 Auto-corrección: ${date} → ${correctedDate}`);
        }

        // Verificar que la fecha sea futura
        const targetDateTime = new Date(`${correctedDate}T${time}:00`);
        if (targetDateTime <= new Date()) {
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          correctedDate = tomorrow.toISOString().split('T')[0];
          console.log(`🔧 Fallback a mañana: ${correctedDate}`);
        }

        // Filtrar emails sospechosos
        let finalEmail = email;
        const suspiciousEmails = ['cliente@ejemplo.com', 'example@email.com', 'test@test.com'];
        if (email && suspiciousEmails.includes(email.toLowerCase())) {
          console.log(`🚫 Email sospechoso detectado: ${email}`);
          finalEmail = undefined;
        }

        // Crear recordatorio usando el scheduler
        const reminderDateTime = new Date(`${correctedDate}T${time}:00`);
        const scheduledAction = await Scheduler.schedule(
          context.chatbotId,
          'email',
          {
            to: finalEmail || 'no-email-provided@placeholder.com',
            title: title,
            date: reminderDateTime.toISOString(),
            chatbotName: 'Tu Asistente Formmy'
          },
          reminderDateTime
        );

        // Track usage (fire and forget)
        ToolUsageTracker.trackUsage({
          chatbotId: context.chatbotId,
          toolName: 'schedule_reminder',
          success: true,
          metadata: {
            title,
            date: correctedDate,
            time,
            hasEmail: !!finalEmail,
            scheduledActionId: scheduledAction.id
          }
        }).catch(console.error);

        // Formatear respuesta
        const formattedDate = new Intl.DateTimeFormat('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }).format(new Date(`${correctedDate}T${time}:00`));

        const recipientInfo = finalEmail
          ? `Se enviará recordatorio a: ${finalEmail}`
          : '📧 **¿Quieres recibir notificación por email?** Proporciona tu email y te recordaré.';

        return `✅ **Recordatorio programado exitosamente:**

📅 **${title}**
🕒 ${formattedDate} a las ${time}
📧 ${recipientInfo}

ID del recordatorio: ${scheduledAction.id}`;

      } catch (error) {
        console.error("❌ Error en schedule_reminder:", error);

        // Track error
        ToolUsageTracker.trackUsage({
          chatbotId: context.chatbotId,
          toolName: 'schedule_reminder',
          success: false,
          errorMessage: error.message,
          metadata: { title, date, time }
        }).catch(console.error);

        return `❌ Error al crear el recordatorio: ${error.message}`;
      }
    },
    parameters: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "Título del recordatorio o cita",
        },
        date: {
          type: "string",
          description: "Fecha en formato YYYY-MM-DD (ej: 2025-09-15). SIEMPRE usar formato YYYY-MM-DD",
        },
        time: {
          type: "string",
          description: "Hora en formato HH:MM (24 horas, ej: 14:30)",
        },
        email: {
          type: "string",
          description: "Email para enviar notificación (OPCIONAL - solo si el usuario lo proporciona explícitamente)",
        },
      },
      required: ["title", "date", "time"],
    },
  });
}

/**
 * LIST REMINDERS TOOL
 */
export async function createListRemindersTool(context: ReminderToolContext): Promise<FunctionTool> {
  return FunctionTool.from({
    name: "list_reminders",
    description: "Consultar todos los recordatorios pendientes del usuario",
    fn: async () => {
      console.log(`📋 LLAMAINDEX TOOL: list_reminders ejecutándose...`);

      try {
        const { db } = await import("~/utils/db.server");

        const pendingReminders = await db.scheduledAction.findMany({
          where: {
            chatbotId: context.chatbotId,
            type: 'email',
            status: 'pending',
            runAt: {
              gte: new Date() // Solo futuras
            }
          },
          orderBy: {
            runAt: 'asc'
          },
          take: 10 // Máximo 10
        });

        if (pendingReminders.length === 0) {
          return "📅 No tienes recordatorios programados para el futuro.";
        }

        let response = `📅 **Tienes ${pendingReminders.length} recordatorio(s) programado(s):**\n\n`;

        pendingReminders.forEach((reminder, index) => {
          const data = reminder.data as any;
          const formattedDate = new Intl.DateTimeFormat('es-MX', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }).format(reminder.runAt);

          response += `${index + 1}. **${data.title}**\n`;
          response += `   📅 ${formattedDate}\n`;
          response += `   📧 ${data.to}\n`;
          response += `   🔧 ID: ${reminder.id}\n\n`;
        });

        return response;

      } catch (error) {
        console.error("❌ Error en list_reminders:", error);
        return `❌ Error al consultar recordatorios: ${error.message}`;
      }
    },
    parameters: {
      type: "object",
      properties: {},
      required: [],
    },
  });
}

/**
 * FACTORY FUNCTION - Create all reminder tools
 */
export async function createReminderTools(context: ReminderToolContext): Promise<FunctionTool[]> {
  const tools: FunctionTool[] = [];

  try {
    // Create reminder tool
    const scheduleReminder = await createScheduleReminderTool(context);
    tools.push(scheduleReminder);

    // List reminders tool
    const listReminders = await createListRemindersTool(context);
    tools.push(listReminders);

    console.log(`✅ Created ${tools.length} reminder tools for user ${context.userId}`);
    return tools;

  } catch (error) {
    console.error("❌ Error creating reminder tools:", error);
    return [];
  }
}