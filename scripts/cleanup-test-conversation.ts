import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  const conv = await prisma.conversation.findFirst({ 
    where: { sessionId: { contains: 'test-memory-' } },
    orderBy: { createdAt: 'desc' }
  });
  
  if (conv) {
    await prisma.message.deleteMany({ where: { conversationId: conv.id } });
    await prisma.conversation.delete({ where: { id: conv.id } });
    console.log('✅ Conversación de prueba limpiada:', conv.sessionId);
  } else {
    console.log('✅ No hay conversaciones de prueba pendientes');
  }
  
  await prisma.$disconnect();
}

cleanup();
