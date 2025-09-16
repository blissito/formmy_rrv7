#!/usr/bin/env npx tsx

/**
 * Test del motor LlamaIndex v2 con herramientas
 */

import { chatWithLlamaIndexV2 } from '../server/llamaindex-engine-v2/index';

async function testV2Engine() {
  console.log('\n🧪 TESTING LLAMAINDEX V2 ENGINE WITH TOOLS\n');

  // Mock chatbot y user
  const chatbot = {
    id: 'test-chatbot-123',
    name: 'Test Chatbot V2',
    aiModel: 'gpt-5-nano', // Modelo principal según CLAUDE.md
    temperature: 1, // GPT-5 nano solo soporta temperature = 1
    personality: 'Asistente amigable y profesional que responde siempre en español',
    instructions: 'Responde siempre en español. Sé útil y conciso.',
    customInstructions: 'Si no entiendes algo, pregunta para aclarar.',
    integrations: {}
  };

  const user = {
    id: 'test-user-456',
    plan: 'PRO'  // PRO tiene acceso a herramientas
  };

  const options = {
    // stream: true por defecto - se desactiva automáticamente si hay herramientas
    conversationHistory: []
  };

  // Test 1: Chat básico
  console.log('--- Test 1: Chat básico ---');
  try {
    const result1 = await chatWithLlamaIndexV2(
      '¡Hola! ¿Qué puedes hacer por mí?',
      chatbot,
      user,
      options
    );

    if ('content' in result1) {
      console.log('✅ Chat básico funcionó');
      console.log(`📝 Respuesta (${result1.content.length} chars): ${result1.content.substring(0, 200)}...`);
      console.log(`🔧 Herramientas usadas: ${result1.toolsUsed.length}`);
    }
  } catch (error) {
    console.error('❌ Error en chat básico:', error);
  }

  // Test 2: Crear recordatorio
  console.log('\n--- Test 2: Crear recordatorio ---');
  try {
    const result2 = await chatWithLlamaIndexV2(
      'Recuérdame llamar al cliente mañana a las 3 PM',
      chatbot,
      user,
      options
    );

    if ('content' in result2) {
      console.log('✅ Recordatorio procesado');
      console.log(`📝 Respuesta: ${result2.content}`);
      console.log(`🔧 Herramientas usadas: ${result2.toolsUsed}`);
      console.log(`⏱️ Tiempo: ${result2.processingTime}ms`);
    }
  } catch (error) {
    console.error('❌ Error en recordatorio:', error);
  }

  // Test 3: Streaming chat (sin herramientas)
  console.log('\n--- Test 3: Streaming chat ---');
  try {
    // No necesitamos forzar stream: true - debería usarlo automáticamente para queries sin herramientas
    const result3 = await chatWithLlamaIndexV2(
      '¿Cuál es la capital de México?',
      chatbot,
      user,
      options
    );

    if (Symbol.asyncIterator in result3) {
      console.log('✅ Streaming activado');
      let fullContent = '';
      for await (const chunk of result3) {
        fullContent += chunk;
      }
      console.log(`📝 Respuesta completa (${fullContent.length} chars): ${fullContent}`);
    }
  } catch (error) {
    console.error('❌ Error en streaming:', error);
  }

  console.log('\n✅ TESTS COMPLETADOS');
}

// Ejecutar tests
testV2Engine().catch(console.error);