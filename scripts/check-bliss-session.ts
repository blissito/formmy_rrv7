import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkBlissSession() {
  const conversation = await prisma.conversation.findFirst({
    where: {
      sessionId: 'asDWjf7dqA3hV8bhMa4OG'
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

  console.log('\n🔍 CONVERSACIÓN DONDE USUARIO DIJO "SOY BLISS"\n');
  console.log('ID:', conversation.id);
  console.log('Session:', conversation.sessionId);
  console.log('Actualizada:', conversation.updatedAt);
  console.log('Total mensajes:', conversation.messages.length);
  console.log('\n' + '═'.repeat(80) + '\n');

  conversation.messages.forEach((msg, i) => {
    console.log(`[${i + 1}] ${msg.role} | ${msg.createdAt.toLocaleString()}`);
    console.log('─'.repeat(80));
    if (msg.role === 'SYSTEM') {
      console.log(msg.content.substring(0, 100) + '...');
    } else {
      console.log(msg.content);
    }
    console.log('');
  });

  // Verificar si hay pregunta "quién soy"
  const hasWhoAmI = conversation.messages.some(m =>
    m.role === 'USER' && (
      m.content.toLowerCase().includes('quién soy') ||
      m.content.toLowerCase().includes('quien soy')
    )
  );

  console.log('═'.repeat(80));
  console.log('🧪 ANÁLISIS:');
  if (hasWhoAmI) {
    console.log('   ✅ El usuario preguntó "quién soy" en esta conversación');
  } else {
    console.log('   ❌ El usuario NO preguntó "quién soy" en esta conversación');
    console.log('   → Esto significa que abrió una conversación NUEVA');
    console.log('   → El agente NO puede recordar entre conversaciones diferentes');
  }

  await prisma.$disconnect();
}

checkBlissSession();
