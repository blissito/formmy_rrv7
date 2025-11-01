import type { Route } from "./+types/api.test-emails";
import { sendWelcomeEmail } from "server/notifyers/welcome";
import { sendReminderEmail } from "server/notifyers/reminder";
import { sendCreditsPurchaseEmail } from "server/notifyers/creditsPurchase";
import { sendConversationsPurchaseEmail } from "server/notifyers/conversationsPurchase";

/**
 * POST /api/test-emails
 * Endpoint de prueba para enviar todos los tipos de correos
 * Solo disponible en desarrollo o con una clave secreta
 */
export const action = async ({ request }: Route.ActionArgs) => {
  // Seguridad básica - solo en desarrollo o con secret key
  const isProduction = process.env.NODE_ENV === "production";
  const url = new URL(request.url);
  const secretKey = url.searchParams.get("secret");

  if (isProduction && secretKey !== process.env.EMAIL_TEST_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const email = "fixtergeek@gmail.com";
  const results: any[] = [];

  try {
    // 1. Email de Bienvenida
    await sendWelcomeEmail({
      email,
      name: "Héctor (Prueba)"
    });
    results.push({ type: "welcome", status: "sent" });

    // 2. Email de Compra de Créditos
    await sendCreditsPurchaseEmail({
      email,
      name: "Héctor",
      credits: 1000,
      newBalance: 1500
    });
    results.push({ type: "credits_purchase", status: "sent" });

    // 3. Email de Compra de Conversaciones
    await sendConversationsPurchaseEmail({
      email,
      name: "Héctor",
      conversations: 100,
      newTotal: 350
    });
    results.push({ type: "conversations_purchase", status: "sent" });

    // 4. Email de Recordatorio
    const reminderDate = new Date();
    reminderDate.setDate(reminderDate.getDate() + 2); // En 2 días
    await sendReminderEmail({
      email,
      title: "Junta con el equipo de Formmy",
      date: reminderDate,
      chatbotName: "Chatbot de Prueba"
    });
    results.push({ type: "reminder", status: "sent" });


    return Response.json({
      success: true,
      message: `Se enviaron ${results.length} correos a ${email}`,
      results
    });

  } catch (error) {
    console.error("❌ Error enviando emails de prueba:", error);
    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      results
    }, { status: 500 });
  }
}
