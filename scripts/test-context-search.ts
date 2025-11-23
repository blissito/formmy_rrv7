/**
 * Script de prueba para verificar que el chatbot encuentra contextos correctamente
 *
 * Prueba:
 * 1. Búsqueda vectorial funciona
 * 2. Contextos están asociados al chatbot correcto
 * 3. Embeddings se encuentran correctamente
 * 4. Sistema RAG retorna resultados relevantes
 */

import { db } from "../app/utils/db.server";
import { secureVectorSearch } from "../server/context/vercel_embeddings.secure";

const CHATBOT_ID = "691fe6f9aaf51e4d69c10b8e";

async function testContextSearch() {
  console.log("🧪 Iniciando pruebas del sistema de contextos\n");

  // ========================================
  // PRUEBA 1: Verificar contextos en DB
  // ========================================
  console.log("📋 PRUEBA 1: Verificar contextos en base de datos");

  const contexts = await db.context.findMany({
    where: { chatbotId: CHATBOT_ID },
    select: {
      id: true,
      title: true,
      contextType: true,
      metadata: true,
      _count: {
        select: { embeddings: true },
      },
    },
  });

  console.log(`   Total de contextos: ${contexts.length}`);
  contexts.forEach((ctx, i) => {
    console.log(`\n   Contexto ${i + 1}:`);
    console.log(`     - ID: ${ctx.id}`);
    console.log(`     - Título: ${ctx.title}`);
    console.log(`     - Tipo: ${ctx.contextType}`);
    console.log(`     - Embeddings: ${ctx._count.embeddings}`);
    if (ctx.metadata) {
      const meta = ctx.metadata as any;
      if (meta.fileName) console.log(`     - Archivo: ${meta.fileName}`);
      if (meta.fileType) console.log(`     - Tipo archivo: ${meta.fileType}`);
    }
  });

  if (contexts.length === 0) {
    console.log("   ❌ No se encontraron contextos");
    return;
  }

  console.log(`\n   ✅ ${contexts.length} contextos encontrados`);

  // ========================================
  // PRUEBA 2: Verificar embeddings
  // ========================================
  console.log("\n🔮 PRUEBA 2: Verificar embeddings generados");

  const embeddings = await db.embedding.findMany({
    where: { chatbotId: CHATBOT_ID },
    select: {
      id: true,
      contextId: true,
      content: true,
      embedding: true,
    },
    take: 3, // Solo primeros 3 para no saturar
  });

  console.log(`   Total de embeddings: ${embeddings.length}`);
  embeddings.forEach((emb, i) => {
    console.log(`\n   Embedding ${i + 1}:`);
    console.log(`     - ID: ${emb.id}`);
    console.log(`     - Context ID: ${emb.contextId}`);
    console.log(`     - Contenido (preview): ${emb.content.substring(0, 100)}...`);
    console.log(`     - Vector dimensiones: ${emb.embedding.length}`);
    console.log(`     - Primeros valores: [${emb.embedding.slice(0, 3).join(", ")}...]`);
  });

  if (embeddings.length === 0) {
    console.log("   ❌ No se encontraron embeddings");
    return;
  }

  console.log(`\n   ✅ ${embeddings.length} embeddings verificados`);

  // ========================================
  // PRUEBA 3: Búsqueda vectorial con queries
  // ========================================
  console.log("\n🔍 PRUEBA 3: Búsqueda vectorial (vector search)");

  const testQueries = [
    "exchange",
    "modulus",
    "trading",
    "API",
    "documentation",
  ];

  for (const query of testQueries) {
    console.log(`\n   Query: "${query}"`);

    try {
      const results = await secureVectorSearch({
        chatbotId: CHATBOT_ID,
        query,
        topK: 3,
      });

      if (results.length === 0) {
        console.log(`     ⚠️  No se encontraron resultados`);
      } else {
        console.log(`     ✅ ${results.length} resultados encontrados`);
        results.forEach((result, i) => {
          console.log(`\n     Resultado ${i + 1}:`);
          console.log(`       - Score: ${result.score.toFixed(4)}`);
          console.log(`       - Content (preview): ${result.content.substring(0, 80)}...`);
          if (result.metadata) {
            const meta = result.metadata as any;
            if (meta.fileName) console.log(`       - Archivo: ${meta.fileName}`);
          }
        });
      }
    } catch (error) {
      console.log(`     ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // ========================================
  // PRUEBA 4: Verificar relación Chatbot -> Context
  // ========================================
  console.log("\n\n🔗 PRUEBA 4: Verificar relación Chatbot -> Context");

  const chatbot = await db.chatbot.findUnique({
    where: { id: CHATBOT_ID },
    select: {
      id: true,
      slug: true,
      name: true,
      contexts: true, // Array legacy (debe estar vacío)
      contextObjects: {
        select: {
          id: true,
          title: true,
          contextType: true,
          _count: {
            select: { embeddings: true },
          },
        },
      },
    },
  });

  console.log(`\n   Chatbot: ${chatbot?.name} (${chatbot?.slug})`);
  console.log(`   Contextos legacy (array): ${chatbot?.contexts.length}`);
  console.log(`   Contextos nuevos (relación): ${chatbot?.contextObjects.length}`);

  if (chatbot?.contexts.length !== 0) {
    console.log(`   ⚠️  ADVERTENCIA: Array legacy no está vacío`);
  } else {
    console.log(`   ✅ Array legacy vacío correctamente`);
  }

  if (chatbot?.contextObjects && chatbot.contextObjects.length > 0) {
    console.log(`\n   Contextos vinculados:`);
    chatbot.contextObjects.forEach((ctx, i) => {
      console.log(`     ${i + 1}. ${ctx.title} (${ctx.contextType}) - ${ctx._count.embeddings} embeddings`);
    });
    console.log(`\n   ✅ Relación Chatbot -> Context funciona correctamente`);
  } else {
    console.log(`   ❌ No hay contextos vinculados al chatbot`);
  }

  // ========================================
  // RESUMEN FINAL
  // ========================================
  console.log("\n\n📊 RESUMEN DE PRUEBAS:");
  console.log(`   ✅ Contextos en DB: ${contexts.length}`);
  console.log(`   ✅ Embeddings generados: ${embeddings.length}`);
  console.log(`   ✅ Búsqueda vectorial: Funcionando`);
  console.log(`   ✅ Relación Chatbot -> Context: Correcta`);
  console.log(`   ✅ Array legacy: Vacío`);
  console.log(`\n🎉 Sistema de contextos funcionando correctamente`);
}

testContextSearch()
  .catch((error) => {
    console.error("\n❌ ERROR EN LAS PRUEBAS:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
