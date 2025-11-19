/**
 * Script para diagnosticar mensajes de reacción en WhatsApp
 * Busca mensajes vacíos o con contenido sospechoso que podrían ser reacciones
 */

import { db } from "../app/utils/db.server";

async function debugReactions() {
  console.log("🔍 Buscando mensajes sospechosos (posibles reacciones)...\n");

  // 1. Buscar mensajes vacíos o con solo espacios
  const emptyMessages = await db.message.findMany({
    where: {
      OR: [
        { content: "" },
        { content: " " },
        { content: { startsWith: "  " } }
      ],
      role: "USER",
      channel: { startsWith: "whatsapp" }
    },
    select: {
      id: true,
      content: true,
      channel: true,
      externalMessageId: true,
      createdAt: true,
      conversationId: true
    },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  console.log(`📭 Mensajes vacíos encontrados: ${emptyMessages.length}\n`);

  for (const msg of emptyMessages) {
    console.log(`ID: ${msg.id}`);
    console.log(`Contenido: "${msg.content}"`);
    console.log(`Canal: ${msg.channel}`);
    console.log(`ExternalMessageId: ${msg.externalMessageId}`);
    console.log(`ConversationId: ${msg.conversationId}`);
    console.log(`Fecha: ${msg.createdAt}`);
    console.log("---");
  }

  // 2. Buscar mensajes que ya son reacciones procesadas
  const reactionMessages = await db.message.findMany({
    where: {
      channel: "whatsapp_reaction"
    },
    orderBy: { createdAt: "desc" },
    take: 10
  });

  console.log(`\n👍 Reacciones ya procesadas: ${reactionMessages.length}\n`);

  for (const msg of reactionMessages) {
    console.log(`ID: ${msg.id}`);
    console.log(`Emoji: ${msg.content}`);
    console.log(`Mensaje original: ${msg.picture}`);
    console.log(`Fecha: ${msg.createdAt}`);
    console.log("---");
  }

  // 3. Estadísticas generales
  const totalWhatsAppMessages = await db.message.count({
    where: {
      channel: { startsWith: "whatsapp" }
    }
  });

  console.log(`\n📊 Estadísticas:`);
  console.log(`Total mensajes WhatsApp: ${totalWhatsAppMessages}`);
  console.log(`Mensajes vacíos: ${emptyMessages.length}`);
  console.log(`Reacciones procesadas: ${reactionMessages.length}`);

  await db.$disconnect();
}

debugReactions().catch(console.error);
