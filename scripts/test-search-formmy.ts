/**
 * Test: Búsqueda semántica de "formmy"
 * Debería encontrar chunks de la web (LINK) y mostrar correctamente la fuente
 */

import { vectorSearch, getSourceName, getSourceType } from '../server/vector/vector-search.service';
import { VECTOR_INDEX_NAME } from '../server/vector/vector-config';

const CHATBOT_ID = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

async function main() {
  console.log('\n🔍 === TEST BÚSQUEDA: "formmy" ===\n');
  console.log(`📇 Index: ${VECTOR_INDEX_NAME}\n`);

  try {
    console.log(`Chatbot ID: ${CHATBOT_ID}`);
    console.log(`Query: "formmy"\n`);

    const results = await vectorSearch('formmy', CHATBOT_ID, 10);

    console.log(`✅ Resultados encontrados: ${results.length}\n`);

    if (results.length === 0) {
      console.log('❌ NO SE ENCONTRARON RESULTADOS');
    } else {
      results.forEach((result, i) => {
        console.log(`─────────────────────────────────────`);
        console.log(`Resultado #${i + 1}`);
        console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`Tipo: ${getSourceType(result.metadata)}`);
        console.log(`Fuente: ${getSourceName(result.metadata)}`);
        console.log(`Chunk: ${result.metadata.chunkIndex ?? 'N/A'}`);

        // Mostrar metadata completa para debug
        if (result.metadata.url) {
          console.log(`URL: ${result.metadata.url}`);
        }
        if (result.metadata.title) {
          console.log(`Title: ${result.metadata.title}`);
        }

        console.log(`\nContenido:\n${result.content.substring(0, 150)}...`);
        console.log('');
      });

      // Estadísticas por tipo
      const byType = results.reduce((acc, r) => {
        const type = r.metadata.contextType || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n📊 Resultados por tipo:');
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`   ${type}: ${count}`);
      });
    }

  } catch (error) {
    console.error('\n❌ Error durante la búsqueda:', error);
  }

  process.exit(0);
}

main();
