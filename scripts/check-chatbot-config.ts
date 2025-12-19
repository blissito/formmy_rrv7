import { db } from "../app/utils/db.server.ts";

async function checkChatbotConfig() {
  const chatbotId = "6939d3e33a7c6abff838c662"; // Brenda Go

  console.log(`\n🔍 Verificando configuración del chatbot...\n`);

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: {
      integrations: {
        where: { platform: "WHATSAPP" },
      },
    },
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    return;
  }

  console.log(`${"=".repeat(80)}`);
  console.log(`Chatbot: ${chatbot.name}`);
  console.log(`Slug: ${chatbot.slug}`);
  console.log(`ID: ${chatbot.id}`);
  console.log(`Status: ${chatbot.status}`);
  console.log(`AI Model: ${chatbot.aiModel || "N/A"}`);
  console.log("");
  console.log(`Instructions: ${chatbot.instructions ? "✅ Configuradas" : "❌ NO configuradas"}`);
  if (chatbot.instructions) {
    console.log(`   ${chatbot.instructions.substring(0, 200)}...`);
  }
  console.log("");
  console.log(`Personality: ${chatbot.personality ? "✅ Configurada" : "❌ NO configurada"}`);
  if (chatbot.personality) {
    console.log(`   ${chatbot.personality.substring(0, 200)}...`);
  }
  console.log("");
  console.log(`Custom Instructions: ${chatbot.customInstructions ? "✅ Configuradas" : "❌ NO configuradas"}`);
  if (chatbot.customInstructions) {
    console.log(`   ${chatbot.customInstructions.substring(0, 200)}...`);
  }
  console.log("");

  console.log(`\nIntegraciones de WhatsApp: ${chatbot.integrations.length}`);
  for (const integration of chatbot.integrations) {
    console.log(`   - ID: ${integration.id}`);
    console.log(`     Phone Number ID: ${integration.phoneNumberId}`);
    console.log(`     Is Active: ${integration.isActive}`);
    console.log(`     Has Token: ${integration.token ? "✅ SÍ" : "❌ NO"}`);
    console.log(`     Sync Status: ${integration.syncStatus || "N/A"}`);
  }

  console.log(`\n${"=".repeat(80)}`);
  console.log("\n📋 Diagnóstico:");

  const issues = [];

  if (chatbot.status !== "ACTIVE") {
    issues.push(`⚠️ Chatbot status es "${chatbot.status}" (debería ser "ACTIVE")`);
  }

  if (!chatbot.aiModel) {
    issues.push("⚠️ No hay modelo de AI configurado");
  }

  if (!chatbot.instructions && !chatbot.personality) {
    issues.push("⚠️ No hay instrucciones ni personalidad configuradas");
  }

  if (chatbot.integrations.length === 0) {
    issues.push("⚠️ No hay integraciones de WhatsApp");
  } else {
    const activeIntegrations = chatbot.integrations.filter((i) => i.isActive);
    if (activeIntegrations.length === 0) {
      issues.push("⚠️ Ninguna integración de WhatsApp está activa");
    }

    const integrationsWithToken = chatbot.integrations.filter((i) => i.token);
    if (integrationsWithToken.length === 0) {
      issues.push("⚠️ Ninguna integración de WhatsApp tiene token de acceso");
    }
  }

  if (issues.length === 0) {
    console.log("✅ El chatbot está configurado correctamente");
  } else {
    console.log("❌ Se encontraron problemas:");
    issues.forEach((issue) => console.log(`   ${issue}`));
  }

  console.log("");
}

checkChatbotConfig()
  .catch(console.error)
  .finally(() => process.exit());
