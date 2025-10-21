import { db } from "../app/utils/db.server";

async function restoreConversation() {
  console.log("🔧 Restaurando conversación de WhatsApp...\n");

  const result = await db.conversation.updateMany({
    where: {
      sessionId: "whatsapp_5217712412825",
      status: "DELETED"
    },
    data: {
      status: "ACTIVE"
    }
  });

  console.log(`✅ Conversaciones restauradas: ${result.count}`);

  // Verificar
  const conv = await db.conversation.findFirst({
    where: { sessionId: "whatsapp_5217712412825" },
    select: {
      id: true,
      sessionId: true,
      status: true,
      messageCount: true,
      updatedAt: true
    }
  });

  if (conv) {
    console.log("\n📱 Estado actual:");
    console.log(`  ID: ${conv.id}`);
    console.log(`  Status: ${conv.status}`);
    console.log(`  Messages: ${conv.messageCount}`);
    console.log(`  Updated: ${conv.updatedAt}`);
  }

  console.log("\n✅ Listo! Ahora puedes enviar mensajes de WhatsApp");
}

restoreConversation()
  .catch(console.error)
  .finally(() => process.exit(0));
