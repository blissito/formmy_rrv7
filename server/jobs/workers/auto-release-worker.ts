/**
 * Auto-Release Worker for Agenda.js
 * Desactiva automáticamente el modo manual en conversaciones inactivas
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { db } from '~/utils/db.server';

const MANUAL_MODE_TIMEOUT_MINUTES = 30;

/**
 * Register auto-release worker with Agenda
 */
export async function registerAutoReleaseWorker() {
  const agenda = await getAgenda();

  // Define the job
  agenda.define(
    'auto-release-manual-mode',
    {
      priority: 'high',
      concurrency: 1, // Solo 1 a la vez para evitar race conditions
    },
    async (job: Job) => {
      try {
        const thirtyMinutesAgo = new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000);

        // Buscar conversaciones en modo manual con último eco hace más de 30 minutos
        const expiredConversations = await db.conversation.findMany({
          where: {
            manualMode: true,
            lastEchoAt: {
              lt: thirtyMinutesAgo,
            },
          },
          select: {
            id: true,
            sessionId: true,
            lastEchoAt: true,
            chatbotId: true,
          },
        });

        if (expiredConversations.length === 0) {
          console.log("[Auto-Release] No conversations to release");
          return;
        }

        // Desactivar modo manual en batch
        const result = await db.conversation.updateMany({
          where: {
            id: {
              in: expiredConversations.map((c) => c.id),
            },
          },
          data: {
            manualMode: false,
          },
        });

        console.log(
          `✅ [Auto-Release] Released ${result.count} conversations from manual mode (timeout: ${MANUAL_MODE_TIMEOUT_MINUTES} min)`
        );

        // Log cada conversación liberada
        for (const conv of expiredConversations) {
          const inactiveMins = Math.floor(
            (Date.now() - (conv.lastEchoAt?.getTime() || 0)) / 1000 / 60
          );
          console.log(
            `  - Conversation ${conv.sessionId} (inactive for ${inactiveMins} min)`
          );
        }
      } catch (error) {
        console.error("[Auto-Release] Error releasing conversations:", error);
        throw error; // Re-throw para que Agenda lo marque como fallido
      }
    }
  );

  // Programar ejecución cada 30 minutos
  // Usar '*/30' para ejecutar a los minutos 0 y 30 de cada hora
  await agenda.every('*/30 * * * *', 'auto-release-manual-mode');

  console.log('✅ Auto-release worker registered (runs every 30 minutes)');
}

/**
 * Estadísticas de conversaciones en modo manual
 * (útil para debugging/monitoring)
 */
export async function getManualModeStats() {
  try {
    const [total, recent, expired] = await Promise.all([
      db.conversation.count({
        where: { manualMode: true },
      }),
      db.conversation.count({
        where: {
          manualMode: true,
          lastEchoAt: {
            gte: new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000),
          },
        },
      }),
      db.conversation.count({
        where: {
          manualMode: true,
          lastEchoAt: {
            lt: new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      active: recent,
      expired,
      timeoutMinutes: MANUAL_MODE_TIMEOUT_MINUTES,
    };
  } catch (error) {
    console.error("[Auto-Release] Error getting stats:", error);
    return { total: 0, active: 0, expired: 0, timeoutMinutes: MANUAL_MODE_TIMEOUT_MINUTES };
  }
}
