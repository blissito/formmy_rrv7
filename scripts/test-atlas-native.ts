/**
 * Test directo con MongoDB driver nativo
 */

import { MongoClient } from 'mongodb';
import { generateEmbedding } from '../server/vector/embedding.service';

const uri = process.env.MONGO_ATLAS!;
const client = new MongoClient(uri);

async function main() {
  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas');

    const db = client.db();
    const collection = db.collection('embeddings');

    const count = await collection.countDocuments();
    console.log(`📊 Documentos: ${count}`);

    console.log('🔎 Test vector search con embedding real...');

    // Usar embedding real de OpenAI en lugar de Array.fill
    let queryVector = await generateEmbedding('¿Cuánto cuesta el plan Pro de Formmy?');

    // FIX: MongoDB Atlas Vector Search bug con enteros
    // Si hay valores enteros exactos, añadir epsilon microscópico
    queryVector = queryVector.map(v => Number.isInteger(v) ? v + 0.000000000000001 : v);

    const results = await collection.aggregate([
      {
        '$vectorSearch': {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryVector,
          numCandidates: 50,
          limit: 5
        }
      },
      {
        '$project': {
          content: 1,
          chatbotId: 1,
          metadata: 1,
          score: { '$meta': 'vectorSearchScore' }
        }
      }
    ]).toArray();

    console.log(`📊 Resultados: ${results.length}`);

    if (results.length > 0) {
      console.log('🎉 ¡FUNCIONA!');
      results.forEach((r, i) => {
        console.log(`${i + 1}. Score: ${r.score?.toFixed(4)}`);
        console.log(`   "${r.content?.substring(0, 60)}..."`);
      });
    } else {
      console.log('❌ 0 resultados - índice no funciona');

      const sample = await collection.findOne({});
      if (sample) {
        console.log('📝 Muestra:');
        console.log(`   embedding length: ${sample.embedding?.length}`);
        console.log(`   content: "${sample.content?.substring(0, 50)}..."`);
      }
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

main();
