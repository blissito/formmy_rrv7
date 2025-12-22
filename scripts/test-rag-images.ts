#!/usr/bin/env npx tsx
/**
 * Test: Verificar si el RAG tiene imágenes indexadas
 */
import { vectorSearch } from "../server/context/vercel_embeddings.js";
import { db } from "../app/utils/db.server.js";

async function main() {
  // Chatbot específico
  const chatbot = await db.chatbot.findFirst({
    where: { slug: "ghosty_VXku4l" },
    select: { id: true, slug: true, name: true }
  });

  if (!chatbot) {
    console.log("❌ No hay chatbots en la DB");
    process.exit(1);
  }

  console.log(`\n🤖 Testing RAG for: ${chatbot.name} (${chatbot.slug})`);
  console.log(`   ID: ${chatbot.id}\n`);

  // Buscar imágenes
  const queries = ["imágenes", "galería", "fotos", "pexels"];

  for (const query of queries) {
    console.log(`🔍 Buscando: "${query}"`);
    const result = await vectorSearch({
      chatbotId: chatbot.id,
      value: query,
    });

    if (result.success && result.results && result.results.length > 0) {
      console.log(`   ✅ Encontrados ${result.results.length} resultados`);
      for (const r of result.results.slice(0, 2)) {
        const preview = r.content.substring(0, 200).replace(/\n/g, " ");
        console.log(`   📄 ${preview}...`);
      }
    } else {
      console.log(`   ❌ Sin resultados`);
    }
    console.log();
  }

  process.exit(0);
}

main().catch(console.error);
