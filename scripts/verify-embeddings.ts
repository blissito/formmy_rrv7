import { db } from '../app/utils/db.server';

async function main() {
  const count = await db.embedding.count();
  console.log('📊 Total embeddings en BD:', count);

  const latest = await db.embedding.findMany({ 
    take: 5, 
    orderBy: { createdAt: 'desc' },
    select: {
      chatbotId: true,
      content: true,
      metadata: true,
      createdAt: true
    }
  });

  console.log('\n📝 Últimos 5 embeddings creados:\n');
  latest.forEach((e: any, i: number) => {
    console.log(`${i + 1}. Chatbot: ${e.chatbotId}`);
    console.log(`   Título: ${e.metadata?.title || 'Sin título'}`);
    console.log(`   Chunk ${(e.metadata?.chunkIndex ?? 0) + 1}/${e.metadata?.totalChunks || '?'}`);
    console.log(`   Contenido: "${e.content.substring(0, 60)}..."`);
    console.log(`   Creado: ${e.createdAt}\n`);
  });
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
