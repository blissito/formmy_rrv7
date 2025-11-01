/**
 * Módulo de chatbot real para V0 - Sin mocks
 * Soporta usuarios anónimos (acceso público)
 */

export async function getChatbot(chatbotId: string, userId: string, isAnonymous = false) {
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
          user: true // Cargar user también en modo development
          // contexts: Ya incluido automáticamente
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

    // 🔓 Usuarios anónimos: buscar solo por chatbotId (sin validar ownership)
    // La validación de isActive se hace en el endpoint
    const where = isAnonymous
      ? { id: chatbotId }
      : { id: chatbotId, userId: userId };

    const chatbot = await db.chatbot.findFirst({
      where,
      include: {
        user: true // ✅ CRÍTICO: Cargar user para obtener plan del dueño (necesario para tools)
        // contexts: Ya incluido automáticamente (es un tipo embebido, no una relación)
      }
    });

    if (!chatbot) {
      console.log('❌ Chatbot not found:', { chatbotId, userId, isAnonymous });
      return null;
    }

    return chatbot;
  } catch (error) {
    console.error('❌ Error getting chatbot:', error);
    return null;
  }
}