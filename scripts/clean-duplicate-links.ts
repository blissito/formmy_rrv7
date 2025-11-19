/**
 * Script para limpiar links duplicados en chatbots
 *
 * Uso: npx tsx scripts/clean-duplicate-links.ts
 */

import { db } from "../app/utils/db.server";

async function cleanDuplicateLinks() {
  console.log("🔍 Buscando chatbots con links duplicados...\n");

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

    const contexts = chatbot.contexts as any[];
    const linkContexts = contexts.filter((ctx) => ctx.type === "LINK");

    if (linkContexts.length === 0) {
      continue;
    }

    // Agrupar por URL
    const urlGroups = new Map<string, any[]>();
    for (const ctx of linkContexts) {
      if (!ctx.url) continue;

      if (!urlGroups.has(ctx.url)) {
        urlGroups.set(ctx.url, []);
      }
      urlGroups.get(ctx.url)!.push(ctx);
    }

    // Encontrar duplicados
    const duplicates: any[] = [];
    for (const [url, group] of urlGroups.entries()) {
      if (group.length > 1) {
        // Ordenar por createdAt (más reciente primero)
        group.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });

        // Mantener el más reciente, eliminar el resto
        const toKeep = group[0];
        const toRemove = group.slice(1);

        console.log(`📦 Chatbot: ${chatbot.name} (${chatbot.id})`);
        console.log(`   URL: ${url}`);
        console.log(`   Duplicados encontrados: ${group.length}`);
        console.log(`   ✅ Manteniendo: ${toKeep.id} (creado: ${toKeep.createdAt})`);
        console.log(`   ❌ Eliminando: ${toRemove.map((ctx) => ctx.id).join(", ")}\n`);

        duplicates.push(...toRemove);
      }
    }

    if (duplicates.length > 0) {
      // Remover duplicados del array de contexts
      const cleanedContexts = contexts.filter(
        (ctx) => !duplicates.some((dup) => dup.id === ctx.id)
      );

      // Actualizar chatbot
      await db.chatbot.update({
        where: { id: chatbot.id },
        data: { contexts: cleanedContexts },
      });

      console.log(`✅ Chatbot ${chatbot.name}: ${duplicates.length} duplicados eliminados\n`);
      totalCleaned += duplicates.length;
    }
  }

  if (totalCleaned === 0) {
    console.log("✨ No se encontraron links duplicados");
  } else {
    console.log(`\n🎉 Total de duplicados eliminados: ${totalCleaned}`);
  }

  await db.$disconnect();
}

cleanDuplicateLinks().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
