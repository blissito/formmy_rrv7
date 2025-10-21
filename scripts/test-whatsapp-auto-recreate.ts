import { db } from "../app/utils/db.server";

async function testAutoRecreate() {
  console.log("🧪 Preparando test de auto-recreación de conversación\n");

  // Marcar conversación como DELETED
  const result = await db.conversation.updateMany({
    where: {
      sessionId: "whatsapp_5217712412825",
      status: "ACTIVE"
    },
    data: {
      status: "DELETED"
    }
  });

  console.log(`✅ Conversaciones marcadas como DELETED: ${result.count}`);

  // Verificar
  const conv = await db.conversation.findFirst({
    where: { sessionId: "whatsapp_5217712412825" },
    select: {
      id: true,
      sessionId: true,
      status: true,
      messageCount: true,
      createdAt: true
    }
  });

  if (conv) {
    console.log("\n📱 Estado antes del test:");
    console.log(`  ID: ${conv.id}`);
    console.log(`  Status: ${conv.status}`);
    console.log(`  Messages: ${conv.messageCount}`);
    console.log(`  Created: ${conv.createdAt}`);
  }

  console.log("\n🎬 Ahora envía un mensaje de WhatsApp al número: +52 1 55 3911 1285");
  console.log("📝 El webhook debería:");
  console.log("  1. Detectar que la conversación está DELETED");
  console.log("  2. Crear una NUEVA conversación ACTIVE");
  console.log("  3. Procesar el mensaje normalmente");
  console.log("  4. Responder por WhatsApp");
  console.log("\n✅ Listo para probar!");
}

testAutoRecreate()
  .catch(console.error)
  .finally(() => process.exit(0));
