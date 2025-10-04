/**
 * Test directo del aggregation pipeline de MongoDB
 * Simula exactamente lo que se haría en Atlas UI
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('\n🔍 Test directo de aggregation pipeline\n');

  // Test 1: Verificar colección
  const count = await db.embedding.count();
  console.log(`📊 Embeddings en colección: ${count}`);

  if (count === 0) {
    console.log('❌ No hay embeddings. Crea algunos primero.');
    return;
  }

  // Test 2: Vector simple (todos 0.1)
  const simpleVector = Array(768).fill(0.1);

  console.log('\n🔎 Test 1: Vector simple (Array.fill(0.1))...');

  try {
    const result1: any = await (db.embedding as any).aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: simpleVector,
            numCandidates: 10,
            limit: 3
          }
        },
        {
          $project: {
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   Resultados: ${result1.length}`);

    if (result1.length > 0) {
      console.log('\n   ✅ ¡EL ÍNDICE FUNCIONA!');
      result1.forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. Score: ${r.score?.toFixed(4) || 'N/A'}`);
        console.log(`      Content: "${r.content?.substring(0, 60)}..."`);
      });
    } else {
      console.log('   ❌ 0 resultados con vector simple');
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);

    if (error.message.includes('index')) {
      console.log('\n   💡 El índice "vector_index" no existe o no está en Vector Search');
      console.log('   → Ve a Atlas UI → Vector Search (no Atlas Search)');
    }
  }

  // Test 3: Vector random
  console.log('\n🔎 Test 2: Vector random...');

  const randomVector = Array(768).fill(0).map(() => Math.random() * 2 - 1);

  try {
    const result2: any = await (db.embedding as any).aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: randomVector,
            numCandidates: 10,
            limit: 3
          }
        },
        {
          $project: {
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   Resultados: ${result2.length}`);

    if (result2.length > 0) {
      result2.forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. Score: ${r.score?.toFixed(4)}`);
      });
    }
  } catch (error: any) {
    console.log(`   ❌ Error: ${error.message}`);
  }

  // Test 4: Usando $search (para descartar si está en Atlas Search)
  console.log('\n🔎 Test 3: Verificar si está en Atlas Search por error...');

  try {
    const result3: any = await (db.embedding as any).aggregateRaw({
      pipeline: [
        {
          $search: {
            index: 'vector_index',
            text: {
              query: 'test',
              path: 'content'
            }
          }
        },
        {
          $limit: 1
        }
      ]
    });

    if (result3.length > 0) {
      console.log('   ⚠️  ¡El índice está en ATLAS SEARCH, no Vector Search!');
      console.log('   → Necesitas moverlo a la sección de Vector Search');
    } else {
      console.log('   ✅ No está en Atlas Search (correcto)');
    }
  } catch (error: any) {
    console.log('   ✅ No está en Atlas Search (correcto)');
  }

  // Test 5: Listar índices disponibles (si es posible)
  console.log('\n📋 Información del sistema:');
  console.log(`   Database: ${process.env.MONGO_ATLAS?.includes('formmy') ? 'formmy_*' : 'desconocida'}`);
  console.log(`   Collection: embeddings`);
  console.log(`   Documentos: ${count}`);

  console.log('\n💡 Si ves 0 resultados en TODOS los tests:');
  console.log('   1. Ve a Atlas UI → Vector Search');
  console.log('   2. Verifica que el índice "vector_index" existe ahí');
  console.log('   3. Verifica que está en la colección "embeddings"');
  console.log('   4. Verifica que el status es "Active"');
  console.log('   5. Espera 15-20 minutos si lo acabas de crear\n');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
