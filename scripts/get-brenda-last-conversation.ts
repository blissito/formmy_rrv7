import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getLastConversation() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot Brenda Go no encontrado');
    return;
  }

  console.log('📊 Chatbot:', chatbot.name, '| ID:', chatbot.id);

  const conversation = await prisma.conversation.findFirst({
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
    orderBy: { updatedAt: 'desc' }
  });

  if (!conversation) {
    console.log('❌ No hay conversaciones');
    return;
  }

  console.log('\n🗨️  ÚLTIMA CONVERSACIÓN');
  console.log('ID:', conversation.id);
  console.log('Session:', conversation.sessionId);
  console.log('Fecha:', conversation.updatedAt);
  console.log('Total mensajes:', conversation.messages.length);

  console.log('\n📝 HISTORIAL DE MENSAJES:\n');
  conversation.messages.forEach((msg, i) => {
    const preview = msg.content.substring(0, 150);
    console.log(`[${i + 1}] ${msg.role} (${msg.createdAt.toISOString()})`);
    console.log(`    ${preview}${msg.content.length > 150 ? '...' : ''}`);
    console.log('');
  });

  // Buscar evidencia de que el agente recuerda información previa
  const hasMemoryTest = conversation.messages.some(m =>
    m.role === 'USER' && (
      m.content.toLowerCase().includes('mi nombre') ||
      m.content.toLowerCase().includes('cómo me llamo') ||
      m.content.toLowerCase().includes('quién soy') ||
      m.content.toLowerCase().includes('te dije') ||
      m.content.toLowerCase().includes('recuerdas')
    )
  );

  if (hasMemoryTest) {
    console.log('⚠️  CONVERSACIÓN CONTIENE PRUEBA DE MEMORIA');
    console.log('   Usuario preguntó sobre información previa\n');
  }

  await prisma.$disconnect();
}

getLastConversation();
