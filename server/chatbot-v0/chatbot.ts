/**
 * Módulo de chatbot real para V0 - Sin mocks
 */

export async function getChatbot(chatbotId: string, userId: string) {
  try {
    const { db } = await import("../../app/utils/db.server");

    const chatbot = await db.chatbot.findFirst({
      where: {
        id: chatbotId,
        userId: userId
      }
    });

    if (!chatbot) {
      console.log('❌ Chatbot not found:', { chatbotId, userId });
      return null;
    }

    console.log('✅ Chatbot found:', {
      id: chatbot.id,
      name: chatbot.name,
      model: chatbot.aiModel
    });

    return chatbot;
  } catch (error) {
    console.error('❌ Error getting chatbot:', error);
    return null;
  }
}