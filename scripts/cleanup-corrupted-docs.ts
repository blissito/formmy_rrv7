/**
 * Script para encontrar y limpiar documentos corruptos en toda la DB
 *
 * Busca contextos con:
 * - Content que contiene "[ERROR:"
 * - Content vacío o muy pequeño
 * - Embeddings faltantes
 */

import { db } from '~/utils/db.server';
import { ObjectId } from 'mongodb';

interface CorruptedContext {
  chatbotId: string;
  chatbotName: string;
  contextId: string;
  fileName?: string;
  type: string;
  reason: string;
  embeddingsCount: number;
}

async function findCorruptedDocuments(): Promise<CorruptedContext[]> {
  console.log('\n🔍 Buscando documentos corruptos en toda la base de datos...\n');

  const allChatbots = await db.chatbot.findMany({
    select: {
      id: true,
      name: true,
      contexts: true,
      _count: {
        select: {
          embeddings: true
        }
      }
    }
  });

  const corrupted: CorruptedContext[] = [];

  for (const chatbot of allChatbots) {
    if (!chatbot.contexts || chatbot.contexts.length === 0) {
      continue;
    }

    console.log(`\n📚 Analizando chatbot: ${chatbot.name} (${chatbot.id})`);
    console.log(`   Contextos: ${chatbot.contexts.length}`);
    console.log(`   Embeddings: ${chatbot._count.embeddings}`);

    for (const ctx of chatbot.contexts as any[]) {
      const issues: string[] = [];

      // 1. Check for ERROR in content
      if (ctx.content && ctx.content.includes('[ERROR:')) {
        issues.push('ERROR en contenido');
      }

      // 2. Check for empty or very small content
      if (!ctx.content || ctx.content.trim().length < 10) {
        issues.push('Contenido vacío o muy pequeño');
      }

      // 3. Check for embeddings
      // Use findMany since count doesn't work well with JSON path queries
      const embeddings = await db.embedding.findMany({
        where: {
          chatbotId: chatbot.id
        },
        select: {
          metadata: true
        }
      });

      const embeddingsCount = embeddings.filter((emb: any) =>
        emb.metadata?.contextId === ctx.id
      ).length;

      if (embeddingsCount === 0 && ctx.content && !ctx.content.includes('[ERROR:')) {
        issues.push('Sin embeddings (pero con contenido válido)');
      }

      if (issues.length > 0) {
        corrupted.push({
          chatbotId: chatbot.id,
          chatbotName: chatbot.name,
          contextId: ctx.id,
          fileName: ctx.fileName || ctx.title || ctx.url || 'Sin nombre',
          type: ctx.type,
          reason: issues.join(', '),
          embeddingsCount
        });
      }
    }
  }

  return corrupted;
}

async function cleanupCorruptedDocuments(corrupted: CorruptedContext[], dryRun: boolean = true) {
  if (corrupted.length === 0) {
    console.log('\n✅ No se encontraron documentos corruptos para limpiar');
    return;
  }

  console.log(`\n🧹 ${dryRun ? '[DRY RUN]' : '[EJECUTANDO]'} Limpieza de ${corrupted.length} documentos corruptos...\n`);

  let cleaned = 0;
  let failed = 0;

  for (const doc of corrupted) {
    console.log(`\n${dryRun ? '🔍' : '🗑️ '} ${doc.chatbotName} - ${doc.fileName}`);
    console.log(`   Tipo: ${doc.type}`);
    console.log(`   Razón: ${doc.reason}`);
    console.log(`   Embeddings: ${doc.embeddingsCount}`);

    if (!dryRun) {
      try {
        // 1. Eliminar embeddings asociados
        if (doc.embeddingsCount > 0) {
          await db.embedding.deleteMany({
            where: {
              chatbotId: doc.chatbotId,
              metadata: {
                path: ['contextId'],
                equals: doc.contextId
              }
            }
          });
          console.log(`   ✅ ${doc.embeddingsCount} embeddings eliminados`);
        }

        // 2. Eliminar contexto del array usando MongoDB raw command
        const { ObjectId } = await import('mongodb');
        await db.$runCommandRaw({
          update: 'Chatbot',
          updates: [
            {
              q: { _id: new ObjectId(doc.chatbotId) },
              u: {
                $pull: {
                  contexts: { id: doc.contextId }
                }
              }
            }
          ]
        });

        console.log(`   ✅ Contexto eliminado`);
        cleaned++;
      } catch (error) {
        console.error(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failed++;
      }
    } else {
      console.log(`   ℹ️  [DRY RUN] Se eliminaría este documento`);
    }
  }

  if (!dryRun) {
    console.log(`\n📊 Resumen:`);
    console.log(`   ✅ Limpiados: ${cleaned}`);
    console.log(`   ❌ Fallidos: ${failed}`);
    console.log(`   📝 Total: ${corrupted.length}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  const dryRun = !execute;

  console.log('\n' + '='.repeat(80));
  console.log('🧹 CLEANUP DE DOCUMENTOS CORRUPTOS');
  console.log('='.repeat(80));

  if (dryRun) {
    console.log('\n⚠️  MODO DRY RUN - No se realizarán cambios');
    console.log('   Para ejecutar la limpieza, usa: npm run cleanup-corrupted -- --execute\n');
  } else {
    console.log('\n⚠️  MODO EJECUCIÓN - Se eliminarán documentos corruptos');
    console.log('   Esperando 3 segundos...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // 1. Encontrar documentos corruptos
  const corrupted = await findCorruptedDocuments();

  // 2. Mostrar reporte
  console.log('\n' + '='.repeat(80));
  console.log('📊 REPORTE DE DOCUMENTOS CORRUPTOS');
  console.log('='.repeat(80));
  console.log(`\nTotal encontrados: ${corrupted.length}\n`);

  if (corrupted.length > 0) {
    // Agrupar por chatbot
    const byChatbot = corrupted.reduce((acc, doc) => {
      if (!acc[doc.chatbotName]) {
        acc[doc.chatbotName] = [];
      }
      acc[doc.chatbotName].push(doc);
      return acc;
    }, {} as Record<string, CorruptedContext[]>);

    for (const [chatbotName, docs] of Object.entries(byChatbot)) {
      console.log(`📚 ${chatbotName}: ${docs.length} documentos corruptos`);
      docs.forEach(doc => {
        console.log(`   - ${doc.fileName} (${doc.type}): ${doc.reason}`);
      });
      console.log('');
    }

    // 3. Limpiar (dry run o ejecución)
    await cleanupCorruptedDocuments(corrupted, dryRun);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Proceso completado');
  console.log('='.repeat(80) + '\n');

  process.exit(0);
}

main().catch((error) => {
  console.error('\n❌ Error fatal:', error);
  process.exit(1);
});
