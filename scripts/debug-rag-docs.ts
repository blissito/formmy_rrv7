/**
 * Script para debuggear documentos en RAG API
 * Muestra qué documentos y embeddings tienes
 */

import { db } from "../app/utils/db.server";

async function main() {
  console.log("\n=== DEBUG: RAG Documents ===\n");

  // Obtener primer usuario
  const user = await db.user.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true }
  });

  if (!user) {
    console.log("❌ No hay usuarios en la DB");
    return;
  }

  console.log(`✓ Usuario: ${user.email} (${user.id})\n`);

  // Obtener API Keys
  const apiKeys = await db.apiKey.findMany({
    where: { userId: user.id },
    select: { id: true, key: true, chatbotId: true, isActive: true }
  });

  console.log(`API Keys: ${apiKeys.length}`);
  apiKeys.forEach((key, i) => {
    console.log(`  ${i + 1}. ${key.key.slice(0, 20)}... (${key.isActive ? "ACTIVE" : "REVOKED"})`);
    console.log(`     Chatbot: ${key.chatbotId}`);
  });
  console.log();

  // Obtener chatbots
  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id, status: "ACTIVE" },
    select: { id: true, name: true }
  });

  console.log(`Chatbots ACTIVE: ${chatbots.length}`);
  chatbots.forEach((bot, i) => {
    console.log(`  ${i + 1}. ${bot.name} (${bot.id})`);
  });
  console.log();

  if (chatbots.length === 0) {
    console.log("❌ No hay chatbots ACTIVE");
    return;
  }

  const chatbotId = chatbots[0].id;
  console.log(`Analizando chatbot: ${chatbots[0].name}\n`);

  // Obtener ParsingJobs
  const parsingJobs = await db.parsingJob.findMany({
    where: { chatbotId },
    select: {
      id: true,
      fileName: true,
      status: true,
      mode: true,
      pages: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  console.log(`ParsingJobs (Parser API): ${parsingJobs.length}`);
  parsingJobs.forEach((job, i) => {
    console.log(`  ${i + 1}. ${job.fileName} - ${job.status} (${job.mode}, ${job.pages}p)`);
    console.log(`     ID: ${job.id}`);
  });
  console.log();

  // Obtener ContextItems
  const chatbotWithContexts = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { contexts: true }
  });

  const contextItems = (chatbotWithContexts?.contexts || []) as any[];
  console.log(`ContextItems (Manual Upload): ${contextItems.length}`);
  contextItems.forEach((ctx, i) => {
    console.log(`  ${i + 1}. ${ctx.fileName || "Sin nombre"} - ${ctx.type}`);
    console.log(`     ID: ${ctx.id}`);
  });
  console.log();

  // Obtener Embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: { id: true, metadata: true }
  });

  console.log(`Embeddings totales: ${embeddings.length}`);

  // Agrupar embeddings por contextId
  const embeddingsByContext = embeddings.reduce((acc: any, emb: any) => {
    const contextId = emb.metadata?.contextId || "UNKNOWN";
    if (!acc[contextId]) {
      acc[contextId] = [];
    }
    acc[contextId].push(emb.id);
    return acc;
  }, {});

  console.log("\nEmbeddings por documento:");
  Object.entries(embeddingsByContext).forEach(([contextId, ids]: [string, any]) => {
    const count = ids.length;

    // Buscar nombre del documento
    const job = parsingJobs.find(j => j.id === contextId);
    const ctx = contextItems.find((c: any) => c.id === contextId);

    const name = job?.fileName || ctx?.fileName || "UNKNOWN";
    const source = job ? "Parser API" : ctx ? "Manual" : "UNKNOWN";

    console.log(`  ${contextId.slice(0, 12)}... → ${count} chunks`);
    console.log(`    📄 ${name} (${source})`);
  });

  console.log("\n=== RESUMEN ===");
  console.log(`Total documentos (ParsingJobs COMPLETED): ${parsingJobs.filter(j => j.status === "COMPLETED").length}`);
  console.log(`Total documentos (ContextItems FILE): ${contextItems.filter((c: any) => c.type === "FILE").length}`);
  console.log(`Total embeddings: ${embeddings.length}`);
  console.log(`Documentos con embeddings: ${Object.keys(embeddingsByContext).length}`);

  // Simular respuesta del endpoint
  const completedJobs = parsingJobs.filter(j => j.status === "COMPLETED");
  const jobDocs = completedJobs.map(job => {
    const embCount = embeddingsByContext[job.id]?.length || 0;
    if (embCount === 0) return null;
    return {
      id: job.id,
      fileName: job.fileName,
      chunks: embCount,
      source: "parser_api"
    };
  }).filter(Boolean);

  const ctxDocs = contextItems
    .filter((c: any) => c.type === "FILE")
    .map((ctx: any) => {
      const embCount = embeddingsByContext[ctx.id]?.length || 0;
      if (embCount === 0) return null;
      return {
        id: ctx.id,
        fileName: ctx.fileName || "Sin nombre",
        chunks: embCount,
        source: "manual"
      };
    }).filter(Boolean);

  const allDocs = [...jobDocs, ...ctxDocs];

  console.log("\n=== DOCUMENTOS QUE DEBERÍAN APARECER ===");
  if (allDocs.length === 0) {
    console.log("❌ NINGUNO - No hay documentos con embeddings activos");
  } else {
    allDocs.forEach((doc: any, i) => {
      console.log(`${i + 1}. ${doc.fileName} (${doc.chunks} chunks) [${doc.source}]`);
    });
  }

  console.log("\n");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
