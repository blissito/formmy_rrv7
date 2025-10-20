/**
 * Test RAG API v1 - Endpoints públicos
 *
 * Prueba los 3 endpoints:
 * - GET /api/v1/rag?intent=list
 * - POST /api/v1/rag?intent=upload
 * - POST /api/v1/rag?intent=query
 */

import { FormmyRAG } from '../sdk/formmy-rag';

const API_KEY = process.env.FORMMY_TEST_API_KEY || 'sk_live_xxxxx';
const BASE_URL = process.env.FORMMY_BASE_URL || 'http://localhost:5173';

async function main() {
  console.log('\n🧪 TEST RAG API v1\n');
  console.log(`API Key: ${API_KEY.substring(0, 15)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('─'.repeat(80));

  const rag = new FormmyRAG({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
  });

  try {
    // 1. Listar contextos existentes
    console.log('\n📋 TEST 1: Listar contextos');
    const listResponse = await rag.list();
    console.log(`✅ Chatbot: ${listResponse.chatbotName} (${listResponse.chatbotId})`);
    console.log(`   Total contextos: ${listResponse.totalContexts}`);
    console.log(`   Total embeddings: ${listResponse.totalEmbeddings}`);
    console.log(`   Tamaño total: ${listResponse.totalSizeKB} KB`);

    if (listResponse.contexts.length > 0) {
      console.log('\n   Primeros 3 contextos:');
      listResponse.contexts.slice(0, 3).forEach((ctx, idx) => {
        const name = ctx.fileName || ctx.title || ctx.url || 'Unnamed';
        console.log(`   ${idx + 1}. [${ctx.type}] ${name} (${ctx.sizeKB} KB)`);
      });
    }

    // 2. Subir nuevo contexto
    console.log('\n\n📤 TEST 2: Subir contexto de prueba');
    const uploadResponse = await rag.upload({
      content: `Formmy - Información de Prueba

Esta es información de prueba para testing del RAG API v1.

Horarios de Atención:
- Lunes a Viernes: 9:00 AM - 6:00 PM
- Sábados: 10:00 AM - 2:00 PM
- Domingos: Cerrado

Precios de Planes:
- Plan Starter: $149 MXN/mes
- Plan Pro: $499 MXN/mes
- Plan Enterprise: $1,499 MXN/mes

Contacto:
- Email: soporte@formmy.app
- Teléfono: +52 55 1234 5678
`,
      type: 'TEXT',
      metadata: {
        title: 'Info de Prueba - RAG API Test',
        routes: ['/test'],
      },
    });

    console.log(`✅ Contexto creado: ${uploadResponse.contextId}`);
    console.log(`   Embeddings creados: ${uploadResponse.embeddingsCreated}`);
    console.log(`   Embeddings saltados: ${uploadResponse.embeddingsSkipped}`);
    console.log(`   Créditos usados: ${uploadResponse.creditsUsed}`);

    // Esperar a que los embeddings se procesen
    console.log('\n⏳ Esperando 2 segundos para que se procesen los embeddings...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Consultar RAG con múltiples queries
    const queries = [
      '¿Cuáles son los horarios de atención?',
      '¿Cuánto cuesta el plan Pro?',
      '¿Cómo puedo contactarlos?',
      '¿Abren los domingos?',
    ];

    console.log('\n\n🔍 TEST 3: Consultar RAG');

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      console.log(`\n   Query ${i + 1}: "${query}"`);

      try {
        const queryResponse = await rag.query(query, { topK: 3 });

        console.log(`   ✅ Respuesta (${queryResponse.sources.length} fuentes):`);
        console.log(`   ${queryResponse.answer.substring(0, 200)}...`);
        console.log(`   Créditos usados: ${queryResponse.creditsUsed}`);

        if (queryResponse.sources.length > 0) {
          const topSource = queryResponse.sources[0];
          const sourceName = topSource.metadata.fileName || topSource.metadata.title || 'Unknown';
          console.log(`   Top fuente: ${sourceName} (score: ${(topSource.score * 100).toFixed(1)}%)`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
      }
    }

    // 4. Helpers del SDK
    console.log('\n\n🔧 TEST 4: SDK Helpers');

    const textContexts = await rag.findByType('TEXT');
    console.log(`✅ Contextos tipo TEXT: ${textContexts.length}`);

    const specificContext = await rag.getContext(uploadResponse.contextId);
    if (specificContext) {
      console.log(`✅ Contexto recuperado: ${specificContext.title || specificContext.id}`);
    }

    // Summary
    console.log('\n\n─'.repeat(80));
    console.log('\n✅ TODOS LOS TESTS COMPLETADOS\n');
    console.log('📊 Resumen:');
    console.log(`   - Contextos totales: ${listResponse.totalContexts + 1}`);
    console.log(`   - Embeddings totales: ~${listResponse.totalEmbeddings + uploadResponse.embeddingsCreated}`);
    console.log(`   - Queries ejecutadas: ${queries.length}`);
    console.log(`   - Créditos consumidos: ${uploadResponse.creditsUsed + (queries.length * 2)}`);
    console.log('');

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error);

    if (error instanceof Error) {
      console.error(`   Mensaje: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }

    process.exit(1);
  }
}

main()
  .catch(console.error)
  .finally(() => {
    console.log('\n✨ Test finalizado\n');
    process.exit(0);
  });
