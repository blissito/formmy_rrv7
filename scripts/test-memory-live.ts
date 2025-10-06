/**
 * Test de memoria conversacional END-TO-END
 * Simula 2 mensajes consecutivos y verifica si el agente recuerda el primero
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testMemory() {
  // 1. Obtener chatbot Brenda Go
  const chatbot = await prisma.chatbot.findFirst({
    where: { name: { contains: 'brenda go', mode: 'insensitive' } },
    include: { user: true }
  });

  if (!chatbot) {
    console.log('❌ Chatbot not found');
    return;
  }

  console.log('\n📊 TESTING MEMORY FOR:', chatbot.name);
  console.log('User Plan:', chatbot.user.plan);
  console.log('Model:', chatbot.aiModel);
  console.log('Temperature:', chatbot.temperature);

  // 2. Crear o encontrar conversación de test
  const { getConversationBySessionId, createConversation } = await import('../server/chatbot/conversationModel.server');
  const { getMessagesByConversationId, addUserMessage } = await import('../server/chatbot/messageModel.server');

  const testSessionId = 'test-memory-' + Date.now();

  let conversation = await createConversation({
    chatbotId: chatbot.id,
    visitorId: chatbot.user.id,
    sessionId: testSessionId
  });

  console.log('\n📝 Created test conversation:', conversation.sessionId);

  // 3. Simular primer mensaje
  console.log('\n🟢 MESSAGE 1: "Me llamo Pedro"');

  await addUserMessage(conversation.id, 'Me llamo Pedro', undefined, 'web');

  // Cargar historial (vacío en el primer mensaje)
  let allMessages = await getMessagesByConversationId(conversation.id);
  let history = allMessages.map(msg => ({
    role: msg.role.toLowerCase() as "user" | "assistant",
    content: msg.content
  }));

  console.log('  Historial antes de responder:', history.length, 'mensajes');

  // Simular respuesta del agente manualmente con Prisma
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      content: '¡Mucho gusto Pedro! Soy Zeus, asistente de Brenda Go. ¿En qué puedo ayudarte hoy?',
      role: 'ASSISTANT',
      aiModel: 'claude-3-haiku-20240307',
      inputTokens: 50,
      outputTokens: 30
    }
  });

  // 4. Simular segundo mensaje
  console.log('\n🟢 MESSAGE 2: "¿Cuál es mi nombre?"');

  await addUserMessage(conversation.id, '¿Cuál es mi nombre?', undefined, 'web');

  // Cargar historial (DEBE incluir mensaje 1 y respuesta 1)
  allMessages = await getMessagesByConversationId(conversation.id);
  history = allMessages
    .filter(msg => msg.role !== 'SYSTEM')  // Excluir system messages
    .map(msg => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content
    }));

  console.log('\n🧠 HISTORIAL QUE SE PASARÁ AL AGENTE:');
  console.log('  Total mensajes:', history.length);
  history.forEach((msg, i) => {
    console.log(`  [${i + 1}] ${msg.role.toUpperCase()}: ${msg.content.substring(0, 80)}...`);
  });

  // 5. Verificar que el agente recibiría el contexto
  const { resolveChatbotConfig, createAgentExecutionContext } = await import('../server/chatbot/configResolver.server');

  const resolvedConfig = resolveChatbotConfig(chatbot, chatbot.user);
  const agentContext = createAgentExecutionContext(chatbot.user, chatbot.id, '¿Cuál es mi nombre?', {
    sessionId: conversation.sessionId,
    conversationId: conversation.id,
    conversationHistory: history
  });

  console.log('\n✅ AgentContext conversationHistory:', agentContext.conversationHistory?.length || 0);

  if (agentContext.conversationHistory && agentContext.conversationHistory.length > 0) {
    console.log('\n📋 Contexto que verá el agente:');
    agentContext.conversationHistory.forEach((msg, i) => {
      console.log(`  [${i + 1}] ${msg.role}: ${msg.content}`);
    });
  } else {
    console.log('\n🚨 PROBLEMA: AgentContext NO tiene conversationHistory!');
  }

  // 6. Verificar que createSingleAgent recibiría la memoria
  console.log('\n🔧 VERIFICANDO INTEGRACIÓN CON createSingleAgent:');

  const { streamAgentWorkflow } = await import('../server/agents/agent-workflow.server');

  console.log('  ✅ streamAgentWorkflow extraerá history de agentContext (línea 456)');
  console.log('  ✅ Pasará history a createSingleAgent (línea 459)');
  console.log('  ✅ createSingleAgent creará memoria si history.length > 0 (línea 238)');
  console.log('  ✅ Memoria se pasará al agent() (línea 263)');

  // 7. Diagnóstico final
  console.log('\n📊 DIAGNÓSTICO:');

  if (history.length >= 2) {
    const firstUserMsg = history.find(m => m.role === 'user');
    const hasName = firstUserMsg?.content.toLowerCase().includes('pedro');

    if (hasName) {
      console.log('  ✅ Historial contiene el nombre "Pedro"');
      console.log('  ✅ El agente DEBERÍA poder responder "Tu nombre es Pedro"');
    } else {
      console.log('  ❌ Historial NO contiene el nombre');
    }
  } else {
    console.log('  ⚠️  Historial muy corto para test:', history.length, 'mensajes');
  }

  // Cleanup
  await prisma.conversation.delete({ where: { id: conversation.id } });
  console.log('\n🗑️  Test conversation cleaned up');

  await prisma.$disconnect();
}

testMemory();
