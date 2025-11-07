/**
 * Ver formato de números en conversaciones vs contactos
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
    select: { id: true }
  });

  const chatbotIds = chatbots.map(c => c.id);

  // Ver conversaciones
  const conversations = await db.conversation.findMany({
    where: { chatbotId: { in: chatbotIds } },
    select: {
      id: true,
      visitorId: true,
      sessionId: true
    },
    take: 5
  });

  console.log('Formato de números en CONVERSACIONES:');
  conversations.forEach(c => {
    console.log(`  visitorId: "${c.visitorId}"`);
    console.log(`  sessionId: "${c.sessionId}"\n`);
  });

  // Ver contactos
  const contacts = await db.contact.findMany({
    where: { chatbotId: { in: chatbotIds } },
    select: {
      name: true,
      phone: true
    },
    take: 5
  });

  console.log('\nFormato de números en CONTACTOS:');
  contacts.forEach(c => {
    console.log(`  nombre: "${c.name}"`);
    console.log(`  phone: "${c.phone}"\n`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
