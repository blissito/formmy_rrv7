/**
 * Test: Búsqueda de "precios"
 * Reproducir el caso que muestra "Unknown"
 */

import { vectorSearch, getSourceName, getSourceType } from '../server/vector/vector-search.service';
import { VECTOR_INDEX_NAME } from '../server/vector/vector-config';

const CHATBOT_ID = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

async function main() {
  console.log('\n🔍 === TEST BÚSQUEDA: "precios" ===\n');
  console.log(`📇 Index: ${VECTOR_INDEX_NAME}\n`);

  try {
    console.log(`Chatbot ID: ${CHATBOT_ID}`);
    console.log(`Query: "precios"\n`);

    const results = await vectorSearch('precios', CHATBOT_ID, 10);

    console.log(`✅ Resultados encontrados: ${results.length}\n`);

    if (results.length === 0) {
      console.log('❌ NO SE ENCONTRARON RESULTADOS');
    } else {
      results.forEach((result, i) => {
        const sourceName = getSourceName(result.metadata);
        const sourceType = getSourceType(result.metadata);

        console.log(`─────────────────────────────────────`);
        console.log(`Resultado #${i + 1}`);
        console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
        console.log(`Tipo: ${sourceType}`);
        console.log(`Fuente: ${sourceName}`);
        console.log(`Chunk: ${result.metadata.chunkIndex ?? 'N/A'}`);

        // DEBUG: Mostrar metadata completa del primero
        if (i === 0) {
          console.log(`\n🔍 DEBUG - Metadata completa del resultado #1:`);
          console.log(JSON.stringify(result.metadata, null, 2));
        }

        console.log(`\nContenido:\n${result.content.substring(0, 200)}...`);
        console.log('');
      });

      // Buscar si alguno muestra "Unknown"
      const unknowns = results.filter(r => getSourceName(r.metadata) === 'Unknown');
      if (unknowns.length > 0) {
        console.log('\n❌ PROBLEMA ENCONTRADO:');
        console.log(`${unknowns.length} resultado(s) mostrarían "Unknown"\n`);

        unknowns.forEach((r, i) => {
          console.log(`Unknown #${i + 1}:`);
          console.log(`  Metadata:`, JSON.stringify(r.metadata, null, 2));
          console.log();
        });
      } else {
        console.log('\n✅ Ningún resultado muestra "Unknown"!');
      }
    }

  } catch (error) {
    console.error('\n❌ Error durante la búsqueda:', error);
  }

  process.exit(0);
}

main();
