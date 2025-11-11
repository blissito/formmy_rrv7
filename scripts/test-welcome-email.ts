import "dotenv/config"; // Cargar variables de entorno
import { sendWelcomeEmail } from "../server/notifyers/welcome";

async function testWelcomeEmail() {
  console.log("🧪 Probando envío de email de bienvenida...");
  console.log("📧 Email destino: fixtergeek@gmail.com");
  console.log("🔧 SES_REGION:", process.env.SES_REGION);
  console.log("🔧 SES_KEY:", process.env.SES_KEY ? "✅ Configurado" : "❌ Faltante");

  try {
    await sendWelcomeEmail({
      email: "fixtergeek@gmail.com",
      name: "Héctor Bliss (Test)",
    });
    console.log("✅ Email enviado exitosamente!");
  } catch (error) {
    console.error("❌ Error enviando email:", error);
    if (error instanceof Error) {
      console.error("Stack trace:", error.stack);
    }
  }
}

testWelcomeEmail();
