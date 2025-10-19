import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function activateDemoChatbot() {
  try {
    const chatbotId = '68f456dca443330f35f8c81d';

    console.log(`Activando chatbot ${chatbotId}...`);

    const updated = await prisma.chatbot.update({
      where: { id: chatbotId },
      data: { status: 'ACTIVE' },
      select: { id: true, name: true, status: true }
    });

    console.log('✅ Chatbot activado:', updated);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

activateDemoChatbot();
