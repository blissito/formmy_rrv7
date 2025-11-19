/**
 * Cleanup Orphaned Embeddings Worker for Agenda.js
 *
 * Limpia embeddings huérfanos (embeddings sin contexto asociado)
 * que pueden quedar si falla la eliminación sincronizada
 *
 * Corre: Domingos a las 3:00 AM
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { db } from '~/utils/db.server';

export interface CleanupOrphanedEmbeddingsJobData {
  runDate: Date;
}

/**
 * Limpia embeddings huérfanos de la base de datos
 */
async function cleanupOrphanedEmbeddings(): Promise<{
  totalEmbeddings: number;
  orphaned: number;
  deleted: number;
  errors: number;
}> {
  try {
    console.log('[CleanupOrphanedEmbeddingsWorker] Starting cleanup...');

    // 1. Obtener todos los embeddings (en batches para no sobrecargar memoria)
    const batchSize = 1000;
    let offset = 0;
    let totalEmbeddings = 0;
    let orphaned = 0;
    let deleted = 0;
    let errors = 0;

    while (true) {
      // Obtener batch de embeddings
      const embeddings = await db.embedding.findMany({
        select: {
          id: true,
          chatbotId: true,
          metadata: true,
        },
        skip: offset,
        take: batchSize,
      });

      if (embeddings.length === 0) break; // No más embeddings

      totalEmbeddings += embeddings.length;

      // 2. Para cada embedding, verificar si existe el contexto asociado
      for (const embedding of embeddings) {
        try {
          // Extraer contextId del metadata
          const metadata = embedding.metadata as any;
          const contextId = metadata?.contextId;

          if (!contextId) {
            // Embedding sin contextId en metadata → huérfano
            console.log(
              `[CleanupOrphanedEmbeddingsWorker] Orphaned embedding (no contextId): ${embedding.id}`
            );
            orphaned++;

            // Eliminar
            await db.embedding.delete({ where: { id: embedding.id } });
            deleted++;
            continue;
          }

          // 3. Verificar si el chatbot existe
          const chatbot = await db.chatbot.findUnique({
            where: { id: embedding.chatbotId },
            select: { id: true, contexts: true },
          });

          if (!chatbot) {
            // Chatbot eliminado → embedding huérfano (esto debería manejarse por cascade, pero por si acaso)
            console.log(
              `[CleanupOrphanedEmbeddingsWorker] Orphaned embedding (chatbot deleted): ${embedding.id}`
            );
            orphaned++;

            // Eliminar
            await db.embedding.delete({ where: { id: embedding.id } });
            deleted++;
            continue;
          }

          // 4. Verificar si el contexto existe en el chatbot
          const contexts = chatbot.contexts as any[];
          const contextExists = contexts?.some((ctx: any) => ctx.id === contextId);

          if (!contextExists) {
            // Contexto eliminado → embedding huérfano
            console.log(
              `[CleanupOrphanedEmbeddingsWorker] Orphaned embedding (context deleted): ${embedding.id} for context ${contextId}`
            );
            orphaned++;

            // Eliminar
            await db.embedding.delete({ where: { id: embedding.id } });
            deleted++;
          }
        } catch (error) {
          console.error(
            `[CleanupOrphanedEmbeddingsWorker] Error processing embedding ${embedding.id}:`,
            error
          );
          errors++;
        }
      }

      offset += batchSize;

      // Log progreso cada 10 batches
      if (offset % (batchSize * 10) === 0) {
        console.log(
          `[CleanupOrphanedEmbeddingsWorker] Progress: ${offset} embeddings checked, ${orphaned} orphaned found, ${deleted} deleted`
        );
      }
    }

    console.log(
      `[CleanupOrphanedEmbeddingsWorker] Cleanup completed - Total: ${totalEmbeddings}, Orphaned: ${orphaned}, Deleted: ${deleted}, Errors: ${errors}`
    );

    return { totalEmbeddings, orphaned, deleted, errors };
  } catch (error) {
    console.error('[CleanupOrphanedEmbeddingsWorker] Job failed:', error);
    return { totalEmbeddings: 0, orphaned: 0, deleted: 0, errors: 1 };
  }
}

/**
 * Register cleanup orphaned embeddings worker with Agenda
 */
export async function registerCleanupOrphanedEmbeddingsWorker() {
  const agenda = await getAgenda();

  agenda.define<CleanupOrphanedEmbeddingsJobData>(
    'cleanup-orphaned-embeddings',
    {
      priority: 'low', // Prioridad baja para no afectar operaciones críticas
      concurrency: 1, // Solo una ejecución a la vez
    },
    async (job: Job<CleanupOrphanedEmbeddingsJobData>) => {
      const startTime = Date.now();

      try {
        console.log('[CleanupOrphanedEmbeddingsWorker] Starting orphaned embeddings cleanup...');

        const result = await cleanupOrphanedEmbeddings();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(
          `[CleanupOrphanedEmbeddingsWorker] Completed in ${duration}s - Total: ${result.totalEmbeddings}, Orphaned: ${result.orphaned}, Deleted: ${result.deleted}, Errors: ${result.errors}`
        );

        return result;
      } catch (error) {
        console.error('[CleanupOrphanedEmbeddingsWorker] Job failed:', error);
        throw error;
      }
    }
  );

  // Programar: Domingos a las 3:00 AM
  // Cron format: minute hour day month dayOfWeek
  // '0 3 * * 0' = minuto 0, hora 3, cualquier día, cualquier mes, domingo (0)
  await agenda.every('0 3 * * 0', 'cleanup-orphaned-embeddings', {
    runDate: new Date(),
  });

  console.log(
    '[CleanupOrphanedEmbeddingsWorker] Registered - Runs every Sunday at 3:00 AM'
  );
}

/**
 * Ejecutar manualmente el worker (para testing)
 */
export async function runCleanupOrphanedEmbeddingsNow(): Promise<void> {
  const agenda = await getAgenda();
  await agenda.now('cleanup-orphaned-embeddings', { runDate: new Date() });
  console.log('[CleanupOrphanedEmbeddingsWorker] Manual execution triggered');
}
