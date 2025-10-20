/**
 * Test E2E de RAG Agéntico con API Pública
 * Verifica que el agente ejecute múltiples búsquedas para responder preguntas complejas
 *
 * Uso:
 *   FORMMY_TEST_API_KEY=sk_live_xxx npx tsx scripts/test-agentic-rag.ts
 */

import { FormmyRAG } from '../sdk/formmy-rag';

const API_KEY = process.env.FORMMY_TEST_API_KEY;
const BASE_URL = process.env.FORMMY_BASE_URL || 'http://localhost:5173';

// Test scenarios (de simple a complejo)
const testScenarios = [
  {
    name: 'Búsqueda Simple',
    query: '¿Cuánto cuesta el plan Pro?',
    expectedSearches: 1,
    description: 'Pregunta directa que requiere 1 búsqueda'
  },
  {
    name: 'Búsqueda Comparativa',
    query: 'Compara los planes Starter y Pro',
    expectedSearches: 2,
    description: 'Debería hacer 2 búsquedas separadas (starter, pro) y combinar resultados'
  },
  {
    name: 'Pregunta Multi-tema',
    query: '¿Cuánto cuestan los planes y qué formas de pago aceptan?',
    expectedSearches: 2,
    description: 'Dos temas distintos: precios + métodos de pago'
  },
  {
    name: 'Investigación Profunda',
    query: 'Dame un resumen completo de todos los servicios que ofrece Formmy',
    expectedSearches: 3,
    description: 'Debería buscar en múltiples categorías para dar respuesta exhaustiva'
  }
];

/**
 * Ejecuta búsqueda agéntica usando RAG API
 */
async function executeAgenticSearch(rag: FormmyRAG, query: string) {
  console.log(`\n🔍 Query: "${query}"\n`);

  const result = await rag.query(query, { topK: 5 });

  console.log(`   Fuentes encontradas: ${result.sources.length}`);
  console.log(`   Créditos usados: ${result.creditsUsed}`);

  if (result.sources.length > 0) {
    console.log('\n   Top 3 fuentes:');
    result.sources.slice(0, 3).forEach((source, idx) => {
      const sourceName = source.metadata.fileName || source.metadata.title || source.metadata.url || 'Sin nombre';
      console.log(`   ${idx + 1}. [${(source.score * 100).toFixed(1)}%] ${sourceName}`);
      console.log(`      "${source.content.substring(0, 80)}..."`);
    });

    console.log('\n   Respuesta generada:');
    console.log(`   ${result.answer.substring(0, 200)}...`);
  } else {
    console.log('   ⚠️  No se encontraron resultados');
  }

  return result;
}

async function main() {
  console.log('\n🧪 TEST DE RAG AGÉNTICO (API v1)\n');
  console.log('Este test usa la API pública de RAG para ejecutar búsquedas.\n');

  // Validar API key
  if (!API_KEY) {
    console.error('❌ Error: FORMMY_TEST_API_KEY no configurado\n');
    console.log('Uso:');
    console.log('  FORMMY_TEST_API_KEY=sk_live_xxx npx tsx scripts/test-agentic-rag.ts\n');
    process.exit(1);
  }

  console.log(`API Key: ${API_KEY.substring(0, 15)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);

  const rag = new FormmyRAG({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    // 1. Obtener info del chatbot
    const listResponse = await rag.list();

    console.log(`✅ Chatbot: ${listResponse.chatbotName} (${listResponse.chatbotId})`);
    console.log(`   Total contextos: ${listResponse.totalContexts}`);
    console.log(`   Total embeddings: ${listResponse.totalEmbeddings}`);
    console.log(`   Tamaño: ${listResponse.totalSizeKB} KB\n`);

    if (listResponse.totalEmbeddings === 0) {
      console.log('❌ El chatbot no tiene embeddings. Sube contexto primero:\n');
      console.log('   npx tsx scripts/migrate-contexts-to-embeddings.ts --all\n');
      return;
    }

    console.log('─'.repeat(80));

    // 2. Ejecutar escenarios de test
    let totalCredits = 0;

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];

      console.log(`\n\n📋 ESCENARIO ${i + 1}: ${scenario.name}`);
      console.log(`   ${scenario.description}`);
      console.log(`   Búsquedas esperadas: ${scenario.expectedSearches}`);

      const result = await executeAgenticSearch(rag, scenario.query);
      totalCredits += result.creditsUsed;
    }

    // 3. Resumen de créditos
    console.log('\n\n─'.repeat(80));
    console.log('\n📊 RESUMEN:\n');
    console.log(`   Escenarios ejecutados: ${testScenarios.length}`);
    console.log(`   Créditos totales consumidos: ${totalCredits}`);
    console.log(`   Promedio por query: ${(totalCredits / testScenarios.length).toFixed(1)}`);

    // 4. Recomendaciones para testing manual
    console.log('\n\n─'.repeat(80));
    console.log('\n💡 TESTING MANUAL RECOMENDADO:\n');
    console.log('Para verificar COMPORTAMIENTO AGÉNTICO real (no solo búsquedas simples):');
    console.log('');
    console.log('1. Abre tu chatbot en el dashboard');
    console.log('2. Prueba estas preguntas complejas:');
    console.log('   - "Compara todos tus planes y dime cuál recomiendas"');
    console.log('   - "¿Qué incluye cada plan y cuánto cuestan?"');
    console.log('   - "Dame info completa sobre precios, formas de pago y garantías"');
    console.log('');
    console.log('3. Verifica en los logs del servidor:');
    console.log('   - Que ejecute MÚLTIPLES llamadas a search_context');
    console.log('   - Que combine resultados coherentemente');
    console.log('   - Que cite fuentes cuando usa documentos');
    console.log('');
    console.log('4. Señales de RAG agéntico funcionando:');
    console.log('   ✅ Ejecuta 2+ búsquedas para preguntas complejas');
    console.log('   ✅ Ajusta queries si primera búsqueda no es suficiente');
    console.log('   ✅ Cita fuentes: "Según [archivo]..." o "De acuerdo a..."');
    console.log('   ✅ Dice "no encontré" si búsqueda falla (no adivina)');
    console.log('');
    console.log('❌ Señales de RAG pasivo (problema):');
    console.log('   ❌ Solo 1 búsqueda para preguntas multi-tema');
    console.log('   ❌ Responde sin buscar cuando debería');
    console.log('   ❌ Adivina precios/datos en vez de buscarlos');
    console.log('');
    console.log('📊 API Usage:');
    console.log('   Este script usa el RAG API público (v1)');
    console.log('   Puedes integrar este mismo patrón en aplicaciones externas');
    console.log('   Ver /sdk/formmy-rag.ts para más detalles');
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('\n✨ Test finalizado\n');
    process.exit(0);
  });
