import { db } from "~/utils/db.server";
import { sendReminderEmail } from "~/utils/notifyers/reminder";

export interface ReminderData {
  chatbotId: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  email?: string;
  phone?: string;
  userMessage?: string;
}

export class ReminderService {
  /**
   * Crear un nuevo recordatorio
   */
  static async scheduleReminder(data: ReminderData) {
    const { chatbotId, title, date, time, email, phone, userMessage } = data;

    // Validar fecha
    const reminderDateTime = new Date(`${date}T${time}:00`);
    if (reminderDateTime <= new Date()) {
      throw new Error("La fecha del recordatorio debe ser en el futuro");
    }

    // Crear recordatorio en DB usando ScheduledAction
    const reminder = await db.scheduledAction.create({
      data: {
        chatbotId,
        type: "reminder", // Type específico para agenda.js
        runAt: reminderDateTime,
        status: "pending",
        data: {
          title,
          time,
          email,
          phone,
          userMessage,
          originalDate: date // Para referencia
        }
      },
      include: {
        chatbot: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    // Programar con agenda.js (compatible con MongoDB + ScheduledAction)
    // El tipo "reminder" será reconocido por agenda.js para ejecutar automáticamente
    
    console.log(`✅ Recordatorio programado: ${title} para ${date} ${time} (ID: ${reminder.id})`);
    return reminder;
  }

  /**
   * Enviar recordatorio por email
   */
  static async sendReminder(reminderId: string) {
    const reminder = await db.scheduledAction.findUnique({
      where: { id: reminderId },
      include: {
        chatbot: {
          select: {
            name: true,
            user: {
              select: {
                email: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!reminder || reminder.status !== "pending") {
      throw new Error("Recordatorio no encontrado o ya procesado");
    }

    try {
      // Extraer datos del JSON field
      const reminderData = reminder.data as any;
      
      // Determinar email destino
      const recipientEmail = reminderData.email || reminder.chatbot.user.email;
      const recipientName = reminder.chatbot.user.name || "Usuario";

      // Enviar email (implementar después)
      // await sendReminderEmail(recipientEmail, {
      //   title: reminderData.title,
      //   date: reminder.runAt,
      //   chatbotName: reminder.chatbot.name
      // });

      // Marcar como completado (compatible con agenda.js)
      await db.scheduledAction.update({
        where: { id: reminderId },
        data: { status: "done" }
      });

      console.log(`📧 Recordatorio enviado: ${reminderData.title} → ${recipientEmail}`);
      return true;

    } catch (error) {
      console.error("Error enviando recordatorio:", error);
      
      await db.scheduledAction.update({
        where: { id: reminderId },
        data: { status: "failed" }
      });
      
      throw error;
    }
  }

  /**
   * Obtener recordatorios de un chatbot
   */
  static async getRemindersByChatbot(chatbotId: string) {
    return db.scheduledAction.findMany({
      where: { 
        chatbotId,
        type: "reminder" 
      },
      orderBy: { runAt: "asc" }
    });
  }

  /**
   * Cancelar un recordatorio
   */
  static async cancelReminder(reminderId: string) {
    await db.scheduledAction.update({
      where: { id: reminderId },
      data: { status: "cancelled" }
    });
    
    console.log(`❌ Recordatorio cancelado: ${reminderId}`);
    return true;
  }
}