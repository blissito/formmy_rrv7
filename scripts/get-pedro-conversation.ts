import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getConversation() {
  const conversation = await prisma.conversation.findFirst({
    where: {
      id: '68e42dc4fa479d51e630a425' // La conversación de Pedro
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        where: { deleted: { not: true } }
      }
    }
  });

  if (!conversation) {
    console.log('❌ Conversación no encontrada');
    return;
  }

  console.log('\n🔍 CONVERSACIÓN COMPLETA: "Me llamo Pedro"\n');
  console.log('ID:', conversation.id);
  console.log('Session:', conversation.sessionId);
  console.log('Total mensajes:', conversation.messages.length);
  console.log('\n' + '═'.repeat(80) + '\n');

  conversation.messages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.role} | ${msg.createdAt.toLocaleString()}`);
    console.log('─'.repeat(80));
    console.log(msg.content);
    console.log('\n');
  });

  // Analizar si el agente respondió correctamente
  const userAsksName = conversation.messages.find(m =>
    m.role === 'USER' && m.content.toLowerCase().includes('cuál es mi nombre')
  );

  if (userAsksName) {
    const msgIndex = conversation.messages.indexOf(userAsksName);
    const agentResponse = conversation.messages[msgIndex + 1];

    console.log('═'.repeat(80));
    console.log('🔍 ANÁLISIS DE MEMORIA:');
    console.log('═'.repeat(80));

    if (agentResponse && agentResponse.role === 'ASSISTANT') {
      const mentionsPedro = agentResponse.content.toLowerCase().includes('pedro');

      if (mentionsPedro) {
        console.log('✅ El agente SÍ recordó que el usuario se llama Pedro');
      } else {
        console.log('❌ El agente NO recordó el nombre Pedro');
        console.log('   Respuesta:', agentResponse.content.substring(0, 200));
      }
    } else {
      console.log('⚠️  No hay respuesta del agente a la pregunta del nombre');
    }
  }

  await prisma.$disconnect();
}

getConversation();
