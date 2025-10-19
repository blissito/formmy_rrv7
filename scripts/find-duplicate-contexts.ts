import { db } from '../app/utils/db.server';

async function main() {
  // Buscar TODOS los contextos con título "Planes y precios"
  const contexts = await db.contextItem.findMany({
    where: {
      title: { contains: 'Planes', mode: 'insensitive' }
    },
    select: {
      id: true,
      title: true,
      type: true,
      chatbotId: true,
      chatbot: {
        select: {
          name: true,
          slug: true
        }
      }
    }
  });

  console.log(`\n🔍 Contextos con "Planes" en el título: ${contexts.length}\n`);

  contexts.forEach(ctx => {
    console.log(`📝 "${ctx.title || 'Sin título'}"`);
    console.log(`   ID: ${ctx.id}`);
    console.log(`   Type: ${ctx.type}`);
    console.log(`   Chatbot: "${ctx.chatbot.name}" (${ctx.chatbot.slug})`);
    console.log(`   ChatbotId: ${ctx.chatbotId}`);
    console.log('');
  });

  // También buscar el contextId específico que vimos en los logs
  const specificContext = await db.contextItem.findUnique({
    where: { id: 'I90nD1uCC2ZLb52MtGNAX' },
    select: {
      id: true,
      title: true,
      chatbotId: true,
      chatbot: {
        select: { name: true, slug: true }
      }
    }
  });

  if (specificContext) {
    console.log('\n📌 Contexto específico "I90nD1uCC2ZLb52MtGNAX":');
    console.log(`   Título: "${specificContext.title}"`);
    console.log(`   Chatbot: "${specificContext.chatbot.name}"`);
    console.log(`   ChatbotId: ${specificContext.chatbotId}`);
  }
}

main().catch(console.error).finally(() => process.exit(0));
