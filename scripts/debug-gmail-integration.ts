/**
 * Script para debugear por qué Gmail no se detecta en Ghosty
 */

import { db } from "../app/utils/db.server";
import { getChatbotIntegrationFlags } from "../server/chatbot/integrationModel.server";

async function debugGmailIntegration() {
  console.log("\n" + "=".repeat(80));
  console.log("🔍 DEBUG: Gmail Integration Detection");
  console.log("=".repeat(80) + "\n");

  // 1. Buscar el usuario de prueba
  const user = await db.user.findFirst({
    where: { email: "fixtergeek@gmail.com" },
  });

  if (!user) {
    console.log("❌ Usuario fixtergeek@gmail.com no encontrado");
    return;
  }

  console.log(`✅ Usuario encontrado: ${user.email} (${user.id})`);
  console.log(`   Plan: ${user.plan}\n`);

  // 2. Obtener todos los chatbots del usuario
  const userChatbots = await db.chatbot.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  console.log(`📊 Chatbots del usuario: ${userChatbots.length}\n`);

  if (userChatbots.length === 0) {
    console.log("⚠️ No hay chatbots para este usuario");
    return;
  }

  // 3. Para cada chatbot, verificar integraciones
  for (const chatbot of userChatbots) {
    console.log(`\n${"─".repeat(80)}`);
    console.log(`📱 Chatbot: ${chatbot.name} (${chatbot.slug})`);
    console.log(`   ID: ${chatbot.id}`);

    // 3.1 Verificar integraciones en BD directamente
    const integrations = await db.integration.findMany({
      where: {
        chatbotId: chatbot.id,
      },
      select: {
        platform: true,
        isActive: true,
        token: true,
        createdAt: true,
      },
    });

    console.log(`\n   🔌 Integraciones en BD (${integrations.length}):`);
    if (integrations.length === 0) {
      console.log("      Ninguna");
    } else {
      for (const int of integrations) {
        console.log(
          `      - ${int.platform}: ${int.isActive ? "✅ ACTIVA" : "❌ INACTIVA"} (token: ${int.token ? "✅" : "❌"})`
        );
      }
    }

    // 3.2 Usar getChatbotIntegrationFlags
    const flags = await getChatbotIntegrationFlags(chatbot.id);
    console.log(`\n   🏁 Flags de integración (getChatbotIntegrationFlags):`);
    console.log(`      - Gmail: ${flags.gmail ? "✅" : "❌"}`);
    console.log(`      - WhatsApp: ${flags.whatsapp ? "✅" : "❌"}`);
    console.log(`      - Google Calendar: ${flags.googleCalendar ? "✅" : "❌"}`);
    console.log(`      - Stripe: ${flags.stripe ? "✅" : "❌"}`);
  }

  // 4. Simular el agregado de flags (como en Ghosty)
  console.log(`\n\n${"=".repeat(80)}`);
  console.log("🎯 Simulación del flujo de Ghosty:");
  console.log("=".repeat(80));

  const integrationFlags = {
    stripe: false,
    googleCalendar: false,
    whatsapp: false,
    gmail: false,
  };

  for (const chatbot of userChatbots) {
    const flags = await getChatbotIntegrationFlags(chatbot.id);
    integrationFlags.stripe = integrationFlags.stripe || flags.stripe;
    integrationFlags.googleCalendar =
      integrationFlags.googleCalendar || flags.googleCalendar;
    integrationFlags.whatsapp = integrationFlags.whatsapp || flags.whatsapp;
    integrationFlags.gmail = integrationFlags.gmail || flags.gmail;
  }

  console.log(`\n📋 Integration Flags finales para Ghosty:`);
  console.log(JSON.stringify(integrationFlags, null, 2));

  console.log(`\n🎯 ¿Gmail debería estar disponible? ${integrationFlags.gmail ? "✅ SÍ" : "❌ NO"}`);

  // 5. Si Gmail NO está disponible, dar sugerencias
  if (!integrationFlags.gmail) {
    console.log(`\n${"⚠️ ".repeat(40)}`);
    console.log("❌ PROBLEMA: Gmail NO está disponible para Ghosty");
    console.log(`${"⚠️ ".repeat(40)}\n`);

    console.log("📝 Posibles causas:");
    console.log("   1. No hay integraciones de Gmail activas en ningún chatbot");
    console.log("   2. Las integraciones existen pero isActive = false");
    console.log("   3. El platform name en BD no es 'GMAIL' (typo?)");
    console.log("\n💡 Soluciones:");
    console.log("   1. Conectar Gmail en algún chatbot desde el dashboard");
    console.log("   2. Verificar que la conexión OAuth completó exitosamente");
    console.log("   3. Ejecutar: npx tsx scripts/test-composio-gmail.ts");
  } else {
    console.log(`\n${"✅ ".repeat(40)}`);
    console.log("✅ Gmail está disponible correctamente");
    console.log(`${"✅ ".repeat(40)}\n`);
  }

  console.log("\n" + "=".repeat(80) + "\n");
}

// Ejecutar
debugGmailIntegration()
  .then(() => {
    console.log("✅ Debug completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error durante debug:", error);
    process.exit(1);
  });
