/**
 * Check chatbot knowledge base documents
 */

import { db } from '~/utils/db.server';

async function main() {
  const chatbotId = '69062a5a18b9ed0f66119fa2';

  console.log('\n📚 Checking knowledge base for chatbot:', chatbotId);

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      contexts: true,
      _count: {
        select: {
          embeddings: true
        }
      }
    }
  });

  if (!chatbot) {
    console.log('❌ Chatbot not found');
    return;
  }

  console.log('\n✅ Chatbot:', chatbot.name);
  console.log('📄 Total contexts:', chatbot.contexts?.length || 0);
  console.log('🔢 Total embeddings:', chatbot._count.embeddings);

  if (chatbot.contexts && chatbot.contexts.length > 0) {
    console.log('\n📋 Contexts:');
    chatbot.contexts.forEach((ctx: any, idx: number) => {
      console.log(`\n${idx + 1}. ${ctx.type} - ${ctx.title || ctx.fileName || ctx.url || 'Untitled'}`);
      console.log(`   ID: ${ctx.id}`);
      console.log(`   Size: ${ctx.sizeKB} KB`);
      if (ctx.content) {
        console.log(`   Content preview: ${ctx.content.substring(0, 150)}...`);
      }
      if (ctx.url) {
        console.log(`   URL: ${ctx.url}`);
      }
    });
  }

  // Check embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      id: true,
      content: true,
      metadata: true
    },
    take: 10
  });

  console.log(`\n🔍 Sample embeddings (showing ${Math.min(10, embeddings.length)} of ${chatbot._count.embeddings}):`);
  embeddings.forEach((emb: any, idx: number) => {
    console.log(`\n${idx + 1}. ${emb.metadata?.title || emb.metadata?.fileName || 'No title'}`);
    console.log(`   Type: ${emb.metadata?.contextType || 'unknown'}`);
    console.log(`   Content: ${emb.content.substring(0, 100)}...`);
  });

  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
