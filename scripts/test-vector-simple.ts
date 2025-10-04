/**
 * Test simple de vector search sin filtros
 */

import { db } from '../app/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';

async function main() {
  console.log('\n🔍 Test simple de vector search\n');

  // 1. Verificar embeddings existentes
  const embeddings = await db.embedding.findMany({
    take: 5,
    select: {
      id: true,
      chatbotId: true,
      content: true,
      metadata: true
    }
  });

  console.log(`📊 Total embeddings en DB: ${embeddings.length}`);
  embeddings.forEach((e, i) => {
    console.log(`   ${i + 1}. ${e.metadata?.title || 'Sin título'} - "${e.content.substring(0, 60)}..."`);
  });

  if (embeddings.length === 0) {
    console.log('\n⚠️  No hay embeddings. Ejecuta primero: npx tsx scripts/test-vector-rag.ts');
    return;
  }

  // 2. Test búsqueda SIN filtro de chatbotId (para verificar que el índice funciona)
  console.log('\n🔎 Test búsqueda sin filtro...');
  const query = '¿Cuánto cuesta?';
  const queryEmbedding = await generateEmbedding(query);

  try {
    const results = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index_2',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 3
          }
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`✅ Resultados encontrados: ${(results as any[]).length}`);
    (results as any[]).forEach((r: any, i: number) => {
      console.log(`\n   ${i + 1}. Score: ${(r.score * 100).toFixed(1)}%`);
      console.log(`      ${r.metadata?.title || 'Sin título'}`);
      console.log(`      "${r.content.substring(0, 80)}..."`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  }

  // 3. Test búsqueda CON filtro de chatbotId
  console.log('\n🔎 Test búsqueda con filtro chatbotId...');
  const chatbotId = embeddings[0].chatbotId;

  try {
    const results = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index_2',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 20,
            limit: 3,
            filter: {
              chatbotId: { $oid: chatbotId }
            }
          }
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1,
            metadata: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`✅ Resultados encontrados: ${(results as any[]).length}`);
    (results as any[]).forEach((r: any, i: number) => {
      console.log(`\n   ${i + 1}. Score: ${(r.score * 100).toFixed(1)}%`);
      console.log(`      ${r.metadata?.title || 'Sin título'}`);
      console.log(`      "${r.content.substring(0, 80)}..."`);
    });

  } catch (error) {
    console.error('❌ Error con filtro:', error);
  }

  console.log('\n✅ Test completado\n');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
