/**
 * Test E2E de RAG Agéntico
 * Verifica que el agente ejecute múltiples búsquedas para responder preguntas complejas
 */

import { db } from '../app/utils/db.server';
import { vectorSearch } from '../server/vector/vector-search.service';

// Test scenarios (de simple a complejo)
const testScenarios = [
  {
    name: 'Búsqueda Simple',
    query: '¿Cuánto cuesta el plan Pro?',
    expectedSearches: 1,
    description: 'Pregunta directa que requiere 1 búsqueda'
  },
  {
    name: 'Búsqueda Comparativa',
    query: 'Compara los planes Starter y Pro',
    expectedSearches: 2,
    description: 'Debería hacer 2 búsquedas separadas (starter, pro) y combinar resultados'
  },
  {
    name: 'Pregunta Multi-tema',
    query: '¿Cuánto cuestan los planes y qué formas de pago aceptan?',
    expectedSearches: 2,
    description: 'Dos temas distintos: precios + métodos de pago'
  },
  {
    name: 'Investigación Profunda',
    query: 'Dame un resumen completo de todos los servicios que ofrece Formmy',
    expectedSearches: 3,
    description: 'Debería buscar en múltiples categorías para dar respuesta exhaustiva'
  }
];

/**
 * Simula búsquedas agénticas (sin ejecutar agente completo)
 */
async function simulateAgenticSearch(chatbotId: string, query: string) {
  console.log(`\n🔍 Query: "${query}"\n`);

  const results = await vectorSearch(query, chatbotId, 5);

  console.log(`   Resultados encontrados: ${results.length}`);

  if (results.length > 0) {
    console.log('\n   Top 3 resultados:');
    results.slice(0, 3).forEach((r, idx) => {
      const source = r.metadata.fileName || r.metadata.url || r.metadata.title || 'Sin fuente';
      console.log(`   ${idx + 1}. [${(r.score * 100).toFixed(1)}%] ${source}`);
      console.log(`      "${r.content.substring(0, 80)}..."`);
    });
  } else {
    console.log('   ⚠️  No se encontraron resultados');
  }

  return results;
}

async function main() {
  console.log('\n🧪 TEST DE RAG AGÉNTICO\n');
  console.log('Este test simula búsquedas que un agente debería ejecutar.\n');

  // 1. Encontrar un chatbot PRO+ con embeddings
  const chatbots = await db.chatbot.findMany({
    where: {
      user: {
        plan: {
          in: ['PRO', 'ENTERPRISE', 'TRIAL']
        }
      },
      isActive: true
    },
    select: {
      id: true,
      name: true,
      user: {
        select: { plan: true }
      }
    },
    take: 5
  });

  if (chatbots.length === 0) {
    console.log('❌ No hay chatbots PRO+ activos para probar.\n');
    return;
  }

  // Verificar cuál tiene embeddings
  let selectedChatbot: any = null;

  for (const chatbot of chatbots) {
    const embeddingCount = await db.embedding.count({
      where: { chatbotId: chatbot.id }
    });

    if (embeddingCount > 0) {
      selectedChatbot = { ...chatbot, embeddingCount };
      break;
    }
  }

  if (!selectedChatbot) {
    console.log('❌ Ningún chatbot PRO+ tiene embeddings. Ejecuta primero la migración.\n');
    console.log('   npx tsx scripts/migrate-contexts-to-embeddings.ts --all\n');
    return;
  }

  console.log(`✅ Chatbot seleccionado: ${selectedChatbot.name}`);
  console.log(`   Plan: ${selectedChatbot.user.plan}`);
  console.log(`   Embeddings: ${selectedChatbot.embeddingCount}\n`);
  console.log('─'.repeat(80));

  // 2. Ejecutar escenarios de test
  for (let i = 0; i < testScenarios.length; i++) {
    const scenario = testScenarios[i];

    console.log(`\n\n📋 ESCENARIO ${i + 1}: ${scenario.name}`);
    console.log(`   ${scenario.description}`);
    console.log(`   Búsquedas esperadas: ${scenario.expectedSearches}`);

    await simulateAgenticSearch(selectedChatbot.id, scenario.query);
  }

  // 3. Recomendaciones para testing manual
  console.log('\n\n─'.repeat(80));
  console.log('\n💡 TESTING MANUAL RECOMENDADO:\n');
  console.log('Para verificar COMPORTAMIENTO AGÉNTICO real (no solo búsquedas simples):');
  console.log('');
  console.log('1. Abre tu chatbot en el dashboard');
  console.log('2. Prueba estas preguntas complejas:');
  console.log('   - "Compara todos tus planes y dime cuál recomiendas"');
  console.log('   - "¿Qué incluye cada plan y cuánto cuestan?"');
  console.log('   - "Dame info completa sobre precios, formas de pago y garantías"');
  console.log('');
  console.log('3. Verifica en los logs del servidor:');
  console.log('   - Que ejecute MÚLTIPLES llamadas a search_context');
  console.log('   - Que combine resultados coherentemente');
  console.log('   - Que cite fuentes cuando usa documentos');
  console.log('');
  console.log('4. Señales de RAG agéntico funcionando:');
  console.log('   ✅ Ejecuta 2+ búsquedas para preguntas complejas');
  console.log('   ✅ Ajusta queries si primera búsqueda no es suficiente');
  console.log('   ✅ Cita fuentes: "Según [archivo]..." o "De acuerdo a..."');
  console.log('   ✅ Dice "no encontré" si búsqueda falla (no adivina)');
  console.log('');
  console.log('❌ Señales de RAG pasivo (problema):');
  console.log('   ❌ Solo 1 búsqueda para preguntas multi-tema');
  console.log('   ❌ Responde sin buscar cuando debería');
  console.log('   ❌ Adivina precios/datos en vez de buscarlos');
  console.log('');
  console.log('📊 Monitoreo en producción:');
  console.log('   Revisa tabla ToolUsage para ver estadísticas de uso de search_context');
  console.log('   Queries frecuentes: SELECT data FROM ToolUsage WHERE toolName="search_context"');
  console.log('');
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
