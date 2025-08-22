import type { ToolContext, ToolResponse } from "../registry";
import { Scheduler } from "../../integrations/scheduler";
import { ToolUsageTracker } from "../../integrations/tool-usage-tracker";

export async function scheduleReminderHandler(
  input: {
    title: string;
    date: string;
    time: string;
    email?: string;
  },
  context: ToolContext
): Promise<ToolResponse> {
  console.log(`📅 DENIK HANDLER: Ejecutando tool con input:`, JSON.stringify(input, null, 2));
  console.log(`📧 CONTEXT: chatbotId=${context.chatbotId}, message=${context.message}`);
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
    
    // Validar email - no permitir emails inventados
    let finalEmail = email;
    const suspiciousEmails = ['cliente@ejemplo.com', 'example@email.com', 'test@test.com', 'user@example.com'];
    
    if (email && suspiciousEmails.includes(email.toLowerCase())) {
      console.log(`🚫 Email sospechoso detectado: ${email}, ignorando...`);
      finalEmail = undefined;
    }

    console.log(`📧 DEBUG: finalEmail = ${finalEmail}`);

    // Schedule email reminder using ultra-simple scheduler
    const reminderDateTime = new Date(`${correctedDate}T${time}:00`);
    console.log(`📅 DEBUG: reminderDateTime = ${reminderDateTime.toISOString()}`);
    
    console.log(`📅 DEBUG: Calling Scheduler.schedule...`);
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
    console.log(`✅ DEBUG: Scheduler.schedule completed, ID: ${scheduledAction.id}`);

    // Track usage (sin awaitar para no bloquear respuesta)
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'schedule_reminder',
      success: true,
      userMessage: context.message,
      metadata: {
        title,
        date: correctedDate,
        time,
        hasEmail: !!finalEmail,
        scheduledActionId: scheduledAction.id
      }
    }).catch(console.error);
    
    // Formatear la fecha para mostrar
    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    }).format(new Date(`${correctedDate}T${time}:00`));
    
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
      message: `🤖 **HERRAMIENTA UTILIZADA: Schedule Reminder**\n\n✅ **Email programado exitosamente:**\n📅 **${title}**\n🕒 ${formattedDate} a las ${time}\n📧 ${recipientInfo}\n\n🔧 *Sistema: Acción programada con ID: ${scheduledAction.id}*`,
      data: {
        scheduledActionId: scheduledAction.id,
        title,
        date: correctedDate,
        time,
        email: finalEmail,
        toolUsed: 'schedule_reminder'
      }
    };
    
  } catch (error) {
    console.error("Error creando recordatorio:", error);
    
    // Track error (sin awaitar)
    ToolUsageTracker.trackUsage({
      chatbotId: context.chatbotId,
      toolName: 'schedule_reminder',
      success: false,
      errorMessage: error.message,
      userMessage: context.message,
      metadata: { title, date, time }
    }).catch(console.error);
    
    return {
      success: false,
      message: `❌ Error al crear el recordatorio: ${error.message}`
    };
  }
}