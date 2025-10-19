/**
 * Test: Vector Search SIN filtro de chatbotId para verificar que el índice funciona
 */
import { db } from '~/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';
import { VECTOR_INDEX_NAME, getIndexConfigJSON } from '../server/vector/vector-config';

async function main() {
  console.log('\n🔍 === TEST: Vector Search SIN FILTRO ===\n');
  console.log(`📇 Index configurado: ${VECTOR_INDEX_NAME}\n`);

  try {
    // 1. Generar embedding de prueba
    console.log('1. Generando embedding de "animal"...');
    const queryEmbedding = await generateEmbedding('animal');
    console.log(`   ✅ Embedding generado: ${queryEmbedding.length} dimensiones\n`);

    // 2. Buscar SIN filtro de chatbotId
    console.log('2. Buscando SIN filtro de chatbotId...');
    const resultsNoFilter = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: VECTOR_INDEX_NAME,
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 50,
            limit: 5
            // SIN filter!
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

    console.log(`   ✅ Resultados SIN filtro: ${(resultsNoFilter as any[]).length}\n`);

    if ((resultsNoFilter as any[]).length > 0) {
      console.log('📋 Top resultados:');
      (resultsNoFilter as any[]).forEach((r: any, i: number) => {
        console.log(`   ${i + 1}. [${r.score?.toFixed(4)}] ${r.content?.substring(0, 80)}...`);
        console.log(`      ChatbotId: ${r.chatbotId?.$oid || r.chatbotId}\n`);
      });

      // 3. Ahora probar CON filtro usando el mismo chatbotId de los resultados
      const testChatbotId = (resultsNoFilter as any[])[0].chatbotId?.$oid || (resultsNoFilter as any[])[0].chatbotId;
      console.log(`\n3. Buscando CON filtro de chatbotId: ${testChatbotId}...`);

      const resultsWithFilter = await db.embedding.aggregateRaw({
        pipeline: [
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit: 5,
              filter: {
                chatbotId: { $oid: testChatbotId }  // ObjectId format
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

      console.log(`   ✅ Resultados CON filtro: ${(resultsWithFilter as any[]).length}\n`);

      if ((resultsWithFilter as any[]).length === 0) {
        console.log('\n⚠️  ADVERTENCIA:');
        console.log('   - Sin filtro: funciona ✅');
        console.log('   - Con filtro ObjectId: no funciona ❌');
        console.log('\n💡 Posibles causas:');
        console.log(`   1. El índice "${VECTOR_INDEX_NAME}" NO tiene el filtro configurado`);
        console.log('   2. El índice está re-indexando (espera 1-2 min)');
        console.log('   3. Hay un problema con el tipo de dato chatbotId');
        console.log('\n📖 Configuración requerida del índice:\n');
        console.log(getIndexConfigJSON());
      } else {
        console.log('✅ ¡El filtro funciona perfectamente! Resultados:');
        (resultsWithFilter as any[]).forEach((r: any, i: number) => {
          console.log(`   ${i + 1}. [${r.score?.toFixed(4)}] ${r.content?.substring(0, 60)}...`);
        });
        console.log('\n🎉 Vector search está completamente funcional con filtros!');
      }
    } else {
      console.log('❌ Sin resultados incluso SIN filtro.');
      console.log('   Esto significa que el índice NO está funcionando en absoluto.');
      console.log(`   Verifica que "${VECTOR_INDEX_NAME}" exista en Atlas y esté Active.`);
      console.log('\n📖 Para crear el índice:');
      console.log('   1. MongoDB Atlas → Database → Collection "Embedding"');
      console.log('   2. Search Indexes → Create Search Index → Atlas Vector Search');
      console.log(`   3. Index Name: ${VECTOR_INDEX_NAME}`);
      console.log('   4. JSON Editor → Pega:\n');
      console.log(getIndexConfigJSON());
      console.log('\n   5. Create Search Index y espera a que esté Active');
    }

  } catch (error: any) {
    console.error('\n❌ Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
