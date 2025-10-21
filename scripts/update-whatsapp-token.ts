import { db } from "../app/utils/db.server";

async function updateToken() {
  console.log("🔑 Actualizado token de WhatsApp en BD...\n");

  // Obtener token del .env
  const newToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!newToken) {
    console.log("❌ ERROR: No se encontró WHATSAPP_ACCESS_TOKEN en .env");
    console.log("\nAgrega en .env:");
    console.log("WHATSAPP_ACCESS_TOKEN=tu_nuevo_token_aqui");
    return;
  }

  console.log(`Token encontrado en .env: ${newToken.length} chars (***${newToken.slice(-6)})`);

  // Actualizar en BD
  const result = await db.integration.updateMany({
    where: {
      platform: "WHATSAPP",
      isActive: true
    },
    data: {
      token: newToken
    }
  });

  console.log(`\n✅ Integraciones actualizadas: ${result.count}`);

  // Verificar
  const integration = await db.integration.findFirst({
    where: { platform: "WHATSAPP", isActive: true },
    select: {
      id: true,
      phoneNumberId: true,
      token: true
    }
  });

  if (integration) {
    console.log("\n📱 Estado actual:");
    console.log(`  Token: ${integration.token?.length} chars (***${integration.token?.slice(-6)})`);
    console.log(`  Phone Number ID: ${integration.phoneNumberId}`);
  }

  console.log("\n✅ Listo! Ahora puedes enviar mensajes de WhatsApp");
}

updateToken()
  .catch(console.error)
  .finally(() => process.exit(0));
