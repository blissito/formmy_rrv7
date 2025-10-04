/**
 * Test en VIVO de RAG Agéntico con chatbot real
 * Simula conversación y verifica comportamiento agéntico
 */

import { db } from '../app/utils/db.server';
import { streamAgentWorkflow } from '../server/agents/agent-workflow.server';
import { resolveChatbotConfig } from '../server/chatbot/configResolver.server';

const CHATBOT_SLUG = process.argv[2] || 'mi-chatbot-TLuoAY'; // Merlina por defecto

async function main() {
  console.log('\n🧪 TEST RAG AGÉNTICO EN VIVO\n');
  console.log(`📌 Chatbot: ${CHATBOT_SLUG}\n`);

  // 1. Obtener chatbot y usuario
  const chatbot = await db.chatbot.findUnique({
    where: { slug: CHATBOT_SLUG },
    include: {
      user: true,
      integrations: true,
      contexts: true
    }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado\n');
    return;
  }

  console.log(`✅ Chatbot: ${chatbot.name}`);
  console.log(`   Usuario: ${chatbot.user.email}`);
  console.log(`   Plan: ${chatbot.user.plan}`);
  console.log(`   Contextos: ${chatbot.contexts.length}`);
  console.log(`   Modelo: ${chatbot.aiModel}\n`);

  // Verificar embeddings
  const embeddingCount = await db.embedding.count({
    where: { chatbotId: chatbot.id }
  });

  console.log(`   Embeddings: ${embeddingCount}`);

  if (embeddingCount === 0) {
    console.log('\n⚠️  Este chatbot no tiene embeddings. El RAG no funcionará.\n');
    return;
  }

  // 2. Resolver configuración
  const resolvedConfig = await resolveChatbotConfig(chatbot as any);

  console.log('\n' + '─'.repeat(80));
  console.log('\n🎯 ESCENARIOS DE PRUEBA:\n');

  // Escenarios de test
  const scenarios = [
    {
      name: 'Búsqueda Simple',
      query: '¿Cuáles son los horarios?',
      expectedBehavior: 'Debería hacer 1 búsqueda sobre horarios'
    },
    {
      name: 'Pregunta Comparativa',
      query: 'Compara los servicios y precios',
      expectedBehavior: 'Debería hacer 2 búsquedas: servicios + precios'
    },
    {
      name: 'Pregunta Multi-tema',
      query: '¿Cómo funcionan, cuánto cuestan y cómo puedo contactarlos?',
      expectedBehavior: 'Debería hacer 3 búsquedas: funcionamiento + precios + contacto'
    }
  ];

  for (let i = 0; i < scenarios.length; i++) {
    const scenario = scenarios[i];

    console.log(`\n${i + 1}. ${scenario.name}`);
    console.log(`   Query: "${scenario.query}"`);
    console.log(`   Esperado: ${scenario.expectedBehavior}\n`);

    // Ejecutar el agente
    const agentContext = {
      integrations: {},
      conversationHistory: []
    };

    let response = '';
    let toolCalls: string[] = [];

    try {
      const stream = streamAgentWorkflow(
        chatbot.user,
        scenario.query,
        chatbot.id,
        { resolvedConfig, agentContext }
      );

      for await (const event of stream) {
        if (event.type === 'tool-start') {
          toolCalls.push(event.tool);
          console.log(`   🔧 Tool ejecutada: ${event.tool}`);
        } else if (event.type === 'chunk') {
          response += event.content;
        } else if (event.type === 'done') {
          console.log(`\n   📊 Estadísticas:`);
          console.log(`      Total tools: ${event.metadata?.toolsExecuted || 0}`);
          console.log(`      Tools usadas: ${event.metadata?.toolsUsed?.join(', ') || 'ninguna'}`);
        }
      }

      // Verificar si usó search_context
      const searchCalls = toolCalls.filter(t => t === 'search_context').length;

      console.log(`\n   ✅ Respuesta generada (${response.length} chars)`);
      console.log(`   🔍 Búsquedas ejecutadas: ${searchCalls}`);

      if (searchCalls === 0) {
        console.log(`   ⚠️  NO usó RAG - puede ser problema`);
      } else if (searchCalls === 1) {
        console.log(`   ℹ️  Solo 1 búsqueda - puede ser suficiente o insuficiente`);
      } else {
        console.log(`   🎯 Comportamiento agéntico detectado - múltiples búsquedas`);
      }

      // Mostrar preview de respuesta
      console.log(`\n   📝 Preview respuesta:`);
      console.log(`      "${response.substring(0, 200)}..."\n`);

    } catch (error: any) {
      console.log(`\n   ❌ Error: ${error.message}\n`);
    }

    console.log('   ' + '─'.repeat(76));
  }

  console.log('\n💡 ANÁLISIS:\n');
  console.log('Para comportamiento agéntico CORRECTO esperamos ver:');
  console.log('  ✅ Múltiples llamadas a search_context en preguntas complejas');
  console.log('  ✅ Cita de fuentes en las respuestas');
  console.log('  ✅ No adivina datos específicos\n');

  console.log('Si NO ves múltiples búsquedas, revisa:');
  console.log('  - Tool description en /server/tools/index.ts:185');
  console.log('  - System prompt en /server/agents/agent-workflow.server.ts:72');
  console.log('  - Logs del servidor para ver reasoning del modelo\n');

  await db.$disconnect();
}

main().catch(console.error);
