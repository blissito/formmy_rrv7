/**
 * Script para limpiar contextos huérfanos (sin embeddings)
 *
 * Uso: npx tsx scripts/clean-orphaned-contexts.ts
 */

import { db } from "../app/utils/db.server";

async function cleanOrphanedContexts() {
  console.log("🔍 Buscando contextos huérfanos (sin embeddings)...\n");

  // Obtener todos los chatbots
  const chatbots = await db.chatbot.findMany({
    select: {
      id: true,
      name: true,
      contexts: true,
    },
  });

  let totalCleaned = 0;

  for (const chatbot of chatbots) {
    if (!chatbot.contexts || chatbot.contexts.length === 0) {
      continue;
    }

    // Obtener todos los embeddings del chatbot
    const embeddings = await db.embedding.findMany({
      where: { chatbotId: chatbot.id },
      select: { metadata: true }
    });

    // Crear set de contextIds que tienen embeddings
    const contextIdsWithEmbeddings = new Set(
      embeddings
        .map(emb => (emb.metadata as any)?.contextId)
        .filter(Boolean)
    );

    // Encontrar contextos sin embeddings
    const contexts = chatbot.contexts as any[];
    const orphanedContexts = contexts.filter(
      ctx => !contextIdsWithEmbeddings.has(ctx.id)
    );

    if (orphanedContexts.length === 0) {
      continue;
    }

    console.log(`📦 Chatbot: ${chatbot.name} (${chatbot.id})`);
    console.log(`   Total de contextos: ${contexts.length}`);
    console.log(`   Contextos con embeddings: ${contextIdsWithEmbeddings.size}`);
    console.log(`   Contextos huérfanos: ${orphanedContexts.length}`);

    for (const orphan of orphanedContexts) {
      console.log(`   ❌ Huérfano: ${orphan.type} - ${orphan.title || orphan.fileName || orphan.url || orphan.id}`);
    }

    // Filtrar para mantener solo contextos con embeddings
    const cleanedContexts = contexts.filter(
      ctx => contextIdsWithEmbeddings.has(ctx.id)
    );

    // Actualizar chatbot
    await db.chatbot.update({
      where: { id: chatbot.id },
      data: { contexts: cleanedContexts },
    });

    console.log(`✅ Chatbot ${chatbot.name}: ${orphanedContexts.length} huérfanos eliminados\n`);
    totalCleaned += orphanedContexts.length;
  }

  if (totalCleaned === 0) {
    console.log("✨ No se encontraron contextos huérfanos");
  } else {
    console.log(`\n🎉 Total de contextos huérfanos eliminados: ${totalCleaned}`);
  }

  await db.$disconnect();
}

cleanOrphanedContexts().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
