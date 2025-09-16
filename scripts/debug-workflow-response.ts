/**
 * Debug para inspeccionar la estructura de respuesta del AgentWorkflow
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

const realChatbot = {
  id: '66f6a7b8c1234567890abcdf',
  name: 'Debug Workflow',
  aiModel: 'gpt-5-nano',
  temperature: 1,
  instructions: 'Debug workflow response structure',
  integrations: {}
};

const realUser = {
  id: '66f6a7b8c1234567890abcde',
  plan: 'PRO',
  email: 'debug@formmy.app'
};

// Monkey patch para interceptar la respuesta del workflow
const originalLlamaIndexV2 = chatWithLlamaIndexV2;

console.log('🔍 DEBUGGING WORKFLOW RESPONSE STRUCTURE\n');

const testMessage = 'Recuérdame hacer backup mañana a las 3pm';

console.log(`📝 Message: "${testMessage}"`);
console.log('🔧 Starting instrumented chat...\n');

// Interceptar en el engine directamente
async function debugWorkflowResponse() {
  // Importar y crear engine directamente para interceptar
  const { LlamaIndexEngineV2 } = await import('../server/llamaindex-engine-v2/index');

  const engine = new LlamaIndexEngineV2('gpt-5-nano');

  // Monkey patch extractToolsUsed para ver qué recibe
  const originalExtractToolsUsed = (engine as any).extractToolsUsed;
  (engine as any).extractToolsUsed = function(response: any) {
    console.log('🔍 WORKFLOW RESPONSE ANALYSIS:');
    console.log('📊 Response type:', typeof response);
    console.log('📊 Response keys:', response ? Object.keys(response) : 'null/undefined');

    if (response) {
      console.log('📊 Full response structure:');
      console.log(JSON.stringify(response, null, 2));
    }

    const result = originalExtractToolsUsed.call(this, response);
    console.log('📊 extractToolsUsed result:', result);

    return result;
  };

  const result = await engine.chat(testMessage, {
    chatbot: realChatbot,
    user: realUser,
    stream: false,
    conversationHistory: []
  });

  console.log('\n🎯 FINAL ENGINE RESULT:');
  console.log('- Tools used:', result.toolsUsed);
  console.log('- Content preview:', result.content?.substring(0, 100) + '...');
}

debugWorkflowResponse().catch(console.error);