import { db } from '../app/utils/db.server';

const CHATBOT_ID = '68f456dca443330f35f8c81d';

async function debugIntegration() {
  const integration = await db.integration.findFirst({
    where: {
      chatbotId: CHATBOT_ID,
      platform: 'WHATSAPP',
    },
  });

  console.log('Integration data:');
  console.log(JSON.stringify(integration, null, 2));

  await db.$disconnect();
}

debugIntegration();
