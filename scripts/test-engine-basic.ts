#!/usr/bin/env npx tsx
/**
 * Basic Test - New Engine v0.0.1
 *
 * Test básico sin llamadas API para verificar arquitectura
 */

// Mock básico para testing
const mockUser = {
  id: 'test-user-123',
  email: 'test@formmy.app',
  plan: 'PRO',
  name: 'Test User',
  createdAt: new Date(),
  updatedAt: new Date(),
  googleId: null,
  avatar: null,
  stripeCustomerId: null,
  stripeSubscriptionId: null,
  subscriptionStatus: null,
  trialEndsAt: null,
  cancelAtPeriodEnd: null,
  currentPeriodEnd: null,
};

const mockChatbot = {
  id: 'test-chatbot-456',
  userId: 'test-user-123',
  name: 'Test Chatbot',
  description: 'Chatbot para testing del motor v0.0.1',
  instructions: 'Eres un asistente útil para pruebas del nuevo motor.',
  customInstructions: 'Responde siempre de forma amigable y profesional.',
  welcomeMessage: '¡Hola! Soy un chatbot de prueba del nuevo motor v0.0.1',
  aiModel: 'gpt-5-nano',
  temperature: 0.7,
  maxTokens: 800,
  createdAt: new Date(),
  updatedAt: new Date(),
  active: true,
  enableStreaming: false,
  goodbyeMessage: null,
  inactivityTimeout: null,
  color: '#3B82F6',
  fontFamily: 'Inter',
  fontSize: 14,
  borderRadius: 8,
  position: 'bottom-right',
  showBranding: true,
  customCss: null,
  customJs: null,
  whatsappIntegrationId: null,
};

async function testAgentCreation() {
  console.log('🧪 Testing Agent Creation...');

  try {
    const { createChatbotAgent } = await import('../server/llamaindex-engine');

    // Test agent creation
    const agent = createChatbotAgent(mockChatbot as any, mockUser as any);
    const info = agent.getInfo();

    console.log('✅ Agent created successfully:', {
      name: info.name,
      version: info.version,
      model: info.model,
      userPlan: info.userPlan,
      toolsCount: info.toolsCount,
      capabilities: info.capabilities,
    });

    // Test configuration
    const config = agent.getConfig();
    console.log('✅ Agent configuration:', {
      model: config.model,
      systemPromptLength: config.systemPrompt.length,
      toolsCount: config.tools.length,
      maxIterations: config.maxIterations,
      agentName: config.agentName,
    });

    return true;

  } catch (error) {
    console.error('❌ Agent Creation Test failed:', error);
    return false;
  }
}

async function testEngineConfig() {
  console.log('🧪 Testing Engine Configuration...');

  try {
    const { LlamaIndexEngine } = await import('../server/llamaindex-engine/core/engine');

    const mockConfig = {
      model: 'gpt-5-nano',
      systemPrompt: 'Test system prompt',
      tools: [], // Empty tools for config test
      agentName: 'TestAgent',
      version: '0.0.1',
    };

    // Test engine creation (without initialization)
    const engine = new LlamaIndexEngine(mockConfig);
    const retrievedConfig = engine.getConfig();

    console.log('✅ Engine created successfully:', {
      model: retrievedConfig.model,
      agentName: retrievedConfig.agentName,
      toolsCount: retrievedConfig.tools.length,
      systemPromptLength: retrievedConfig.systemPrompt.length,
    });

    console.log('✅ Engine version info:', {
      version: (engine.constructor as any).getVersion?.() || '0.0.1',
      description: (engine.constructor as any).getDescription?.() || 'LlamaIndex Engine',
    });

    return true;

  } catch (error) {
    console.error('❌ Engine Configuration Test failed:', error);
    return false;
  }
}

async function testToolsCreation() {
  console.log('🧪 Testing Tools Creation...');

  try {
    const { createChatbotTools, getAvailableToolsByPlan } = await import('../server/llamaindex-engine/tools/chatbot-tools');

    // Test tools for different plans
    const plansToTest = ['FREE', 'PRO', 'ENTERPRISE'];

    for (const plan of plansToTest) {
      const tools = createChatbotTools({
        user: { ...mockUser, plan } as any,
        chatbot: mockChatbot as any,
        userPlan: plan,
        integrations: plan === 'PRO' ? { stripe: { enabled: true } } : {},
      });

      const availableTools = getAvailableToolsByPlan(
        plan,
        plan === 'PRO' // hasStripe
      );

      console.log(`✅ ${plan} plan:`, {
        toolsCreated: tools.length,
        toolNames: tools.map(t => t.metadata.name),
        availableTools,
      });
    }

    return true;

  } catch (error) {
    console.error('❌ Tools Creation Test failed:', error);
    return false;
  }
}

async function testImportsAndExports() {
  console.log('🧪 Testing Imports and Exports...');

  try {
    const engineModule = await import('../server/llamaindex-engine');

    const expectedExports = [
      'LlamaIndexEngine',
      'ChatbotAgent',
      'chatWithNewEngine',
      'testNewEngine',
      'compareEngines',
      'createChatbotAgent',
      'createChatbotTools',
      'ENGINE_VERSION',
      'ENGINE_DESCRIPTION',
    ];

    const availableExports = Object.keys(engineModule);
    const missingExports = expectedExports.filter(exp => !availableExports.includes(exp));

    if (missingExports.length > 0) {
      console.warn('⚠️ Missing exports:', missingExports);
    }

    console.log('✅ Available exports:', availableExports);
    console.log('✅ Engine metadata:', {
      version: engineModule.ENGINE_VERSION,
      description: engineModule.ENGINE_DESCRIPTION,
    });

    return missingExports.length === 0;

  } catch (error) {
    console.error('❌ Imports/Exports Test failed:', error);
    return false;
  }
}

async function runBasicTests() {
  console.log('🚀 Testing New Engine v0.0.1 - Basic Architecture Tests\n');

  const tests = [
    { name: 'Imports and Exports', fn: testImportsAndExports },
    { name: 'Engine Configuration', fn: testEngineConfig },
    { name: 'Tools Creation', fn: testToolsCreation },
    { name: 'Agent Creation', fn: testAgentCreation },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}\n`);
  }

  // Summary
  console.log('\n=== BASIC TEST SUMMARY ===');
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });

  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\n📊 Results: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('🎉 ALL BASIC TESTS PASSED! Architecture is solid.');
    console.log('💡 Next step: Test with real API keys in environment.');
  } else {
    console.log('⚠️ Some basic tests failed. Fix architecture issues first.');
  }

  return passedCount === totalCount;
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  runBasicTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Basic test execution failed:', error);
      process.exit(1);
    });
}