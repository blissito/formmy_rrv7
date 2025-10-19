import { db } from "../app/utils/db.server";
import { vectorizeContext } from "../server/vector/auto-vectorize.service";

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d';

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { contexts: true }
  });

  const contexts = (chatbot?.contexts as any[]) || [];
  const whatsappContext = contexts.find((c: any) => c.fileName?.includes('WhatsApp'));

  if (!whatsappContext) {
    console.error('❌ WhatsApp context not found');
    process.exit(1);
  }

  console.log('📄 Found context:', whatsappContext.fileName);
  console.log('🔄 Vectorizing...\n');

  await vectorizeContext(chatbotId, whatsappContext);

  console.log('\n✅ Vectorization completed!');
}

main().catch(console.error).finally(() => process.exit(0));
