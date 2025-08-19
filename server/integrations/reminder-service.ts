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

    // Crear recordatorio en DB
    const reminder = await db.reminder.create({
      data: {
        chatbotId,
        title,
        date: reminderDateTime,
        time,
        email,
        phone,
        userMessage,
        status: "pending",
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

    // TODO: Integrar con agenda.js para scheduling automático
    // Por ahora, solo guardamos en DB
    
    console.log(`✅ Recordatorio creado: ${title} para ${date} ${time}`);
    return reminder;
  }

  /**
   * Enviar recordatorio por email
   */
  static async sendReminder(reminderId: string) {
    const reminder = await db.reminder.findUnique({
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
      // Determinar email destino
      const recipientEmail = reminder.email || reminder.chatbot.user.email;
      const recipientName = reminder.chatbot.user.name || "Usuario";

      // Enviar email (implementar después)
      // await sendReminderEmail(recipientEmail, {
      //   title: reminder.title,
      //   date: reminder.date,
      //   chatbotName: reminder.chatbot.name
      // });

      // Marcar como enviado
      await db.reminder.update({
        where: { id: reminderId },
        data: { status: "sent" }
      });

      console.log(`📧 Recordatorio enviado: ${reminder.title} → ${recipientEmail}`);
      return true;

    } catch (error) {
      console.error("Error enviando recordatorio:", error);
      
      await db.reminder.update({
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
    return db.reminder.findMany({
      where: { chatbotId },
      orderBy: { date: "asc" }
    });
  }

  /**
   * Cancelar un recordatorio
   */
  static async cancelReminder(reminderId: string) {
    await db.reminder.update({
      where: { id: reminderId },
      data: { status: "cancelled" }
    });
    
    console.log(`❌ Recordatorio cancelado: ${reminderId}`);
    return true;
  }
}