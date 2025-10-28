import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateVoiceToSpanish() {
  const chatbotSlug = "demo-chatbot-DeqLzY";

  console.log(`\n🔧 Cambiando a voz española con mejor pronunciación\n`);

  const chatbot = await prisma.chatbot.findUnique({
    where: { slug: chatbotSlug },
    select: { id: true },
  });

  if (!chatbot) {
    console.log("❌ Chatbot no encontrado");
    return;
  }

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

  // ✅ Leo Moreno - ÚNICA voz nativa mexicana real de ElevenLabs (verificada Ene 2025)
  const updatedMetadata = {
    ttsProvider: "elevenlabs",
    ttsVoiceId: "3l9iCMrNSRR0w51JvFB0", // Leo Moreno - Voz nativa mexicana masculina
  };

  console.log("✏️ Cambiando a voz Leo Moreno (3l9iCMrNSRR0w51JvFB0) - ÚNICA voz nativa mexicana");

  await prisma.integration.update({
    where: { id: voiceIntegration.id },
    data: { metadata: updatedMetadata },
  });

  console.log("✅ Voz actualizada a Leo Moreno (Voz nativa mexicana)");

  await prisma.$disconnect();
}

updateVoiceToSpanish().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
