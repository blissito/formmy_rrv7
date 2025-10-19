/**
 * Eliminar contextos usando la misma lógica que el UI
 */

import { db } from '../app/utils/db.server';

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d';

  const contextsToDelete = [
    'O2Uz6wiXBttjJF5g75kpi', // Información sobre Formmy
    'AGFraDWsCjuacVthpMiSf', // ¿Qué es un chatbot?
    'YJToomn4HQmu0OIK8xRTv', // ¿Cómo integro WhatsApp?
    'I90nD1uCC2ZLb52MtGNAX', // Planes y precios
    'Y_YkyALo_ccitFMdAW8Fb', // ¿Puedo personalizar mi chatbot?
    'c3cOPDu43z4UFfzVwixHz'  // Guía de inicio rápido
  ];

  console.log('\n🗑️  Eliminando 6 contextos incorrectos...\n');

  for (const contextId of contextsToDelete) {
    // Primero eliminar embeddings
    const embeddings = await db.embedding.findMany({
      where: { chatbotId }
    });

    const toDelete = embeddings.filter((e: any) => e.metadata?.contextId === contextId);

    if (toDelete.length > 0) {
      await db.embedding.deleteMany({
        where: {
          id: { in: toDelete.map(e => e.id) }
        }
      });
      console.log(`✅ Eliminados ${toDelete.length} embeddings de contexto ${contextId.substring(0, 8)}...`);
    }

    // Eliminar el contexto usando update (remove from array)
    await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        contexts: {
          deleteMany: {
            id: contextId
          }
        }
      }
    });

    console.log(`✅ Contexto ${contextId.substring(0, 8)}... eliminado del chatbot`);
  }

  console.log('\n✅ Limpieza completada\n');

  // Verificar resultado
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { contexts: true }
  });

  const remainingEmbeddings = await db.embedding.count({
    where: { chatbotId }
  });

  console.log('📊 Estado final:');
  console.log(`   Contextos: ${chatbot?.contexts.length}`);
  console.log(`   Embeddings: ${remainingEmbeddings}\n`);

  chatbot?.contexts.forEach((ctx: any) => {
    console.log(`   ✅ ${ctx.fileName || ctx.url || ctx.title}`);
  });
}

main().catch(console.error).finally(() => process.exit(0));
