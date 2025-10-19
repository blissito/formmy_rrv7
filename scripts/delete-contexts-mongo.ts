/**
 * Eliminar contextos usando MongoDB directamente
 */

import { db } from '../app/utils/db.server';

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

  const contextsToDelete = [
    'O2Uz6wiXBttjJF5g75kpi', // Información sobre Formmy
    'AGFraDWsCjuacVthpMiSf', // ¿Qué es un chatbot?
    'YJToomn4HQmu0OIK8xRTv', // ¿Cómo integro WhatsApp?
    'I90nD1uCC2ZLb52MtGNAX', // Planes y precios
    'Y_YkyALo_ccitFMdAW8Fb', // ¿Puedo personalizar mi chatbot?
    'c3cOPDu43z4UFfzVwixHz'  // Guía de inicio rápido
  ];

  console.log('\n🗑️  Eliminando 6 contextos incorrectos...\n');

  let totalEmbeddingsDeleted = 0;

  // Primero eliminar todos los embeddings asociados
  for (const contextId of contextsToDelete) {
    const embeddings = await db.embedding.findMany({
      where: { chatbotId },
      select: { id: true, metadata: true }
    });

    const toDelete = embeddings.filter((e: any) => e.metadata?.contextId === contextId);

    if (toDelete.length > 0) {
      await db.embedding.deleteMany({
        where: {
          id: { in: toDelete.map(e => e.id) }
        }
      });
      console.log(`✅ Eliminados ${toDelete.length} embeddings de contexto ${contextId.substring(0, 8)}...`);
      totalEmbeddingsDeleted += toDelete.length;
    }
  }

  console.log(`\n📊 Total embeddings eliminados: ${totalEmbeddingsDeleted}\n`);

  // Ahora usar $pull de MongoDB para remover los contextos del array
  console.log('🗑️  Eliminando contextos del chatbot...\n');

  // @ts-ignore - Usar comando raw de MongoDB
  const result = await db.chatbot.updateMany({
    where: { id: chatbotId },
    data: {
      // @ts-ignore
      $pull: {
        contexts: {
          id: { $in: contextsToDelete }
        }
      }
    }
  });

  console.log(`✅ Operación completada\n`);

  // Verificar resultado final
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { contexts: true }
  });

  const remainingEmbeddings = await db.embedding.count({
    where: { chatbotId }
  });

  console.log('📊 Estado final:');
  console.log(`   Contextos restantes: ${chatbot?.contexts.length}`);
  console.log(`   Embeddings restantes: ${remainingEmbeddings}\n`);

  if (chatbot?.contexts && chatbot.contexts.length > 0) {
    console.log('📝 Contextos que quedaron:');
    chatbot.contexts.forEach((ctx: any) => {
      console.log(`   ✅ ${ctx.fileName || ctx.url || ctx.title} (${ctx.type})`);
    });
  }

  if (chatbot?.contexts.length === 2) {
    console.log('\n✅ PERFECTO: Solo quedan los 2 contextos correctos!');
  } else {
    console.log(`\n⚠️  Quedan ${chatbot?.contexts.length} contextos (esperado: 2)`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
