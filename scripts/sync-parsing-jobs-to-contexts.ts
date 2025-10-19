/**
 * Script para sincronizar ParsingJobs COMPLETED con chatbot.contexts[]
 * Esto es necesario para jobs que se completaron antes de implementar auto-sync
 */

import { db } from "../app/utils/db.server";

async function main() {
  console.log("\n=== Sync ParsingJobs → contexts[] ===\n");

  // Obtener ParsingJobs COMPLETED
  const completedJobs = await db.parsingJob.findMany({
    where: {
      status: "COMPLETED"
    },
    select: {
      id: true,
      fileName: true,
      resultMarkdown: true,
      chatbotId: true,
      createdAt: true
    }
  });

  console.log(`Found ${completedJobs.length} COMPLETED ParsingJobs\n`);

  let syncedCount = 0;
  let skippedCount = 0;

  for (const job of completedJobs) {
    if (!job.chatbotId) {
      console.log(`⏩ Skipping job ${job.id} - no chatbotId`);
      skippedCount++;
      continue;
    }

    // Verificar si ya existe en contexts[]
    const chatbot = await db.chatbot.findUnique({
      where: { id: job.chatbotId },
      select: { contexts: true, name: true }
    });

    if (!chatbot) {
      console.log(`⚠️  Chatbot ${job.chatbotId} not found for job ${job.id}`);
      skippedCount++;
      continue;
    }

    const existingContexts = (chatbot.contexts || []) as any[];
    const alreadyExists = existingContexts.some((ctx: any) => ctx.id === job.id);

    if (alreadyExists) {
      console.log(`⏩ ${job.fileName} - already in contexts[] of "${chatbot.name}"`);
      skippedCount++;
      continue;
    }

    // Agregar a contexts[]
    const newContext = {
      id: job.id,
      type: "FILE",
      content: job.resultMarkdown || "",
      fileName: job.fileName,
      createdAt: job.createdAt.toISOString(),
      enabled: true,
    };

    await db.chatbot.update({
      where: { id: job.chatbotId },
      data: {
        contexts: [...existingContexts, newContext]
      }
    });

    console.log(`✅ ${job.fileName} → added to "${chatbot.name}"`);
    syncedCount++;
  }

  console.log("\n=== Summary ===");
  console.log(`✅ Synced: ${syncedCount}`);
  console.log(`⏩ Skipped: ${skippedCount}`);
  console.log(`📊 Total: ${completedJobs.length}\n`);

  console.log("💡 Next step: Run auto-vectorize to create embeddings for new contexts");
  console.log("   npx tsx scripts/migrate-contexts-to-embeddings.ts --all\n");
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
