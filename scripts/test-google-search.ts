/**
 * Test script para Google Search Tool
 * Prueba directa del handler sin necesidad de autenticación
 */

import { googleSearchHandler } from '../server/tools/handlers/google-search';
import type { ToolContext } from '../server/tools/types';

async function testGoogleSearch() {
  console.log('🔍 Probando Google Search Tool...\n');

  // Mock context para testing
  const mockContext: ToolContext = {
    userId: 'test-user-123',
    userPlan: 'TRIAL',
    chatbotId: 'test-chatbot-456',
    message: 'Búscame información sobre LlamaIndex Agent Workflows',
    integrations: {},
    isGhosty: true
  };

  try {
    console.log('📋 Ejecutando búsqueda: "LlamaIndex Agent Workflows"\n');

    const result = await googleSearchHandler(
      {
        query: 'LlamaIndex Agent Workflows',
        numResults: 3
      },
      mockContext
    );

    console.log('✅ Resultado:');
    console.log('Success:', result.success);
    console.log('\n📝 Mensaje:');
    console.log(result.message);

    if (result.data) {
      console.log('\n📊 Datos:');
      console.log('- Query:', result.data.query);
      console.log('- Resultados encontrados:', result.data.results?.length || 0);
      console.log('- Total de resultados:', result.data.totalResults);

      if (result.data.results && result.data.results.length > 0) {
        console.log('\n🔗 URLs encontradas:');
        result.data.results.forEach((res: any, idx: number) => {
          console.log(`  [${idx + 1}] ${res.url}`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error ejecutando test:', error);
    process.exit(1);
  }
}

// Ejecutar test
testGoogleSearch()
  .then(() => {
    console.log('\n✅ Test completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test falló:', error);
    process.exit(1);
  });
