import { db } from "../app/utils/db.server";

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d';

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { contexts: true }
  });

  const contexts = (chatbot?.contexts as any[]) || [];

  console.log('📋 Total contexts:', contexts.length);
  console.log('\nContexts:');
  contexts.forEach((c: any, i: number) => {
    console.log(`\n${i + 1}. ${c.fileName || 'Unnamed'}`);
    console.log(`   ID: ${c.id}`);
    console.log(`   Type: ${c.type}`);
    console.log(`   Content preview: ${c.content?.substring(0, 100)}...`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
