/**
 * Test: Vector Search sin filtro para ver si el index funciona
 */

import { db } from '~/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';

async function main() {
  console.log('\n🔍 === TEST: Vector Search Index ===\n');

  try {
    // Generar embedding de "animal"
    console.log('1. Generando embedding de "animal"...');
    const queryEmbedding = await generateEmbedding('animal');
    console.log(`   ✅ Embedding generado (${queryEmbedding.length} dimensiones)\n`);

    // Test 1: Sin filtro (debería devolver cualquier resultado)
    console.log('2. Test SIN filtro (debería funcionar)...');
    const resultsNoFilter = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index_2',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5
            // NO filter
          }
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   Results: ${(resultsNoFilter as any[]).length}`);

    if ((resultsNoFilter as any[]).length > 0) {
      console.log('\n   ✅ Vector Search Index está FUNCIONANDO\n');

      const top = (resultsNoFilter as any[])[0];
      console.log(`   Top result:`);
      console.log(`   - ChatbotId: ${top.chatbotId}`);
      console.log(`   - Score: ${top.score}`);
      console.log(`   - Content: ${top.content?.substring(0, 150)}...`);
    } else {
      console.log('\n   ❌ Vector Search Index NO está funcionando o no hay datos');
      console.log('   Verifica en MongoDB Atlas que "vector_index_2" existe');
    }

    console.log('\n3. Test CON filtro chatbotId...');
    const CHATBOT_ID = '68f456dca443330f35f8c81d';

    const resultsWithFilter = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index_2',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5,
            filter: {
              chatbotId: CHATBOT_ID
            }
          }
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   Results: ${(resultsWithFilter as any[]).length}`);

    if ((resultsWithFilter as any[]).length > 0) {
      console.log('\n   ✅ Filtro chatbotId funciona correctamente');
    } else {
      console.log('\n   ⚠️  El filtro chatbotId NO funciona');
      console.log('   Posibles causas:');
      console.log('   - El index no tiene "chatbotId" en filterPaths');
      console.log('   - El chatbotId está en formato incorrecto (ObjectId vs String)');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);

    if (error instanceof Error) {
      console.log('\nError message:', error.message);

      if (error.message.includes('index')) {
        console.log('\n⚠️  El index "vector_index_2" NO existe en MongoDB Atlas');
        console.log('Necesitas crear el index con:');
        console.log('- Name: vector_index_2');
        console.log('- Path: embedding');
        console.log('- Dimensions: 768');
        console.log('- Similarity: cosine');
        console.log('- Filter Paths: ["chatbotId"]');
      }
    }
  } finally {
    await db.$disconnect();
  }
}

main();
