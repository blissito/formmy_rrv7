import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkHistory() {
  // Buscar la conversación más reciente con "bliss"
  const conversation = await prisma.conversation.findFirst({
    where: {
      sessionId: {
        contains: 'preview-68ba2400acaca27f1371ed2a'
      }
    },
    include: {
      messages: {
        where: { deleted: { not: true } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conversation) {
    console.log('❌ Conversación no encontrada');
    return;
  }

  console.log('\n🔍 ANÁLISIS DE HISTORIAL\n');
  console.log('SessionId:', conversation.sessionId);
  console.log('Total mensajes:', conversation.messages.length);
  console.log('\n' + '═'.repeat(80) + '\n');

  // Simular exactamente lo que hace el backend
  const allMessages = conversation.messages;
  console.log(`📚 Total mensajes en BD: ${allMessages.length}`);

  const recentMessages = allMessages.slice(-50);
  console.log(`📚 Después de truncar a 50: ${recentMessages.length}`);

  const history = recentMessages.map(msg => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content
  }));

  console.log(`📚 Historial formateado: ${history.length} mensajes\n`);

  // Mostrar exactamente qué se pasaría al agente
  console.log('📝 HISTORIAL QUE DEBERÍA RECIBIR EL AGENTE:\n');
  history.forEach((msg, i) => {
    if (msg.role !== 'system') {
      console.log(`[${i + 1}] ${msg.role.toUpperCase()}: ${msg.content.substring(0, 60)}...`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  console.log('🧪 VALIDACIÓN:');

  const hasPreviousBliss = history.some(m =>
    m.role === 'user' && m.content.toLowerCase().includes('bliss')
  );

  if (hasPreviousBliss) {
    console.log('✅ El historial CONTIENE el mensaje "soy bliss"');
    console.log('   → El agente DEBERÍA poder recordar');
    console.log('   → Si no recuerda: problema en createMemory() o agent()');
  } else {
    console.log('❌ El historial NO contiene "bliss"');
    console.log('   → Problema en la carga del historial');
  }

  // Verificar orden
  const userMessages = history.filter(m => m.role === 'user');
  console.log(`\n📊 Mensajes USER en orden:`);
  userMessages.forEach((m, i) => {
    console.log(`   ${i + 1}. "${m.content.substring(0, 40)}..."`);
  });

  await prisma.$disconnect();
}

checkHistory();
