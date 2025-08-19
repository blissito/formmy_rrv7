import { ToolContext, ToolResponse } from "../registry";
import { ReminderService } from "../../integrations/reminder-service";

export async function scheduleReminderHandler(
  input: {
    title: string;
    date: string;
    time: string;
    email?: string;
  },
  context: ToolContext
): Promise<ToolResponse> {
  const { title, date, time, email } = input;
  
  try {
    // Debug: Log de fecha recibida
    console.log(`📅 Denik handler - Fecha recibida: ${date}, Hora: ${time}`);
    
    // Validar formato de fecha antes de enviar
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      throw new Error(`Formato de fecha inválido: ${date}. Debe ser YYYY-MM-DD`);
    }
    
    // AUTO-CORRECCIÓN: Si el modelo envía año pasado, corregir al año actual
    let correctedDate = date;
    const currentYear = new Date().getFullYear().toString();
    
    if (date.startsWith('2023') || date.startsWith('2024')) {
      correctedDate = date.replace(/^(2023|2024)/, currentYear);
      console.log(`🔧 Auto-corrección: ${date} → ${correctedDate} (año actual: ${currentYear})`);
    }
    
    // Verificar que la fecha corregida esté en el futuro
    const targetDateTime = new Date(`${correctedDate}T${time}:00`);
    if (targetDateTime <= new Date()) {
      // Si aún está en el pasado, usar mañana como fallback
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      correctedDate = tomorrow.toISOString().split('T')[0];
      console.log(`🔧 Fallback a mañana: ${correctedDate}`);
    }
    
    // Crear el recordatorio con fecha corregida
    const reminder = await ReminderService.scheduleReminder({
      chatbotId: context.chatbotId,
      title,
      date: correctedDate,
      time,
      email,
      userMessage: context.message
    });
    
    // Formatear la fecha para mostrar
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(new Date(`${correctedDate}T${time}:00`));
    
    // Validar email - no permitir emails inventados
    let finalEmail = email;
    const suspiciousEmails = ['cliente@ejemplo.com', 'example@email.com', 'test@test.com', 'user@example.com'];
    
    if (email && suspiciousEmails.includes(email.toLowerCase())) {
      console.log(`🚫 Email sospechoso detectado: ${email}, ignorando...`);
      finalEmail = undefined;
    }
    
    // Manejo de notificaciones según contexto del usuario
    let recipientInfo;
    if (finalEmail) {
      recipientInfo = `Se enviará recordatorio a: ${finalEmail}`;
    } else {
      // Para usuarios anónimos o sin email, sugerir proporcionar email
      recipientInfo = '📧 **¿Quieres recibir notificación por email?** Proporciona tu email y te recordaré la cita.';
    }
    
    return {
      success: true,
      message: `✅ Recordatorio programado exitosamente:\n📅 **${title}**\n🕒 ${formattedDate} a las ${time}\n📧 ${recipientInfo}`,
      data: {
        reminderId: reminder.id,
        title,
        date,
        time,
        email
      }
    };
    
  } catch (error) {
    console.error("Error creando recordatorio:", error);
    return {
      success: false,
      message: `❌ Error al crear el recordatorio: ${error.message}`
    };
  }
}