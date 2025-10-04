import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_ATLAS!;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado\n');

    const db = client.db();
    const collection = db.collection('embeddings');

    // Test SIN filtro chatbotId
    const queryVector = Array(768).fill(0.1);

    const results = await collection.aggregate([
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 50,  // Aumentado
          limit: 5
        }
      },
      {
        $project: {
          content: 1,
          'metadata.title': 1,
          score: { $meta: 'vectorSearchScore' }
        }
      }
    ]).toArray();

    console.log(`📊 Resultados SIN filtro: ${results.length}\n`);

    if (results.length > 0) {
      console.log('🎉 ¡FUNCIONA sin filtro!\n');
      results.forEach((r: any, i: number) => {
        console.log(`${i + 1}. ${r.metadata?.title || 'Sin título'}`);
        console.log(`   Score: ${r.score?.toFixed(4)}`);
        console.log(`   "${r.content?.substring(0, 50)}..."\n`);
      });
    } else {
      console.log('❌ Aún 0 resultados\n');
      console.log('Posibles causas:');
      console.log('1. Índice aún no terminó de indexar (espera 30-60 min)');
      console.log('2. Nombre del índice no es exactamente "vector_index"');
      console.log('3. Bug de MongoDB Atlas M0 Free tier\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('$vectorSearch')) {
      console.log('\n💡 El índice "vector_index" NO existe');
      console.log('   Verifica el nombre exacto en Atlas UI');
    }
  } finally {
    await client.close();
  }
}

main();
