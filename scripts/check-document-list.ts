/**
 * Verificar lista de documentos para un chatbot
 */

import { db } from "~/utils/db.server";

async function checkDocumentList(chatbotId: string) {
  console.log(`\n📋 Verificando lista de documentos para chatbot ${chatbotId}\n`);

  // Obtener chatbot con contextos
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      contexts: true
    }
  });

  if (!chatbot) {
    throw new Error('Chatbot not found');
  }

  console.log(`📦 Chatbot: ${chatbot.name}`);
  console.log(`📄 Contexts en chatbot.contexts[]: ${chatbot.contexts.length}\n`);

  // Mostrar contexts
  if (chatbot.contexts.length > 0) {
    console.log('Contexts:');
    chatbot.contexts.forEach((ctx: any, i) => {
      console.log(`  ${i + 1}. [${ctx.type}] ${ctx.fileName || ctx.title || ctx.url || 'Unnamed'}`);
      console.log(`     ID: ${ctx.id}`);
    });
  }

  // Obtener ParsingJobs
  const parsingJobs = await db.parsingJob.findMany({
    where: {
      chatbotId,
      status: { in: ['COMPLETED', 'COMPLETED_NO_VECTOR'] }
    },
    select: {
      id: true,
      fileName: true,
      status: true,
      pages: true
    }
  });

  console.log(`\n📄 ParsingJobs completados: ${parsingJobs.length}\n`);

  if (parsingJobs.length > 0) {
    console.log('ParsingJobs:');
    parsingJobs.forEach((job, i) => {
      console.log(`  ${i + 1}. [${job.status}] ${job.fileName} (${job.pages || 0}p)`);
      console.log(`     ID: ${job.id}`);
    });
  }

  // Obtener embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: { metadata: true }
  });

  console.log(`\n📦 Embeddings totales: ${embeddings.length}\n`);

  // Agrupar por contextId
  const embeddingsByContext = embeddings.reduce((acc, emb) => {
    const contextId = (emb.metadata as any)?.contextId;
    if (contextId) {
      acc[contextId] = (acc[contextId] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  console.log('Embeddings por documento:');
  Object.entries(embeddingsByContext).forEach(([contextId, count]) => {
    const context = chatbot.contexts.find((ctx: any) => ctx.id === contextId);
    const job = parsingJobs.find(j => j.id === contextId);
    const name = context?.fileName || context?.title || job?.fileName || 'Unknown';
    console.log(`  ${name}: ${count} chunks`);
    console.log(`    contextId: ${contextId}`);
  });

  // Simular lo que retorna el endpoint /api/rag/v1?intent=list
  console.log('\n' + '='.repeat(60));
  console.log('📊 Simulando endpoint /api/rag/v1?intent=list\n');

  const parsingJobDocs = parsingJobs
    .map((job) => {
      const embeddingCount = embeddings.filter((emb: any) =>
        emb.metadata?.contextId === job.id
      ).length;

      if (embeddingCount === 0) return null;

      return {
        id: job.id,
        fileName: job.fileName,
        mode: 'AGENTIC',
        pages: job.pages || 0,
        chunks: embeddingCount,
        source: "parser_api",
      };
    })
    .filter(Boolean);

  const contextItemDocs = chatbot.contexts
    .map((ctx: any) => {
      const embeddingCount = embeddings.filter((emb: any) =>
        emb.metadata?.contextId === ctx.id
      ).length;

      if (embeddingCount === 0) return null;

      let displayName = "Unnamed";
      let source = "manual_upload";

      switch (ctx.type) {
        case "FILE":
          displayName = ctx.fileName || "Unnamed file";
          source = "manual_upload";
          break;
        case "LINK":
          displayName = ctx.url || ctx.title || "Unnamed link";
          source = "web_source";
          break;
        case "TEXT":
          displayName = ctx.title || "Unnamed text";
          source = "text_context";
          break;
        case "QUESTION":
          displayName = ctx.title || ctx.questions || "Unnamed Q&A";
          source = "qa_context";
          break;
      }

      return {
        id: ctx.id,
        fileName: displayName,
        type: ctx.type,
        mode: "COST_EFFECTIVE",
        pages: ctx.type === "LINK" ? (ctx.routes?.length || 0) : 0,
        chunks: embeddingCount,
        source,
      };
    })
    .filter(Boolean);

  const allDocs = [...parsingJobDocs, ...contextItemDocs];

  console.log(`Total documentos que aparecerían en lista: ${allDocs.length}\n`);

  allDocs.forEach((doc, i) => {
    console.log(`${i + 1}. ${doc.fileName}`);
    console.log(`   Source: ${doc.source}`);
    console.log(`   Chunks: ${doc.chunks}`);
    console.log(`   Mode: ${doc.mode}`);
  });

  if (allDocs.length === 0) {
    console.log('⚠️  NO HAY DOCUMENTOS PARA MOSTRAR (todos tienen 0 embeddings)');
  }

  console.log('\n' + '='.repeat(60));
}

const chatbotId = process.argv[2] || '68f456dca443330f35f8c81d';
checkDocumentList(chatbotId)
  .catch(console.error)
  .finally(() => process.exit(0));
