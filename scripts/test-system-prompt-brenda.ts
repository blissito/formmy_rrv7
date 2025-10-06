import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testSystemPrompt() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } },
    include: { user: true }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  // Importar las funciones necesarias
  const { resolveChatbotConfig } = await import('../server/chatbot/configResolver.server');

  const resolvedConfig = resolveChatbotConfig(chatbot, chatbot.user);

  console.log('\n📊 RESOLVED CONFIG:');
  console.log('Model:', resolvedConfig.aiModel);
  console.log('Temperature:', resolvedConfig.temperature);
  console.log('Personality:', resolvedConfig.personality);
  console.log('Instructions length:', resolvedConfig.instructions.length);
  console.log('CustomInstructions length:', resolvedConfig.customInstructions.length);
  console.log('Contexts:', resolvedConfig.contexts.length);

  // Simular buildSystemPrompt
  const { getToolsForPlan } = await import('../server/tools/index');

  const toolContext = {
    userId: chatbot.user.id,
    userPlan: chatbot.user.plan,
    chatbotId: chatbot.id,
    message: 'test',
    integrations: {},
    isGhosty: false
  };

  const tools = getToolsForPlan(chatbot.user.plan, {}, toolContext);

  const hasContextSearch = tools.some((t: any) => t.metadata?.name === 'search_context');
  const hasWebSearch = tools.some((t: any) => t.metadata?.name === 'web_search_google');

  console.log('\n🛠️ TOOLS AVAILABILITY:');
  console.log('hasContextSearch:', hasContextSearch);
  console.log('hasWebSearch:', hasWebSearch);

  // Construir system prompt básico
  let basePrompt = `${resolvedConfig.name} - ${resolvedConfig.instructions}`;
  if (resolvedConfig.customInstructions) {
    basePrompt += `\n\n${resolvedConfig.customInstructions}`;
  }

  console.log('\n📝 BASE PROMPT:');
  console.log(basePrompt);

  // Agregar sección de búsqueda
  if (hasContextSearch) {
    console.log('\n🔍 SEARCH CONTEXT INSTRUCTIONS ADDED');
    console.log('The agent should be instructed to use search_context tool');
  }

  await prisma.$disconnect();
}

testSystemPrompt();
