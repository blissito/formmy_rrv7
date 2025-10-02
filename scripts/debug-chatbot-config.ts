import { db } from '../app/utils/db.server';

async function main() {
  const chatbot = await db.chatbot.findFirst({
    where: { slug: 'mi-chatbot-TLuoAY' },
    include: {
      contexts: true
    }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    await db.$disconnect();
    return;
  }

  console.log('\n📊 CONFIGURACIÓN DEL CHATBOT\n');
  console.log('ID:', chatbot.id);
  console.log('Nombre:', chatbot.name);
  console.log('Slug:', chatbot.slug);
  console.log('Activo:', chatbot.isActive);

  console.log('\n🤖 CONFIGURACIÓN AI\n');
  console.log('Modelo:', chatbot.aiModel);
  console.log('Temperatura:', chatbot.temperature);
  console.log('Max Tokens:', chatbot.maxTokens);
  console.log('Personalidad:', chatbot.personality);

  console.log('\n💬 PROMPTS\n');
  console.log('Instrucciones:', chatbot.instructions?.substring(0, 200) + '...');
  console.log('Instrucciones custom:', chatbot.customInstructions?.substring(0, 200) || 'Ninguna');
  console.log('Welcome:', chatbot.welcomeMessage?.substring(0, 100));

  console.log('\n📚 CONTEXTOS\n');
  console.log('Total contextos:', chatbot.contexts?.length || 0);

  if (chatbot.contexts && chatbot.contexts.length > 0) {
    chatbot.contexts.forEach((ctx: any, i: number) => {
      console.log(`\nContexto ${i + 1}:`);
      console.log('  Tipo:', ctx.type);
      console.log('  Título:', ctx.title);
      console.log('  Tamaño:', ctx.sizeKB, 'KB');
      if (ctx.content) {
        console.log('  Preview:', ctx.content.substring(0, 150) + '...');
      }
    });
  }

  await db.$disconnect();
}

main();
