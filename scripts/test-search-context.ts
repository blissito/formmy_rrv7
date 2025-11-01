/**
 * Test script para verificar que search_context funciona correctamente
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Buscar el chatbot por slug
  const chatbot = await prisma.chatbot.findUnique({
    where: {
      slug: "mi-chatbot-IF3R5V",
    },
    select: {
      id: true,
      slug: true,
      name: true,
      _count: {
        select: {
          embeddings: true,
        },
      },
    },
  });

  if (!chatbot) {
    console.error("❌ No se encontró un chatbot con RAG configurado");
    return;
  }

  console.log("\n✅ Chatbot encontrado:");
  console.log(`  ID: ${chatbot.id}`);
  console.log(`  Nombre: ${chatbot.name}`);
  console.log(`  Slug: ${chatbot.slug}`);
  console.log(`  Embeddings DB: ${chatbot._count.embeddings}`);

  // Verificar que tenga embeddings
  const vectorCollection = prisma.db.collection("vector_index_2");
  const embeddingsCount = await vectorCollection.countDocuments({
    chatbotId: chatbot.id,
  });

  console.log(`  Embeddings: ${embeddingsCount}\n`);

  if (embeddingsCount === 0) {
    console.error("⚠️  Este chatbot no tiene embeddings todavía");
    return;
  }

  // Obtener una muestra de un embedding para saber sobre qué temas preguntar
  const sampleEmbedding = await vectorCollection.findOne({
    chatbotId: chatbot.id,
  });

  if (sampleEmbedding) {
    console.log("📄 Muestra de contenido:");
    console.log(`  Texto: ${sampleEmbedding.text?.substring(0, 200)}...`);
    console.log(`  Metadata: ${JSON.stringify(sampleEmbedding.metadata, null, 2)}\n`);
  }

  console.log("\n🧪 Comandos para probar:");
  console.log(
    `\ncurl -X POST http://localhost:3000/api/v1/conversations \\`
  );
  console.log(`  -H "Content-Type: application/json" \\`);
  console.log(`  -d '{`);
  console.log(`    "chatbotId": "${chatbot.id}",`);
  console.log(`    "message": "¿Qué productos ofreces?",`);
  console.log(`    "metadata": { "test": true }`);
  console.log(`  }'\n`);

  console.log(
    "Busca en los logs del servidor mensajes como: [tool:search_context]"
  );
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
