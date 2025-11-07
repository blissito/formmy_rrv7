/**
 * Limpiar solo duplicados de fixtergeek@gmail.com
 */

import { db } from '../app/utils/db.server';

async function main() {
  // 1. Encontrar usuario
  const user = await db.user.findUnique({
    where: { email: 'fixtergeek@gmail.com' }
  });

  if (!user) {
    console.error('Usuario no encontrado');
    process.exit(1);
  }

  // 2. Encontrar chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id },
    select: { id: true }
  });

  const chatbotIds = chatbots.map(c => c.id);

  // 3. Encontrar conversaciones del usuario
  const conversations = await db.conversation.findMany({
    where: { chatbotId: { in: chatbotIds } },
    select: { id: true }
  });

  const conversationIds = conversations.map(c => c.id);

  console.log(`Usuario: ${user.email}`);
  console.log(`Chatbots: ${chatbotIds.length}`);
  console.log(`Conversaciones: ${conversationIds.length}`);

  // 4. Buscar duplicados SOLO en esas conversaciones
  const messages = await db.message.findMany({
    where: {
      conversationId: { in: conversationIds },
      externalMessageId: { not: null }
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      conversationId: true,
      externalMessageId: true,
      createdAt: true,
    }
  });

  console.log(`Mensajes con externalMessageId: ${messages.length}\n`);

  // 5. Agrupar por conversationId + externalMessageId
  const groups = new Map<string, typeof messages>();

  for (const msg of messages) {
    const key = `${msg.conversationId}_${msg.externalMessageId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(msg);
  }

  const duplicateGroups = Array.from(groups.entries())
    .filter(([_, msgs]) => msgs.length > 1);

  console.log(`Grupos con duplicados: ${duplicateGroups.length}\n`);

  if (duplicateGroups.length === 0) {
    console.log('✅ No hay duplicados en tu cuenta');
    return;
  }

  // 6. Eliminar duplicados (mantener el más antiguo)
  let deletedCount = 0;
  for (const [key, msgs] of duplicateGroups) {
    const toDelete = msgs.slice(1);

    for (const msg of toDelete) {
      await db.message.delete({
        where: { id: msg.id }
      });
      deletedCount++;
    }
  }

  console.log(`✅ Duplicados eliminados: ${deletedCount}`);
}

main().catch(console.error).finally(() => process.exit(0));
