import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixVoiceIntegration() {
  const chatbotSlug = "demo-chatbot-DeqLzY";

  console.log(`\n🔧 Arreglando integración de voz para: ${chatbotSlug}\n`);

  // 1. Buscar chatbot
  const chatbot = await prisma.chatbot.findUnique({
    where: { slug: chatbotSlug },
    select: { id: true, name: true },
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    return;
  }

  console.log(`📋 Chatbot: ${chatbot.name} (${chatbot.id})`);

  // 2. Buscar integración de voz
  const voiceIntegration = await prisma.integration.findFirst({
    where: {
      chatbotId: chatbot.id,
      platform: "VOICE",
    },
  });

  if (!voiceIntegration) {
    console.log("❌ No se encontró integración de voz");
    return;
  }

  console.log("\n🎤 Integración actual:");
  console.log(JSON.stringify(voiceIntegration, null, 2));

  // 3. Actualizar metadata para incluir ttsProvider
  const currentMetadata = (voiceIntegration.metadata as any) || {};

  const updatedMetadata = {
    ...currentMetadata,
    ttsProvider: "elevenlabs", // ✅ Agregar provider explícitamente
    ttsVoiceId: "3l9iCMrNSRR0w51JvFB0", // ✅ Leo Moreno - ÚNICA voz nativa mexicana
  };

  console.log("\n✏️ Metadata actualizado:");
  console.log(JSON.stringify(updatedMetadata, null, 2));

  // 4. Actualizar en BD
  await prisma.integration.update({
    where: { id: voiceIntegration.id },
    data: {
      metadata: updatedMetadata,
    },
  });

  console.log("\n✅ Integración actualizada exitosamente");

  // 5. Verificar
  const updated = await prisma.integration.findUnique({
    where: { id: voiceIntegration.id },
  });

  console.log("\n🔍 Verificación final:");
  console.log(JSON.stringify(updated, null, 2));

  await prisma.$disconnect();
}

fixVoiceIntegration().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
