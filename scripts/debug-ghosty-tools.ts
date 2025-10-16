/**
 * Script de Debug: Ghosty Tool Availability
 * Verifica QUÉ tools tiene acceso Ghosty realmente
 */

import { config } from 'dotenv';
config();

import { getToolsForPlan } from "../server/tools/index";
import type { ToolContext } from "../server/tools/types";

console.log('\n╔═══════════════════════════════════════════════════════════════╗');
console.log('║  🔍 DEBUG: Ghosty Tool Availability Check                    ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Mock context para Ghosty
const ghostyContext: ToolContext = {
  userId: 'test-user-123',
  userPlan: 'PRO',
  chatbotId: null, // Ghosty no tiene chatbotId
  conversationId: 'test-conv-123',
  message: 'Quiero el plan Pro',
  integrations: {},
  isGhosty: true // 🎯 CRÍTICO: Ghosty flag
};

console.log('📋 Contexto de Ghosty:');
console.log(JSON.stringify(ghostyContext, null, 2));

console.log('\n🔧 Obteniendo tools para Ghosty...\n');

const tools = getToolsForPlan(
  ghostyContext.userPlan,
  ghostyContext.integrations,
  ghostyContext
);

console.log(`\n✅ Total de tools disponibles: ${tools.length}\n`);

const toolNames = tools.map((tool: any) => tool.metadata?.name || 'unknown');

console.log('📋 Lista de herramientas:');
toolNames.forEach((name: string, index: number) => {
  const icon = name === 'create_formmy_plan_payment' ? '🎯' : '🔧';
  console.log(`   ${icon} [${index + 1}] ${name}`);
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚨 VERIFICACIONES CRÍTICAS:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// Verificación 1: create_formmy_plan_payment
const hasPaymentTool = toolNames.includes('create_formmy_plan_payment');
if (hasPaymentTool) {
  console.log('✅ create_formmy_plan_payment: DISPONIBLE');
} else {
  console.log('❌ create_formmy_plan_payment: NO DISPONIBLE (ERROR CRÍTICO)');
}

// Verificación 2: Tools que NO debería tener
const bannedTools = ['save_contact_info', 'get_current_datetime', 'web_search_google'];
const hasBannedTools = bannedTools.filter(tool => toolNames.includes(tool));

if (hasBannedTools.length === 0) {
  console.log('✅ Tools prohibidas: NINGUNA (correcto)');
} else {
  console.log(`❌ Tools prohibidas detectadas: ${hasBannedTools.join(', ')}`);
  console.log('   Estas tools causan que Ghosty las ejecute innecesariamente');
}

// Verificación 3: Tools esperadas
const expectedTools = [
  'create_formmy_plan_payment',
  'get_usage_limits',
  'query_chatbots',
  'get_chatbot_stats',
  'schedule_reminder',
  'list_reminders'
];

const missingTools = expectedTools.filter(tool => !toolNames.includes(tool));
if (missingTools.length === 0) {
  console.log('✅ Tools esperadas: TODAS PRESENTES');
} else {
  console.log(`⚠️  Tools faltantes: ${missingTools.join(', ')}`);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('📊 RESUMEN:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (hasPaymentTool && hasBannedTools.length === 0) {
  console.log('🎉 CONFIGURACIÓN CORRECTA');
  console.log('   Ghosty tiene acceso SOLO a las tools necesarias\n');
  process.exit(0);
} else {
  console.log('❌ CONFIGURACIÓN INCORRECTA');
  if (!hasPaymentTool) {
    console.log('   - Falta create_formmy_plan_payment (tool crítica)');
  }
  if (hasBannedTools.length > 0) {
    console.log(`   - Tiene acceso a tools prohibidas: ${hasBannedTools.join(', ')}`);
  }
  console.log('\n💡 ACCIÓN REQUERIDA:');
  console.log('   1. Revisar server/tools/index.ts:407-437');
  console.log('   2. Verificar que las condiciones !context.isGhosty estén correctas');
  console.log('   3. Reiniciar el servidor dev (npm run dev)\n');
  process.exit(1);
}
