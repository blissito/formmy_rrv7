/**
 * Script de migración: Arreglar metadata de embeddings existentes
 * Garantiza que todos los embeddings tengan al menos fileName, title o url
 */

import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔧 === MIGRACIÓN: Arreglar metadata de embeddings ===\n');

  try {
    // 1. Obtener todos los embeddings
    const embeddings = await db.embedding.findMany({
      select: {
        id: true,
        chatbotId: true,
        metadata: true
      }
    });

    console.log(`📊 Total embeddings: ${embeddings.length}\n`);

    let fixed = 0;
    let alreadyOk = 0;

    // 2. Verificar y arreglar cada uno
    for (const emb of embeddings) {
      const meta = emb.metadata as any;

      // Verificar si necesita fix
      const hasFileName = meta?.fileName !== null && meta?.fileName !== undefined;
      const hasTitle = meta?.title !== null && meta?.title !== undefined;
      const hasUrl = meta?.url !== null && meta?.url !== undefined;

      if (hasFileName || hasTitle || hasUrl) {
        alreadyOk++;
        continue; // Ya está OK
      }

      // Necesita fix
      console.log(`🔧 Fixing embedding ${emb.id}`);
      console.log(`   Type: ${meta?.contextType || 'NO_TYPE'}`);
      console.log(`   ContextId: ${meta?.contextId || 'NO_ID'}`);

      // Intentar obtener metadata desde el contexto original
      const contextId = meta?.contextId;

      if (!contextId) {
        console.log(`   ⚠️  Sin contextId - usando fallback genérico\n`);

        // Fallback genérico según tipo
        let updatedMeta = { ...meta };

        switch (meta?.contextType) {
          case 'FILE':
            updatedMeta.fileName = 'Unnamed file';
            break;
          case 'LINK':
            updatedMeta.title = 'Unnamed link';
            break;
          case 'TEXT':
            updatedMeta.title = 'Unnamed text';
            break;
          case 'QUESTION':
            updatedMeta.title = 'Unnamed question';
            break;
          default:
            updatedMeta.title = 'Unknown source';
        }

        await db.embedding.update({
          where: { id: emb.id },
          data: { metadata: updatedMeta }
        });

        fixed++;
        continue;
      }

      // Buscar el contexto original en el chatbot
      const chatbot = await db.chatbot.findUnique({
        where: { id: emb.chatbotId },
        select: { contexts: true }
      });

      const context = chatbot?.contexts?.find((ctx: any) => ctx.id === contextId);

      if (!context) {
        console.log(`   ⚠️  Contexto ${contextId} no encontrado - usando fallback\n`);

        // Fallback genérico
        let updatedMeta = { ...meta };
        updatedMeta.title = 'Deleted source';

        await db.embedding.update({
          where: { id: emb.id },
          data: { metadata: updatedMeta }
        });

        fixed++;
        continue;
      }

      // Construir metadata correcta desde el contexto
      let updatedMeta = { ...meta };

      switch (context.type) {
        case 'FILE':
          updatedMeta.fileName = context.fileName || context.title || 'Unnamed file';
          updatedMeta.title = context.title;
          break;
        case 'LINK':
          updatedMeta.title = context.title || (context.url ? new URL(context.url).hostname : 'Unnamed link');
          updatedMeta.url = context.url;
          break;
        case 'TEXT':
          updatedMeta.title = context.title || 'Unnamed text';
          break;
        case 'QUESTION':
          updatedMeta.title = context.title || context.questions || 'Unnamed question';
          break;
      }

      console.log(`   ✅ Actualizado desde contexto`);
      console.log(`      fileName: ${updatedMeta.fileName || 'null'}`);
      console.log(`      title: ${updatedMeta.title || 'null'}`);
      console.log(`      url: ${updatedMeta.url || 'null'}\n`);

      await db.embedding.update({
        where: { id: emb.id },
        data: { metadata: updatedMeta }
      });

      fixed++;
    }

    console.log('='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60) + '\n');

    console.log(`Total embeddings: ${embeddings.length}`);
    console.log(`✅ Ya tenían metadata válida: ${alreadyOk}`);
    console.log(`🔧 Arreglados: ${fixed}\n`);

    if (fixed > 0) {
      console.log('✅ Migración completada! Todos los embeddings ahora tienen metadata válida.\n');
    } else {
      console.log('✅ No se necesitaron cambios. Todos los embeddings ya tenían metadata válida.\n');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
