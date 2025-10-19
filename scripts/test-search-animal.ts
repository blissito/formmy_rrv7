/**
 * Test: Búsqueda semántica de "animal"
 * Debería encontrar chunks del Axolotl de Cortázar
 */

import { vectorSearch, getSourceName, getSourceType } from '../server/vector/vector-search.service';
import { VECTOR_INDEX_NAME } from '../server/vector/vector-config';

const CHATBOT_ID = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

async function main() {
  console.log('\n🔍 === TEST BÚSQUEDA: "animal" ===\n');
  console.log(`📇 Index: ${VECTOR_INDEX_NAME}\n`);

  try {
    console.log(`Chatbot ID: ${CHATBOT_ID}`);
    console.log(`Query: "animal"\n`);

    const results = await vectorSearch('animal', CHATBOT_ID, 5);

    console.log(`✅ Resultados encontrados: ${results.length}\n`);

    if (results.length === 0) {
      console.log('❌ NO SE ENCONTRARON RESULTADOS');
      console.log('\nPosibles causas:');
      console.log('1. Los embeddings no existen para este chatbot');
      console.log('2. El vector search index no está configurado');
      console.log('3. La similaridad es muy baja (<threshold del index)');
    } else {
      results.forEach((result, i) => {
        console.log(`─────────────────────────────────────`);
        console.log(`Resultado #${i + 1}`);
        console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`Tipo: ${getSourceType(result.metadata)}`);
        console.log(`Fuente: ${getSourceName(result.metadata)}`);
        console.log(`Chunk: ${result.metadata.chunkIndex ?? 'N/A'}`);
        console.log(`\nContenido:\n${result.content.substring(0, 200)}...`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('\n❌ Error durante la búsqueda:', error);

    if (error instanceof Error) {
      if (error.message.includes('index')) {
        console.log('\n⚠️  El vector search index no está configurado en MongoDB Atlas');
        console.log(`Necesitas crear "${VECTOR_INDEX_NAME}" en la colección Embedding`);
        console.log('\n📖 Ejecuta el diagnóstico completo:');
        console.log('   npx tsx scripts/test-vector-search-no-filter.ts');
      }
    }
  }

  process.exit(0);
}

main();
