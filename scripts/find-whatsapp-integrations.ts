import { db } from "../app/utils/db.server.ts";

async function findWhatsAppIntegrations() {
  console.log("🔍 Buscando todas las integraciones de WhatsApp en el sistema...\n");

  // Buscar todas las integraciones de WhatsApp
  const integrations = await db.integration.findMany({
    where: {
      platform: "WHATSAPP",
    },
    include: {
      chatbot: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      },
    },
  });

  console.log(`📱 Total de integraciones WhatsApp: ${integrations.length}\n`);

  for (const integration of integrations) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Integration ID: ${integration.id}`);
    console.log(`Usuario: ${integration.chatbot.user.email} (${integration.chatbot.user.name})`);
    console.log(`Chatbot: ${integration.chatbot.name} (${integration.chatbot.slug})`);
    console.log(`Chatbot ID: ${integration.chatbotId}`);
    console.log(`Phone Number ID: ${integration.phoneNumberId || "N/A"}`);
    console.log(`Platform: ${integration.platform}`);
    console.log(`Is Active: ${integration.isActive}`);
    console.log(`Has Token: ${integration.token ? "✅ SÍ" : "❌ NO"}`);
    console.log(`Token (primeros 20 chars): ${integration.token ? integration.token.substring(0, 20) + "..." : "N/A"}`);
    console.log(`Sync Status: ${integration.syncStatus || "N/A"}`);
    console.log(`Created: ${integration.createdAt}`);
    console.log(`Updated: ${integration.updatedAt}`);

    // Buscar conversaciones asociadas a este chatbot con el número problemático
    const phoneNumber = "5217757609276";
    const conversations = await db.conversation.findMany({
      where: {
        chatbotId: integration.chatbotId,
        sessionId: { contains: phoneNumber },
      },
      orderBy: { updatedAt: "desc" },
      take: 3,
    });

    console.log(`\n📬 Conversaciones con ${phoneNumber}: ${conversations.length}`);
    for (const conv of conversations) {
      console.log(`   - ${conv.id} | ${conv.sessionId} | Status: ${conv.status} | Updated: ${conv.updatedAt}`);
    }
  }

  // Buscar integraciones de brenda@fixter.org específicamente
  console.log(`\n${"=".repeat(80)}`);
  console.log("\n🔍 Integraciones de brenda@fixter.org:\n");

  const brendaIntegrations = integrations.filter(
    (i) => i.chatbot.user.email === "brenda@fixter.org"
  );

  if (brendaIntegrations.length === 0) {
    console.log("❌ NO HAY INTEGRACIONES DE WHATSAPP configuradas para brenda@fixter.org");
    console.log("\n🚨 PROBLEMA IDENTIFICADO:");
    console.log("   El usuario no tiene integraciones de WhatsApp activas.");
    console.log("   Necesita configurar la integración siguiendo estos pasos:");
    console.log("   1. Ir a Dashboard > Chatbot > Integraciones");
    console.log("   2. Conectar con WhatsApp Business");
    console.log("   3. Completar Meta Embedded Signup");
  } else {
    console.log(`✅ Encontradas ${brendaIntegrations.length} integración(es)`);
    for (const integration of brendaIntegrations) {
      console.log(`   - ${integration.chatbot.name}: isActive=${integration.isActive}, hasToken=${!!integration.token}`);
    }
  }
}

findWhatsAppIntegrations()
  .catch(console.error)
  .finally(() => process.exit());
