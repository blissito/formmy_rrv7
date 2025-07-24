import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugWelcomeMessage() {
  try {
    // Get the chatbot with ID 687eced5cd352f36e1ff8214
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: '687eced5cd352f36e1ff8214' },
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
        primaryColor: true,
        userId: true
      }
    });
    
    console.log('Chatbot actual:', chatbot);
    
    // Get all chatbots for debugging
    const allChatbots = await prisma.chatbot.findMany({
      select: {
        id: true,
        name: true,
        welcomeMessage: true,
        primaryColor: true,
        userId: true,
        isActive: true
      }
    });
    
    console.log('Todos los chatbots:', allChatbots);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugWelcomeMessage();
