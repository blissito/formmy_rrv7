import { db } from '../app/utils/db.server';

async function main() {
  const chatbot = await db.chatbot.findFirst({
    where: { slug: 'mi-chatbot-TLuoAY' }
  });

  if (chatbot) {
    await db.chatbot.update({
      where: { id: chatbot.id },
      data: { isActive: true }
    });
    console.log('✅ Chatbot activado:', chatbot.name);
    console.log('Slug:', chatbot.slug);
    console.log('ID:', chatbot.id);
  } else {
    console.log('❌ Chatbot no encontrado');
  }

  await db.$disconnect();
}

main();
