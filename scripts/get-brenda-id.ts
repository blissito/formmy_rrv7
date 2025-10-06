import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function getBrendaId() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } },
    select: { id: true, name: true, userId: true }
  });

  if (chatbot) {
    console.log('Chatbot ID:', chatbot.id);
    console.log('Name:', chatbot.name);
    console.log('User ID:', chatbot.userId);
  } else {
    console.log('No encontrado');
  }

  await prisma.$disconnect();
}

getBrendaId();
