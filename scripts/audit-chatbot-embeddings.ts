/**
 * Auditoría de Embeddings por Chatbot
 * Identifica chatbots PRO/ENTERPRISE/TRIAL con contextos sin vectorizar
 */

import { db } from '../app/utils/db.server';

interface ChatbotAudit {
  chatbotId: string;
  chatbotName: string;
  plan: string;
  totalContexts: number;
  totalEmbeddings: number;
  orphanContexts: number;
  contextIds: string[];
  embeddedContextIds: string[];
}

async function main() {
  console.log('\n📊 AUDITORÍA DE EMBEDDINGS POR CHATBOT\n');
  console.log('Buscando chatbots PRO/ENTERPRISE/TRIAL con contextos...\n');

  // 1. Obtener chatbots de usuarios PRO+ (activos e inactivos)
  const chatbots = await db.chatbot.findMany({
    where: {
      user: {
        plan: {
          in: ['PRO', 'ENTERPRISE', 'TRIAL']
        }
      }
      // NO filtrar por isActive - incluir todos
    },
    select: {
      id: true,
      name: true,
      slug: true,
      contexts: true,
      user: {
        select: {
          plan: true,
          email: true
        }
      }
    }
  });

  console.log(`✅ Encontrados ${chatbots.length} chatbots (activos + inactivos) en planes PRO+\n`);

  if (chatbots.length === 0) {
    console.log('⚠️  No hay chatbots que auditar. Todos son FREE/STARTER o están inactivos.\n');
    return;
  }

  const audits: ChatbotAudit[] = [];

  // 2. Para cada chatbot, verificar embeddings
  for (const chatbot of chatbots) {
    const totalContexts = chatbot.contexts.length;

    // Obtener embeddings de este chatbot
    const embeddings = await db.embedding.findMany({
      where: { chatbotId: chatbot.id },
      select: {
        metadata: true
      }
    });

    // Extraer contextIds que YA tienen embeddings
    const embeddedContextIds = new Set<string>();
    embeddings.forEach((emb: any) => {
      if (emb.metadata?.contextId) {
        embeddedContextIds.add(emb.metadata.contextId);
      }
    });

    // Contextos que NO tienen embeddings (huérfanos)
    const contextIds = chatbot.contexts.map((ctx: any) => ctx.id);
    const orphanContexts = contextIds.filter((id: string) => !embeddedContextIds.has(id));

    audits.push({
      chatbotId: chatbot.id,
      chatbotName: chatbot.name,
      plan: chatbot.user.plan,
      totalContexts,
      totalEmbeddings: embeddings.length,
      orphanContexts: orphanContexts.length,
      contextIds,
      embeddedContextIds: Array.from(embeddedContextIds)
    });
  }

  // 3. Mostrar tabla resumen
  console.log('┌─────────────────────────────────────────┬──────┬──────────┬────────────┬─────────────┐');
  console.log('│ Chatbot                                 │ Plan │ Contexts │ Embeddings │ Pendientes  │');
  console.log('├─────────────────────────────────────────┼──────┼──────────┼────────────┼─────────────┤');

  audits.forEach(audit => {
    const status = audit.orphanContexts === 0 ? '✅' : '⚠️';
    const nameShort = audit.chatbotName.substring(0, 35).padEnd(37);
    const planShort = audit.plan.padEnd(4);
    const contextsStr = String(audit.totalContexts).padEnd(8);
    const embeddingsStr = String(audit.totalEmbeddings).padEnd(10);
    const orphansStr = `${audit.orphanContexts} ${status}`.padEnd(11);

    console.log(`│ ${nameShort} │ ${planShort} │ ${contextsStr} │ ${embeddingsStr} │ ${orphansStr} │`);
  });

  console.log('└─────────────────────────────────────────┴──────┴──────────┴────────────┴─────────────┘\n');

  // 4. Resumen global
  const totalOrphans = audits.reduce((sum, a) => sum + a.orphanContexts, 0);
  const totalContextsGlobal = audits.reduce((sum, a) => sum + a.totalContexts, 0);
  const totalEmbeddingsGlobal = audits.reduce((sum, a) => sum + a.totalEmbeddings, 0);

  console.log('📈 RESUMEN GLOBAL:');
  console.log(`   Total chatbots: ${audits.length}`);
  console.log(`   Total contextos: ${totalContextsGlobal}`);
  console.log(`   Total embeddings: ${totalEmbeddingsGlobal}`);
  console.log(`   Contextos huérfanos: ${totalOrphans} ${totalOrphans > 0 ? '⚠️' : '✅'}\n`);

  // 5. Detalles de chatbots con pendientes
  const chatbotsWithOrphans = audits.filter(a => a.orphanContexts > 0);

  if (chatbotsWithOrphans.length > 0) {
    console.log('⚠️  CHATBOTS QUE REQUIEREN MIGRACIÓN:\n');

    chatbotsWithOrphans.forEach((audit, idx) => {
      console.log(`${idx + 1}. ${audit.chatbotName} (${audit.plan})`);
      console.log(`   ID: ${audit.chatbotId}`);
      console.log(`   Contextos sin vectorizar: ${audit.orphanContexts}/${audit.totalContexts}`);

      // Mostrar IDs de contextos huérfanos (primeros 3)
      const orphanIds = audit.contextIds.filter((id: string) => !audit.embeddedContextIds.includes(id));
      console.log(`   Contextos huérfanos: ${orphanIds.slice(0, 3).join(', ')}${orphanIds.length > 3 ? '...' : ''}\n`);
    });

    console.log('💡 SIGUIENTE PASO:');
    console.log('   Ejecutar migración con:');
    console.log(`   npx tsx scripts/migrate-contexts-to-embeddings.ts --all\n`);
  } else {
    console.log('🎉 ¡Todos los chatbots están completamente vectorizados!\n');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
