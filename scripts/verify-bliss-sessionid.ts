import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verifyBlissSession() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  // Buscar mensajes de "bliss" de los últimos 5 minutos
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

  const messages = await prisma.message.findMany({
    where: {
      conversation: {
        chatbotId: chatbot.id
      },
      OR: [
        { content: { contains: 'bliss', mode: 'insensitive' } },
        { content: { contains: 'quien', mode: 'insensitive' } },
        { content: { contains: 'quién', mode: 'insensitive' } }
      ],
      createdAt: { gte: fiveMinutesAgo },
      deleted: { not: true }
    },
    include: {
      conversation: true
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log(`\n🔍 MENSAJES DE LOS ÚLTIMOS 5 MINUTOS: ${messages.length}\n`);

  // Agrupar por sessionId
  const bySession = messages.reduce((acc, msg) => {
    const sid = msg.conversation.sessionId;
    if (!acc[sid]) acc[sid] = [];
    acc[sid].push(msg);
    return acc;
  }, {} as Record<string, typeof messages>);

  const sessionIds = Object.keys(bySession);
  console.log(`📊 Total de sessionIds diferentes: ${sessionIds.length}\n`);

  if (sessionIds.length === 1) {
    console.log('✅ ¡EXCELENTE! Todos los mensajes usan el MISMO sessionId');
    console.log(`   SessionId: ${sessionIds[0]}`);
  } else {
    console.log('❌ PROBLEMA: Múltiples sessionIds (cada mensaje crea nueva conversación)');
  }

  console.log('\n' + '═'.repeat(80) + '\n');

  for (const [sessionId, msgs] of Object.entries(bySession)) {
    console.log(`📝 SessionId: ${sessionId}`);
    console.log(`   Total mensajes: ${msgs.length}`);
    console.log(`   Creado: ${msgs[msgs.length - 1].createdAt.toLocaleString()}`);
    console.log(`   Último: ${msgs[0].createdAt.toLocaleString()}`);
    console.log('   Contenido:');
    msgs.reverse().forEach((msg, i) => {
      console.log(`   ${i + 1}. [${msg.role}] ${msg.content.substring(0, 60)}`);
    });
    console.log('');
  }

  // Análisis
  console.log('═'.repeat(80));
  console.log('📊 ANÁLISIS:');

  if (sessionIds.length > 1) {
    console.log('\n❌ DIAGNÓSTICO: El sessionId está cambiando entre mensajes');
    console.log('   Causas posibles:');
    console.log('   1. localStorage no se está leyendo correctamente');
    console.log('   2. Componente se está desmontando');
    console.log('   3. localStorage se está limpiando entre mensajes');
    console.log('\n   SOLUCIÓN: Revisar logs de consola del navegador');
    console.log('   Buscar: "♻️ Reutilizando" vs "🆕 Nuevo sessionId"');
  } else if (sessionIds.length === 1 && bySession[sessionIds[0]].length < 2) {
    console.log('\n⚠️  Solo hay 1 mensaje en esta sesión');
    console.log('   Espera a que envíes el segundo mensaje para verificar');
  } else {
    console.log('\n✅ SessionId funciona correctamente');
    console.log('   Si el agente NO recuerda, el problema es en el backend');
  }

  await prisma.$disconnect();
}

verifyBlissSession();
