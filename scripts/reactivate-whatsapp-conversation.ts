/**
 * Script para reactivar una conversación de WhatsApp DELETED
 */

import { PrismaClient, ConversationStatus } from "@prisma/client";

const db = new PrismaClient();

async function reactivateConversation() {
  const phoneNumber = "5217712412825";
  const sessionId = `whatsapp_${phoneNumber}`;

  console.log(`🔍 Buscando conversación con sessionId: ${sessionId}`);

  const conversation = await db.conversation.findFirst({
    where: { sessionId },
  });

  if (!conversation) {
    console.log("❌ No se encontró conversación con ese sessionId");
    return;
  }

  console.log("📋 Conversación encontrada:", {
    id: conversation.id,
    sessionId: conversation.sessionId,
    status: conversation.status,
    chatbotId: conversation.chatbotId,
    messageCount: conversation.messageCount,
    createdAt: conversation.createdAt,
  });

  if (conversation.status === ConversationStatus.DELETED) {
    console.log("♻️ Reactivando conversación DELETED...");

    const updated = await db.conversation.update({
      where: { id: conversation.id },
      data: {
        status: ConversationStatus.ACTIVE,
        updatedAt: new Date(),
      },
    });

    console.log("✅ Conversación reactivada:", {
      id: updated.id,
      status: updated.status,
      updatedAt: updated.updatedAt,
    });
  } else {
    console.log(`ℹ️ La conversación ya está en status ${conversation.status}`);
  }

  await db.$disconnect();
}

reactivateConversation().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
