/**
 * Test específico para verificar detección y uso de herramientas
 * en LlamaIndex Engine v2
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const mockUser = {
  id: 'test-user',
  plan: 'PRO',
  email: 'test@example.com'
};

const mockChatbot = {
  id: 'test-chatbot',
  name: 'Test Chatbot',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Eres un asistente útil.',
  integrations: {}
};

async function testToolDetection() {
  console.log('🧪 TESTING TOOL DETECTION - LlamaIndex Engine v2\n');

  // Test 1: Mensaje que debería usar herramientas
  console.log('--- Test 1: Recordatorio ---');
  const reminderMessage = 'Recuérdame llamar al cliente mañana a las 3pm';

  try {
    console.log(`📝 Message: "${reminderMessage}"`);

    const result = await chatWithLlamaIndexV2(
      reminderMessage,
      mockChatbot,
      mockUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('✅ Result type:', typeof result);
    console.log('📄 Content length:', result.content?.length || 0);
    console.log('🛠️ Tools used count:', result.toolsUsed?.length || 0);
    console.log('📋 Tools list:', result.toolsUsed || []);
    console.log('⏱️ Processing time:', result.processingTime || 0);
    console.log('🎯 Content preview:', result.content?.substring(0, 200) + '...');

    const toolsWorked = (result.toolsUsed?.length || 0) > 0;
    console.log(`${toolsWorked ? '✅' : '❌'} Tools execution: ${toolsWorked ? 'SUCCESS' : 'FAILED'}\n`);

  } catch (error) {
    console.error('❌ Test 1 error:', error.message);
  }

  // Test 2: Mensaje conversacional (no herramientas)
  console.log('--- Test 2: Conversación ---');
  const chatMessage = '¿Cómo estás?';

  try {
    console.log(`📝 Message: "${chatMessage}"`);

    const result = await chatWithLlamaIndexV2(
      chatMessage,
      mockChatbot,
      mockUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('✅ Result type:', typeof result);
    console.log('📄 Content length:', result.content?.length || 0);
    console.log('🛠️ Tools used count:', result.toolsUsed?.length || 0);
    console.log('⏱️ Processing time:', result.processingTime || 0);
    console.log('🎯 Content preview:', result.content?.substring(0, 200) + '...');

    const conversationWorked = (result.toolsUsed?.length || 0) === 0;
    console.log(`${conversationWorked ? '✅' : '❌'} Conversation mode: ${conversationWorked ? 'SUCCESS' : 'FAILED'}\n`);

  } catch (error) {
    console.error('❌ Test 2 error:', error.message);
  }

  // Test 3: Consultar recordatorios
  console.log('--- Test 3: List Reminders ---');
  const listMessage = '¿Qué recordatorios tengo?';

  try {
    console.log(`📝 Message: "${listMessage}"`);

    const result = await chatWithLlamaIndexV2(
      listMessage,
      mockChatbot,
      mockUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('✅ Result type:', typeof result);
    console.log('📄 Content length:', result.content?.length || 0);
    console.log('🛠️ Tools used count:', result.toolsUsed?.length || 0);
    console.log('📋 Tools list:', result.toolsUsed || []);
    console.log('⏱️ Processing time:', result.processingTime || 0);
    console.log('🎯 Content preview:', result.content?.substring(0, 200) + '...');

    const listWorked = (result.toolsUsed?.length || 0) > 0;
    console.log(`${listWorked ? '✅' : '❌'} List tools execution: ${listWorked ? 'SUCCESS' : 'FAILED'}\n`);

  } catch (error) {
    console.error('❌ Test 3 error:', error.message);
  }

  console.log('🏁 Tool detection testing completed');
}

testToolDetection().catch(console.error);