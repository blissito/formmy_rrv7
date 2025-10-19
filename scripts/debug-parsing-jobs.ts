import { db } from "../app/utils/db.server";

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d';

  // Ver ParsingJobs de este chatbot
  const parsingJobs = await db.parsingJob.findMany({
    where: { chatbotId },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log('📋 Total ParsingJobs:', parsingJobs.length);
  console.log('\nParsingJobs:');
  parsingJobs.forEach((job: any, i: number) => {
    console.log(`\n${i + 1}. ${job.fileName}`);
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Mode: ${job.mode}`);
    console.log(`   Pages: ${job.pages}`);
    console.log(`   Created: ${job.createdAt}`);
  });

  // Ver embeddings existentes
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: { metadata: true },
    take: 5
  });

  console.log('\n\n📊 Sample embeddings:');
  embeddings.forEach((emb: any, i: number) => {
    console.log(`\n${i + 1}. ContextId: ${emb.metadata?.contextId || 'N/A'}`);
    console.log(`   FileName: ${emb.metadata?.fileName || 'N/A'}`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
