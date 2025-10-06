import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBlissConversation() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  // Buscar conversación más reciente
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

  console.log('\n🔍 ÚLTIMA CONVERSACIÓN (test "soy bliss")\n');
  console.log('ID:', conversation.id);
  console.log('Session:', conversation.sessionId);
  console.log('Actualizada:', conversation.updatedAt);
  console.log('Total mensajes:', conversation.messages.length);
  console.log('\n' + '═'.repeat(80) + '\n');

  conversation.messages.forEach((msg, i) => {
    if (msg.role !== 'SYSTEM') {
      console.log(`[${i + 1}] ${msg.role} | ${msg.createdAt.toLocaleString()}`);
      console.log(msg.content.substring(0, 200));
      console.log('');
    }
  });

  // Verificar si las respuestas se están guardando
  const assistantMessages = conversation.messages.filter(m => m.role === 'ASSISTANT');
  console.log('═'.repeat(80));
  console.log(`📊 ESTADÍSTICAS:`);
  console.log(`   Total mensajes: ${conversation.messages.length}`);
  console.log(`   Mensajes ASSISTANT: ${assistantMessages.length}`);
  console.log(`   Última actualización: ${conversation.updatedAt.toLocaleString()}`);

  // Buscar si el usuario dijo "bliss"
  const userSaidBliss = conversation.messages.some(m =>
    m.role === 'USER' && m.content.toLowerCase().includes('bliss')
  );

  const userAskedWho = conversation.messages.some(m =>
    m.role === 'USER' && (
      m.content.toLowerCase().includes('quién soy') ||
      m.content.toLowerCase().includes('quien soy')
    )
  );

  console.log('\n🧪 TEST DE MEMORIA:');
  if (userSaidBliss && userAskedWho) {
    console.log('   ✅ Usuario dijo "bliss" y preguntó "quién soy"');

    const blissMessageIndex = conversation.messages.findIndex(m =>
      m.role === 'USER' && m.content.toLowerCase().includes('bliss')
    );

    const whoMessageIndex = conversation.messages.findIndex(m =>
      m.role === 'USER' && (
        m.content.toLowerCase().includes('quién soy') ||
        m.content.toLowerCase().includes('quien soy')
      )
    );

    if (whoMessageIndex > blissMessageIndex) {
      const agentResponse = conversation.messages[whoMessageIndex + 1];
      if (agentResponse && agentResponse.role === 'ASSISTANT') {
        const mentionsBliss = agentResponse.content.toLowerCase().includes('bliss');

        if (mentionsBliss) {
          console.log('   ✅ Agente RECORDÓ que el usuario es Bliss');
        } else {
          console.log('   ❌ Agente NO RECORDÓ que el usuario es Bliss');
          console.log('   Respuesta del agente:');
          console.log('   ', agentResponse.content.substring(0, 150));
        }
      } else {
        console.log('   ⚠️  No hay respuesta del agente después de la pregunta');
      }
    }
  }

  await prisma.$disconnect();
}

checkBlissConversation();
