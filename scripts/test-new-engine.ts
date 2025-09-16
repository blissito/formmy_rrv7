#!/usr/bin/env npx tsx
/**
 * Test Script - New Engine v0.0.1
 *
 * Script para probar el ChatbotAgent + LlamaIndexEngine sin afectar producción
 */

import { PrismaClient } from '@prisma/client';

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
  aiModel: 'gpt-5-nano', // PRUEBA CRÍTICA: GPT-5-nano con ProductivityAssistant
  temperature: 0.7, // Será manejado correctamente por el motor
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

async function testBasicChat() {
  console.log('🧪 Testing Basic Chat...');

  try {
    const { chatWithNewEngine } = await import('../server/llamaindex-engine');

    const response = await chatWithNewEngine(
      '¡Hola! ¿Cómo puedes ayudarme?',
      mockChatbot as any,
      mockUser as any,
      {
        contexts: [],
        conversationHistory: [],
        integrations: {},
        sessionId: 'test-session-basic',
      }
    );

    console.log('✅ Basic Chat Test:', {
      success: !response.error,
      contentLength: response.content.length,
      toolsUsed: response.toolsUsed.length,
      processingTime: response.metadata?.processingTime,
      error: response.error,
    });

    if (response.content) {
      console.log('📝 Response preview:', response.content.substring(0, 200) + '...');
    }

    return !response.error;

  } catch (error) {
    console.error('❌ Basic Chat Test failed:', error);
    return false;
  }
}

async function testWithReminders() {
  console.log('🧪 Testing with Reminders...');

  try {
    const { chatWithNewEngine } = await import('../server/llamaindex-engine');

    const response = await chatWithNewEngine(
      'CREA UN RECORDATORIO: llamar al cliente mañana a las 10:00 AM',
      mockChatbot as any,
      mockUser as any,
      {
        contexts: [],
        conversationHistory: [],
        integrations: {}, // Sin Stripe para esta prueba
        sessionId: 'test-session-reminder',
      }
    );

    console.log('✅ Reminder Test:', {
      success: !response.error,
      contentLength: response.content.length,
      toolsUsed: response.toolsUsed,
      toolsCount: response.toolsUsed.length,
      processingTime: response.metadata?.processingTime,
      error: response.error,
    });

    if (response.content) {
      console.log('📝 Response preview:', response.content.substring(0, 200) + '...');
    }

    return !response.error && response.toolsUsed.includes('schedule_reminder');

  } catch (error) {
    console.error('❌ Reminder Test failed:', error);
    return false;
  }
}

async function testAgentCreation() {
  console.log('🧪 Testing Agent Creation...');

  try {
    const { createChatbotAgent, testNewEngine } = await import('../server/llamaindex-engine');

    // Test agent creation
    const agent = createChatbotAgent(mockChatbot as any, mockUser as any);
    console.log('✅ Agent created:', agent.getInfo());

    // Test agent connectivity
    const testResult = await testNewEngine(
      mockChatbot as any,
      mockUser as any,
      'Test de conectividad del agente'
    );

    console.log('✅ Agent Test:', {
      success: testResult.success,
      responseLength: testResult.response?.length,
      toolsAvailable: testResult.toolsAvailable,
      processingTime: testResult.processingTime,
      error: testResult.error,
    });

    return testResult.success;

  } catch (error) {
    console.error('❌ Agent Creation Test failed:', error);
    return false;
  }
}

async function testEngineComparison() {
  console.log('🧪 Testing Engine Comparison...');

  try {
    const { compareEngines } = await import('../server/llamaindex-engine');

    const comparison = await compareEngines(
      '¿Qué puedes hacer por mí?',
      mockChatbot as any,
      mockUser as any,
      {
        contexts: [],
        conversationHistory: [],
        integrations: {},
      }
    );

    console.log('✅ Engine Comparison:', {
      newEngineSuccess: comparison.newEngine.success,
      oldEngineSuccess: comparison.oldEngine.success,
      recommendation: comparison.recommendation,
      newEngineTime: comparison.newEngine.processingTime,
      oldEngineTime: comparison.oldEngine.processingTime,
    });

    return comparison.newEngine.success;

  } catch (error) {
    console.error('❌ Engine Comparison Test failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Testing New Engine v0.0.1 - ChatbotAgent\n');

  const tests = [
    { name: 'Agent Creation', fn: testAgentCreation },
    { name: 'Basic Chat', fn: testBasicChat },
    { name: 'Reminders Tool', fn: testWithReminders },
    { name: 'Engine Comparison', fn: testEngineComparison },
  ];

  const results = [];

  for (const test of tests) {
    console.log(`\n--- ${test.name} ---`);
    const success = await test.fn();
    results.push({ name: test.name, success });
    console.log(`${success ? '✅' : '❌'} ${test.name}: ${success ? 'PASSED' : 'FAILED'}\n`);
  }

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  results.forEach(result => {
    console.log(`${result.success ? '✅' : '❌'} ${result.name}`);
  });

  const passedCount = results.filter(r => r.success).length;
  const totalCount = results.length;

  console.log(`\n📊 Results: ${passedCount}/${totalCount} tests passed`);

  if (passedCount === totalCount) {
    console.log('🎉 ALL TESTS PASSED! New Engine v0.0.1 is ready for production flag activation.');
  } else {
    console.log('⚠️ Some tests failed. Review issues before enabling production flag.');
  }

  return passedCount === totalCount;
}

// Execute if run directly
if (import.meta.url.endsWith(process.argv[1])) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test execution failed:', error);
      process.exit(1);
    });
}