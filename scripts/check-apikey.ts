import { db } from '../app/utils/db.server';

async function check() {
  const apiKey = await db.apiKey.findUnique({
    where: { key: 'sk_live_ZY2gfHB4C-xY-71m-AGTstR589mIgkBT' },
    select: {
      chatbotId: true,
      name: true,
      userId: true,
      user: {
        select: { email: true }
      }
    }
  });

  console.log('API Key Info:', apiKey);

  if (apiKey?.chatbotId) {
    const chatbot = await db.chatbot.findUnique({
      where: { id: apiKey.chatbotId },
      select: { id: true, name: true, isActive: true }
    });
    console.log('Associated Chatbot:', chatbot);
  } else {
    console.log('⚠️ API Key has NO chatbotId assigned!');
  }

  await db.$disconnect();
}

check();
