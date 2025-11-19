/**
 * Script para limpiar todos los contextos y embeddings de un chatbot específico
 *
 * Uso: npx tsx scripts/clean-chatbot-contexts.ts <chatbot-slug>
 * Ejemplo: npx tsx scripts/clean-chatbot-contexts.ts mi-chatbot-IF3R5V
 */

import { db } from '~/utils/db.server';

async function cleanChatbotContexts(chatbotSlug: string) {
  console.log(`🧹 Iniciando limpieza de contextos y embeddings para: ${chatbotSlug}`);
  console.log('━'.repeat(80));

  try {
    // 1. Buscar chatbot por slug
    console.log(`\n🔍 Buscando chatbot "${chatbotSlug}"...`);
    const chatbot = await db.chatbot.findUnique({
      where: { slug: chatbotSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        contexts: true,
        contextSizeKB: true,
        _count: {
          select: {
            embeddings: true
          }
        }
      }
    });

    if (!chatbot) {
      console.error(`❌ Error: Chatbot "${chatbotSlug}" no encontrado`);
      process.exit(1);
    }

    console.log(`✅ Chatbot encontrado:`);
    console.log(`   - ID: ${chatbot.id}`);
    console.log(`   - Nombre: ${chatbot.name}`);
    console.log(`   - Contextos: ${Array.isArray(chatbot.contexts) ? chatbot.contexts.length : 0}`);
    console.log(`   - Embeddings: ${chatbot._count.embeddings}`);
    console.log(`   - Tamaño total: ${chatbot.contextSizeKB} KB`);

    // 2. Confirmar limpieza
    console.log(`\n⚠️  ADVERTENCIA: Esta operación eliminará TODOS los contextos y embeddings de este chatbot.`);
    console.log(`   Esta acción NO se puede deshacer.`);

    // En ambiente no interactivo, continuar automáticamente
    const totalContexts = Array.isArray(chatbot.contexts) ? chatbot.contexts.length : 0;
    const totalEmbeddings = chatbot._count.embeddings;

    if (totalContexts === 0 && totalEmbeddings === 0) {
      console.log(`\n✨ El chatbot ya está limpio (sin contextos ni embeddings)`);
      process.exit(0);
    }

    // 3. Eliminar embeddings
    console.log(`\n🗑️  Eliminando ${totalEmbeddings} embeddings...`);
    const embeddingsDeleted = await db.embedding.deleteMany({
      where: {
        chatbotId: chatbot.id
      }
    });
    console.log(`✅ Embeddings eliminados: ${embeddingsDeleted.count}`);

    // 4. Limpiar contextos del chatbot
    console.log(`\n🧹 Limpiando ${totalContexts} contextos...`);
    const updated = await db.chatbot.update({
      where: { id: chatbot.id },
      data: {
        contexts: [],
        contextSizeKB: 0
      }
    });
    console.log(`✅ Contextos limpiados`);

    // 5. Verificar limpieza
    console.log(`\n🔍 Verificando limpieza...`);
    const verification = await db.chatbot.findUnique({
      where: { id: chatbot.id },
      select: {
        contexts: true,
        contextSizeKB: true,
        _count: {
          select: {
            embeddings: true
          }
        }
      }
    });

    if (verification) {
      const contextsRemaining = Array.isArray(verification.contexts) ? verification.contexts.length : 0;
      console.log(`   - Contextos restantes: ${contextsRemaining}`);
      console.log(`   - Embeddings restantes: ${verification._count.embeddings}`);
      console.log(`   - Tamaño: ${verification.contextSizeKB} KB`);

      if (contextsRemaining === 0 && verification._count.embeddings === 0) {
        console.log(`\n✨ Limpieza completada exitosamente`);
      } else {
        console.log(`\n⚠️  Advertencia: Aún quedan datos sin limpiar`);
      }
    }

    console.log('\n' + '━'.repeat(80));
    console.log('✅ Proceso completado');

  } catch (error) {
    console.error(`\n❌ Error durante la limpieza:`, error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Ejecutar script
const chatbotSlug = process.argv[2];

if (!chatbotSlug) {
  console.error('❌ Error: Debes proporcionar el slug del chatbot');
  console.log('Uso: npx tsx scripts/clean-chatbot-contexts.ts <chatbot-slug>');
  console.log('Ejemplo: npx tsx scripts/clean-chatbot-contexts.ts mi-chatbot-IF3R5V');
  process.exit(1);
}

cleanChatbotContexts(chatbotSlug)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
