/**
 * Script para verificar el estado de sincronización de WhatsApp
 * Muestra si necesita desconectar/reconectar o solo reintentar
 */

import { db } from "~/utils/db.server";

async function checkWhatsAppSyncStatus() {
  try {
    console.log("🔍 Buscando integraciones de WhatsApp...\n");

    const whatsappIntegrations = await db.integration.findMany({
      where: { platform: "WHATSAPP" },
      orderBy: { createdAt: "desc" },
    });

    if (whatsappIntegrations.length === 0) {
      console.log("❌ No se encontraron integraciones de WhatsApp");
      return;
    }

    console.log(`✅ Encontradas ${whatsappIntegrations.length} integración(es)\n`);

    for (const integration of whatsappIntegrations) {
      const now = new Date();
      const createdAt = new Date(integration.createdAt);
      const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
      const within24Hours = hoursSinceCreation < 24;

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🆔 Integration ID: ${integration.id}`);
      console.log(`🤖 Chatbot ID: ${integration.chatbotId}`);
      console.log(`📞 Phone Number ID: ${integration.phoneNumberId || "N/A"}`);
      console.log(`⏰ Creada hace: ${hoursSinceCreation.toFixed(1)} horas`);
      console.log(`🔄 Estado de sync: ${integration.syncStatus || "null"}`);
      console.log(`🔢 Intentos: ${integration.syncAttempts}`);

      if (integration.syncError) {
        console.log(`❌ Error: ${integration.syncError}`);
      }

      if (integration.syncCompletedAt) {
        console.log(`✅ Completado: ${integration.syncCompletedAt.toISOString()}`);
      }

      console.log("\n📋 DIAGNÓSTICO:");

      // Escenario 1: Nunca ha intentado sincronizar
      if (!integration.syncStatus || integration.syncStatus === "pending") {
        if (within24Hours) {
          console.log("✅ Puede sincronizar SIN desconectar");
          console.log("   → Acción: Click en el botón de la integración en el dashboard");
        } else {
          console.log("⚠️  Ventana de 24 horas EXPIRADA");
          console.log("   → Acción: DESCONECTAR y RECONECTAR desde el dashboard");
        }
      }

      // Escenario 2: Sincronización en progreso
      else if (integration.syncStatus === "syncing") {
        console.log("⏳ Sincronización en progreso");
        console.log("   → Acción: ESPERAR a que los webhooks completen el proceso");
      }

      // Escenario 3: Sincronización fallida
      else if (integration.syncStatus === "failed") {
        if (within24Hours) {
          console.log("⚠️  Falló, pero está dentro de 24 horas");
          console.log("   → Acción: Usar el botón 'Reintentar' en el dashboard");
        } else {
          console.log("❌ Falló y ventana de 24 horas EXPIRADA");
          console.log("   → Acción: DESCONECTAR y RECONECTAR desde el dashboard");
        }
      }

      // Escenario 4: Ya completada
      else if (integration.syncStatus === "completed") {
        console.log("✅ Sincronización YA COMPLETADA");
        console.log("   → No necesita hacer nada");
      }

      console.log("\n");
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n📘 CÓMO DESCONECTAR (si es necesario):");
    console.log("   1. Ve a formmy.app → Dashboard → Integraciones");
    console.log("   2. En la tarjeta de WhatsApp, click en 'Desconectar'");
    console.log("   3. Espera 30 segundos");
    console.log("   4. Click en 'Conectar' de nuevo");
    console.log("   5. Sigue el flujo de Embedded Signup\n");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await db.$disconnect();
  }
}

checkWhatsAppSyncStatus();
