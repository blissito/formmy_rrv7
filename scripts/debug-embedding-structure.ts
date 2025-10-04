/**
 * Debug: Ver estructura exacta de un embedding en MongoDB
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('\n🔍 Debugging embedding structure\n');

  const embedding = await db.embedding.findFirst();

  if (!embedding) {
    console.log('❌ No hay embeddings en la BD');
    return;
  }

  console.log('📄 Estructura del embedding:');
  console.log(JSON.stringify(embedding, null, 2));

  console.log('\n📊 Información clave:');
  console.log(`   ID: ${embedding.id}`);
  console.log(`   ChatbotId: ${embedding.chatbotId}`);
  console.log(`   Embedding array length: ${(embedding.embedding as any)?.length || 'NO ES ARRAY'}`);
  console.log(`   Embedding type: ${typeof embedding.embedding}`);
  console.log(`   Embedding es array?: ${Array.isArray(embedding.embedding)}`);

  if (Array.isArray(embedding.embedding)) {
    console.log(`   Primeros 5 valores: [${(embedding.embedding as number[]).slice(0, 5).join(', ')}...]`);
  }

  console.log(`   Metadata: ${JSON.stringify(embedding.metadata)}`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
