/**
 * Script para diagnosticar por qué no aparece el banner de WhatsApp
 */

import { db } from "~/utils/db.server";

async function checkWhatsAppBanner() {
  console.log("🔍 Diagnóstico del Banner de WhatsApp\n");

  // Buscar usuario por email
  const user = await db.user.findUnique({
    where: { email: "fixtergeek@gmail.com" },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  console.log(`👤 Usuario: ${user.name} (${user.email})\n`);

  // Buscar integraciones de WhatsApp del usuario
  const integrations = await db.integration.findMany({
    where: {
      platform: "WHATSAPP",
      chatbot: {
        userId: user.id,
      },
    },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
          userId: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`📊 Total integraciones WhatsApp encontradas: ${integrations.length}\n`);

  for (const integration of integrations) {
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Chatbot: ${integration.chatbot.name} (${integration.chatbotId})`);
    console.log(`Integration ID: ${integration.id}`);
    console.log(`UserId: ${integration.chatbot.userId}`);
    console.log(`-`.repeat(80));
    console.log(`syncStatus: ${integration.syncStatus || "null"}`);
    console.log(`syncAttempts: ${integration.syncAttempts}`);
    console.log(`syncError: ${integration.syncError || "null"}`);
    console.log(`syncCompletedAt: ${integration.syncCompletedAt || "null"}`);
    console.log(`isActive: ${integration.isActive}`);
    console.log(`createdAt: ${integration.createdAt}`);
    console.log(`-`.repeat(80));

    // Determinar si el banner debería mostrarse
    const shouldShowBanner =
      integration.syncStatus === "pending" ||
      integration.syncStatus === "syncing";

    console.log(`\n🎯 ¿Debería mostrar banner? ${shouldShowBanner ? "✅ SÍ" : "❌ NO"}`);

    if (!shouldShowBanner) {
      if (!integration.syncStatus) {
        console.log(`   Razón: syncStatus es null`);
      } else if (integration.syncStatus === "completed") {
        console.log(`   Razón: syncStatus es "completed"`);
      } else if (integration.syncStatus === "failed") {
        console.log(`   Razón: syncStatus es "failed" (error: ${integration.syncError})`);
      }
    }
  }

  console.log(`\n${"=".repeat(80)}\n`);

  // Verificar si hay usuarios con email específico
  console.log("💡 Para filtrar por usuario específico, actualiza el script con tu email\n");
}

checkWhatsAppBanner()
  .then(() => {
    console.log("✅ Diagnóstico completado");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error en diagnóstico:", error);
    process.exit(1);
  });
