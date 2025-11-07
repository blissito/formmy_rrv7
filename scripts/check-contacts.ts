/**
 * Ver contactos sincronizados de fixtergeek@gmail.com
 */

import { db } from '../app/utils/db.server';

async function main() {
  const user = await db.user.findUnique({
    where: { email: 'fixtergeek@gmail.com' }
  });

  if (!user) {
    console.error('Usuario no encontrado');
    process.exit(1);
  }

  const chatbots = await db.chatbot.findMany({
    where: { userId: user.id },
    select: { id: true, name: true }
  });

  console.log(`Usuario: ${user.email}`);
  console.log(`Chatbots: ${chatbots.length}\n`);

  for (const chatbot of chatbots) {
    const contacts = await db.contact.findMany({
      where: { chatbotId: chatbot.id },
      select: {
        id: true,
        name: true,
        phone: true,
        source: true,
        capturedAt: true
      }
    });

    console.log(`\nChatbot "${chatbot.name}":`);
    console.log(`  Contactos: ${contacts.length}`);

    if (contacts.length > 0) {
      console.log('\nPrimeros 10 contactos:');
      contacts.slice(0, 10).forEach(c => {
        console.log(`  - ${c.name || 'SIN NOMBRE'} | ${c.phone} | ${c.source}`);
      });
    }
  }
}

main().catch(console.error).finally(() => process.exit(0));
