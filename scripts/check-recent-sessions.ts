import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkRecentSessions() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

  const conversations = await prisma.conversation.findMany({
    where: {
      chatbotId: chatbot.id,
      createdAt: { gte: thirtyMinutesAgo },
      status: { not: 'DELETED' }
    },
    include: {
      messages: {
        where: { deleted: { not: true } },
        orderBy: { createdAt: 'asc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n🔍 CONVERSACIONES (últimos 30 min): ${conversations.length}\n`);

  for (const conv of conversations) {
    console.log('━'.repeat(80));
    console.log(`📝 Conversación: ${conv.id}`);
    console.log(`   SessionId: ${conv.sessionId}`);
    console.log(`   Creada: ${conv.createdAt.toLocaleString()}`);
    console.log(`   Actualizada: ${conv.updatedAt.toLocaleString()}`);
    console.log(`   Total mensajes: ${conv.messages.length}`);
    console.log('');

    conv.messages.forEach((msg, i) => {
      if (msg.role !== 'SYSTEM') {
        const preview = msg.content.substring(0, 60);
        console.log(`   [${i + 1}] ${msg.role} (${msg.createdAt.toLocaleTimeString()}): ${preview}${msg.content.length > 60 ? '...' : ''}`);
      }
    });
    console.log('');
  }

  // Análisis de patrones
  console.log('═'.repeat(80));
  console.log('📊 ANÁLISIS:');
  console.log(`   Total conversaciones: ${conversations.length}`);

  const conversationsWithMultipleMessages = conversations.filter(c => c.messages.length > 2);
  console.log(`   Conversaciones con múltiples mensajes: ${conversationsWithMultipleMessages.length}`);

  const conversationsWithOnlyOneMessage = conversations.filter(c => c.messages.length <= 2);
  console.log(`   Conversaciones con 1 mensaje: ${conversationsWithOnlyOneMessage.length}`);

  if (conversationsWithOnlyOneMessage.length > conversationsWithMultipleMessages.length) {
    console.log('\n   ⚠️  PROBLEMA: Muchas conversaciones con 1 mensaje');
    console.log('       → Sugiere que cada mensaje crea nueva conversación');
    console.log('       → SessionId probablemente cambia entre mensajes');
  }

  await prisma.$disconnect();
}

checkRecentSessions();
