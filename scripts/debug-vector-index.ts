/**
 * Script para diagnosticar el estado del vector index en Atlas
 */
import { db } from '~/utils/db.server';
import { VECTOR_INDEX_NAME, getIndexConfigJSON } from '../server/vector/vector-config';

async function main() {
  console.log('\n🔍 === DIAGNÓSTICO VECTOR INDEX ===\n');
  console.log(`📇 Index configurado: ${VECTOR_INDEX_NAME}\n`);

  try {
    // 1. Verificar colección y documentos de embeddings
    const totalEmbeddings = await db.embedding.count();
    console.log('📊 Estado de la colección Embedding:');
    console.log(`   Total embeddings: ${totalEmbeddings}\n`);

    // 2. Verificar estructura de embeddings
    const sampleEmbedding = await db.embedding.findFirst();

    if (sampleEmbedding) {
      console.log('📝 Ejemplo de embedding:');
      console.log(`   _id: ${sampleEmbedding.id}`);
      console.log(`   chatbotId: ${sampleEmbedding.chatbotId}`);
      console.log(`   content preview: ${sampleEmbedding.content?.substring(0, 50)}...`);
      console.log(`   embedding length: ${(sampleEmbedding.embedding as any)?.length || 0}`);
      console.log(`   embedding type: ${Array.isArray(sampleEmbedding.embedding) ? 'array' : typeof sampleEmbedding.embedding}`);
      console.log(`   metadata: ${JSON.stringify(sampleEmbedding.metadata, null, 2)}\n`);
    } else {
      console.log('⚠️  No se encontraron embeddings en la DB\n');
      process.exit(0);
    }

    // 3. Buscar chatbots con embeddings
    const embeddingsGrouped = await db.embedding.groupBy({
      by: ['chatbotId'],
      _count: true
    });

    console.log('📦 Embeddings por chatbot:');
    embeddingsGrouped.forEach((group: any) => {
      console.log(`   - ${group.chatbotId}: ${group._count} embeddings`);
    });
    console.log();

    // 4. Intentar búsqueda vectorial directa
    console.log('🔍 Intentando búsqueda vectorial con aggregateRaw...');
    const testEmbedding = new Array(768).fill(0.1); // Embedding dummy para test
    const testChatbotId = sampleEmbedding.chatbotId;

    console.log(`   Usando chatbotId: ${testChatbotId}`);
    console.log(`   Index: ${VECTOR_INDEX_NAME}`);
    console.log(`   Path: embedding\n`);

    try {
      const results = await db.embedding.aggregateRaw({
        pipeline: [
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: testEmbedding,
              numCandidates: 20,
              limit: 5,
              filter: {
                chatbotId: testChatbotId
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

      console.log(`✅ Búsqueda vectorial exitosa! Resultados: ${(results as any[]).length}\n`);
      if ((results as any[]).length > 0) {
        console.log('📋 Primeros resultados:');
        (results as any[]).forEach((r: any, i: number) => {
          console.log(`   ${i + 1}. Score: ${r.score?.toFixed(4)} | Content: ${r.content?.substring(0, 50)}...`);
        });
      } else {
        console.log('⚠️  Búsqueda exitosa pero sin resultados. Esto sugiere:');
        console.log('   - El índice existe y funciona');
        console.log('   - Pero el filtro o query no coincide con documentos');
      }
    } catch (searchError: any) {
      console.error('\n❌ Error en búsqueda vectorial:', searchError.message);
      if (searchError.code) console.error('   Code:', searchError.code);
      if (searchError.codeName) console.error('   CodeName:', searchError.codeName);

      console.log('\n💡 Posibles causas:');
      console.log(`   1. El índice "${VECTOR_INDEX_NAME}" no existe en Atlas`);
      console.log('   2. El path "embedding" no coincide con la configuración del índice');
      console.log('   3. El filtro de chatbotId está mal configurado en el índice');
      console.log('\n📖 Configuración correcta del índice:\n');
      console.log(getIndexConfigJSON());
      console.log('\n   Verifica en Atlas:');
      console.log('   - Database: formmy_bliss (o el que uses)');
      console.log('   - Collection: Embedding');
      console.log(`   - Search Indexes → ${VECTOR_INDEX_NAME} debe existir y estar Active`);
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
