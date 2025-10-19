/**
 * Eliminar contextos usando MongoDB raw
 */

import { db } from '../app/utils/db.server';

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d';

  const contextsToDelete = [
    'O2Uz6wiXBttjJF5g75kpi',
    'AGFraDWsCjuacVthpMiSf',
    'YJToomn4HQmu0OIK8xRTv',
    'I90nD1uCC2ZLb52MtGNAX',
    'Y_YkyALo_ccitFMdAW8Fb',
    'c3cOPDu43z4UFfzVwixHz'
  ];

  console.log('\n🗑️  Eliminando contextos del chatbot usando MongoDB raw...\n');

  // Obtener el chatbot actual
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: { contexts: true }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  // Filtrar los contextos a mantener
  const contextsToKeep = chatbot.contexts.filter((ctx: any) =>
    !contextsToDelete.includes(ctx.id)
  );

  console.log(`📊 Contextos actuales: ${chatbot.contexts.length}`);
  console.log(`   A mantener: ${contextsToKeep.length}`);
  console.log(`   A eliminar: ${chatbot.contexts.length - contextsToKeep.length}\n`);

  // Actualizar el chatbot con solo los contextos a mantener
  await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      contexts: {
        set: contextsToKeep
      }
    }
  });

  console.log('✅ Contextos eliminados del chatbot\n');

  // Verificar resultado final
  const updatedChatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    include: { contexts: true }
  });

  const remainingEmbeddings = await db.embedding.count({
    where: { chatbotId }
  });

  console.log('📊 Estado final:');
  console.log(`   Contextos: ${updatedChatbot?.contexts.length}`);
  console.log(`   Embeddings: ${remainingEmbeddings}\n`);

  if (updatedChatbot?.contexts) {
    console.log('📝 Contextos finales:');
    updatedChatbot.contexts.forEach((ctx: any) => {
      console.log(`   ✅ ${ctx.fileName || ctx.url || ctx.title} (${ctx.type})`);
    });
  }

  if (updatedChatbot?.contexts.length === 2) {
    console.log('\n✅ PERFECTO: Solo quedan los 2 contextos correctos!');
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
