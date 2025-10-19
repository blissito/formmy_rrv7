/**
 * 🔍 Auditoría Completa del Sistema de Embeddings
 *
 * Verifica:
 * 1. Documentos sin embeddings (huérfanos)
 * 2. Embeddings sin documentos (referencias rotas)
 * 3. ParsingJobs COMPLETED sin embeddings
 * 4. Contexts sin embeddings
 * 5. Integridad de metadata
 */

import { db } from "~/utils/db.server";

interface AuditResult {
  chatbotId: string;
  chatbotName: string;
  issues: AuditIssue[];
  stats: {
    totalEmbeddings: number;
    totalContexts: number;
    totalParsingJobs: number;
    orphanedEmbeddings: number;
    documentsWithoutEmbeddings: number;
  };
}

interface AuditIssue {
  severity: 'critical' | 'warning' | 'info';
  type: string;
  description: string;
  details: any;
}

async function auditChatbot(chatbotId: string): Promise<AuditResult> {
  const issues: AuditIssue[] = [];

  // Obtener chatbot
  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      name: true,
      contexts: true,
      user: {
        select: { plan: true }
      }
    }
  });

  if (!chatbot) {
    throw new Error(`Chatbot ${chatbotId} not found`);
  }

  console.log(`\n📊 Auditando: ${chatbot.name} (${chatbotId})`);
  console.log(`Plan: ${chatbot.user.plan}`);

  // 1. Obtener todos los embeddings
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      id: true,
      metadata: true,
      content: true
    }
  });

  console.log(`📦 Embeddings encontrados: ${embeddings.length}`);

  // 2. Obtener todos los ParsingJobs COMPLETED
  const parsingJobs = await db.parsingJob.findMany({
    where: {
      chatbotId,
      status: { in: ['COMPLETED', 'COMPLETED_NO_VECTOR'] }
    },
    select: {
      id: true,
      fileName: true,
      status: true,
      pages: true,
      createdAt: true
    }
  });

  console.log(`📄 ParsingJobs completados: ${parsingJobs.length}`);

  // 3. Crear set de IDs válidos
  const validContextIds = new Set([
    ...chatbot.contexts.map((ctx: any) => ctx.id),
    ...parsingJobs.map(job => job.id)
  ]);

  console.log(`✅ Contextos válidos: ${validContextIds.size}`);

  // 4. AUDITORÍA 1: Embeddings huérfanos (sin contexto válido)
  const orphanedEmbeddings = embeddings.filter(emb => {
    const contextId = (emb.metadata as any)?.contextId;
    return contextId && !validContextIds.has(contextId);
  });

  if (orphanedEmbeddings.length > 0) {
    issues.push({
      severity: 'warning',
      type: 'orphaned_embeddings',
      description: `${orphanedEmbeddings.length} embeddings sin contexto válido`,
      details: orphanedEmbeddings.map(e => ({
        id: e.id,
        contextId: (e.metadata as any)?.contextId,
        fileName: (e.metadata as any)?.fileName,
        preview: e.content.slice(0, 50)
      }))
    });
  }

  // 5. AUDITORÍA 2: ParsingJobs sin embeddings
  const jobsWithoutEmbeddings = parsingJobs.filter(job => {
    const hasEmbeddings = embeddings.some(
      emb => (emb.metadata as any)?.contextId === job.id
    );
    return !hasEmbeddings && job.status === 'COMPLETED';
  });

  if (jobsWithoutEmbeddings.length > 0) {
    issues.push({
      severity: 'critical',
      type: 'parsing_jobs_without_embeddings',
      description: `${jobsWithoutEmbeddings.length} ParsingJobs COMPLETED sin embeddings`,
      details: jobsWithoutEmbeddings.map(job => ({
        id: job.id,
        fileName: job.fileName,
        pages: job.pages,
        createdAt: job.createdAt
      }))
    });
  }

  // 6. AUDITORÍA 3: Contexts sin embeddings (excluyendo FREE/STARTER)
  if (['PRO', 'ENTERPRISE', 'TRIAL'].includes(chatbot.user.plan)) {
    const contextsWithoutEmbeddings = chatbot.contexts.filter((ctx: any) => {
      const hasEmbeddings = embeddings.some(
        emb => (emb.metadata as any)?.contextId === ctx.id
      );
      return !hasEmbeddings;
    });

    if (contextsWithoutEmbeddings.length > 0) {
      issues.push({
        severity: 'warning',
        type: 'contexts_without_embeddings',
        description: `${contextsWithoutEmbeddings.length} contextos sin embeddings`,
        details: contextsWithoutEmbeddings.map((ctx: any) => ({
          id: ctx.id,
          type: ctx.type,
          fileName: ctx.fileName,
          title: ctx.title
        }))
      });
    }
  }

  // 7. AUDITORÍA 4: Metadata inconsistente
  const invalidMetadata = embeddings.filter(emb => {
    const meta = emb.metadata as any;
    return !meta || (!meta.fileName && !meta.title && !meta.url);
  });

  if (invalidMetadata.length > 0) {
    issues.push({
      severity: 'warning',
      type: 'invalid_metadata',
      description: `${invalidMetadata.length} embeddings con metadata incompleta`,
      details: invalidMetadata.slice(0, 5).map(e => ({
        id: e.id,
        metadata: e.metadata,
        preview: e.content.slice(0, 30)
      }))
    });
  }

  // 8. AUDITORÍA 5: ParsingJobs COMPLETED_NO_VECTOR
  const jobsNoVector = parsingJobs.filter(job => job.status === 'COMPLETED_NO_VECTOR');

  if (jobsNoVector.length > 0) {
    issues.push({
      severity: 'info',
      type: 'completed_no_vector',
      description: `${jobsNoVector.length} documentos parseados pero sin vectorizar`,
      details: jobsNoVector.map(job => ({
        id: job.id,
        fileName: job.fileName,
        suggestion: 'Puede reintentar vectorización manualmente'
      }))
    });
  }

  return {
    chatbotId,
    chatbotName: chatbot.name,
    issues,
    stats: {
      totalEmbeddings: embeddings.length,
      totalContexts: chatbot.contexts.length,
      totalParsingJobs: parsingJobs.length,
      orphanedEmbeddings: orphanedEmbeddings.length,
      documentsWithoutEmbeddings: jobsWithoutEmbeddings.length +
        (chatbot.contexts.filter((ctx: any) => {
          return !embeddings.some(emb => (emb.metadata as any)?.contextId === ctx.id);
        }).length)
    }
  };
}

async function main() {
  console.log('🔍 AUDITORÍA COMPLETA DEL SISTEMA DE EMBEDDINGS\n');
  console.log('='.repeat(60));

  // Obtener todos los chatbots con documentos
  const chatbots = await db.chatbot.findMany({
    where: {
      OR: [
        { contexts: { isEmpty: false } },
      ]
    },
    select: {
      id: true,
      name: true
    }
  });

  // También verificar chatbots con ParsingJobs
  const chatbotsWithJobs = await db.parsingJob.groupBy({
    by: ['chatbotId'],
    _count: true
  });

  const allChatbotIds = new Set([
    ...chatbots.map(c => c.id),
    ...chatbotsWithJobs.map(c => c.chatbotId)
  ]);

  console.log(`\n📋 Chatbots a auditar: ${allChatbotIds.size}\n`);

  const results: AuditResult[] = [];

  for (const chatbotId of allChatbotIds) {
    try {
      const result = await auditChatbot(chatbotId);
      results.push(result);
    } catch (error) {
      console.error(`❌ Error auditando ${chatbotId}:`, error);
    }
  }

  // Resumen global
  console.log('\n' + '='.repeat(60));
  console.log('📊 RESUMEN GLOBAL\n');

  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const criticalIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'critical');
  const warningIssues = results.flatMap(r => r.issues).filter(i => i.severity === 'warning');

  console.log(`Total de chatbots auditados: ${results.length}`);
  console.log(`Total de issues encontrados: ${totalIssues}`);
  console.log(`  🔴 Críticos: ${criticalIssues.length}`);
  console.log(`  🟡 Warnings: ${warningIssues.length}`);
  console.log(`  🔵 Info: ${totalIssues - criticalIssues.length - warningIssues.length}`);

  // Estadísticas agregadas
  const totalStats = results.reduce((acc, r) => ({
    embeddings: acc.embeddings + r.stats.totalEmbeddings,
    contexts: acc.contexts + r.stats.totalContexts,
    parsingJobs: acc.parsingJobs + r.stats.totalParsingJobs,
    orphaned: acc.orphaned + r.stats.orphanedEmbeddings,
    withoutEmbeddings: acc.withoutEmbeddings + r.stats.documentsWithoutEmbeddings
  }), { embeddings: 0, contexts: 0, parsingJobs: 0, orphaned: 0, withoutEmbeddings: 0 });

  console.log(`\nEstadísticas globales:`);
  console.log(`  📦 Total embeddings: ${totalStats.embeddings}`);
  console.log(`  📄 Total contexts: ${totalStats.contexts}`);
  console.log(`  🔧 Total parsing jobs: ${totalStats.parsingJobs}`);
  console.log(`  ⚠️  Embeddings huérfanos: ${totalStats.orphaned}`);
  console.log(`  ❌ Documentos sin embeddings: ${totalStats.withoutEmbeddings}`);

  // Detalle de issues críticos
  if (criticalIssues.length > 0) {
    console.log('\n🔴 ISSUES CRÍTICOS (requieren atención inmediata):\n');
    criticalIssues.forEach((issue, i) => {
      const result = results.find(r => r.issues.includes(issue))!;
      console.log(`${i + 1}. ${result.chatbotName}:`);
      console.log(`   ${issue.description}`);
      console.log(`   Detalles:`, JSON.stringify(issue.details.slice(0, 2), null, 2));
      console.log();
    });
  }

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:\n');

  if (totalStats.orphaned > 0) {
    console.log(`1. Ejecutar cleanup de embeddings huérfanos:`);
    console.log(`   GET /api/rag/v1?intent=cleanup&chatbotId=xxx`);
  }

  if (totalStats.withoutEmbeddings > 0) {
    console.log(`2. Re-vectorizar documentos sin embeddings (${totalStats.withoutEmbeddings} documentos)`);
  }

  if (criticalIssues.length === 0 && warningIssues.length === 0) {
    console.log('✅ Sistema de embeddings en perfecto estado!');
  }

  console.log('\n' + '='.repeat(60));
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
