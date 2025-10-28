import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkVoiceConfig() {
  const chatbotSlug = "demo-chatbot-DeqLzY";

  console.log(`\n🔍 Verificando configuración de voz para chatbot: ${chatbotSlug}\n`);

  // 1. Buscar chatbot por slug
  const chatbot = await prisma.chatbot.findUnique({
    where: { slug: chatbotSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      customInstructions: true
    }
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    return;
  }

  console.log("📋 Chatbot:");
  console.log(`  ID: ${chatbot.id}`);
  console.log(`  Nombre: ${chatbot.name}`);
  console.log(`  Custom Instructions: ${chatbot.customInstructions?.substring(0, 100)}...`);

  // 2. Buscar integración de voz
  const voiceIntegration = await prisma.integration.findFirst({
    where: {
      chatbotId: chatbot.id,
      platform: "VOICE"
    }
  });

  console.log("\n🎤 Integración de Voz:");
  if (!voiceIntegration) {
    console.log("❌ No se encontró integración de voz");
  } else {
    console.log(`  ID: ${voiceIntegration.id}`);
    console.log(`  Estado: ${voiceIntegration.isActive ? '✅ Activa' : '❌ Inactiva'}`);
    console.log(`  Platform: ${voiceIntegration.platform}`);

    // Analizar metadata
    const metadata = voiceIntegration.metadata as any;
    console.log("\n📊 Metadata:");
    console.log("  ttsVoiceId:", metadata?.ttsVoiceId);
    console.log("  ttsProvider:", metadata?.ttsProvider);

    // Verificar si es Valentina
    const valentinaId = "FGY2WhTYpPnrIDTdsKH5";
    const diegoId = "DuNnqwVuAtxzKcXGUN2v";

    console.log("\n🔍 Verificación de Voice ID:");
    if (metadata?.ttsVoiceId === valentinaId) {
      console.log("  ✅ Voice ID coincide con Valentina (voz mexicana femenina)");
    } else if (metadata?.ttsVoiceId === diegoId) {
      console.log("  ⚠️ Voice ID es Diego (voz mexicana masculina)");
    } else {
      console.log(`  ❌ Voice ID NO coincide con voces mexicanas configuradas`);
      console.log(`\n  Voces esperadas:`);
      console.log(`    Valentina (Femenino): ${valentinaId}`);
      console.log(`    Diego (Masculino): ${diegoId}`);
      console.log(`\n  Voice ID actual: ${metadata?.ttsVoiceId || 'NO CONFIGURADO'}`);
    }
  }

  await prisma.$disconnect();
}

checkVoiceConfig().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
