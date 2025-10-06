import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testBrendaGoRAG() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } },
    include: { user: true }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  console.log('\n📊 Chatbot:', chatbot.name);
  console.log('Plan:', chatbot.user.plan);
  console.log('ChatbotId:', chatbot.id);
  console.log('Model:', chatbot.aiModel);
  console.log('Temperature:', chatbot.temperature);

  // Simular el contexto del agente
  const userPlan = chatbot.user.plan;
  const chatbotId = chatbot.id;

  console.log('\n🔍 Checking tool availability for plan:', userPlan);

  // Importar el getToolsForPlan
  const { getToolsForPlan } = await import('../server/tools/index');

  const toolContext = {
    userId: chatbot.user.id,
    userPlan,
    chatbotId,
    message: '¿tienes algo más barato que 5mil pesos?',
    integrations: {},
    isGhosty: false
  };

  const tools = getToolsForPlan(userPlan, {}, toolContext);

  console.log('\n🛠️ Tools disponibles:', tools.length);
  tools.forEach((tool: any) => {
    console.log('  -', tool.metadata?.name || tool.name || 'unknown');
  });

  const hasSearchContext = tools.some((t: any) => t.metadata?.name === 'search_context');
  console.log('\n✅ search_context disponible:', hasSearchContext);

  if (!hasSearchContext) {
    console.log('\n❌ PROBLEMA: search_context NO está disponible para este chatbot');
    console.log('   Verificar:');
    console.log('   - Plan:', userPlan);
    console.log('   - ChatbotId:', chatbotId);
    console.log('   - Condición: ["PRO", "ENTERPRISE", "TRIAL"].includes(userPlan) && chatbotId');
  }

  // Verificar embeddings
  const embeddings = await prisma.embedding.findMany({
    where: { chatbotId: chatbot.id },
    take: 1
  });

  console.log('\n📚 Embeddings en DB:', embeddings.length > 0 ? 'SÍ' : 'NO');

  await prisma.$disconnect();
}

testBrendaGoRAG();
