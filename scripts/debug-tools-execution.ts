/**
 * Debug script para entender exactamente por qué las herramientas no se ejecutan
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const realChatbot = {
  id: '66f6a7b8c1234567890abcdf',
  name: 'Test Real Chatbot',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Eres un asistente útil que debe usar herramientas.',
  customInstructions: 'SIEMPRE usa las herramientas disponibles cuando sea necesario.',
  integrations: {}
};

const realUser = {
  id: '66f6a7b8c1234567890abcde',
  plan: 'PRO',
  email: 'test@formmy.app'
};

async function debugToolExecution() {
  console.log('🔍 DEBUG: Tool Execution Analysis\n');

  const testMessage = 'Recuérdame revisar el reporte mañana a las 10am';

  console.log(`📝 Testing message: "${testMessage}"`);
  console.log(`👤 User: ${realUser.plan} (${realUser.id})`);
  console.log(`🤖 Chatbot: ${realChatbot.aiModel} (${realChatbot.id})`);
  console.log('');

  try {
    console.log('🚀 Starting chat with LlamaIndex Engine v2...');

    const result = await chatWithLlamaIndexV2(
      testMessage,
      realChatbot,
      realUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('\n📊 RESULT ANALYSIS:');
    console.log('- Success:', result.success);
    console.log('- Content length:', result.content?.length || 0);
    console.log('- Processing time:', result.processingTime);
    console.log('- Tools detected in response:', result.toolsUsed?.length || 0);
    console.log('- Tools list:', JSON.stringify(result.toolsUsed, null, 2));
    console.log('- Metadata:', JSON.stringify(result.metadata, null, 2));

    console.log('\n💬 RESPONSE PREVIEW:');
    console.log(result.content?.substring(0, 300) + '...');

    // Analizar si la respuesta contiene evidencia de herramientas ejecutadas
    const content = result.content || '';
    const hasToolEvidence = [
      content.includes('recordatorio programado'),
      content.includes('✅'),
      content.includes('ID:'),
      content.includes('scheduled'),
      content.includes('exitosamente')
    ];

    console.log('\n🔍 TOOL EVIDENCE ANALYSIS:');
    console.log('- Has "recordatorio programado":', hasToolEvidence[0]);
    console.log('- Has "✅":', hasToolEvidence[1]);
    console.log('- Has "ID:":', hasToolEvidence[2]);
    console.log('- Has "scheduled":', hasToolEvidence[3]);
    console.log('- Has "exitosamente":', hasToolEvidence[4]);

    const evidenceCount = hasToolEvidence.filter(Boolean).length;
    console.log(`- Evidence score: ${evidenceCount}/5`);

    if (evidenceCount >= 2) {
      console.log('✅ LIKELY: Tools were executed (evidence in response)');
    } else {
      console.log('❌ LIKELY: Tools were NOT executed (no evidence)');
    }

    // Verificar si hay registros en la base de datos
    console.log('\n💾 Checking database for recent records...');
    const { db } = await import('../app/utils/db.server');

    const recentActions = await db.scheduledAction.findMany({
      where: {
        chatbotId: realChatbot.id,
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 3
    });

    console.log(`📋 Recent scheduled actions (last 5 min): ${recentActions.length}`);
    for (const action of recentActions) {
      console.log(`- ${action.id}: ${JSON.stringify(action.data).substring(0, 100)}...`);
    }

    console.log('\n🎯 FINAL DIAGNOSIS:');
    if (recentActions.length > 0) {
      console.log('✅ Tools ARE working: Found database records');
      console.log('❓ Issue might be in tool tracking/reporting');
    } else {
      console.log('❌ Tools NOT working: No database records found');
      console.log('❓ Issue is in tool execution itself');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    console.error('Stack:', error instanceof Error ? error.stack : 'No stack trace');
  }
}

debugToolExecution().catch(console.error);