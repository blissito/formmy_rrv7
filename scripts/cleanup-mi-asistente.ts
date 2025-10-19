/**
 * Limpiar contextos incorrectos de "Mi Asistente Demo"
 * Solo debe tener:
 * - https://beta.formmy.app (LINK)
 * - Axolotl-en-Final-de-juego-Julio-Cortázar1.pdf (FILE)
 */

import { db } from '../app/utils/db.server';

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

  console.log('\n🧹 Limpiando contextos de "Mi Asistente Demo"...\n');

  // Obtener todos los contextos actuales
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      contexts: true
    }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  console.log(`📋 Chatbot: "${chatbot.name}"`);
  console.log(`   Contextos actuales: ${chatbot.contexts.length}\n`);

  // Identificar contextos a mantener y eliminar
  const toKeep: any[] = [];
  const toDelete: any[] = [];

  chatbot.contexts.forEach((ctx: any) => {
    const isAxolotl = ctx.type === 'FILE' &&
                      ctx.fileName?.includes('Axolotl');
    const isFormmy = ctx.type === 'LINK' &&
                     ctx.url?.includes('beta.formmy.app');

    if (isAxolotl || isFormmy) {
      toKeep.push(ctx);
      console.log(`✅ MANTENER: ${ctx.fileName || ctx.url || ctx.title} (${ctx.type})`);
    } else {
      toDelete.push(ctx);
      console.log(`❌ ELIMINAR: ${ctx.title || ctx.fileName || ctx.url} (${ctx.type})`);
    }
  });

  console.log(`\n📊 Resumen:`);
  console.log(`   Mantener: ${toKeep.length}`);
  console.log(`   Eliminar: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log('\n✅ No hay contextos para eliminar');
    return;
  }

  // Confirmar eliminación
  console.log(`\n⚠️  Se eliminarán ${toDelete.length} contextos y sus embeddings asociados`);
  console.log('   Contextos a eliminar:');
  toDelete.forEach(ctx => {
    console.log(`   - ${ctx.title || ctx.fileName || ctx.url} (ID: ${ctx.id})`);
  });

  // Eliminar contextos
  console.log('\n🗑️  Eliminando contextos...');

  for (const ctx of toDelete) {
    // Primero obtener embeddings asociados
    const embeddings = await db.embedding.findMany({
      where: {
        chatbotId
      }
    });

    // Filtrar los que tienen este contextId en metadata
    const toDeleteEmbeddings = embeddings.filter((e: any) =>
      e.metadata?.contextId === ctx.id
    );

    // Eliminar embeddings asociados
    if (toDeleteEmbeddings.length > 0) {
      await db.embedding.deleteMany({
        where: {
          id: {
            in: toDeleteEmbeddings.map((e: any) => e.id)
          }
        }
      });
    }

    console.log(`   - ${ctx.title || ctx.fileName || ctx.url}: ${toDeleteEmbeddings.length} embeddings eliminados`);

    // Luego eliminar el contexto
    await db.context.delete({
      where: { id: ctx.id }
    });
  }

  console.log('\n✅ Limpieza completada');

  // Verificar resultado final
  const updatedChatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      contexts: true
    }
  });

  const embeddings = await db.embedding.count({
    where: { chatbotId }
  });

  console.log(`\n📊 Estado final:`);
  console.log(`   Contextos: ${updatedChatbot?.contexts.length}`);
  console.log(`   Embeddings: ${embeddings}`);

  if (updatedChatbot?.contexts) {
    console.log('\n📝 Contextos finales:');
    updatedChatbot.contexts.forEach((ctx: any) => {
      console.log(`   ✅ ${ctx.fileName || ctx.url || ctx.title} (${ctx.type})`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
