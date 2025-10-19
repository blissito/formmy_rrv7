/**
 * 🔧 Fix Missing Embeddings
 *
 * Re-vectoriza documentos ParsingJobs COMPLETED que no tienen embeddings
 */

import { db } from "~/utils/db.server";
import { vectorizeContext } from "server/vector/auto-vectorize.service";

async function fixMissingEmbeddings(chatbotId: string) {
  console.log(`\n🔧 Fixing missing embeddings for chatbot ${chatbotId}\n`);

  // 1. Obtener chatbot con contextos
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      name: true,
      contexts: true
    }
  });

  if (!chatbot) {
    throw new Error(`Chatbot ${chatbotId} not found`);
  }

  // 2. Obtener todos los embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: { metadata: true }
  });

  // 3. Obtener ParsingJobs COMPLETED
  const completedJobs = await db.parsingJob.findMany({
    where: {
      chatbotId,
      status: 'COMPLETED'
    },
    select: {
      id: true,
      fileName: true,
      fileType: true,
      fileSize: true,
      resultMarkdown: true,
      pages: true
    }
  });

  console.log(`📄 ParsingJobs COMPLETED encontrados: ${completedJobs.length}`);

  // 4. Identificar jobs sin embeddings
  const jobsWithoutEmbeddings = completedJobs.filter(job => {
    const hasEmbeddings = embeddings.some(
      emb => (emb.metadata as any)?.contextId === job.id
    );
    return !hasEmbeddings;
  });

  console.log(`❌ Jobs sin embeddings: ${jobsWithoutEmbeddings.length}\n`);

  if (jobsWithoutEmbeddings.length === 0) {
    console.log('✅ No hay jobs sin embeddings para corregir');
    return;
  }

  // 5. Re-vectorizar cada job
  let fixed = 0;
  let failed = 0;

  for (const job of jobsWithoutEmbeddings) {
    console.log(`\n📝 Procesando: ${job.fileName}`);

    try {
      // Verificar si ya existe en chatbot.contexts
      const existsInContexts = chatbot.contexts.some((ctx: any) => ctx.id === job.id);

      if (!existsInContexts) {
        console.log('  ⚠️  No existe en chatbot.contexts, agregando...');

        // Agregar a contexts usando $push
        const { ObjectId } = await import('mongodb');

        const newContext = {
          id: job.id,
          type: "FILE",
          fileName: job.fileName,
          fileType: job.fileType,
          fileUrl: null,
          url: null,
          title: null,
          sizeKB: Math.round(job.fileSize / 1024),
          content: job.resultMarkdown,
          routes: [],
          questions: null,
          answer: null,
          createdAt: new Date(),
        };

        const result = await db.$runCommandRaw({
          update: 'Chatbot',
          updates: [
            {
              q: { _id: new ObjectId(chatbotId) },
              u: { $push: { contexts: newContext } },
            },
          ],
        });

        console.log('  ✅ Context agregado a chatbot', result);
      }

      // Usar el context que acabamos de crear directamente
      const context = {
        id: job.id,
        type: "FILE" as const,
        fileName: job.fileName,
        fileType: job.fileType,
        fileUrl: null,
        url: null,
        title: null,
        sizeKB: Math.round(job.fileSize / 1024),
        content: job.resultMarkdown,
        routes: [],
        questions: null,
        answer: null,
        createdAt: new Date(),
      };

      // Vectorizar
      console.log('  🔄 Vectorizando...');
      const result = await vectorizeContext(chatbotId, context as any);

      if (result.success && result.embeddingsCreated > 0) {
        console.log(`  ✅ Vectorizado: ${result.embeddingsCreated} embeddings creados`);
        fixed++;
      } else {
        throw new Error(result.error || 'No embeddings created');
      }

    } catch (error) {
      console.error(`  ❌ Error:`, error instanceof Error ? error.message : error);

      // Marcar como COMPLETED_NO_VECTOR
      await db.parsingJob.update({
        where: { id: job.id },
        data: {
          status: 'COMPLETED_NO_VECTOR',
          errorMessage: `Manual vectorization failed: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        }
      });

      failed++;
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Resultados:`);
  console.log(`  ✅ Corregidos: ${fixed}`);
  console.log(`  ❌ Fallidos: ${failed}`);
  console.log(`${'='.repeat(60)}\n`);
}

async function main() {
  const chatbotId = process.argv[2];

  if (!chatbotId) {
    console.error('❌ Uso: npx tsx scripts/fix-missing-embeddings.ts <chatbotId>');
    process.exit(1);
  }

  await fixMissingEmbeddings(chatbotId);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
