import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findBlissConversations() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  // Buscar mensajes que contengan "bliss"
  const messagesWithBliss = await prisma.message.findMany({
    where: {
      conversation: {
        chatbotId: chatbot.id
      },
      content: {
        contains: 'bliss',
        mode: 'insensitive'
      },
      deleted: { not: true }
    },
    include: {
      conversation: {
        include: {
          messages: {
            where: { deleted: { not: true } },
            orderBy: { createdAt: 'asc' }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  console.log(`\n🔍 MENSAJES CON "BLISS": ${messagesWithBliss.length}\n`);

  for (const msg of messagesWithBliss) {
    console.log('━'.repeat(80));
    console.log(`📝 Mensaje: ${msg.id}`);
    console.log(`   Conversación: ${msg.conversationId}`);
    console.log(`   Session: ${msg.conversation.sessionId}`);
    console.log(`   Fecha: ${msg.createdAt.toLocaleString()}`);
    console.log(`   Role: ${msg.role}`);
    console.log(`   Contenido: ${msg.content}`);
    console.log(`\n   Total mensajes en esta conversación: ${msg.conversation.messages.length}\n`);

    // Mostrar toda la conversación
    console.log('   HISTORIAL COMPLETO:');
    msg.conversation.messages.forEach((m, i) => {
      if (m.role !== 'SYSTEM') {
        console.log(`   [${i + 1}] ${m.role}: ${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}`);
      }
    });
    console.log('');
  }

  await prisma.$disconnect();
}

findBlissConversations();
