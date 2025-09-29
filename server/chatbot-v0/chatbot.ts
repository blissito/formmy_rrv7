/**
 * Módulo de chatbot real para V0 - Sin mocks
 */

export async function getChatbot(chatbotId: string, userId: string) {
  try {
    // 🛠️ Development mode - Use REAL chatbot for testing
    if (userId === 'dev-user-mock-pro' && process.env.DEVELOPMENT_TOKEN) {
      console.log('🛠️ Development mode - Using REAL chatbot for testing');

      // Override to use YOUR real chatbot ID
      const realChatbotId = '687edb4e7656b411c6a6c628';

      // Get the ACTUAL chatbot from database
      const { db } = await import("../../app/utils/db.server");
      const realChatbot = await db.chatbot.findFirst({
        where: {
          id: realChatbotId
        },
        include: {
          contexts: true
        }
      });

      if (realChatbot) {
        console.log('🎯 Found REAL chatbot:', {
          id: realChatbot.id,
          name: realChatbot.name,
          model: realChatbot.aiModel,
          isActive: realChatbot.isActive,
          contextsCount: realChatbot.contexts?.length || 0
        });
        return realChatbot;
      } else {
        console.log('❌ Real chatbot not found, falling back to mock');
      }
    }

    const { db } = await import("../../app/utils/db.server");

    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: userId
      }
      // ⚡ OPTIMIZACIÓN: No incluir contextos por defecto para mejorar performance
      // Los contextos se cargan solo cuando son necesarios (no include contexts)
    });

    if (!chatbot) {
      console.log('❌ Chatbot not found:', { chatbotId, userId });
      return null;
    }


    return chatbot;
  } catch (error) {
    console.error('❌ Error getting chatbot:', error);
    return null;
  }
}