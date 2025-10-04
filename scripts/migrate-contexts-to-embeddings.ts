/**
 * Migración Batch: Contextos → Embeddings
 * Vectoriza contextos de chatbots PRO/ENTERPRISE/TRIAL que no tienen embeddings
 */

import { db } from '../app/utils/db.server';
import { vectorizeContext } from '../server/vector/auto-vectorize.service';
import type { ContextItem } from '@prisma/client';

// Parsear argumentos CLI
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const migrateAll = args.includes('--all');
const chatbotIdArg = args.find(arg => arg.startsWith('--chatbotId='))?.split('=')[1];

interface MigrationResult {
  chatbotId: string;
  chatbotName: string;
  contextsMigrated: number;
  embeddingsCreated: number;
  errors: string[];
}

/**
 * Migra los contextos de un chatbot a embeddings
 */
async function migrateChatbot(chatbotId: string): Promise<MigrationResult> {
  // Obtener chatbot con contextos
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      name: true,
      contexts: true
    }
  });

  if (!chatbot) {
    throw new Error(`Chatbot ${chatbotId} no encontrado`);
  }

  // Obtener embeddings existentes
  const existingEmbeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: { metadata: true }
  });

  const embeddedContextIds = new Set<string>();
  existingEmbeddings.forEach((emb: any) => {
    if (emb.metadata?.contextId) {
      embeddedContextIds.add(emb.metadata.contextId);
    }
  });

  // Filtrar contextos que NO tienen embeddings
  const orphanContexts = chatbot.contexts.filter((ctx: any) => !embeddedContextIds.has(ctx.id));

  if (orphanContexts.length === 0) {
    return {
      chatbotId,
      chatbotName: chatbot.name,
      contextsMigrated: 0,
      embeddingsCreated: 0,
      errors: []
    };
  }

  console.log(`\n📝 Migrando ${orphanContexts.length} contextos de "${chatbot.name}"...`);

  let totalEmbeddingsCreated = 0;
  const errors: string[] = [];

  // Vectorizar cada contexto huérfano
  for (let i = 0; i < orphanContexts.length; i++) {
    const context = orphanContexts[i] as ContextItem;
    console.log(`   [${i + 1}/${orphanContexts.length}] Vectorizando: ${context.title || context.id}...`);

    if (isDryRun) {
      console.log(`   ⏭️  DRY RUN - Se crearían embeddings para este contexto`);
      continue;
    }

    try {
      const result = await vectorizeContext(chatbotId, context);

      if (result.success) {
        totalEmbeddingsCreated += result.embeddingsCreated;
        console.log(`   ✅ ${result.embeddingsCreated} embeddings creados`);
      } else {
        errors.push(`Context ${context.id}: ${result.error}`);
        console.log(`   ❌ Error: ${result.error}`);
      }
    } catch (error: any) {
      errors.push(`Context ${context.id}: ${error.message}`);
      console.log(`   ❌ Error inesperado: ${error.message}`);
    }

    // Delay para no saturar API de OpenAI (rate limits)
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return {
    chatbotId,
    chatbotName: chatbot.name,
    contextsMigrated: orphanContexts.length,
    embeddingsCreated: totalEmbeddingsCreated,
    errors
  };
}

async function main() {
  console.log('\n🚀 MIGRACIÓN DE CONTEXTOS A EMBEDDINGS\n');

  if (isDryRun) {
    console.log('⚠️  MODO DRY RUN - No se crearán embeddings reales\n');
  }

  let chatbotIds: string[] = [];

  // Determinar qué chatbots migrar
  if (chatbotIdArg) {
    console.log(`📌 Migrando chatbot específico: ${chatbotIdArg}\n`);
    chatbotIds = [chatbotIdArg];
  } else if (migrateAll) {
    console.log('📌 Migrando TODOS los chatbots PRO/ENTERPRISE/TRIAL\n');

    const chatbots = await db.chatbot.findMany({
      where: {
        user: {
          plan: {
            in: ['PRO', 'ENTERPRISE', 'TRIAL']
          }
        }
        // NO filtrar por isActive - migrar todos (activos + inactivos)
      },
      select: { id: true }
    });

    chatbotIds = chatbots.map(c => c.id);
    console.log(`✅ Encontrados ${chatbotIds.length} chatbots para migrar\n`);
  } else {
    console.log('❌ Error: Debes especificar --chatbotId=XXX o --all\n');
    console.log('Ejemplos de uso:');
    console.log('  npx tsx scripts/migrate-contexts-to-embeddings.ts --chatbotId=68a8bccb2b5f4db764eb931d');
    console.log('  npx tsx scripts/migrate-contexts-to-embeddings.ts --all --dry-run');
    console.log('  npx tsx scripts/migrate-contexts-to-embeddings.ts --all\n');
    return;
  }

  if (chatbotIds.length === 0) {
    console.log('⚠️  No hay chatbots para migrar.\n');
    return;
  }

  // Ejecutar migración
  const results: MigrationResult[] = [];

  for (let i = 0; i < chatbotIds.length; i++) {
    console.log(`\n[${i + 1}/${chatbotIds.length}] ====================================`);
    const result = await migrateChatbot(chatbotIds[i]);
    results.push(result);
  }

  // Resumen final
  console.log('\n\n📊 RESUMEN DE MIGRACIÓN\n');
  console.log('┌─────────────────────────────────────────┬──────────────┬────────────────┐');
  console.log('│ Chatbot                                 │ Contextos    │ Embeddings     │');
  console.log('├─────────────────────────────────────────┼──────────────┼────────────────┤');

  let totalContextsMigrated = 0;
  let totalEmbeddingsCreated = 0;
  let totalErrors = 0;

  results.forEach(result => {
    const nameShort = result.chatbotName.substring(0, 35).padEnd(37);
    const contextsStr = String(result.contextsMigrated).padEnd(12);
    const embeddingsStr = String(result.embeddingsCreated).padEnd(14);

    console.log(`│ ${nameShort} │ ${contextsStr} │ ${embeddingsStr} │`);

    totalContextsMigrated += result.contextsMigrated;
    totalEmbeddingsCreated += result.embeddingsCreated;
    totalErrors += result.errors.length;
  });

  console.log('└─────────────────────────────────────────┴──────────────┴────────────────┘\n');

  console.log('📈 TOTALES:');
  console.log(`   Chatbots procesados: ${results.length}`);
  console.log(`   Contextos migrados: ${totalContextsMigrated}`);
  console.log(`   Embeddings creados: ${totalEmbeddingsCreated}`);
  console.log(`   Errores: ${totalErrors} ${totalErrors > 0 ? '⚠️' : '✅'}\n`);

  if (totalErrors > 0) {
    console.log('⚠️  ERRORES DETALLADOS:\n');
    results.forEach(result => {
      if (result.errors.length > 0) {
        console.log(`${result.chatbotName}:`);
        result.errors.forEach(err => console.log(`   - ${err}`));
        console.log('');
      }
    });
  }

  if (isDryRun) {
    console.log('💡 Este fue un DRY RUN. Para ejecutar la migración real, omite --dry-run\n');
  } else {
    console.log('✅ Migración completada. Verifica con:');
    console.log('   npx tsx scripts/audit-chatbot-embeddings.ts\n');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
