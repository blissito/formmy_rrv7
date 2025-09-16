/**
 * Módulo de chatbot mock para testing LlamaIndex V2
 * Crea chatbots de prueba cuando no existen en BD
 */

export interface MockChatbotConfig {
  chatbotId: string;
  userId: string;
  model?: string;
}

export function createMockChatbot(config: MockChatbotConfig) {
  const { chatbotId, userId, model = 'gpt-5-nano' } = config;

  console.log('🤖 Creating mock chatbot for LlamaIndex V2 testing');

  return {
    id: chatbotId,
    userId: userId,
    name: 'LlamaIndex V2 Test Bot',
    slug: 'llamaindex-v2-test',
    description: 'Chatbot de prueba para LlamaIndex V2',
    personality: 'Asistente especializado en LlamaIndex V2',
    instructions: 'Eres un asistente que demuestra las capacidades de LlamaIndex V2',
    customInstructions: '',
    welcomeMessage: '¡Hola! Soy el chatbot de prueba LlamaIndex V2.',
    aiModel: model,
    temperature: 0.7,
    primaryColor: '#3B82F6',
    theme: 'light',
    isActive: true,
    contexts: [],
    whatsappIntegrationEnabled: false,
    stripeIntegrationEnabled: false
  } as any;
}

export async function getChatbotOrMock(chatbotId: string, userId: string, isTestUser: boolean) {
  const { getChatbotById } = await import("../chatbot-api.server");

  let chatbot = await getChatbotById(chatbotId);

  // Solo crear mock para usuarios de testing
  if (!chatbot && isTestUser) {
    chatbot = createMockChatbot({ chatbotId, userId });
  }

  return chatbot;
}

export function createChatbotNotFoundError() {
  return new Response(
    JSON.stringify({ error: "Chatbot no encontrado" }),
    { status: 404, headers: { "Content-Type": "application/json" } }
  );
}

export function createChatbotPermissionError() {
  return new Response(
    JSON.stringify({ error: "No tienes permiso para usar este chatbot" }),
    { status: 403, headers: { "Content-Type": "application/json" } }
  );
}