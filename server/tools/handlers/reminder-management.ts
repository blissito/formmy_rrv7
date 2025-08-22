import type { ToolContext, ToolResponse } from "../registry";
import { db } from "~/utils/db.server";

// Listar recordatorios pendientes del usuario
export async function listRemindersHandler(
  input: {},
  context: ToolContext
): Promise<ToolResponse> {
  console.log(`📋 LIST REMINDERS: Starting execution for chatbotId: ${context.chatbotId}`);
  
  try {
    console.log(`📋 LIST REMINDERS: Querying database...`);
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
    
    console.log(`📋 LIST REMINDERS: Found ${pendingReminders.length} pending reminders`);

    if (pendingReminders.length === 0) {
      console.log(`📋 LIST REMINDERS: No reminders found, returning empty response`);
      return {
        success: true,
        message: "📅 No tienes recordatorios programados para el futuro.",
        data: { reminders: [] }
      };
    }

    let message = `📅 **Tienes ${pendingReminders.length} recordatorio(s) programado(s):**\n\n`;
    
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

      message += `${index + 1}. **${data.title}**\n`;
      message += `   📅 ${formattedDate}\n`;
      message += `   📧 ${data.to}\n`;
      message += `   🔧 ID: ${reminder.id}\n\n`;
    });

    console.log(`📋 LIST REMINDERS: Returning response with ${pendingReminders.length} reminders`);
    return {
      success: true,
      message,
      data: { reminders: pendingReminders }
    };

  } catch (error) {
    console.error("Error listando recordatorios:", error);
    return {
      success: false,
      message: `❌ Error al consultar recordatorios: ${error.message}`
    };
  }
}

// Cancelar un recordatorio específico
export async function cancelReminderHandler(
  input: { id: string },
  context: ToolContext
): Promise<ToolResponse> {
  const { id } = input;

  try {
    // Verificar que el recordatorio existe y pertenece al chatbot
    const reminder = await db.scheduledAction.findFirst({
      where: {
        id,
        chatbotId: context.chatbotId,
        type: 'email',
        status: 'pending'
      }
    });

    if (!reminder) {
      return {
        success: false,
        message: `❌ No se encontró el recordatorio con ID: ${id} o ya fue procesado.`
      };
    }

    // Marcar como cancelado
    await db.scheduledAction.update({
      where: { id },
      data: { status: 'cancelled' }
    });

    const data = reminder.data as any;
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(reminder.runAt);

    return {
      success: true,
      message: `✅ **Recordatorio cancelado:**\n📅 "${data.title}"\n🕒 ${formattedDate}\n📧 ${data.to}`,
      data: { cancelledReminder: reminder }
    };

  } catch (error) {
    console.error("Error cancelando recordatorio:", error);
    return {
      success: false,
      message: `❌ Error al cancelar el recordatorio: ${error.message}`
    };
  }
}

// Actualizar un recordatorio existente
export async function updateReminderHandler(
  input: {
    id: string;
    title?: string;
    date?: string;
    time?: string;
    email?: string;
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { id, title, date, time, email } = input;

  try {
    // Verificar que el recordatorio existe y pertenece al chatbot
    const existingReminder = await db.scheduledAction.findFirst({
      where: {
        id,
        chatbotId: context.chatbotId,
        type: 'email',
        status: 'pending'
      }
    });

    if (!existingReminder) {
      return {
        success: false,
        message: `❌ No se encontró el recordatorio con ID: ${id} o ya fue procesado.`
      };
    }

    // Preparar nuevos datos
    const currentData = existingReminder.data as any;
    const newData = { ...currentData };
    let newRunAt = existingReminder.runAt;

    // Actualizar campos proporcionados
    if (title) newData.title = title;
    if (email) newData.to = email;
    
    // Actualizar fecha/hora si se proporcionó
    if (date || time) {
      const currentDate = existingReminder.runAt.toISOString().split('T')[0];
      const currentTime = existingReminder.runAt.toTimeString().substring(0, 5);
      
      const newDate = date || currentDate;
      const newTime = time || currentTime;
      
      newRunAt = new Date(`${newDate}T${newTime}:00`);
      newData.date = newRunAt.toISOString();
      
      // Validar que la nueva fecha sea futura
      if (newRunAt <= new Date()) {
        return {
          success: false,
          message: `❌ La fecha debe ser en el futuro. Fecha proporcionada: ${newRunAt.toISOString()}`
        };
      }
    }

    // Actualizar en la base de datos
    await db.scheduledAction.update({
      where: { id },
      data: {
        data: newData,
        runAt: newRunAt
      }
    });

    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(newRunAt);

    return {
      success: true,
      message: `✅ **Recordatorio actualizado:**\n📅 "${newData.title}"\n🕒 ${formattedDate}\n📧 ${newData.to}`,
      data: { updatedReminder: { ...existingReminder, data: newData, runAt: newRunAt } }
    };

  } catch (error) {
    console.error("Error actualizando recordatorio:", error);
    return {
      success: false,
      message: `❌ Error al actualizar el recordatorio: ${error.message}`
    };
  }
}

// Borrar permanentemente un recordatorio
export async function deleteReminderHandler(
  input: { id: string },
  context: ToolContext
): Promise<ToolResponse> {
  const { id } = input;

  try {
    // Verificar que el recordatorio existe y pertenece al chatbot
    const reminder = await db.scheduledAction.findFirst({
      where: {
        id,
        chatbotId: context.chatbotId,
        type: 'email'
      }
    });

    if (!reminder) {
      return {
        success: false,
        message: `❌ No se encontró el recordatorio con ID: ${id}.`
      };
    }

    // Borrar permanentemente
    await db.scheduledAction.delete({
      where: { id: reminder.id }
    });

    const data = reminder.data as any;
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(reminder.runAt);

    return {
      success: true,
      message: `🗑️ **Recordatorio eliminado permanentemente:**\n📅 "${data.title}"\n🕒 ${formattedDate}\n📧 ${data.to}`,
      data: { deletedReminder: reminder }
    };

  } catch (error) {
    console.error("Error borrando recordatorio:", error);
    return {
      success: false,
      message: `❌ Error al borrar el recordatorio: ${error.message}`
    };
  }
}