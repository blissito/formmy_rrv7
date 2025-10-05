/**
 * Script de prueba para verificar que el sistema de sugerencias
 * solo sugiere acciones disponibles según el plan del usuario
 */

import { getToolsForPlan, type ToolContext } from '../server/tools/index';

console.log('🧪 Testing Tool Suggestions System\n');

// Simular diferentes usuarios con diferentes planes
const testCases = [
  {
    plan: 'FREE',
    description: 'Plan FREE (sin herramientas)',
    integrations: {},
    isGhosty: false
  },
  {
    plan: 'STARTER',
    description: 'Plan STARTER (herramientas básicas)',
    integrations: {},
    isGhosty: false
  },
  {
    plan: 'PRO',
    description: 'Plan PRO sin Stripe (sin payment tools)',
    integrations: {},
    isGhosty: true
  },
  {
    plan: 'PRO',
    description: 'Plan PRO con Stripe (con payment tools)',
    integrations: { stripe: { enabled: true } },
    isGhosty: true
  },
  {
    plan: 'ENTERPRISE',
    description: 'Plan ENTERPRISE completo',
    integrations: { stripe: { enabled: true } },
    isGhosty: true
  },
  {
    plan: 'TRIAL',
    description: 'Plan TRIAL (acceso completo temporal)',
    integrations: { stripe: { enabled: true } },
    isGhosty: true
  }
];

for (const testCase of testCases) {
  const context: ToolContext = {
    userId: 'test-user',
    userPlan: testCase.plan,
    chatbotId: testCase.isGhosty ? 'ghosty-main' : 'chatbot-123',
    conversationId: 'test-conversation',
    message: 'test',
    integrations: testCase.integrations,
    isGhosty: testCase.isGhosty
  };

  const tools = getToolsForPlan(testCase.plan, testCase.integrations, context);
  const toolNames = tools.map((tool: any) => tool.metadata?.name || 'unknown');

  console.log(`📋 ${testCase.description}`);
  console.log(`   Plan: ${testCase.plan}`);
  console.log(`   IsGhosty: ${testCase.isGhosty}`);
  console.log(`   Integraciones: ${JSON.stringify(testCase.integrations)}`);
  console.log(`   Herramientas disponibles (${toolNames.length}):`);

  if (toolNames.length === 0) {
    console.log('      ❌ Sin herramientas disponibles');
  } else {
    toolNames.forEach(name => console.log(`      ✅ ${name}`));
  }

  // Verificar sugerencias problemáticas
  console.log(`\n   🔍 Verificaciones:`);

  const hasPaymentLink = toolNames.includes('create_payment_link');
  if (testCase.plan === 'FREE' || testCase.plan === 'STARTER') {
    console.log(`      ${!hasPaymentLink ? '✅' : '❌'} NO debe sugerir "Crear link de pago" (${hasPaymentLink ? 'FALLO' : 'OK'})`);
  } else if (testCase.integrations.stripe) {
    console.log(`      ${hasPaymentLink ? '✅' : '❌'} DEBE sugerir "Crear link de pago" (${hasPaymentLink ? 'OK' : 'FALLO'})`);
  }

  const hasReminders = toolNames.includes('schedule_reminder');
  if (!testCase.isGhosty) {
    console.log(`      ${!hasReminders ? '✅' : '❌'} Chatbots públicos NO deben tener recordatorios (${hasReminders ? 'FALLO' : 'OK'})`);
  } else if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(testCase.plan)) {
    console.log(`      ${hasReminders ? '✅' : '❌'} Ghosty PRO+ DEBE tener recordatorios (${hasReminders ? 'OK' : 'FALLO'})`);
  }

  const hasChatbotStats = toolNames.includes('get_chatbot_stats');
  if (!testCase.isGhosty) {
    console.log(`      ${!hasChatbotStats ? '✅' : '❌'} Chatbots públicos NO deben ver stats privadas (${hasChatbotStats ? 'FALLO' : 'OK'})`);
  }

  console.log('\n' + '─'.repeat(80) + '\n');
}

console.log('\n✅ Pruebas completadas\n');
console.log('📌 IMPORTANTE: El sistema de sugerencias ahora verificará estas herramientas');
console.log('   antes de sugerir acciones. Si el usuario NO tiene acceso a una herramienta,');
console.log('   NO se le sugerirá esa acción.\n');
