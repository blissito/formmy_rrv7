import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanOrphanEmbeddings(chatbotId: string) {
  try {
    console.log(`\n🗑️  Limpiando embeddings huérfanos del chatbot: ${chatbotId}\n`);

    // 1. Obtener contextos válidos
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: { contexts: true, name: true }
    });

    if (!chatbot) {
      console.error('Chatbot no encontrado');
      return;
    }

    const contexts = Array.isArray(chatbot.contexts) ? chatbot.contexts : [];
    const validContextIds = new Set(contexts.map((ctx: any) => ctx.id));

    console.log(`✅ Chatbot: ${chatbot.name}`);
    console.log(`   Contextos válidos: ${validContextIds.size}\n`);

    // 2. Encontrar embeddings huérfanos
    const allEmbeddings = await prisma.embedding.findMany({
      where: { chatbotId },
      select: { id: true, metadata: true }
    });

    const orphanIds: string[] = [];
    allEmbeddings.forEach(emb => {
      const contextId = (emb.metadata as any)?.contextId;
      if (!contextId || !validContextIds.has(contextId)) {
        orphanIds.push(emb.id);
      }
    });

    if (orphanIds.length === 0) {
      console.log('✅ No hay embeddings huérfanos para eliminar\n');
      return;
    }

    console.log(`⚠️  Encontrados ${orphanIds.length} embeddings huérfanos`);
    console.log(`   IDs a eliminar: ${orphanIds.slice(0, 3).join(', ')}${orphanIds.length > 3 ? '...' : ''}\n`);

    // 3. Eliminar embeddings huérfanos
    const result = await prisma.embedding.deleteMany({
      where: {
        id: { in: orphanIds }
      }
    });

    console.log(`✅ Eliminados ${result.count} embeddings huérfanos\n`);
    console.log(`${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

const chatbotId = process.argv[2] || '69062a5a18b9ed0f66119fa2';
cleanOrphanEmbeddings(chatbotId);
