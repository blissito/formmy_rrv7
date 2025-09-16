/**
 * Test para verificar capacidades multi-paso del agente LlamaIndex
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const realChatbot = {
  id: '66f6a7b8c1234567890abcdf',
  name: 'Multi-Step Test Bot',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Eres un asistente que puede realizar múltiples tareas secuenciales.',
  integrations: {}
};

const realUser = {
  id: '66f6a7b8c1234567890abcde',
  plan: 'PRO',
  email: 'test@formmy.app'
};

async function testMultiStepCapabilities() {
  console.log('🔍 TESTING MULTI-STEP AGENT CAPABILITIES\n');

  // Test 1: Tarea que requiere múltiples pasos
  console.log('--- Test 1: Múltiples recordatorios en una solicitud ---');
  const multiStepMessage = `
    Necesito que me ayudes con mi agenda para la próxima semana:
    1. Recuérdame la reunión con cliente el lunes 18 a las 10am
    2. Recuérdame revisar reportes el martes 19 a las 2pm
    3. Recuérdame llamar al proveedor el miércoles 20 a las 4pm
  `;

  try {
    console.log(`📝 Multi-step message: "${multiStepMessage.trim()}"`);

    const result = await chatWithLlamaIndexV2(
      multiStepMessage.trim(),
      realChatbot,
      realUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('\n📊 MULTI-STEP RESULT:');
    console.log('- Tools used count:', result.toolsUsed?.length || 0);
    console.log('- Tools list:', result.toolsUsed || []);
    console.log('- Processing time:', result.processingTime);
    console.log('- Content length:', result.content?.length || 0);

    console.log('\n💬 RESPONSE PREVIEW:');
    console.log(result.content?.substring(0, 500) + '...');

    // Analizar si se crearon múltiples registros
    const { db } = await import('../app/utils/db.server');
    const recentActions = await db.scheduledAction.findMany({
      where: {
        chatbotId: realChatbot.id,
        createdAt: {
          gte: new Date(Date.now() - 2 * 60 * 1000) // Last 2 minutes
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`\n💾 Database records created: ${recentActions.length}`);
    for (const action of recentActions) {
      const data = action.data as any;
      console.log(`- ${action.id}: ${data.title} (${data.date})`);
    }

    console.log('\n🎯 MULTI-STEP ANALYSIS:');
    if (recentActions.length >= 3) {
      console.log('✅ EXCELLENT: Agent executed multiple tools in sequence');
    } else if (recentActions.length >= 2) {
      console.log('✅ GOOD: Agent executed some multi-step actions');
    } else if (recentActions.length >= 1) {
      console.log('⚠️ PARTIAL: Agent executed at least one step');
    } else {
      console.log('❌ FAILED: No steps executed');
    }

  } catch (error) {
    console.error('❌ Multi-step test failed:', error);
  }

  console.log('\n');

  // Test 2: Tarea compleja que requiere razonamiento
  console.log('--- Test 2: Tarea compleja con razonamiento ---');
  const complexMessage = `
    Analiza mi agenda y ayúdame: necesito programar una presentación importante.
    La presentación debe ser después del 18 de septiembre pero antes del 25.
    Debe ser en horario de oficina (9am-5pm) y preferiblemente martes o miércoles.
    Recuérdame preparar la presentación para la fecha que elijas.
  `;

  try {
    console.log(`📝 Complex reasoning message: "${complexMessage.trim()}"`);

    const result = await chatWithLlamaIndexV2(
      complexMessage.trim(),
      realChatbot,
      realUser,
      {
        stream: false,
        conversationHistory: []
      }
    );

    console.log('\n📊 COMPLEX REASONING RESULT:');
    console.log('- Tools used count:', result.toolsUsed?.length || 0);
    console.log('- Processing time:', result.processingTime);

    console.log('\n💬 REASONING RESPONSE:');
    console.log(result.content?.substring(0, 400) + '...');

    const hasReasoning = result.content?.includes('septiembre') &&
                        (result.content?.includes('martes') || result.content?.includes('miércoles'));

    console.log('\n🧠 REASONING ANALYSIS:');
    console.log(`${hasReasoning ? '✅' : '❌'} Agent showed reasoning capabilities: ${hasReasoning}`);

  } catch (error) {
    console.error('❌ Complex reasoning test failed:', error);
  }

  console.log('\n🏁 Multi-step agent testing completed');
}

testMultiStepCapabilities().catch(console.error);