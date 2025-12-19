import { db } from "../app/utils/db.server.ts";

async function debugBrendaWhatsApp() {
  console.log("🔍 Buscando usuario brenda@fixter.org...\n");

  // 1. Buscar usuario
  const user = await db.user.findUnique({
    where: { email: "brenda@fixter.org" },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  console.log("✅ Usuario encontrado:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Plan: ${user.plan}`);
  console.log("");

  // 2. Buscar chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id },
    include: {
      integrations: true,
    },
  });

  console.log(`📱 Chatbots encontrados: ${chatbots.length}\n`);

  for (const chatbot of chatbots) {
    console.log(`   Chatbot: ${chatbot.name} (${chatbot.slug})`);
    console.log(`   ID: ${chatbot.id}`);
    console.log(`   Status: ${chatbot.status}`);

    const whatsappIntegrations = chatbot.integrations.filter(
      (i) => i.platform === "whatsapp"
    );

    if (whatsappIntegrations.length > 0) {
      console.log(`   🟢 WhatsApp Integrations: ${whatsappIntegrations.length}`);

      for (const integration of whatsappIntegrations) {
        console.log(`      Integration ID: ${integration.id}`);
        console.log(`      Phone Number ID: ${integration.phoneNumberId || "N/A"}`);
        console.log(`      Status: ${integration.status}`);
        console.log(
          `      Has Access Token: ${integration.accessToken ? "✅" : "❌"}`
        );
        console.log(`      Created: ${integration.createdAt}`);
      }
    } else {
      console.log("   ❌ No WhatsApp integrations");
    }
    console.log("");
  }

  // 3. Buscar conversaciones recientes del número específico
  const phoneNumber = "5217757609276"; // Sin + ni espacios
  console.log(`🔍 Buscando conversaciones del número: ${phoneNumber}\n`);

  const conversations = await db.conversation.findMany({
    where: {
      sessionId: { contains: phoneNumber },
    },
    include: {
      chatbot: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  console.log(`📬 Conversaciones encontradas: ${conversations.length}\n`);

  for (const conv of conversations) {
    console.log(`   Conversation ID: ${conv.id}`);
    console.log(`   Chatbot: ${conv.chatbot?.name || "N/A"}`);
    console.log(`   Session ID: ${conv.sessionId}`);
    console.log(`   Status: ${conv.status}`);
    console.log(`   Updated: ${conv.updatedAt}`);
    console.log(`   Mensajes: ${conv.messages.length}`);

    if (conv.messages.length > 0) {
      console.log(`   Últimos mensajes:`);
      for (const msg of conv.messages) {
        console.log(
          `      ${msg.createdAt.toISOString()} - ${msg.role}: ${msg.content.substring(0, 100)}...`
        );
      }
    }
    console.log("");
  }

  // 4. Buscar en logs de Fly.io (esto debe ejecutarse manualmente)
  console.log("\n📋 Siguiente paso: Revisar logs de Fly.io");
  console.log("Ejecutar: fly logs --app formmy-chat");
  console.log(`Buscar: ${phoneNumber}`);
}

debugBrendaWhatsApp()
  .catch(console.error)
  .finally(() => process.exit());
