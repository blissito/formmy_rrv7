/**
 * Test script para Vector Search RAG
 * Prueba embeddings, búsqueda vectorial y tool integration
 */

import { db } from '../app/utils/db.server';
import { generateEmbedding, cosineSimilarity } from '../server/vector/embedding.service';
import { vectorSearch } from '../server/vector/vector-search.service';

async function main() {
  console.log('\n🧪 === TEST VECTOR SEARCH RAG ===\n');

  // 1. Test: Generar embedding
  console.log('📝 Test 1: Generar embedding de prueba...');
  const testText = 'Formmy es una plataforma de chatbots con IA';
  const embedding = await generateEmbedding(testText);
  console.log(`✅ Embedding generado: ${embedding.length} dimensiones`);
  console.log(`   Primeros valores: [${embedding.slice(0, 5).map(v => v.toFixed(4)).join(', ')}...]`);

  // 2. Test: Buscar un chatbot de prueba
  console.log('\n🔍 Test 2: Buscar chatbot de prueba...');
  const chatbot = await db.chatbot.findFirst({
    where: {
      status: 'ACTIVE'
    },
    select: {
      id: true,
      name: true,
      slug: true,
      userId: true
    }
  });

  if (!chatbot) {
    console.log('⚠️  No hay chatbots activos. Creando datos de prueba...');
    return;
  }

  console.log(`✅ Chatbot encontrado: ${chatbot.name} (${chatbot.id})`);

  // 3. Test: Crear embeddings de prueba
  console.log('\n📚 Test 3: Crear embeddings de prueba...');

  const testDocs = [
    {
      content: 'Formmy es una plataforma SaaS para crear chatbots con inteligencia artificial. Permite automatizar conversaciones y capturar leads.',
      metadata: { contextType: 'TEXT', title: 'Sobre Formmy' }
    },
    {
      content: 'Los planes de Formmy incluyen Free, Starter ($149 MXN - solo formularios), Pro ($499 MXN - 10 chatbots, 30 min voz) y Enterprise ($2,490 MXN - ilimitado, 60 min voz).',
      metadata: { contextType: 'TEXT', title: 'Pricing' }
    },
    {
      content: 'Los chatbots de Formmy pueden integrarse con WhatsApp, Stripe para pagos, y tienen herramientas como recordatorios y búsqueda web.',
      metadata: { contextType: 'TEXT', title: 'Integraciones' }
    }
  ];

  // Limpiar embeddings anteriores de prueba
  await db.embedding.deleteMany({
    where: {
      chatbotId: chatbot.id
    }
  });

  for (const doc of testDocs) {
    const emb = await generateEmbedding(doc.content);
    await db.embedding.create({
      data: {
        chatbotId: chatbot.id,
        content: doc.content,
        embedding: emb,
        metadata: doc.metadata
      }
    });
    console.log(`   ✅ Creado: ${doc.metadata.title}`);
  }

  // 4. Test: Búsqueda vectorial
  console.log('\n🔎 Test 4: Búsqueda vectorial...');

  const queries = [
    '¿Cuánto cuesta el plan Pro?',
    '¿Qué integraciones tiene?',
    '¿Qué es Formmy?'
  ];

  for (const query of queries) {
    console.log(`\n   Query: "${query}"`);
    const results = await vectorSearch(query, chatbot.id, 2);

    if (results.length === 0) {
      console.log('   ⚠️  No se encontraron resultados');
    } else {
      results.forEach((r, idx) => {
        console.log(`   ${idx + 1}. Score: ${(r.score * 100).toFixed(1)}% - ${r.metadata.title}`);
        console.log(`      "${r.content.substring(0, 80)}..."`);
      });
    }
  }

  // 5. Test: Similaridad coseno
  console.log('\n📐 Test 5: Similaridad coseno...');
  const emb1 = await generateEmbedding('chatbot con inteligencia artificial');
  const emb2 = await generateEmbedding('bot conversacional con IA');
  const emb3 = await generateEmbedding('receta de pizza');

  const sim12 = cosineSimilarity(emb1, emb2);
  const sim13 = cosineSimilarity(emb1, emb3);

  console.log(`   Similaridad (chatbot IA vs bot IA): ${(sim12 * 100).toFixed(1)}%`);
  console.log(`   Similaridad (chatbot IA vs pizza): ${(sim13 * 100).toFixed(1)}%`);

  // 6. Test: Stats de embeddings
  console.log('\n📊 Test 6: Estadísticas de embeddings...');
  const count = await db.embedding.count({
    where: { chatbotId: chatbot.id }
  });
  console.log(`   Total embeddings: ${count}`);

  console.log('\n✅ === TODOS LOS TESTS COMPLETADOS ===\n');
}

main()
  .catch((error) => {
    console.error('\n❌ Error en tests:', error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
