import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verificar configuración de integración de WhatsApp
 */

async function checkWhatsAppIntegration() {
  console.log("🔍 Verificando integración de WhatsApp...\n");

  try {
    // 1. Buscar integraciones de WhatsApp
    const integrations = await prisma.integration.findMany({
      where: {
        platform: "WHATSAPP"
      },
      select: {
        id: true,
        platform: true,
        isActive: true,
        chatbotId: true,
        accessToken: true,
        phoneNumberId: true,
        webhookVerifyToken: true,
        metadata: true,
        createdAt: true,
        chatbot: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`📊 Total integraciones de WhatsApp: ${integrations.length}\n`);

    if (integrations.length === 0) {
      console.log("❌ No hay integraciones de WhatsApp configuradas\n");
      return;
    }

    // Mostrar cada integración
    for (const integration of integrations) {
      console.log(`\n📱 Integración de WhatsApp:`);
      console.log(`   ID: ${integration.id}`);
      console.log(`   Bot: ${integration.chatbot?.name} (${integration.chatbot?.slug})`);
      console.log(`   Activa: ${integration.isActive ? "✅ SÍ" : "❌ NO"}`);
      console.log(`   Phone Number ID: ${integration.phoneNumberId || "N/A"}`);
      console.log(`   Access Token: ${integration.accessToken ? "✅ Configurado" : "❌ Faltante"}`);
      console.log(`   Webhook Token: ${integration.webhookVerifyToken || "N/A"}`);
      console.log(`   Creada: ${integration.createdAt}`);

      if (integration.metadata) {
        console.log(`   Metadata:`);
        const metadata = integration.metadata as any;
        if (metadata.lastHistorySync) {
          console.log(`     - Última sincronización de historial: ${metadata.lastHistorySync}`);
        }
        if (metadata.lastAppStateSync) {
          console.log(`     - Última sincronización de estado: ${metadata.lastAppStateSync}`);
        }
        if (metadata.appMobileActive !== undefined) {
          console.log(`     - WhatsApp App activa: ${metadata.appMobileActive ? "✅ SÍ" : "❌ NO"}`);
        }
      }
    }

    // 2. Verificar la configuración de webhooks necesarios
    console.log(`\n\n📋 Webhooks requeridos para sincronización de contactos:`);
    console.log(`   1. "messages" - Para mensajes entrantes ✓`);
    console.log(`   2. "message_echoes" - Para mensajes salientes (ecos) ✓`);
    console.log(`   3. "smb_app_state_sync" - Para sincronización de contactos`);
    console.log(`   4. "history" - Para historial de conversaciones`);

    console.log(`\n\n💡 Para sincronizar contactos:`);
    console.log(`   1. Ve a Meta Developer Console`);
    console.log(`   2. Configura webhook para eventos: "messages", "message_echoes", "smb_app_state_sync", "history"`);
    console.log(`   3. URL webhook: https://formmy.app/api/v1/integrations/whatsapp/webhook`);
    console.log(`   4. Verify token: ${integrations[0]?.webhookVerifyToken || "[tu token]"}`);

  } catch (error) {
    console.error("💥 Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkWhatsAppIntegration()
  .then(() => {
    console.log("\n✅ Verificación completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error:", error);
    process.exit(1);
  });
