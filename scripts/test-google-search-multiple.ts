/**
 * Test múltiples búsquedas para verificar caché y rendimiento
 */

import { googleSearchHandler } from '../server/tools/handlers/google-search';
import type { ToolContext } from '../server/tools/types';

async function testMultipleSearches() {
  const mockContext: ToolContext = {
    userId: 'test-user',
    userPlan: 'PRO',
    chatbotId: 'test-chatbot',
    message: 'test',
    integrations: {}
  };

  const queries = [
    'Claude Code AI assistant',
    'React Router v7 documentation',
    'TypeScript best practices 2025'
  ];

  console.log('🔍 Probando múltiples búsquedas...\n');

  for (const query of queries) {
    console.log(`📋 Búsqueda: "${query}"`);
    const startTime = Date.now();

    const result = await googleSearchHandler({ query, numResults: 3 }, mockContext);
    const duration = Date.now() - startTime;

    console.log(`  ⏱️  Tiempo: ${duration}ms`);
    console.log(`  ✅ Success: ${result.success}`);

    if (result.data?.results) {
      console.log(`  📊 Resultados: ${result.data.results.length}`);
      console.log(`  🔗 Primera URL: ${result.data.results[0]?.url || 'N/A'}`);
    }
    console.log();
  }

  // Segunda ejecución para probar caché
  console.log('\n🔄 Probando caché (segunda ejecución de misma query)...\n');
  const cacheQuery = queries[0];

  console.log(`📋 Búsqueda (cached): "${cacheQuery}"`);
  const startTime = Date.now();

  const cachedResult = await googleSearchHandler({ query: cacheQuery, numResults: 3 }, mockContext);
  const cacheDuration = Date.now() - startTime;

  console.log(`  ⏱️  Tiempo: ${cacheDuration}ms (debería ser <50ms si caché funciona)`);
  console.log(`  ✅ Success: ${cachedResult.success}`);
  console.log(`  📊 Resultados: ${cachedResult.data?.results?.length || 0}`);
}

testMultipleSearches()
  .then(() => {
    console.log('\n✅ Todas las pruebas completadas');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
