import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testTemperature() {
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } },
    include: { user: true }
  });

  if (!chatbot) {
    console.log('Chatbot not found');
    return;
  }

  console.log('\n📊 CHATBOT TEMPERATURE INFO:');
  console.log('Name:', chatbot.name);
  console.log('Model:', chatbot.aiModel);
  console.log('Temperature in DB:', chatbot.temperature);
  console.log('User Plan:', chatbot.user.plan);

  // Importar configResolver
  const { resolveChatbotConfig } = await import('../server/chatbot/configResolver.server');

  const resolvedConfig = resolveChatbotConfig(chatbot, chatbot.user);

  console.log('\n🔧 RESOLVED CONFIGURATION:');
  console.log('Final Temperature:', resolvedConfig.temperature);
  console.log('Model Corrected:', resolvedConfig.modelCorrected);
  console.log('Original Model:', resolvedConfig.originalModel);
  console.log('Validation Warnings:', resolvedConfig.validationWarnings);

  // Verificar qué temperature debería tener según el modelo
  const { getOptimalTemperature } = await import('../server/config/model-temperatures');
  const optimalTemp = getOptimalTemperature(chatbot.aiModel);

  console.log('\n📈 TEMPERATURE ANALYSIS:');
  console.log('Optimal for model:', optimalTemp);
  console.log('User configured:', chatbot.temperature);
  console.log('Actually used:', resolvedConfig.temperature);

  if (chatbot.temperature !== resolvedConfig.temperature) {
    console.log('\n⚠️  PROBLEM: User temperature is being overridden!');
  } else {
    console.log('\n✅ User temperature is being respected');
  }

  await prisma.$disconnect();
}

testTemperature();
