/**
 * Verificar que TODOS los embeddings de un chatbot le pertenecen
 */

import { db } from '../app/utils/db.server';

async function main() {
  const chatbotId = '68f456dca443330f35f8c81d'; // Mi Asistente Demo

  console.log('\n🔍 Verificando embeddings del chatbot:', chatbotId);

  // Obtener info del chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      userId: true,
      contexts: {
        select: {
          id: true,
          title: true,
          type: true,
          fileName: true,
          url: true
        }
      }
    }
  });

  if (!chatbot) {
    console.log('❌ Chatbot no encontrado');
    return;
  }

  console.log(`\n📋 Chatbot: "${chatbot.name}"`);
  console.log(`   Contextos: ${chatbot.contexts.length}`);

  // Obtener TODOS los embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      id: true,
      chatbotId: true,
      metadata: true,
      content: true
    }
  });

  console.log(`   Embeddings: ${embeddings.length}\n`);

  // Verificar que todos tienen el chatbotId correcto
  const wrongChatbotId = embeddings.filter(e => e.chatbotId !== chatbotId);
  if (wrongChatbotId.length > 0) {
    console.log(`❌ ERROR: ${wrongChatbotId.length} embeddings con chatbotId INCORRECTO!`);
    wrongChatbotId.forEach(e => {
      console.log(`  - Embedding ${e.id}: chatbotId = ${e.chatbotId}`);
    });
  } else {
    console.log(`✅ Todos los embeddings tienen chatbotId correcto`);
  }

  // Agrupar por contextId
  const byContext = embeddings.reduce((acc, emb: any) => {
    const ctxId = emb.metadata?.contextId || 'NO_CONTEXT_ID';
    if (!acc[ctxId]) acc[ctxId] = [];
    acc[ctxId].push(emb);
    return acc;
  }, {} as Record<string, any[]>);

  console.log(`\n📊 Embeddings agrupados por contextId:\n`);

  // IDs de contextos válidos del chatbot
  const validContextIds = new Set(chatbot.contexts.map(c => c.id));

  for (const [contextId, chunks] of Object.entries(byContext)) {
    const isValid = validContextIds.has(contextId);
    const context = chatbot.contexts.find(c => c.id === contextId);

    const meta = chunks[0].metadata as any;
    const displayName = meta?.fileName || meta?.title || meta?.url || 'Unknown';

    console.log(`${isValid ? '✅' : '❌'} ${displayName}`);
    console.log(`   ContextId: ${contextId}`);
    console.log(`   Type: ${meta?.contextType}`);
    console.log(`   Chunks: ${chunks.length}`);

    if (!isValid && contextId !== 'NO_CONTEXT_ID') {
      console.log(`   ⚠️  ESTE CONTEXT NO PERTENECE AL CHATBOT!`);

      // Buscar a qué chatbot pertenece este contexto
      const realContext = await db.contextItem.findUnique({
        where: { id: contextId },
        select: {
          chatbotId: true,
          chatbot: {
            select: { name: true }
          }
        }
      });

      if (realContext) {
        console.log(`   ⚠️  Pertenece a: "${realContext.chatbot.name}" (${realContext.chatbotId})`);
      }
    }

    console.log('');
  }

  // Resumen
  const invalidEmbeddings = embeddings.filter((e: any) => {
    const ctxId = e.metadata?.contextId;
    return ctxId && !validContextIds.has(ctxId);
  });

  if (invalidEmbeddings.length > 0) {
    console.log(`\n❌ PROBLEMA DETECTADO:`);
    console.log(`   ${invalidEmbeddings.length}/${embeddings.length} embeddings tienen contextId inválido`);
    console.log(`\n💡 Solución: Ejecutar cleanup para eliminar estos embeddings huérfanos`);
  } else {
    console.log(`\n✅ Todos los embeddings tienen contextId válido`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
