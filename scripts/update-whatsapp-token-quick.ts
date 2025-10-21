/**
 * Script rápido para actualizar el token de WhatsApp
 */

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function updateToken() {
  const userEmail = "fixtergeek@gmail.com";
  const newToken = "EAAQCKJqSLTMBPkg4sHMRZAw2SrjmabVgJ8Nn41jRa5fyOAwAEFmaDU5jI71rZBWT5Y5kbgWKpnth3diF7qOl3mTZAowT5TzoNjn6yoZBUwoGrTDGUhPTJIStZAamDwkjnzcZBZCs7bo3S5RvRZAEHxrqpYZAWpZAZBpDnmuJrNZCaZBRN15TZAF6YuB0MYCFUXKaezvlVevmhOHNpwQP8UWSXO8VqZCKGUGFglq8xxABUXZCNVZCXo4E0hqHwul5UZCj3X8EMZD";

  console.log(`🔍 Buscando usuario: ${userEmail}`);

  // Encontrar usuario
  const user = await db.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    console.log("❌ Usuario no encontrado");
    return;
  }

  console.log(`✅ Usuario encontrado: ${user.id}`);

  // Encontrar chatbot del usuario
  const chatbot = await db.chatbot.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }, // Tomar el más reciente
  });

  if (!chatbot) {
    console.log("❌ No se encontró chatbot para este usuario");
    return;
  }

  console.log(`✅ Chatbot encontrado: ${chatbot.id} (${chatbot.name})`);

  // Encontrar integración de WhatsApp
  const integration = await db.integration.findFirst({
    where: {
      chatbotId: chatbot.id,
      platform: 'WHATSAPP',
    },
  });

  if (!integration) {
    console.log("❌ No se encontró integración de WhatsApp para este chatbot");
    return;
  }

  console.log(`📋 Integración actual:`, {
    id: integration.id,
    platform: integration.platform,
    isActive: integration.isActive,
    phoneNumberId: integration.phoneNumberId,
  });

  // Actualizar token
  console.log(`🔄 Actualizando token...`);

  const updated = await db.integration.update({
    where: { id: integration.id },
    data: {
      token: newToken,
      isActive: true,
      lastActivity: new Date(),
    },
  });

  console.log(`✅ Token actualizado exitosamente!`);
  console.log(`📱 Phone Number ID: ${updated.phoneNumberId}`);
  console.log(`✅ Activo: ${updated.isActive}`);

  await db.$disconnect();
}

updateToken().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
