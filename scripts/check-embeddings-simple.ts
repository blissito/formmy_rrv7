import { db } from '../app/utils/db.server';

async function main() {
  console.log('📊 Verificando embeddings en BD...\n');

  const total = await db.embedding.count();
  console.log(`Total embeddings: ${total}\n`);

  const latest = await db.embedding.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' }
  });

  console.log('Últimos 10 embeddings:\n');
  let idx = 0;
  for (const e of latest) {
    idx++;
    const meta = e.metadata as any || {};
    console.log(`${idx}. ID: ${e.id}`);
    console.log(`   Chatbot: ${e.chatbotId}`);
    console.log(`   Título: ${meta.title || 'Sin título'}`);
    console.log(`   Tipo: ${meta.contextType || 'N/A'}`);
    console.log(`   Chunk: ${(meta.chunkIndex ?? 0) + 1}/${meta.totalChunks || '?'}`);
    console.log(`   Embedding dim: ${e.embedding?.length || 0}`);
    console.log(`   Contenido: "${e.content.substring(0, 80)}..."`);
    console.log(`   Creado: ${e.createdAt}\n`);
  }

  // Agrupar por chatbot
  const byBot = await db.embedding.groupBy({
    by: ['chatbotId'],
    _count: true
  });

  console.log('\nEmbeddings por chatbot:');
  for (const group of byBot) {
    const bot = await db.chatbot.findUnique({
      where: { id: group.chatbotId },
      select: { name: true }
    });
    console.log(`  ${bot?.name || 'Unknown'}: ${group._count} embeddings`);
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
