import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugLastConversation() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  console.log('\n📊 CHATBOT:', chatbot.name, `(${chatbot.id})`);

  // Buscar última conversación
  const lastConversation = await prisma.conversation.findFirst({
    where: { chatbotId: chatbot.id },
    orderBy: { createdAt: 'desc' },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!lastConversation) {
    console.log('No conversations found');
    return;
  }

  console.log('\n💬 ÚLTIMA CONVERSACIÓN:');
  console.log('ID:', lastConversation.id);
  console.log('Session ID:', lastConversation.sessionId);
  console.log('Created:', lastConversation.createdAt);
  console.log('Status:', lastConversation.status);
  console.log('Total mensajes:', lastConversation.messages.length);

  console.log('\n📝 MENSAJES (orden cronológico):');
  lastConversation.messages.forEach((msg, i) => {
    console.log(`\n[${i + 1}] ${msg.role.toUpperCase()} (${msg.createdAt.toISOString().split('T')[1].substring(0, 8)})`);
    console.log(msg.content.substring(0, 150) + (msg.content.length > 150 ? '...' : ''));
  });

  // Analizar patrones de memoria
  console.log('\n🔍 ANÁLISIS DE MEMORIA:');

  const userMessages = lastConversation.messages.filter(m => m.role === 'USER');
  const assistantMessages = lastConversation.messages.filter(m => m.role === 'ASSISTANT');

  console.log('Mensajes usuario:', userMessages.length);
  console.log('Mensajes asistente:', assistantMessages.length);

  // Verificar si hay referencias al contexto previo
  if (assistantMessages.length > 1) {
    const secondResponse = assistantMessages[1]?.content || '';
    const hasContextReference =
      secondResponse.includes('mencion') ||
      secondResponse.includes('dijiste') ||
      secondResponse.includes('preguntaste') ||
      secondResponse.includes('antes') ||
      secondResponse.includes('anterior') ||
      secondResponse.toLowerCase().includes('como te coment') ||
      secondResponse.toLowerCase().includes('como mencion');

    console.log('\n⚠️  Segunda respuesta hace referencia al contexto previo:', hasContextReference ? '✅' : '❌ PROBLEMA');

    if (!hasContextReference && userMessages.length > 1) {
      console.log('\n🚨 SÍNTOMA: Segunda respuesta no reconoce contexto de primera pregunta');
      console.log('Primera pregunta del usuario:', userMessages[0].content);
      console.log('Segunda pregunta del usuario:', userMessages[1].content);
      console.log('Segunda respuesta (primeros 200 chars):', secondResponse.substring(0, 200));
    }
  }

  await prisma.$disconnect();
}

debugLastConversation();
