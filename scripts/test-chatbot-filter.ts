/**
 * Test: Verificar que vector search filtra correctamente por chatbotId
 */

import { db } from '../app/utils/db.server';
import { vectorSearch } from '../server/vector/vector-search.service';

async function main() {
  // Buscar el chatbot "Mi Asistente Demo"
  const miAsistente = await db.chatbot.findFirst({
    where: {
      name: { contains: 'Mi Asistente', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      userId: true
    }
  });

  if (!miAsistente) {
    console.log('❌ No se encontró "Mi Asistente Demo"');
    return;
  }

  console.log('\n🤖 Chatbot:', miAsistente.name);
  console.log('   ID:', miAsistente.id);

  // Query de prueba
  const query = 'precios';
  console.log(`\n🔍 Buscando: "${query}"`);
  console.log(`   Filtrando por chatbotId: ${miAsistente.id}`);

  // Realizar búsqueda vectorial
  const results = await vectorSearch(query, miAsistente.id, 5);

  console.log(`\n📊 Resultados: ${results.length}`);

  // Verificar que TODOS los resultados pertenecen al chatbot correcto
  const incorrectChatbot = results.filter(r => r.chatbotId !== miAsistente.id);

  if (incorrectChatbot.length > 0) {
    console.log(`\n❌ ERROR: ${incorrectChatbot.length}/${results.length} resultados pertenecen a OTRO chatbot!`);
    incorrectChatbot.forEach((r, i) => {
      console.log(`\n  Resultado ${i + 1}:`);
      console.log(`    ChatbotId incorrecto: ${r.chatbotId}`);
      console.log(`    Esperado: ${miAsistente.id}`);
      console.log(`    Contenido: ${r.content.substring(0, 80)}...`);
    });

    // Buscar información del chatbot incorrecto
    for (const wrong of incorrectChatbot) {
      const wrongChatbot = await db.chatbot.findUnique({
        where: { id: wrong.chatbotId },
        select: { name: true, userId: true }
      });
      if (wrongChatbot) {
        console.log(`\n  ℹ️  El resultado pertenece a: "${wrongChatbot.name}"`);
      }
    }
  } else {
    console.log(`\n✅ CORRECTO: Todos los resultados pertenecen al chatbot "${miAsistente.name}"`);
  }

  // Mostrar detalles de los resultados
  console.log(`\n📝 Detalles de resultados:\n`);
  results.forEach((r, i) => {
    console.log(`${i + 1}. Score: ${(r.score * 100).toFixed(0)}%`);
    console.log(`   Type: ${r.metadata.contextType || 'undefined'}`);
    console.log(`   Title: ${r.metadata.title || 'undefined'}`);
    console.log(`   FileName: ${r.metadata.fileName || 'undefined'}`);
    console.log(`   ChatbotId: ${r.chatbotId}`);
    console.log(`   Match: ${r.chatbotId === miAsistente.id ? '✅' : '❌ INCORRECTO'}`);
    console.log('');
  });
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
