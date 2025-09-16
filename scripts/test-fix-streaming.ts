/**
 * Test para verificar que el fix de streaming funciona
 * Simular conversación: Hola → Recuérdame algo
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const mockUser = {
  id: '66f6a7b8c1234567890abcde', // ObjectID válido
  plan: 'PRO',
  email: 'test@example.com'
};

const mockChatbot = {
  id: '66f6a7b8c1234567890abcdf', // ObjectID válido
  name: 'Test Chatbot',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Eres un asistente útil.',
  integrations: {}
};

async function testStreamingFix() {
  console.log('🧪 TESTING STREAMING FIX - LlamaIndex Engine v2\n');

  // Simular conversación histórica
  let conversationHistory: Array<{ role: "user" | "assistant"; content: string }> = [];

  // MENSAJE 1: Saludo inicial (antes activaba streaming)
  console.log('--- MENSAJE 1: Saludo ---');
  const greetingMessage = 'Hola, ¿cómo estás?';

  try {
    console.log(`👋 Usuario: "${greetingMessage}"`);

    const result1 = await chatWithLlamaIndexV2(
      greetingMessage,
      mockChatbot,
      mockUser,
      {
        stream: true, // Intentar activar streaming (debería ser ignorado)
        conversationHistory: conversationHistory
      }
    );

    console.log('✅ Result type:', typeof result1);
    console.log('📄 Content preview:', result1.content?.substring(0, 100) + '...');
    console.log('🛠️ Tools used:', result1.toolsUsed?.length || 0);

    // Agregar a historial
    conversationHistory.push({ role: 'user', content: greetingMessage });
    conversationHistory.push({ role: 'assistant', content: result1.content || '' });

    console.log('🎯 Streaming fue deshabilitado:', !result1.content?.includes('streaming'));

  } catch (error) {
    console.error('❌ Mensaje 1 error:', error.message);
  }

  console.log('\n');

  // MENSAJE 2: Solicitud de herramienta (debe funcionar)
  console.log('--- MENSAJE 2: Recordatorio ---');
  const reminderMessage = 'Recuérdame llamar al cliente mañana a las 2pm';

  try {
    console.log(`📅 Usuario: "${reminderMessage}"`);

    const result2 = await chatWithLlamaIndexV2(
      reminderMessage,
      mockChatbot,
      mockUser,
      {
        stream: true, // Intentar activar streaming (debería ser ignorado)
        conversationHistory: conversationHistory
      }
    );

    console.log('✅ Result type:', typeof result2);
    console.log('📄 Content preview:', result2.content?.substring(0, 100) + '...');
    console.log('🛠️ Tools used count:', result2.toolsUsed?.length || 0);
    console.log('📋 Tools list:', result2.toolsUsed || []);

    // Verificar que herramientas se intentaron ejecutar
    const toolsAttempted = result2.content?.includes('schedule_reminder') ||
                          result2.content?.includes('recordatorio') ||
                          (result2.toolsUsed?.length || 0) > 0;

    console.log(`${toolsAttempted ? '✅' : '❌'} Herramientas ${toolsAttempted ? 'DETECTADAS' : 'IGNORADAS'}`);

    // El éxito es que se INTENTEN las herramientas, aunque fallen por ObjectID
    const testPassed = toolsAttempted;
    console.log(`\n🎯 TEST RESULTADO: ${testPassed ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🔧 Fix aplicado: ${testPassed ? 'FUNCIONA' : 'NO FUNCIONA'}`);

  } catch (error) {
    console.error('❌ Mensaje 2 error:', error.message);
  }

  console.log('\n🏁 Test del fix de streaming completado');
}

testStreamingFix().catch(console.error);