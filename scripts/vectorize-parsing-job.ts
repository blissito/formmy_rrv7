/**
 * Script para vectorizar un ParsingJob específico que ya está en contexts[] pero no tiene embeddings
 */

import { db } from "../app/utils/db.server";
import { vectorizeContext } from "../server/vector/auto-vectorize.service";

async function main() {
  const jobId = process.argv[2];

  if (!jobId) {
    console.error("❌ Uso: npx tsx scripts/vectorize-parsing-job.ts JOB_ID");
    process.exit(1);
  }

  console.log(`\n🔄 Vectorizing ParsingJob: ${jobId}\n`);

  // Buscar el job
  const job = await db.parsingJob.findUnique({
    where: { id: jobId },
    select: {
      id: true,
      fileName: true,
      chatbotId: true,
      status: true
    }
  });

  if (!job) {
    console.error(`❌ ParsingJob ${jobId} not found`);
    process.exit(1);
  }

  if (job.status !== "COMPLETED") {
    console.error(`❌ ParsingJob is ${job.status}, not COMPLETED`);
    process.exit(1);
  }

  if (!job.chatbotId) {
    console.error(`❌ ParsingJob has no chatbotId`);
    process.exit(1);
  }

  console.log(`📄 ${job.fileName}`);
  console.log(`🤖 Chatbot: ${job.chatbotId}`);

  // Buscar el context
  const chatbot = await db.chatbot.findUnique({
    where: { id: job.chatbotId },
    select: { contexts: true }
  });

  const context = (chatbot?.contexts as any[] || []).find((c: any) => c.id === job.id);

  if (!context) {
    console.error(`❌ Context ${jobId} not found in chatbot.contexts[]`);
    process.exit(1);
  }

  console.log(`📝 Vectorizing: ${context.fileName || "Unnamed"}...`);

  // Vectorizar
  await vectorizeContext(job.chatbotId, context);

  console.log(`✅ Vectorización completada\n`);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
