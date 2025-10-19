import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkChatbots() {
  try {
    // Buscar usuario (por email si lo conocemos)
    console.log('\n=== Buscando usuarios ===');
    const users = await prisma.user.findMany({
      select: { id: true, email: true },
      take: 5,
    });
    console.log('Primeros 5 usuarios:', users);

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la BD');
      return;
    }

    const firstUserId = users[0].id;
    console.log(`\n=== Verificando chatbots para userId: ${firstUserId} ===`);

    // Buscar TODOS los chatbots del usuario (sin filtro de status)
    const allChatbots = await prisma.chatbot.findMany({
      where: { userId: firstUserId },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`\nTotal chatbots del usuario: ${allChatbots.length}`);
    allChatbots.forEach((bot, i) => {
      console.log(`  ${i + 1}. ${bot.name} - Status: ${bot.status} (ID: ${bot.id})`);
    });

    // Buscar solo los ACTIVE
    const activeChatbots = await prisma.chatbot.findMany({
      where: { userId: firstUserId, status: 'ACTIVE' },
      select: { id: true, name: true, status: true },
    });

    console.log(`\nChatbots ACTIVE: ${activeChatbots.length}`);
    activeChatbots.forEach((bot, i) => {
      console.log(`  ${i + 1}. ${bot.name} (ID: ${bot.id})`);
    });

    // Buscar chatbots "demo"
    const demoChatbots = await prisma.chatbot.findMany({
      where: {
        name: { contains: 'demo', mode: 'insensitive' },
      },
      select: { id: true, name: true, status: true, userId: true },
    });

    console.log(`\n=== Chatbots con "demo" en el nombre: ${demoChatbots.length} ===`);
    demoChatbots.forEach((bot, i) => {
      const isCurrentUser = bot.userId === firstUserId;
      console.log(`  ${i + 1}. ${bot.name} - Status: ${bot.status} (${isCurrentUser ? '✅ Tu usuario' : '❌ Otro usuario'})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChatbots();
