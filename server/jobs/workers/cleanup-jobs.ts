/**
 * Cleanup Jobs Worker for Agenda.js
 * Limpia automáticamente jobs antiguos de la colección agendaJobs
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';

/**
 * Register cleanup worker with Agenda
 */
export async function registerCleanupWorker() {
  const agenda = await getAgenda();

  // Define the cleanup job
  agenda.define(
    'cleanup-old-jobs',
    {
      priority: 'low',
      concurrency: 1, // Solo 1 a la vez
    },
    async (job: Job) => {
      try {
        console.log('[Cleanup] Starting cleanup of old agenda jobs...');

        // Calcular fechas límite
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Contador de eliminaciones
        let completedDeleted = 0;
        let failedDeleted = 0;

        // 1. Eliminar jobs completados (sin fallos) de hace más de 7 días
        try {
          const completedResult = await agenda.cancel({
            lastFinishedAt: { $lt: sevenDaysAgo },
            failCount: 0,
          });

          completedDeleted = completedResult;
          console.log(`  ✅ Deleted ${completedDeleted} completed jobs older than 7 days`);
        } catch (error) {
          console.error('  ❌ Error deleting completed jobs:', error);
        }

        // 2. Eliminar jobs fallidos de hace más de 30 días
        try {
          const failedResult = await agenda.cancel({
            lastFinishedAt: { $lt: thirtyDaysAgo },
            failCount: { $gt: 0 },
          });

          failedDeleted = failedResult;
          console.log(`  ✅ Deleted ${failedDeleted} failed jobs older than 30 days`);
        } catch (error) {
          console.error('  ❌ Error deleting failed jobs:', error);
        }

        const totalDeleted = completedDeleted + failedDeleted;
        console.log(`✅ [Cleanup] Cleanup completed - ${totalDeleted} jobs deleted total`);

        // Si se eliminaron muchos jobs, podría ser útil saberlo
        if (totalDeleted > 100) {
          console.warn(`⚠️  [Cleanup] Deleted ${totalDeleted} jobs - consider adjusting retention policy`);
        }

      } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
        throw error; // Re-throw para que Agenda lo marque como fallido
      }
    }
  );

  // Programar ejecución diaria a las 2 AM (hora del servidor)
  // Con TZ=America/Mexico_City, será 2 AM México
  await agenda.every('0 2 * * *', 'cleanup-old-jobs');

  console.log('✅ Cleanup worker registered (runs daily at 2 AM)');
}
