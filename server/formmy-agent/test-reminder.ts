/**
 * PRUEBA ESPECÍFICA: Recordatorios con Formmy Agent Framework
 * 
 * Este archivo prueba el flujo completo:
 * Usuario solicita recordatorio → LLM decide usar herramienta → Tool se ejecuta → Respuesta
 */

import { FormmyAgent, createTestAgent } from './index';
import type { ChatOptions } from './types';

// Mock de herramientas para la prueba
const MOCK_TOOLS = [
  {
    name: 'schedule_reminder',
    description: 'Crear un nuevo recordatorio o cita en el calendario',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título del recordatorio' },
        date: { type: 'string', description: 'Fecha en formato YYYY-MM-DD' },
        time: { type: 'string', description: 'Hora en formato HH:MM' },
        email: { type: 'string', description: 'Email opcional para notificación' }
      },
      required: ['title', 'date', 'time']
    }
  },
  {
    name: 'list_reminders',
    description: 'Ver todos los recordatorios programados',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Mock de usuario PRO con acceso a herramientas
const MOCK_USER = {
  id: 'test-user-123',
  plan: 'PRO',
  email: 'usuario@test.com'
};

async function testReminderCreation() {
  console.log('\n🧪 === PRUEBA: CREAR RECORDATORIO ===');
  
  const agent = createTestAgent('gpt-5-nano');
  
  const testMessage = "Agéndame una reunión con el equipo para mañana a las 10:30 AM";
  
  const options: ChatOptions = {
    contexts: [],
    model: 'gpt-5-nano',
    stream: false,
    user: MOCK_USER,
    chatbotId: 'test-chatbot-123',
    sessionId: 'test-session-456'
  };
  
  console.log(`📝 Mensaje de prueba: "${testMessage}"`);
  console.log(`👤 Usuario: ${MOCK_USER.plan} (${MOCK_USER.id})`);
  console.log(`🤖 Modelo: ${options.model}`);
  
  try {
    // Usar método debug para ver el proceso completo
    const { response, debug } = await agent.debug(testMessage, options);
    
    console.log('\n=== RESULTADOS DE DEBUG ===');
    console.log('💭 Contexto optimizado:', debug.contextOptimized.length, 'caracteres');
    console.log('🛠️ Herramientas disponibles:', debug.toolsAvailable);
    console.log('🔄 Usó agent loop:', debug.usedAgentLoop);
    console.log('⏱️ Tiempo total:', debug.processingTime, 'ms');
    
    console.log('\n=== RESPUESTA FINAL ===');
    console.log('📤 Contenido:', response.content);
    console.log('🔧 Herramientas usadas:', response.toolsUsed);
    console.log('🔄 Iteraciones:', response.iterations);
    console.log('📊 Tokens:', response.usage?.totalTokens || 'N/A');
    
    // Verificar que funcionó correctamente
    const success = response.toolsUsed && response.toolsUsed.includes('schedule_reminder');
    console.log('\n✅ Estado:', success ? 'ÉXITO - Tool ejecutada' : '❌ FALLO - Tool no ejecutada');
    
    return success;
    
  } catch (error) {
    console.error('\n❌ ERROR en prueba:', error);
    return false;
  }
}

async function testReminderList() {
  console.log('\n🧪 === PRUEBA: LISTAR RECORDATORIOS ===');
  
  const agent = createTestAgent('gpt-5-nano');
  
  const testMessage = "¿Qué recordatorios tengo programados?";
  
  const options: ChatOptions = {
    contexts: [],
    model: 'gpt-5-nano', 
    stream: false,
    user: MOCK_USER
  };
  
  console.log(`📝 Mensaje de prueba: "${testMessage}"`);
  
  try {
    const response = await agent.chat(testMessage, options);
    
    console.log('\n=== RESPUESTA ===');
    console.log('📤 Contenido:', response.content);
    console.log('🔧 Herramientas usadas:', response.toolsUsed);
    
    const success = response.toolsUsed && response.toolsUsed.includes('list_reminders');
    console.log('\n✅ Estado:', success ? 'ÉXITO - Tool ejecutada' : '❌ FALLO - Tool no ejecutada');
    
    return success;
    
  } catch (error) {
    console.error('\n❌ ERROR en prueba:', error);
    return false;
  }
}

async function testComplexReminder() {
  console.log('\n🧪 === PRUEBA: RECORDATORIO COMPLEJO ===');
  
  const agent = createTestAgent('claude-3-haiku');
  
  const testMessage = "Recordarme enviar el reporte de ventas el próximo viernes a las 2 PM y enviar copia a maria@empresa.com";
  
  const options: ChatOptions = {
    contexts: [
      {
        id: 'context-1',
        type: 'TEXT',
        title: 'Información de la empresa',
        content: 'María López es la directora de ventas. Su email es maria@empresa.com. Los reportes se envían cada viernes.',
        sizeKB: 1
      }
    ],
    model: 'claude-3-haiku',
    stream: false,
    user: MOCK_USER
  };
  
  console.log(`📝 Mensaje de prueba: "${testMessage}"`);
  console.log(`📄 Contexto: ${options.contexts?.length} items`);
  
  try {
    const { response, debug } = await agent.debug(testMessage, options);
    
    console.log('\n=== DEBUG INFO ===');
    console.log('📊 Contexto optimizado:', debug.contextOptimized.length, 'chars');
    console.log('🔄 Agent loop usado:', debug.usedAgentLoop);
    
    console.log('\n=== RESPUESTA ===');
    console.log('📤 Contenido:', response.content);
    console.log('🔧 Herramientas usadas:', response.toolsUsed);
    console.log('🔄 Iteraciones:', response.iterations);
    
    const success = response.toolsUsed && response.toolsUsed.length > 0;
    console.log('\n✅ Estado:', success ? 'ÉXITO - Herramientas ejecutadas' : '❌ FALLO - Sin herramientas');
    
    return success;
    
  } catch (error) {
    console.error('\n❌ ERROR en prueba:', error);
    return false;
  }
}

// Función principal de prueba
export async function runReminderTests() {
  console.log('🎯 === FORMMY AGENT - PRUEBAS DE RECORDATORIOS ===\n');
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Inyectar herramientas mock en el agent (hack para pruebas)
  console.log('🔧 Configurando herramientas mock para pruebas...');
  
  // Prueba 1: Crear recordatorio
  totalTests++;
  if (await testReminderCreation()) {
    passedTests++;
  }
  
  // Prueba 2: Listar recordatorios
  totalTests++;
  if (await testReminderList()) {
    passedTests++;
  }
  
  // Prueba 3: Recordatorio complejo
  totalTests++;
  if (await testComplexReminder()) {
    passedTests++;
  }
  
  // Resultados finales
  console.log(`\n🏁 === RESULTADOS FINALES ===`);
  console.log(`✅ Pruebas pasadas: ${passedTests}/${totalTests}`);
  console.log(`📊 Éxito: ${Math.round((passedTests/totalTests)*100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! El framework funciona correctamente.');
  } else {
    console.log('⚠️ Algunas pruebas fallaron. Revisar implementación.');
  }
  
  return { passedTests, totalTests, successRate: passedTests/totalTests };
}

// Para ejecutar las pruebas directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runReminderTests().then(() => process.exit(0));
}

// Función específica para probar desde el chat-preview
export async function testChatPreviewIntegration(
  message: string,
  chatbot: any,
  user: any,
  sessionId: string
) {
  console.log('\n🔗 === PRUEBA: INTEGRACIÓN CHAT-PREVIEW ===');
  console.log(`📝 Mensaje: "${message}"`);
  console.log(`👤 Usuario: ${user.plan} (${user.id})`);
  console.log(`🤖 Chatbot: ${chatbot.aiModel}`);
  
  try {
    // Importar el factory real
    const { createAgent } = await import('./config');
    
    // Crear agente real
    const agent = await createAgent(chatbot);
    
    // Ejecutar chat
    const response = await agent.chat(message, {
      contexts: chatbot.contexts || [],
      model: chatbot.aiModel,
      stream: false,
      user: user,
      chatbotId: chatbot.id,
      sessionId: sessionId
    });
    
    console.log('\n=== RESPUESTA INTEGRACIÓN ===');
    console.log('📤 Contenido:', response.content);
    console.log('🔧 Herramientas usadas:', response.toolsUsed);
    console.log('🔄 Iteraciones:', response.iterations);
    console.log('📊 Tokens:', response.usage?.totalTokens);
    
    return response;
    
  } catch (error) {
    console.error('❌ Error en integración:', error);
    throw error;
  }
}