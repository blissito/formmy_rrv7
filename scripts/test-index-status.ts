/**
 * Verificar status detallado del índice
 */
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_ATLAS!;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    const db = client.db();
    const coll = db.collection('embeddings');

    console.log('📊 Verificando índice...\n');

    // Intentar búsqueda con diferentes configuraciones
    const tests = [
      { name: 'Vector simple (0.1)', vector: Array(768).fill(0.1), candidates: 10 },
      { name: 'Vector random', vector: Array(768).fill(0).map(() => Math.random()), candidates: 50 },
      { name: 'Más candidates (100)', vector: Array(768).fill(0.1), candidates: 100 }
    ];

    for (const test of tests) {
      try {
        const results = await coll.aggregate([
          {
            $vectorSearch: {
              index: 'vector_index',
              path: 'embedding',
              queryVector: test.vector,
              numCandidates: test.candidates,
              limit: 3
            }
          },
          { $limit: 3 }
        ]).toArray();

        console.log(`${results.length > 0 ? '✅' : '❌'} ${test.name}: ${results.length} resultados`);
      } catch (e: any) {
        console.log(`❌ ${test.name}: ERROR - ${e.message}`);
      }
    }

    console.log('\n⏳ Si todos muestran 0:');
    console.log('   El índice necesita 15-30 min más para indexar');
    console.log('   (M0 Free tier es lento)\n');

  } finally {
    await client.close();
  }
}

main();
