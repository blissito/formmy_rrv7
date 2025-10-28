/**
 * Crear más embeddings para activar el índice
 * Atlas Vector Search puede requerir más documentos
 */

import { db } from '../app/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';

async function main() {
  console.log('\n📝 Creando más embeddings...\n');

  const chatbot = await db.chatbot.findFirst({
    where: { status: 'ACTIVE' },
    select: { id: true, name: true }
  });

  if (!chatbot) {
    console.log('❌ No hay chatbots');
    return;
  }

  console.log(`✅ Chatbot: ${chatbot.name}`);

  const docs = [
    'Formmy es una plataforma SaaS para crear chatbots con IA',
    'El plan Pro cuesta $499 MXN mensuales y incluye 10 chatbots, 30 minutos de voz',
    'Formmy integra WhatsApp, Stripe y herramientas de búsqueda',
    'Los chatbots pueden automatizar conversaciones y capturar leads',
    'El plan Starter cuesta $149 MXN, es solo formularios sin chatbots',
    'El plan Enterprise cuesta $2,490 MXN con chatbots ilimitados, 60 minutos de voz',
    'Formmy usa GPT-5 Nano, Claude 3 Haiku y otros modelos de IA',
    'Puedes crear recordatorios, generar links de pago y guardar contactos',
    'La integración de WhatsApp permite respuestas automáticas',
    'El sistema usa embeddings de 768 dimensiones para búsqueda semántica',
    'Formmy está construido con React Router v7 y Tailwind CSS',
    'La base de datos es MongoDB Atlas con Prisma ORM',
    'El deployment se hace en fly.io con Docker',
    'Los agentes usan LlamaIndex Agent Workflows nativo',
    'Hay herramientas para Google Search, recordatorios y pagos Stripe'
  ];

  // Limpiar anteriores
  await db.embedding.deleteMany({ where: { chatbotId: chatbot.id } });
  console.log('🗑️  Embeddings anteriores eliminados\n');

  // Crear nuevos
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
    console.log(`   ✅ ${i + 1}/${docs.length}: "${docs[i].substring(0, 50)}..."`);
  }

  const total = await db.embedding.count();
  console.log(`\n📊 Total embeddings: ${total}`);

  console.log('\n⏳ Esperando 30 segundos...');
  await new Promise(r => setTimeout(r, 30000));

  console.log('\n🔎 Probando búsqueda...');
  const queryEmbedding = await generateEmbedding('¿Cuánto cuesta el plan Pro?');

  const results: any = await db.embedding.aggregateRaw({
    pipeline: [
      {
        $vectorSearch: {
          index: 'vector_index',
          path: 'embedding',
          queryVector: queryEmbedding,
          numCandidates: 20,
          limit: 5
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

  console.log(`\n📊 Resultados: ${results.length}`);

  if (results.length > 0) {
    console.log('\n🎉 ¡FUNCIONA!\n');
    results.forEach((r: any, i: number) => {
      console.log(`${i + 1}. Score: ${(r.score * 100).toFixed(1)}%`);
      console.log(`   "${r.content.substring(0, 80)}..."\n`);
    });
  } else {
    console.log('\n⚠️  Aún 0 resultados con 15 documentos.');
    console.log('   El índice definitivamente tiene un problema de configuración.');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
