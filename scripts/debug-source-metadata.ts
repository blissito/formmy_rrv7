/**
 * Debug: Verificar metadata de la fuente "Planes y precios"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugSourceMetadata() {
  console.log("🔍 Buscando embedding con contenido 'Planes y precios'...\n");

  // Buscar en embeddings que contengan este texto
  const embeddings = await prisma.embedding.findMany({
    where: {
      text: {
        contains: "Planes y precios"
      }
    },
    take: 5
  });

  console.log(`📊 Encontrados ${embeddings.length} embeddings\n`);

  for (const emb of embeddings) {
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📄 Embedding ID: ${emb.id}`);
    console.log(`   Context ID: ${emb.contextId}`);
    console.log(`   Chatbot ID: ${emb.chatbotId}`);
    console.log(`   Chunk Index: ${emb.chunkIndex}`);
    console.log(`\n📝 Metadata (JSON):`);
    console.log(JSON.stringify(emb.metadata, null, 2));
    console.log(`\n📄 Texto (primeros 200 chars):`);
    console.log(emb.text.substring(0, 200));
    console.log(`${'='.repeat(80)}\n`);

    // Buscar el contexto relacionado
    if (emb.contextId) {
      const context = await prisma.context.findUnique({
        where: { id: emb.contextId }
      });

      if (context) {
        console.log(`📦 CONTEXTO RELACIONADO:`);
        console.log(`   ID: ${context.id}`);
        console.log(`   Tipo: ${context.type}`);
        console.log(`   Fuente: ${context.source}`);
        console.log(`   fileName: ${context.fileName || 'NULL'}`);
        console.log(`   title: ${context.title || 'NULL'}`);
        console.log(`   url: ${context.url || 'NULL'}`);
        console.log(`\n`);
      } else {
        console.log(`⚠️  No se encontró contexto con ID: ${emb.contextId}\n`);
      }
    }
  }

  await prisma.$disconnect();
}

debugSourceMetadata()
  .then(() => console.log("\n✅ Debug completado"))
  .catch((error) => {
    console.error("\n❌ Error:", error);
    process.exit(1);
  });
