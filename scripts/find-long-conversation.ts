import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findLongConversation() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  console.log('\n📊 CHATBOT:', chatbot.name);

  // Buscar conversaciones con múltiples mensajes
  const conversations = await prisma.conversation.findMany({
    where: { chatbotId: chatbot.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  console.log('\n💬 CONVERSACIONES RECIENTES:');
  conversations.forEach((conv, i) => {
    const userMsgs = conv.messages.filter(m => m.role === 'USER').length;
    console.log(`${i + 1}. ${conv.sessionId} - ${conv.messages.length} mensajes (${userMsgs} del usuario) - ${conv.createdAt.toISOString().split('T')[0]}`);
  });

  // Encontrar la conversación con más intercambios
  const longest = conversations.sort((a, b) => b.messages.length - a.messages.length)[0];

  if (!longest || longest.messages.length < 5) {
    console.log('\n⚠️  No hay conversaciones largas (mínimo 5 mensajes)');
    console.log('Mostrando conversación más reciente con múltiples mensajes...');
  }

  const target = longest;

  console.log('\n🔍 ANALIZANDO CONVERSACIÓN:', target.sessionId);
  console.log('Total mensajes:', target.messages.length);
  console.log('Created:', target.createdAt);

  console.log('\n📝 MENSAJES COMPLETOS:');
  target.messages.forEach((msg, i) => {
    console.log(`\n[${i + 1}] ${msg.role.toUpperCase()}:`);
    console.log(msg.content);
    console.log('---');
  });

  // Diagnóstico de memoria
  console.log('\n🧠 DIAGNÓSTICO DE MEMORIA:');

  const userMessages = target.messages.filter(m => m.role === 'USER');
  const assistantMessages = target.messages.filter(m => m.role === 'ASSISTANT');

  if (userMessages.length >= 2) {
    console.log('\n📌 Pregunta 1:', userMessages[0].content);
    console.log('📌 Respuesta 1:', assistantMessages[0]?.content.substring(0, 100) + '...');
    console.log('📌 Pregunta 2:', userMessages[1].content);
    console.log('📌 Respuesta 2:', assistantMessages[1]?.content.substring(0, 200) + '...');

    // Buscar referencias contextuales
    const response2 = assistantMessages[1]?.content.toLowerCase() || '';
    const hasMemory =
      response2.includes('mencion') ||
      response2.includes('dijiste') ||
      response2.includes('como te coment') ||
      response2.includes('anteriormente') ||
      response2.includes('antes') ||
      response2.includes('tu pregunta sobre');

    console.log('\n🚨 ¿Respuesta 2 usa contexto de Pregunta 1?', hasMemory ? '✅ SÍ' : '❌ NO - PROBLEMA DE MEMORIA');
  }

  await prisma.$disconnect();
}

findLongConversation();
