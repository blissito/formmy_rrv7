import { db } from "../app/utils/db.server";

/**
 * Script para verificar reacciones en la base de datos
 */
async function checkReactions() {
  console.log("🔍 Buscando reacciones en la base de datos...\n");

  // Buscar mensajes con isReaction: true
  const reactions = await db.message.findMany({
    where: {
      isReaction: true,
    },
    select: {
      id: true,
      content: true,
      reactionEmoji: true,
      reactionToMsgId: true,
      externalMessageId: true,
      conversationId: true,
      createdAt: true,
    },
    take: 20,
  });

  console.log(`✅ Encontradas ${reactions.length} reacciones con isReaction: true\n`);

  if (reactions.length > 0) {
    reactions.forEach((reaction, index) => {
      console.log(`Reacción ${index + 1}:`);
      console.log(`  - ID: ${reaction.id}`);
      console.log(`  - Emoji: ${reaction.reactionEmoji}`);
      console.log(`  - Content: "${reaction.content}"`);
      console.log(`  - Reacciona a mensaje: ${reaction.reactionToMsgId}`);
      console.log(`  - External ID: ${reaction.externalMessageId}`);
      console.log(`  - Conversación: ${reaction.conversationId}`);
      console.log(`  - Fecha: ${reaction.createdAt}`);
      console.log("");
    });
  }

  // Buscar mensajes vacíos o con solo emoji que podrían ser reacciones antiguas
  console.log("\n🔍 Buscando mensajes vacíos o muy cortos (posibles reacciones antiguas)...\n");

  const emptyMessages = await db.message.findMany({
    where: {
      OR: [
        { content: "" },
        { content: { contains: "📎" } },
      ],
      role: "USER",
      channel: "whatsapp",
      isReaction: { not: true }, // Que NO estén marcadas como reacción
    },
    select: {
      id: true,
      content: true,
      role: true,
      channel: true,
      externalMessageId: true,
      conversationId: true,
      createdAt: true,
    },
    take: 10,
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`✅ Encontrados ${emptyMessages.length} mensajes vacíos/cortos\n`);

  if (emptyMessages.length > 0) {
    emptyMessages.forEach((msg, index) => {
      console.log(`Mensaje ${index + 1}:`);
      console.log(`  - ID: ${msg.id}`);
      console.log(`  - Content: "${msg.content}"`);
      console.log(`  - Channel: ${msg.channel}`);
      console.log(`  - External ID: ${msg.externalMessageId}`);
      console.log(`  - Fecha: ${msg.createdAt}`);
      console.log("");
    });
  }

  // Verificar si hay mensajes con externalMessageId que podrían recibir reacciones
  console.log("\n🔍 Verificando mensajes del bot con externalMessageId...\n");

  const botMessages = await db.message.findMany({
    where: {
      role: "ASSISTANT",
      channel: "whatsapp",
      externalMessageId: { not: null },
    },
    select: {
      id: true,
      content: true,
      externalMessageId: true,
      conversationId: true,
    },
    take: 5,
    orderBy: {
      createdAt: "desc",
    },
  });

  console.log(`✅ Encontrados ${botMessages.length} mensajes del bot con externalMessageId\n`);

  if (botMessages.length > 0) {
    botMessages.forEach((msg, index) => {
      console.log(`Mensaje ${index + 1}:`);
      console.log(`  - Content: ${msg.content.substring(0, 50)}...`);
      console.log(`  - External ID: ${msg.externalMessageId}`);
      console.log("");
    });
  }

  process.exit(0);
}

checkReactions().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
