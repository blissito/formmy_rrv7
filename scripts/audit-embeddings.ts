import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function auditEmbeddings() {
  const chatbotId = '69062a5a18b9ed0f66119fa2'; // Tu chatbot Ghosty

  try {
    // 1. Obtener el chatbot con sus contexts
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: {
        id: true,
        name: true,
        contexts: true
      }
    });

    if (!chatbot) {
      console.error('Chatbot no encontrado');
      return;
    }

    console.log(`\n📦 Chatbot: ${chatbot.name}`);
    console.log(`   ID: ${chatbot.id}`);

    // 2. Extraer contextIds válidos del chatbot
    const contexts = Array.isArray(chatbot.contexts) ? chatbot.contexts : [];
    const validContextIds = new Set(contexts.map((ctx: any) => ctx.id));

    console.log(`\n✅ Contextos válidos en el chatbot: ${validContextIds.size}`);
    contexts.forEach((ctx: any, idx: number) => {
      console.log(`   ${idx + 1}. ${ctx.id} - ${ctx.type} - ${ctx.fileName || ctx.url || ctx.title || 'Sin nombre'}`);
    });

    // 3. Obtener todos los embeddings del chatbot
    const allEmbeddings = await prisma.embedding.findMany({
      where: { chatbotId },
      select: {
        id: true,
        metadata: true,
        createdAt: true
      }
    });

    console.log(`\n📊 Total de embeddings en DB: ${allEmbeddings.length}`);

    // 4. Agrupar embeddings por contextId
    const embeddingsByContext = new Map<string, any[]>();
    const orphanEmbeddings: any[] = [];

    allEmbeddings.forEach(emb => {
      const contextId = (emb.metadata as any)?.contextId;

      if (!contextId) {
        orphanEmbeddings.push({ ...emb, reason: 'Sin contextId' });
        return;
      }

      if (!validContextIds.has(contextId)) {
        orphanEmbeddings.push({ ...emb, reason: `Context ${contextId} no existe en chatbot` });
        return;
      }

      if (!embeddingsByContext.has(contextId)) {
        embeddingsByContext.set(contextId, []);
      }
      embeddingsByContext.get(contextId)!.push(emb);
    });

    // 5. Reportar embeddings válidos
    console.log(`\n✅ Embeddings válidos agrupados por contexto:`);
    embeddingsByContext.forEach((embeddings, contextId) => {
      const context = contexts.find((c: any) => c.id === contextId);
      const contextName = context?.fileName || context?.url || context?.title || contextId;
      console.log(`   ${contextId.substring(0, 8)}... (${contextName}): ${embeddings.length} embeddings`);
    });

    // 6. Reportar embeddings huérfanos
    if (orphanEmbeddings.length > 0) {
      console.log(`\n⚠️  EMBEDDINGS HUÉRFANOS ENCONTRADOS: ${orphanEmbeddings.length}`);
      console.log(`\n📋 Detalle de embeddings huérfanos:\n`);

      const byReason = new Map<string, any[]>();
      orphanEmbeddings.forEach(emb => {
        const key = emb.reason;
        if (!byReason.has(key)) {
          byReason.set(key, []);
        }
        byReason.get(key)!.push(emb);
      });

      byReason.forEach((embeddings, reason) => {
        console.log(`\n   ${reason}: ${embeddings.length} embeddings`);
        embeddings.slice(0, 3).forEach((emb, idx) => {
          const meta = emb.metadata as any;
          console.log(`      ${idx + 1}. ID: ${emb.id}`);
          console.log(`         Metadata:`, JSON.stringify(meta, null, 2));
          console.log(`         Created: ${emb.createdAt}`);
        });
        if (embeddings.length > 3) {
          console.log(`      ... y ${embeddings.length - 3} más`);
        }
      });

      // Preguntar si eliminar
      console.log(`\n🗑️  ¿Eliminar embeddings huérfanos?`);
      console.log(`   Total a eliminar: ${orphanEmbeddings.length}`);
      console.log(`\n   Para eliminar, ejecuta:`);
      console.log(`   npx tsx scripts/clean-orphan-embeddings.ts ${chatbotId}`);
    } else {
      console.log(`\n✅ No se encontraron embeddings huérfanos`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`\n📊 RESUMEN:`);
    console.log(`   Contextos válidos: ${validContextIds.size}`);
    console.log(`   Embeddings válidos: ${allEmbeddings.length - orphanEmbeddings.length}`);
    console.log(`   Embeddings huérfanos: ${orphanEmbeddings.length}`);
    console.log(`\n${'='.repeat(80)}\n`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

auditEmbeddings();
