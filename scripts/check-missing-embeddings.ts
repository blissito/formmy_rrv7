import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMissingEmbeddings() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  console.log('\n🔍 Checking which contexts are missing embeddings:\n');

  // Obtener todos los embeddings
  const embeddings = await prisma.embedding.findMany({
    where: { chatbotId: chatbot.id },
    select: { metadata: true }
  });

  // Extraer contextIds únicos de los embeddings
  const embeddedContextIds = new Set(
    embeddings.map(e => (e.metadata as any).contextId)
  );

  console.log('Contexts WITH embeddings:');
  chatbot.contexts.forEach(ctx => {
    if (embeddedContextIds.has(ctx.id)) {
      console.log(`  ✅ ${ctx.type} - ${ctx.title}`);
    }
  });

  console.log('\nContexts MISSING embeddings:');
  const missingContexts = chatbot.contexts.filter(ctx => !embeddedContextIds.has(ctx.id));

  if (missingContexts.length === 0) {
    console.log('  ✅ All contexts have embeddings!');
  } else {
    missingContexts.forEach(ctx => {
      console.log(`  ❌ ${ctx.type} - ${ctx.title} (ID: ${ctx.id})`);
      if (ctx.type === 'TEXT') {
        console.log(`     Content: ${ctx.content?.substring(0, 100)}...`);
      }
    });
  }

  await prisma.$disconnect();
}

checkMissingEmbeddings();
