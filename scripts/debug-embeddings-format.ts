/**
 * Debug: Verificar formato de chatbotId en embeddings
 */

import { db } from '~/utils/db.server';

const CHATBOT_ID = '68f456dca443330f35f8c81d';

async function main() {
  console.log('\n🔍 === DEBUG: Formato de Embeddings ===\n');

  try {
    // Obtener algunos embeddings
    const embeddings = await db.embedding.findMany({
      where: { chatbotId: CHATBOT_ID },
      take: 3,
      select: {
        id: true,
        chatbotId: true,
        content: true,
        metadata: true,
      }
    });

    console.log(`Total embeddings encontrados con Prisma: ${embeddings.length}\n`);

    if (embeddings.length > 0) {
      const sample = embeddings[0];
      console.log('📄 Sample Embedding:');
      console.log(`   ID: ${sample.id}`);
      console.log(`   ChatbotId: ${sample.chatbotId}`);
      console.log(`   ChatbotId type: ${typeof sample.chatbotId}`);
      console.log(`   Content preview: ${sample.content.substring(0, 100)}...`);
      console.log(`   Metadata:`, JSON.stringify(sample.metadata, null, 2));
    }

    // Probar aggregation RAW sin filtro
    console.log('\n🔎 Probando aggregateRaw SIN filtro...\n');

    const rawResults = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $match: {
            chatbotId: CHATBOT_ID // String directo, sin $oid
          }
        },
        {
          $limit: 3
        },
        {
          $project: {
            _id: 1,
            chatbotId: 1,
            content: 1
          }
        }
      ]
    });

    console.log(`Results from aggregateRaw: ${(rawResults as any[]).length}`);

    if ((rawResults as any[]).length > 0) {
      const sample = (rawResults as any[])[0];
      console.log('\n📄 Sample from aggregateRaw:');
      console.log(`   _id:`, sample._id);
      console.log(`   chatbotId:`, sample.chatbotId);
      console.log(`   content:`, sample.content?.substring(0, 100));
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    await db.$disconnect();
  }
}

main();
