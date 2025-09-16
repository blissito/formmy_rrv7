/**
 * Test específico para "la misa" - debe usar tools automáticamente
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const testChatbot = {
  id: '66f6a7b8c1234567890abcdf',
  name: 'Test Enhanced Agent',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Eres un asistente que usa herramientas automáticamente.',
  integrations: {}
};

const testUser = {
  id: '66f6a7b8c1234567890abcde',
  plan: 'PRO',
  email: 'test@formmy.app'
};

async function testMisaDetection() {
  console.log('🔍 TESTING: Enhanced agent con "la misa"');

  const testMessage = 'recordatorio de la misa el 08/09/2025';

  console.log(`📝 Input: "${testMessage}"`);
  console.log('🎯 Expected: Debe usar schedule_reminder con defaults inteligentes\n');

  try {
    const result = await chatWithLlamaIndexV2(
      testMessage,
      testChatbot,
      testUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('📊 RESULT ANALYSIS:');
    console.log('- Tools used:', result.toolsUsed?.length || 0);
    console.log('- Tools list:', result.toolsUsed || []);
    console.log('- Processing time:', result.processingTime, 'ms');

    console.log('\n💬 RESPONSE:');
    console.log(result.content?.substring(0, 400) + '...');

    console.log('\n🎯 ANALYSIS:');
    if (result.toolsUsed?.length > 0) {
      console.log('✅ SUCCESS: Agent used tools automatically');

      // Verificar en BD
      const { db } = await import('../app/utils/db.server');
      const recentActions = await db.scheduledAction.findMany({
        where: {
          chatbotId: testChatbot.id,
          createdAt: {
            gte: new Date(Date.now() - 2 * 60 * 1000)
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 3
      });

      console.log(`💾 Database records: ${recentActions.length}`);
      for (const action of recentActions) {
        const data = action.data as any;
        console.log(`- ${data.title} → ${data.date} @ ${new Date(data.date).toTimeString().substring(0, 5)}`);
      }

    } else {
      console.log('❌ FAILED: Agent did not use tools');
      console.log('💡 Need stronger prompting or different approach');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMisaDetection().catch(console.error);