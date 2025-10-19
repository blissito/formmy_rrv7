/**
 * Debug script para investigar embeddings con metadata "Unknown"
 */

import { db } from '../app/utils/db.server';

async function main() {
  // Buscar el chatbot "Mi Asistente Demo"
  const chatbot = await db.chatbot.findFirst({
    where: {
      name: { contains: 'Mi Asistente', mode: 'insensitive' }
    },
    select: {
      id: true,
      name: true,
      userId: true,
      contexts: true
    }
  });

  if (!chatbot) {
    console.log('❌ No se encontró el chatbot "Mi Asistente Demo"');

    // Listar todos los chatbots disponibles
    const allChatbots = await db.chatbot.findMany({
      select: { id: true, name: true, status: true },
      take: 10
    });
    console.log('\n📋 Chatbots disponibles:');
    allChatbots.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.status})`);
    });
    return;
  }

  console.log('\n🤖 Chatbot encontrado:', {
    id: chatbot.id,
    name: chatbot.name,
    contextos: chatbot.contexts.length
  });

  // Obtener embeddings de este chatbot
  const embeddings = await db.embedding.findMany({
    where: { chatbotId: chatbot.id },
    select: {
      id: true,
      metadata: true,
      content: true
    },
    take: 20
  });

  console.log(`\n📊 Total embeddings: ${embeddings.length}`);

  if (embeddings.length === 0) {
    console.log('⚠️  No hay embeddings para este chatbot');
    return;
  }

  console.log('\n📝 Análisis de embeddings:\n');

  embeddings.forEach((emb, i) => {
    const meta = emb.metadata as any;
    const hasTitle = !!meta?.title;
    const hasFileName = !!meta?.fileName;
    const hasUrl = !!meta?.url;
    const hasAnyIdentifier = hasTitle || hasFileName || hasUrl;

    console.log(`#${i + 1}:`);
    console.log(`  ❓ Tiene identificador: ${hasAnyIdentifier ? '✅' : '❌ PROBLEMA'}`);
    console.log(`  Type: ${meta?.contextType || 'UNDEFINED'}`);
    console.log(`  Title: ${meta?.title || 'undefined'}`);
    console.log(`  FileName: ${meta?.fileName || 'undefined'}`);
    console.log(`  URL: ${meta?.url || 'undefined'}`);
    console.log(`  ContextId: ${meta?.contextId || 'undefined'}`);
    console.log(`  Content: ${emb.content.substring(0, 80).replace(/\n/g, ' ')}...`);
    console.log('');
  });

  // Contar embeddings con metadata incompleto
  const incomplete = embeddings.filter((emb: any) => {
    const meta = emb.metadata as any;
    return !meta?.fileName && !meta?.title && !meta?.url;
  });

  console.log(`\n⚠️  Embeddings con metadata incompleto (Unknown): ${incomplete.length}/${embeddings.length}`);

  if (incomplete.length > 0) {
    console.log('\n🔍 Embeddings problemáticos:');
    incomplete.forEach((emb: any, i: number) => {
      const meta = emb.metadata as any;
      console.log(`  ${i + 1}. ContextId: ${meta?.contextId}, Type: ${meta?.contextType}`);
    });
  }

  // Verificar contextos TEXT del chatbot
  const textContexts = chatbot.contexts.filter((ctx: any) => ctx.type === 'TEXT');
  console.log(`\n📝 Contextos TEXT del chatbot: ${textContexts.length}`);
  textContexts.forEach((ctx: any, i: number) => {
    console.log(`  ${i + 1}. "${ctx.title || 'Sin título'}" (id: ${ctx.id.substring(0, 8)}...)`);
  });

  // Verificar si hay contextos TEXT sin título
  const textContextsNoTitle = textContexts.filter((ctx: any) => !ctx.title);
  if (textContextsNoTitle.length > 0) {
    console.log(`\n⚠️  Contextos TEXT sin título: ${textContextsNoTitle.length}`);
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
