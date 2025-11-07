/**
 * Script para eliminar todas las conversaciones y mensajes de un usuario
 */

import { db } from '../app/utils/db.server';

async function main() {
  const userEmail = process.argv[2] || 'fixtergeek@gmail.com';

  console.log(`🔍 Buscando usuario: ${userEmail}\n`);

  // 1. Encontrar usuario
  const user = await db.user.findUnique({
    where: { email: userEmail }
  });

  if (!user) {
    console.error(`❌ Usuario no encontrado: ${userEmail}`);
    process.exit(1);
  }

  console.log(`✅ Usuario encontrado: ${user.name} (${user.id})\n`);

  // 2. Encontrar todos los chatbots del usuario
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id },
    select: { id: true, name: true }
  });

  console.log(`Chatbots encontrados: ${chatbots.length}`);
  chatbots.forEach(bot => console.log(`  - ${bot.name} (${bot.id})`));
  console.log('');

  // 3. Encontrar todas las conversaciones
  let totalConversations = 0;
  let totalMessages = 0;

  for (const chatbot of chatbots) {
    const conversations = await db.conversation.findMany({
      where: { chatbotId: chatbot.id },
      select: { id: true }
    });

    console.log(`\nChatbot "${chatbot.name}": ${conversations.length} conversaciones`);
    totalConversations += conversations.length;

    // 4. Eliminar mensajes de cada conversación
    for (const conversation of conversations) {
      const deletedMessages = await db.message.deleteMany({
        where: { conversationId: conversation.id }
      });

      totalMessages += deletedMessages.count;

      if (deletedMessages.count > 0) {
        console.log(`  Conversación ${conversation.id}: ${deletedMessages.count} mensajes eliminados`);
      }
    }

    // 5. Eliminar conversaciones
    const deletedConversations = await db.conversation.deleteMany({
      where: { chatbotId: chatbot.id }
    });

    console.log(`  ✅ ${deletedConversations.count} conversaciones eliminadas`);
  }

  console.log(`\n✅ Resumen:`);
  console.log(`   - Conversaciones eliminadas: ${totalConversations}`);
  console.log(`   - Mensajes eliminados: ${totalMessages}`);
  console.log('\n🔄 Ahora puedes volver a sincronizar WhatsApp');
}

main().catch(console.error).finally(() => process.exit(0));
