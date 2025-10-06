import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkCurlTest() {
  const sessionId = process.argv[2];

  if (!sessionId) {
    console.log('❌ Uso: npx tsx scripts/check-curl-test.ts <sessionId>');
    return;
  }

  const conversation = await prisma.conversation.findFirst({
    where: {
      sessionId: { contains: sessionId }
    },
    include: {
      messages: {
        where: { deleted: { not: true } },
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conversation) {
    console.log(`\n❌ No se encontró conversación con sessionId: ${sessionId}\n`);
    return;
  }

  console.log('\n🔍 RESULTADO DEL TEST CURL\n');
  console.log('═'.repeat(80));
  console.log(`SessionId completo: ${conversation.sessionId}`);
  console.log(`Total mensajes: ${conversation.messages.length}`);
  console.log('═'.repeat(80));
  console.log('');

  console.log('📝 MENSAJES:\n');
  conversation.messages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.role} (${msg.createdAt.toLocaleTimeString()})`);
    console.log(`    ${msg.content.substring(0, 100)}${msg.content.length > 100 ? '...' : ''}`);
    console.log('');
  });

  console.log('═'.repeat(80));
  console.log('🧪 ANÁLISIS:\n');

  if (conversation.messages.length < 4) {
    console.log('❌ ERROR: Faltan mensajes');
    console.log(`   Esperado: 5 mensajes (SYSTEM + USER + ASSISTANT + USER + ASSISTANT)`);
    console.log(`   Actual: ${conversation.messages.length}`);
    return;
  }

  const userMessages = conversation.messages.filter(m => m.role === 'USER');
  const hasBliss = userMessages.some(m => m.content.toLowerCase().includes('bliss'));
  const hasWho = userMessages.some(m =>
    m.content.toLowerCase().includes('quien') ||
    m.content.toLowerCase().includes('quién')
  );

  if (hasBliss && hasWho) {
    console.log('✅ ESTRUCTURA CORRECTA:');
    console.log('   - Mensaje 1: "soy bliss" ✅');
    console.log('   - Mensaje 2: "quien soy" ✅');
    console.log('');

    // Verificar la respuesta del agente
    const lastAssistant = [...conversation.messages].reverse().find(m => m.role === 'ASSISTANT');

    if (lastAssistant) {
      const mentionsBliss = lastAssistant.content.toLowerCase().includes('bliss');

      if (mentionsBliss) {
        console.log('✅✅✅ ¡MEMORIA FUNCIONANDO! El agente recordó "Bliss"');
        console.log(`   Respuesta: "${lastAssistant.content.substring(0, 100)}..."`);
      } else {
        console.log('❌ MEMORIA NO FUNCIONA: El agente NO recordó "Bliss"');
        console.log(`   Respuesta: "${lastAssistant.content.substring(0, 150)}..."`);
        console.log('');
        console.log('   🔍 Revisar logs del servidor para ver:');
        console.log('      - Si se cargó el historial desde BD');
        console.log('      - Si createMemory() se ejecutó');
        console.log('      - Si la memoria se pasó al agente');
      }
    }
  }

  console.log('');
  console.log('═'.repeat(80));

  await prisma.$disconnect();
}

checkCurlTest();
