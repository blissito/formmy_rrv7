import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkAllConversations() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  const conversations = await prisma.conversation.findMany({
    where: {
      chatbotId: chatbot.id,
      status: { not: 'DELETED' }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        where: { deleted: { not: true } }
      }
    },
    orderBy: { updatedAt: 'desc' },
    take: 10
  });

  console.log(`\n📊 Total conversaciones activas: ${conversations.length}\n`);

  for (const conv of conversations) {
    console.log('━'.repeat(80));
    console.log(`🗨️  Conversación: ${conv.id}`);
    console.log(`   Session: ${conv.sessionId}`);
    console.log(`   Fecha: ${conv.updatedAt.toLocaleString()}`);
    console.log(`   Total mensajes: ${conv.messages.length}`);

    // Analizar si hay prueba de memoria
    const userMessages = conv.messages.filter(m => m.role === 'USER');
    const hasNameIntroduction = userMessages.some(m =>
      m.content.toLowerCase().includes('me llamo') ||
      m.content.toLowerCase().includes('mi nombre es') ||
      m.content.toLowerCase().includes('soy ')
    );

    const hasMemoryQuestion = userMessages.some(m =>
      m.content.toLowerCase().includes('mi nombre') ||
      m.content.toLowerCase().includes('cómo me llamo') ||
      m.content.toLowerCase().includes('quién soy') ||
      m.content.toLowerCase().includes('recuerdas')
    );

    if (hasNameIntroduction) {
      console.log('   ✅ Usuario se presentó con su nombre');
    }
    if (hasMemoryQuestion) {
      console.log('   ⚠️  Usuario preguntó sobre información previa');
    }

    if (hasNameIntroduction || hasMemoryQuestion) {
      console.log('\n   📝 MENSAJES:\n');
      conv.messages.forEach((msg, i) => {
        if (msg.role !== 'SYSTEM') {
          const preview = msg.content.substring(0, 100).replace(/\n/g, ' ');
          console.log(`   [${i + 1}] ${msg.role}: ${preview}${msg.content.length > 100 ? '...' : ''}`);
        }
      });
    }
    console.log('');
  }

  await prisma.$disconnect();
}

checkAllConversations();
