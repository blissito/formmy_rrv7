import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function findWhoAmIMessages() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  // Buscar mensajes de las últimas 2 horas que contengan "quién" o "quien"
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

  const messages = await prisma.message.findMany({
    where: {
      conversation: {
        chatbotId: chatbot.id
      },
      role: 'USER',
      OR: [
        { content: { contains: 'quién', mode: 'insensitive' } },
        { content: { contains: 'quien', mode: 'insensitive' } }
      ],
      createdAt: { gte: twoHoursAgo },
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
    orderBy: { createdAt: 'desc' }
  });

  console.log(`\n🔍 MENSAJES CON "QUIÉN/QUIEN" (últimas 2h): ${messages.length}\n`);

  for (const msg of messages) {
    console.log('━'.repeat(80));
    console.log(`📝 "${msg.content}"`);
    console.log(`   Fecha: ${msg.createdAt.toLocaleString()}`);
    console.log(`   Conversación: ${msg.conversationId}`);
    console.log(`   Session: ${msg.conversation.sessionId}`);
    console.log(`   Total mensajes en conversación: ${msg.conversation.messages.length}`);
    console.log('');

    console.log('   HISTORIAL COMPLETO DE ESTA CONVERSACIÓN:');
    msg.conversation.messages.forEach((m, i) => {
      if (m.role !== 'SYSTEM') {
        const preview = m.content.substring(0, 80);
        console.log(`   [${i + 1}] ${m.role} (${m.createdAt.toLocaleTimeString()}): ${preview}${m.content.length > 80 ? '...' : ''}`);
      }
    });
    console.log('');

    // Análisis de memoria
    const hasBlissInHistory = msg.conversation.messages.some(m =>
      m.content.toLowerCase().includes('bliss') && m.id !== msg.id
    );

    if (hasBlissInHistory) {
      console.log('   ✅ Esta conversación SÍ tiene "bliss" en el historial');

      const agentIndex = msg.conversation.messages.findIndex(m => m.id === msg.id);
      const nextMessage = msg.conversation.messages[agentIndex + 1];

      if (nextMessage && nextMessage.role === 'ASSISTANT') {
        const mentionsBliss = nextMessage.content.toLowerCase().includes('bliss');
        if (mentionsBliss) {
          console.log('   ✅ El agente RECORDÓ a Bliss en la respuesta');
        } else {
          console.log('   ❌ El agente NO RECORDÓ a Bliss en la respuesta');
          console.log('   Respuesta:', nextMessage.content.substring(0, 150));
        }
      }
    } else {
      console.log('   ❌ Esta conversación NO tiene "bliss" en el historial');
      console.log('   → Conversación independiente, el agente no puede recordar');
    }
    console.log('');
  }

  await prisma.$disconnect();
}

findWhoAmIMessages();
