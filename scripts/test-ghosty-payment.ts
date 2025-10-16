/**
 * Test Script: Ghosty Payment Link Generation
 *
 * Valida que Ghosty use create_formmy_plan_payment correctamente
 * cuando el usuario pide planes de Formmy
 */

// Cargar variables de entorno
import { config } from 'dotenv';
config();

import { streamAgentWorkflow } from "../server/agents/agent-workflow.server";
import type { ResolvedChatbotConfig } from "../server/chatbot/configResolver.server";

// Mock user con plan PRO
const mockUser = {
  id: 'test-user-123',
  email: 'test@formmy.app',
  plan: 'PRO'
};

// Configuración Ghosty mock
const ghostyConfig: ResolvedChatbotConfig = {
  id: 'ghosty-main',
  name: 'Ghosty',
  slug: 'ghosty',
  instructions: 'Eres Ghosty, el asistente principal de Formmy.',
  customInstructions: '',
  personality: 'friendly',
  aiModel: 'gpt-4o-mini',
  temperature: 1,
  maxTokens: 4000,
  welcomeMessage: '¡Hola! Soy Ghosty 👻',
  goodbyeMessage: '¡Hasta la vista! 👻',
  primaryColor: '#9A99EA',
  avatarUrl: '',
  contexts: [],
  isActive: true,
  userId: mockUser.id
};

// Mock agent context
const agentContext = {
  integrations: {},
  conversationHistory: [],
  conversationId: 'test-conversation-123',
  isGhosty: true
};

// Test cases
const testCases = [
  {
    name: 'Caso 1: Solicitud directa de plan Pro',
    message: 'Quiero el plan Pro',
    expectedTool: 'create_formmy_plan_payment',
    expectedPlan: 'PRO'
  },
  {
    name: 'Caso 2: Link de pago para Starter',
    message: 'Dame el link para pagar Starter',
    expectedTool: 'create_formmy_plan_payment',
    expectedPlan: 'STARTER'
  },
  {
    name: 'Caso 3: Pregunta sobre compra Enterprise',
    message: '¿Puedo comprar Enterprise?',
    expectedTool: 'create_formmy_plan_payment',
    expectedPlan: 'ENTERPRISE'
  },
  {
    name: 'Caso 4: Cambio directo a PRO',
    message: 'Cámbieme a PRO',
    expectedTool: 'create_formmy_plan_payment',
    expectedPlan: 'PRO'
  },
  {
    name: 'Caso 5: Necesidad de más recursos',
    message: 'Necesito más conversaciones',
    expectedTool: null, // Puede o no usar la tool (debe preguntar primero)
    expectedPlan: null
  }
];

async function runTest(testCase: typeof testCases[0]) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`🧪 ${testCase.name}`);
  console.log(`📝 Mensaje: "${testCase.message}"`);
  console.log(`${'='.repeat(80)}\n`);

  let toolsExecuted: string[] = [];
  let fullResponse = '';
  let hasWidget = false;
  let widgetType = '';
  let widgetId = '';

  try {
    // Ejecutar workflow
    for await (const event of streamAgentWorkflow(mockUser, testCase.message, null, {
      resolvedConfig: ghostyConfig,
      agentContext
    })) {
      // Capturar herramientas ejecutadas
      if (event.type === 'tool-start') {
        toolsExecuted.push(event.tool);
        console.log(`🔧 Tool ejecutada: ${event.tool}`);
      }

      // Capturar contenido
      if (event.type === 'chunk' && event.content) {
        fullResponse += event.content;
      }

      // Capturar widgets
      if (event.type === 'widget') {
        hasWidget = true;
        widgetType = event.widgetType;
        widgetId = event.widgetId;
        console.log(`🎨 Widget detectado: ${event.widgetType}:${event.widgetId}`);
      }

      // Metadata final
      if (event.type === 'done' && event.metadata) {
        console.log(`\n📊 Metadata:`);
        console.log(`   Tools ejecutadas: ${event.metadata.toolsUsed.join(', ') || 'ninguna'}`);
        console.log(`   Tokens usados: ${event.metadata.tokensUsed}`);
        console.log(`   Créditos usados: ${event.metadata.creditsUsed}`);
      }
    }

    // Validaciones
    console.log(`\n📋 Validaciones:`);

    // Validar tool esperada
    if (testCase.expectedTool) {
      const toolUsed = toolsExecuted.includes(testCase.expectedTool);
      if (toolUsed) {
        console.log(`   ✅ Tool ${testCase.expectedTool} ejecutada correctamente`);
      } else {
        console.log(`   ❌ ERROR: Tool ${testCase.expectedTool} NO ejecutada`);
        console.log(`   📋 Tools ejecutadas: ${toolsExecuted.join(', ') || 'ninguna'}`);
      }

      // Validar widget generado
      if (toolUsed && !hasWidget) {
        console.log(`   ⚠️  WARNING: Tool ejecutada pero NO se detectó widget`);
      } else if (hasWidget) {
        console.log(`   ✅ Widget generado: ${widgetType}:${widgetId}`);
      }
    } else {
      console.log(`   ℹ️  Este caso no requiere tool específica (puede preguntar primero)`);
    }

    // Mostrar respuesta (truncada)
    console.log(`\n💬 Respuesta (primeros 200 chars):`);
    console.log(`   "${fullResponse.substring(0, 200)}..."`);

    return {
      success: testCase.expectedTool ? toolsExecuted.includes(testCase.expectedTool) : true,
      toolsExecuted,
      hasWidget,
      response: fullResponse
    };

  } catch (error) {
    console.error(`\n❌ ERROR en test:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function main() {
  console.log(`\n${'🔥'.repeat(40)}`);
  console.log(`🚀 TESTING: Ghosty Payment Link Generation`);
  console.log(`${'🔥'.repeat(40)}\n`);

  console.log(`📋 Configuración:`);
  console.log(`   Usuario: ${mockUser.email} (${mockUser.plan})`);
  console.log(`   Modelo AI: ${ghostyConfig.aiModel}`);
  console.log(`   isGhosty: ${agentContext.isGhosty}`);

  const results = [];

  // Ejecutar todos los test cases
  for (const testCase of testCases) {
    const result = await runTest(testCase);
    results.push({
      name: testCase.name,
      ...result
    });

    // Esperar un poco entre tests
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Resumen final
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 RESUMEN FINAL`);
  console.log(`${'='.repeat(80)}\n`);

  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;

  results.forEach((result, i) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${testCases[i].name}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  console.log(`\n📈 Total: ${passed}/${results.length} tests pasaron`);

  if (failed === 0) {
    console.log(`\n🎉 ¡Todos los tests pasaron! Ghosty está usando la tool correctamente.`);
  } else {
    console.log(`\n⚠️  ${failed} test(s) fallaron. Revisar system prompt.`);
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Ejecutar tests
main().catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
