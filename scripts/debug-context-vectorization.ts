/**
 * Script de Diagnóstico: Verificar Vectorización de Contextos
 *
 * Verifica:
 * 1. Qué contextos tiene un chatbot
 * 2. Cuáles han sido vectorizados
 * 3. Cuáles faltan por vectorizar
 * 4. Errores en el proceso de vectorización
 */

import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔍 === DIAGNÓSTICO DE VECTORIZACIÓN DE CONTEXTOS ===\n');

  try {
    // 0. Si no hay CHATBOT_ID, buscar el primero con contextos
    let CHATBOT_ID = process.env.TEST_CHATBOT_ID;

    if (!CHATBOT_ID) {
      console.log('🔎 Buscando chatbot con contextos...');
      const chatbotWithContexts = await db.chatbot.findFirst({
        where: {
          contexts: {
            isEmpty: false,
          },
        },
        select: { id: true, name: true },
      });

      if (chatbotWithContexts) {
        CHATBOT_ID = chatbotWithContexts.id;
        console.log(`   ✅ Usando: ${chatbotWithContexts.name} (${CHATBOT_ID})\n`);
      } else {
        console.error('❌ No se encontraron chatbots con contextos');
        process.exit(1);
      }
    }

    // 1. Obtener chatbot y usuario
    console.log(`📋 Obteniendo información del chatbot ${CHATBOT_ID}...`);
    const chatbot = await db.chatbot.findUnique({
      where: { id: CHATBOT_ID },
      select: {
        name: true,
        userId: true,
        contexts: true,
        contextSizeKB: true,
        user: {
          select: {
            email: true,
            plan: true,
          },
        },
      },
    });

    if (!chatbot) {
      console.error(`❌ Chatbot ${CHATBOT_ID} no encontrado`);
      process.exit(1);
    }

    console.log(`   ✅ Chatbot: ${chatbot.name}`);
    console.log(`   ✅ Usuario: ${chatbot.user.email} (${chatbot.user.plan})`);
    console.log(`   ✅ Contextos: ${chatbot.contexts.length}`);
    console.log(`   ✅ Tamaño total: ${chatbot.contextSizeKB} KB\n`);

    // 2. Listar todos los contextos
    console.log('📁 CONTEXTOS DEL CHATBOT:');
    console.log('─'.repeat(80));

    if (chatbot.contexts.length === 0) {
      console.log('   (Sin contextos)\n');
    } else {
      for (const ctx of chatbot.contexts) {
        const context = ctx as any;
        console.log(`\n   ID: ${context.id}`);
        console.log(`   Tipo: ${context.type}`);

        if (context.type === 'FILE') {
          console.log(`   Archivo: ${context.fileName} (${context.sizeKB} KB)`);
        } else if (context.type === 'LINK') {
          console.log(`   URL: ${context.url}`);
          console.log(`   Título: ${context.title || '(sin título)'}`);
        } else if (context.type === 'TEXT') {
          console.log(`   Título: ${context.title}`);
          console.log(`   Contenido: ${(context.content || '').substring(0, 100)}...`);
        } else if (context.type === 'QUESTION') {
          console.log(`   Título: ${context.title}`);
          console.log(`   Pregunta: ${context.questions}`);
        }

        console.log(`   Creado: ${new Date(context.createdAt).toLocaleString()}`);
      }
      console.log('\n' + '─'.repeat(80) + '\n');
    }

    // 3. Obtener embeddings del chatbot
    console.log('🧠 EMBEDDINGS VECTORIZADOS:');
    console.log('─'.repeat(80));

    const embeddings = await db.embedding.findMany({
      where: { chatbotId: CHATBOT_ID },
      select: {
        id: true,
        content: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    console.log(`   Total embeddings: ${embeddings.length}\n`);

    if (embeddings.length === 0) {
      console.log('   ⚠️  NO HAY EMBEDDINGS VECTORIZADOS\n');
    } else {
      // Agrupar por contextId
      const byContext = embeddings.reduce((acc, emb) => {
        const contextId = (emb.metadata as any)?.contextId || 'unknown';
        if (!acc[contextId]) {
          acc[contextId] = [];
        }
        acc[contextId].push(emb);
        return acc;
      }, {} as Record<string, typeof embeddings>);

      console.log('   Por contexto:');
      for (const [contextId, embs] of Object.entries(byContext)) {
        const metadata = (embs[0].metadata as any) || {};
        const source = metadata.source || '?';
        const fileName = metadata.fileName || metadata.title || 'Sin nombre';

        console.log(`\n   ├─ Context ID: ${contextId}`);
        console.log(`   │  Archivo/Título: ${fileName}`);
        console.log(`   │  Source: ${source}`);
        console.log(`   │  Chunks: ${embs.length}`);
        console.log(`   │  Último update: ${new Date(embs[0].createdAt).toLocaleString()}`);
      }
      console.log('\n' + '─'.repeat(80) + '\n');
    }

    // 4. Comparar contextos vs embeddings
    console.log('🔎 ANÁLISIS: Contextos vs Embeddings');
    console.log('─'.repeat(80));

    const contextIds = chatbot.contexts.map((ctx: any) => ctx.id);
    const vectorizedContextIds = new Set(
      embeddings.map((emb) => (emb.metadata as any)?.contextId).filter(Boolean)
    );

    console.log(`\n   Total contextos: ${contextIds.length}`);
    console.log(`   Contextos vectorizados: ${vectorizedContextIds.size}`);
    console.log(`   Contextos SIN vectorizar: ${contextIds.length - vectorizedContextIds.size}\n`);

    const missing = contextIds.filter((id) => !vectorizedContextIds.has(id));

    if (missing.length > 0) {
      console.log('   ⚠️  CONTEXTOS SIN VECTORIZAR:');
      for (const ctxId of missing) {
        const context = chatbot.contexts.find((c: any) => c.id === ctxId) as any;
        if (context) {
          console.log(`\n   ├─ ID: ${ctxId}`);
          console.log(`   │  Tipo: ${context.type}`);

          if (context.type === 'FILE') {
            console.log(`   │  Archivo: ${context.fileName}`);
          } else if (context.type === 'LINK') {
            console.log(`   │  URL: ${context.url}`);
          } else if (context.type === 'TEXT') {
            console.log(`   │  Título: ${context.title}`);
          } else if (context.type === 'QUESTION') {
            console.log(`   │  Pregunta: ${context.questions}`);
          }

          console.log(`   │  Creado: ${new Date(context.createdAt).toLocaleString()}`);
        }
      }
    } else {
      console.log('   ✅ Todos los contextos están vectorizados');
    }

    console.log('\n' + '─'.repeat(80) + '\n');

    // 5. Verificar permisos del plan
    console.log('🔐 VERIFICACIÓN DE PERMISOS:');
    console.log('─'.repeat(80));

    const allowedPlans = ['PRO', 'ENTERPRISE', 'TRIAL'];
    const hasAccess = allowedPlans.includes(chatbot.user.plan);

    console.log(`   Plan del usuario: ${chatbot.user.plan}`);
    console.log(`   Planes con acceso a RAG: ${allowedPlans.join(', ')}`);
    console.log(`   ¿Tiene acceso? ${hasAccess ? '✅ SÍ' : '❌ NO'}`);

    if (!hasAccess) {
      console.log('\n   ⚠️  PROBLEMA DETECTADO:');
      console.log('   El usuario NO tiene un plan con acceso a vectorización.');
      console.log('   Los contextos NO se vectorizarán automáticamente.\n');
    }

    console.log('\n' + '─'.repeat(80) + '\n');

    // 6. Resumen final
    console.log('📊 RESUMEN:');
    console.log(`   • Chatbot: ${chatbot.name}`);
    console.log(`   • Plan: ${chatbot.user.plan} ${hasAccess ? '(con RAG)' : '(sin RAG)'}`);
    console.log(`   • Contextos totales: ${chatbot.contexts.length}`);
    console.log(`   • Embeddings totales: ${embeddings.length}`);
    console.log(`   • Contextos sin vectorizar: ${missing.length}`);

    if (missing.length > 0 && hasAccess) {
      console.log('\n   ⚠️  ACCIÓN REQUERIDA:');
      console.log('   Hay contextos sin vectorizar. Posibles causas:');
      console.log('   1. Error silencioso en vectorizeContext()');
      console.log('   2. Contexto agregado antes de implementar auto-vectorización');
      console.log('   3. Contenido vacío o inválido');
      console.log('\n   Ejecuta: npx tsx scripts/migrate-contexts-to-embeddings.ts --chatbot ' + CHATBOT_ID);
    } else if (!hasAccess && chatbot.contexts.length > 0) {
      console.log('\n   ℹ️  INFORMACIÓN:');
      console.log('   El plan actual no incluye RAG.');
      console.log('   Upgrade a PRO, ENTERPRISE o TRIAL para habilitar vectorización.');
    } else if (missing.length === 0 && chatbot.contexts.length > 0) {
      console.log('\n   ✅ TODO EN ORDEN:');
      console.log('   Todos los contextos están vectorizados correctamente.');
    }

    console.log('\n' + '='.repeat(80) + '\n');

  } catch (error) {
    console.error('\n❌ Error durante el diagnóstico:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

main();
