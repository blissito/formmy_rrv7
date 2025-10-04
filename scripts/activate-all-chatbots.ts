import { db } from '../app/utils/db.server';

async function main() {
  const result = await db.chatbot.updateMany({
    where: { isActive: false },
    data: { isActive: true }
  });

  console.log(`✅ Activados ${result.count} chatbots`);
  await db.$disconnect();
}

main();
