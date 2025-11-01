import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkChatbot() {
  try {
    // Buscar usuarios TRIAL
    const trialUsers = await prisma.user.findMany({
      where: { plan: 'TRIAL' },
      select: { id: true, email: true, plan: true }
    });

    console.log('\n👥 USUARIOS TRIAL:');
    console.log(JSON.stringify(trialUsers, null, 2));

    if (trialUsers.length === 0) {
      console.log('No hay usuarios TRIAL');
      return;
    }

    // Buscar chatbots de usuarios TRIAL
    const chatbots = await prisma.chatbot.findMany({
      where: {
        userId: { in: trialUsers.map(u => u.id) },
        status: 'ACTIVE'
      },
      include: {
        user: { select: { email: true, plan: true } }
      }
    });

    console.log('\n🤖 CHATBOTS DE USUARIOS TRIAL:');
    chatbots.forEach(c => {
      console.log(JSON.stringify({
        id: c.id,
        name: c.name,
        slug: c.slug,
        userEmail: c.user?.email,
      }, null, 2));
    });

    // Usar el primer chatbot encontrado
    const chatbot = chatbots[0];

    console.log('\n🤖 CHATBOT ENCONTRADO:');
    console.log(JSON.stringify({
      id: chatbot?.id,
      name: chatbot?.name,
      slug: chatbot?.slug,
      userId: chatbot?.userId,
      userEmail: chatbot?.user?.email,
      userPlan: chatbot?.user?.plan
    }, null, 2));

    if (chatbot) {
      // Buscar embeddings
      const embeddings = await prisma.embedding.count({
        where: { chatbotId: chatbot.id }
      });

      console.log(`\n📊 EMBEDDINGS: ${embeddings} documentos indexados`);

      // Mostrar algunos embeddings
      const sampleEmbeddings = await prisma.embedding.findMany({
        where: { chatbotId: chatbot.id },
        take: 3,
        select: {
          id: true,
          content: true,
          metadata: true
        }
      });

      console.log('\n📄 SAMPLE EMBEDDINGS:');
      sampleEmbeddings.forEach((emb, idx) => {
        console.log(`\n${idx + 1}. ID: ${emb.id}`);
        console.log(`   Content: ${emb.content?.substring(0, 100)}...`);
        console.log(`   Metadata:`, emb.metadata);
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkChatbot();
