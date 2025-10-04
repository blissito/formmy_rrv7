/**
 * Forzar re-indexación eliminando y recreando embeddings
 * A veces Atlas necesita ver cambios en la colección para activar el índice
 */

import { db } from '../app/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';

async function main() {
  console.log('\n🔄 Forzando re-indexación...\n');

  // 1. Obtener un chatbot
  const chatbot = await db.chatbot.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  });

  if (!chatbot) {
    console.log('❌ No hay chatbots activos');
    return;
  }

  console.log(`✅ Usando chatbot: ${chatbot.name} (${chatbot.id})`);

  // 2. Eliminar embeddings anteriores
  const deleted = await db.embedding.deleteMany({
    where: { chatbotId: chatbot.id }
  });

  console.log(`🗑️  Eliminados ${deleted.count} embeddings anteriores`);

  // 3. Esperar un poco
  console.log(`⏳ Esperando 5 segundos...`);
  await new Promise(resolve => setTimeout(resolve, 5000));

  // 4. Crear nuevos embeddings
  console.log(`\n📝 Creando nuevos embeddings...`);

  const docs = [
    'Formmy es una plataforma SaaS para crear chatbots con IA',
    'El plan Pro de Formmy cuesta $499 MXN mensuales',
    'Formmy integra WhatsApp, Stripe y herramientas de búsqueda'
  ];

  for (let i = 0; i < docs.length; i++) {
    const embedding = await generateEmbedding(docs[i]);
    await db.embedding.create({
      data: {
        chatbotId: chatbot.id,
        content: docs[i],
        embedding,
        metadata: {
          contextType: 'TEXT',
          title: `Doc ${i + 1}`,
          chunkIndex: i
        }
      }
    });
    console.log(`   ✅ Creado embedding ${i + 1}/3`);
  }

  console.log(`\n⏳ Esperando 30 segundos para que Atlas indexe...`);
  await new Promise(resolve => setTimeout(resolve, 30000));

  // 5. Probar búsqueda
  console.log(`\n🔎 Probando búsqueda...`);
  const queryEmbedding = await generateEmbedding('¿Cuánto cuesta el plan Pro?');

  try {
    const results = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: 10,
            limit: 3
          }
        },
        {
          $project: {
            _id: 1,
            content: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`\n📊 Resultados: ${(results as any[]).length}`);

    if ((results as any[]).length > 0) {
      console.log(`\n✅ ¡VECTOR SEARCH FUNCIONANDO!\n`);
      (results as any[]).forEach((r: any, i: number) => {
        console.log(`${i + 1}. Score: ${(r.score * 100).toFixed(1)}%`);
        console.log(`   "${r.content}"`);
      });
    } else {
      console.log(`\n⚠️  Aún sin resultados. El índice puede necesitar más tiempo.`);
      console.log(`   Espera 5-10 minutos y ejecuta: npx tsx scripts/test-vector-simple.ts`);
    }
  } catch (error) {
    console.error(`\n❌ Error:`, error);
  }

  console.log(`\n✅ Proceso completado\n`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
