/**
 * Test script para verificar el endpoint de limpieza de embeddings
 *
 * Uso:
 * npx tsx scripts/test-embeddings-cleanup.ts <chatbotId> <apiKey>
 */

const CHATBOT_ID = process.argv[2];
const API_KEY = process.argv[3];

if (!CHATBOT_ID || !API_KEY) {
  console.error('❌ Uso: npx tsx scripts/test-embeddings-cleanup.ts <chatbotId> <apiKey>');
  process.exit(1);
}

const BASE_URL = 'https://formmy.app';

async function testCleanup() {
  console.log('🧪 Testing embeddings cleanup endpoint...\n');
  console.log(`Chatbot ID: ${CHATBOT_ID}`);
  console.log(`API Key: ${API_KEY.substring(0, 10)}...`);
  console.log('');

  try {
    // 1. Listar documentos actuales
    console.log('📋 Paso 1: Listar documentos actuales');
    const listResponse = await fetch(
      `${BASE_URL}/api/rag/v1?intent=list&chatbotId=${CHATBOT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    if (!listResponse.ok) {
      const error = await listResponse.text();
      throw new Error(`Error listing: ${listResponse.status} - ${error}`);
    }

    const listData = await listResponse.json();
    console.log(`✅ Total documentos: ${listData.total}`);
    console.log(`   Contextos: ${listData.contexts.map((c: any) => c.fileName).join(', ')}`);
    console.log('');

    // 2. Ejecutar cleanup
    console.log('🧹 Paso 2: Ejecutar cleanup de embeddings');
    const cleanupResponse = await fetch(
      `${BASE_URL}/api/rag/v1?intent=cleanup&chatbotId=${CHATBOT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    if (!cleanupResponse.ok) {
      const error = await cleanupResponse.text();
      throw new Error(`Error cleanup: ${cleanupResponse.status} - ${error}`);
    }

    const cleanupData = await cleanupResponse.json();
    console.log(`✅ Cleanup completado:`);
    console.log(`   Total embeddings: ${cleanupData.totalEmbeddings}`);
    console.log(`   Contextos válidos: ${cleanupData.validContexts}`);
    console.log(`   Huérfanos encontrados: ${cleanupData.orphanedFound}`);
    console.log(`   Huérfanos eliminados: ${cleanupData.orphanedDeleted}`);
    console.log(`   Mensaje: ${cleanupData.message}`);
    console.log('');

    // 3. Verificar estado final
    console.log('📊 Paso 3: Verificar estado final');
    const finalListResponse = await fetch(
      `${BASE_URL}/api/rag/v1?intent=list&chatbotId=${CHATBOT_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      }
    );

    const finalListData = await finalListResponse.json();
    console.log(`✅ Documentos finales: ${finalListData.total}`);
    console.log('');

    console.log('✅ Test completado exitosamente!');

    if (cleanupData.orphanedDeleted > 0) {
      console.log(`\n🎉 ¡Se eliminaron ${cleanupData.orphanedDeleted} embeddings huérfanos!`);
    } else {
      console.log('\n✨ No se encontraron embeddings huérfanos. ¡Base de datos limpia!');
    }

  } catch (error) {
    console.error('❌ Error en test:', error);
    process.exit(1);
  }
}

testCleanup();
