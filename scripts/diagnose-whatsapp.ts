/**
 * Script de diagnóstico WhatsApp
 * Verifica el estado completo de una integración de WhatsApp
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function diagnoseWhatsApp(chatbotId: string) {
  console.log("🔍 DIAGNÓSTICO WHATSAPP");
  console.log("========================\n");

  // 1. Buscar chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { id: true, name: true, userId: true },
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    return;
  }

  console.log(`✅ Chatbot: ${chatbot.name} (${chatbot.id})`);
  console.log(`   User ID: ${chatbot.userId}\n`);

  // 2. Buscar integración WhatsApp
  const integration = await db.integration.findFirst({
    where: {
      chatbotId: chatbot.id,
      platform: "WHATSAPP",
    },
  });

  if (!integration) {
    console.log("❌ No hay integración de WhatsApp configurada\n");
    return;
  }

  console.log("📱 INTEGRACIÓN");
  console.log("   ID:", integration.id);
  console.log("   Status:", integration.syncStatus || "N/A");
  console.log("   Is Active:", integration.isActive);
  console.log("   Sync Attempts:", integration.syncAttempts);
  console.log("   Sync Error:", integration.syncError || "N/A");
  console.log("   Sync Completed:", integration.syncCompletedAt || "N/A");
  console.log("   Created:", integration.createdAt);
  console.log("   Updated:", integration.updatedAt);

  // Metadata
  const metadata = integration.metadata as any;
  console.log("\n   Metadata:");
  console.log("   - Phone Number ID:", metadata?.phoneNumberId || "N/A");
  console.log("   - WABA ID:", metadata?.wabaId || "N/A");
  console.log("   - Display Phone:", metadata?.displayPhoneNumber || "N/A");
  console.log("   - Last History Progress:", metadata?.lastHistorySyncProgress || "N/A");
  console.log("");

  // 3. Contar contactos
  const contactCount = await db.contact.count({
    where: { integrationId: integration.id },
  });

  console.log("📇 CONTACTOS");
  console.log(`   Total: ${contactCount}\n`);

  // 4. Buscar conversaciones
  const conversations = await db.conversation.findMany({
    where: {
      chatbotId: chatbot.id,
      status: { not: "DELETED" },
    },
    include: {
      messages: {
        where: { deleted: { not: true } },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 10,
  });

  console.log("💬 CONVERSACIONES");
  console.log(`   Total: ${conversations.length}`);

  if (conversations.length === 0) {
    console.log("   ⚠️  NO HAY CONVERSACIONES\n");
  } else {
    console.log("");
    conversations.forEach((conv, idx) => {
      const userMessages = conv.messages.filter((m) => m.role === "USER").length;
      const assistantMessages = conv.messages.filter((m) => m.role === "ASSISTANT").length;
      const lastMessage = conv.messages[conv.messages.length - 1];

      console.log(`   ${idx + 1}. ID: ${conv.id}`);
      console.log(`      Customer: ${conv.customerName || "N/A"} (${conv.customerPhone || "N/A"})`);
      console.log(`      Messages: ${userMessages} user, ${assistantMessages} assistant`);
      console.log(`      Last: ${lastMessage?.content.substring(0, 50) || "N/A"}...`);
      console.log(`      Updated: ${conv.updatedAt}`);
      console.log("");
    });
  }

  // 5. Verificar si hay mensajes de WhatsApp
  const whatsappMessageCount = await db.message.count({
    where: {
      conversation: {
        chatbotId: chatbot.id,
      },
      metadata: {
        path: ["source"],
        equals: "whatsapp",
      },
    },
  });

  console.log("📨 MENSAJES WHATSAPP");
  console.log(`   Total: ${whatsappMessageCount}\n`);

  // 6. Diagnóstico
  console.log("🔬 DIAGNÓSTICO");
  console.log("==============");

  if (integration.syncStatus === "pending") {
    console.log("⚠️  Sincronización AÚN NO INICIADA");
    console.log("   → La integración se creó pero initializeSync() nunca se llamó");
  } else if (integration.syncStatus === "syncing") {
    console.log("🔄 Sincronización EN PROGRESO");
    const progress = metadata?.lastHistorySyncProgress || 0;
    console.log(`   → Progreso actual: ${progress}%`);
    if (integration.syncAttempts > 1) {
      console.log(`   ⚠️  Múltiples intentos: ${integration.syncAttempts}`);
    }
  } else if (integration.syncStatus === "completed") {
    console.log("✅ Sincronización COMPLETADA");
    if (conversations.length === 0) {
      console.log("   ❌ PERO NO HAY CONVERSACIONES");
      console.log("   → Problema: Los webhooks no guardaron conversaciones");
      console.log("   → Revisar logs del webhook /api/v1/integrations/whatsapp/webhook");
    }
  } else if (integration.syncStatus === "failed") {
    console.log("❌ Sincronización FALLÓ");
    console.log(`   Error: ${integration.syncError}`);
  } else {
    console.log("❓ Estado desconocido");
    console.log(`   syncStatus: ${integration.syncStatus}`);
  }

  console.log("");

  if (contactCount === 0 && conversations.length === 0) {
    console.log("❌ PROBLEMA CRÍTICO: No hay contactos NI conversaciones");
    console.log("   → Los webhooks de Meta NO están llegando");
    console.log("   → Verificar:");
    console.log("     1. Webhook URL configurada en Meta");
    console.log("     2. Token de verificación correcto");
    console.log("     3. Fly logs: fly logs --app formmy-v2");
  }

  if (contactCount > 0 && conversations.length === 0) {
    console.log("⚠️  HAY CONTACTOS pero NO conversaciones");
    console.log("   → El webhook 'smb_app_state_sync' funciona");
    console.log("   → Problema en webhook 'history'");
    console.log("   → Revisar getOrCreateConversation() en el webhook");
  }
}

// Ejecutar
const chatbotId = process.argv[2];

if (!chatbotId) {
  console.log("❌ Uso: npx tsx scripts/diagnose-whatsapp.ts <chatbotId>");
  process.exit(1);
}

diagnoseWhatsApp(chatbotId)
  .then(() => {
    console.log("✅ Diagnóstico completo");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  });
