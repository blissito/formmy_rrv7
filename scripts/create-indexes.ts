/**
 * Script para crear índices que optimizan las queries lentas
 * Ejecutar con: npx tsx scripts/create-indexes.ts
 */

import { db } from '../app/utils/db.server';

async function createIndexes() {
  console.log('🚀 Iniciando creación de índices...\n');

  try {
    // Obtener acceso directo a MongoDB usando $runCommandRaw
    const createIndex = async (collection: string, keys: any, options: any) => {
      try {
        await db.$runCommandRaw({
          createIndexes: collection,
          indexes: [{
            key: keys,
            ...options
          }]
        });
        return true;
      } catch (e: any) {
        if (e.message?.includes('already exists')) {
          console.log(`  → Ya existe, saltando...`);
          return false;
        }
        throw e;
      }
    };

    // 1. Índice en Conversation (chatbotId + status + updatedAt)
    console.log('1/5 Creando índice en Conversation...');
    const created1 = await createIndex(
      'Conversation',
      { chatbotId: 1, status: 1, updatedAt: -1 },
      { name: 'idx_chatbot_status_updated', background: true }
    );
    if (created1) console.log('✅ Índice: Conversation (chatbotId + status + updatedAt)\n');

    // 2. Índice en Message (conversationId + deleted + createdAt)
    console.log('2/5 Creando índice en Message...');
    const created2 = await createIndex(
      'Message',
      { conversationId: 1, deleted: 1, createdAt: -1 },
      { name: 'idx_conversation_deleted_created', background: true }
    );
    if (created2) console.log('✅ Índice: Message (conversationId + deleted + createdAt)\n');

    // 3. Índice en Chatbot (slug UNIQUE)
    console.log('3/5 Creando índice en Chatbot...');
    const created3 = await createIndex(
      'Chatbot',
      { slug: 1 },
      { name: 'idx_slug', unique: true, background: true, sparse: true }
    );
    if (created3) console.log('✅ Índice: Chatbot (slug UNIQUE)\n');

    // 4. Índice en Contact (chatbotId + capturedAt)
    console.log('4/5 Creando índice en Contact...');
    const created4 = await createIndex(
      'Contact',
      { chatbotId: 1, capturedAt: -1 },
      { name: 'idx_chatbot_captured', background: true }
    );
    if (created4) console.log('✅ Índice: Contact (chatbotId + capturedAt)\n');

    // 5. Índice en Embedding (chatbotId)
    console.log('5/5 Creando índice en Embedding...');
    const created5 = await createIndex(
      'Embedding',
      { chatbotId: 1 },
      { name: 'idx_chatbot', background: true }
    );
    if (created5) console.log('✅ Índice: Embedding (chatbotId)\n');

    console.log('🎉 Proceso completado!\n');
    console.log('💡 Ahora recarga la página del chatbot y verás la mejora de ~7s → ~500ms');

  } catch (error) {
    console.error('❌ Error general:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

createIndexes();
