/**
 * Weekly Emails Worker for Agenda.js
 * Ejecuta todos los chequeos de emails semanales en un solo job
 * Corre: Lunes a las 9:00 AM
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { db } from '~/utils/db.server';
import { sendFreeTrialEmail } from 'server/notifyers/freeTrial';
import { sendNoUsageEmail } from 'server/notifyers/noUsage';
import { sendWeekSummaryEmail } from 'server/notifyers/weekSummary';

export interface WeeklyEmailsJobData {
  runDate: Date;
}

/**
 * Chequeo 1: Free Trial Expiry
 * Usuarios en trial que llevan 5-7 días sin uso
 */
async function checkTrialExpiry(): Promise<{ sent: number }> {
  console.log('[WeeklyEmailsWorker] Checking trial expiry...');

  try {
    // Fecha de hace 5 días
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    // Fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Usuarios en trial sin actividad en 5-7 días
    const users = await db.user.findMany({
      where: {
        stripeSubscriptionStatus: null, // Sin plan pago
        createdAt: {
          gte: sevenDaysAgo,
          lte: fiveDaysAgo
        },
        // Usuarios que no han creado chatbots
        projects: {
          none: {}
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      },
      take: 50 // Límite por ejecución
    });

    let sent = 0;
    for (const user of users) {
      try {
        await sendFreeTrialEmail({
          email: user.email,
          name: user.name || undefined
        });
        sent++;
      } catch (error) {
        console.error(`[WeeklyEmailsWorker] Error sending trial email to ${user.email}:`, error);
      }
    }

    console.log(`[WeeklyEmailsWorker] Trial expiry: ${sent}/${users.length} emails sent`);
    return { sent };
  } catch (error) {
    console.error('[WeeklyEmailsWorker] Error in checkTrialExpiry:', error);
    return { sent: 0 };
  }
}

/**
 * Chequeo 2: No Usage
 * Usuarios con chatbots pero sin actividad en 14+ días
 */
async function checkNoUsage(): Promise<{ sent: number }> {
  console.log('[WeeklyEmailsWorker] Checking no usage...');

  try {
    // Fecha de hace 14 días
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Usuarios con proyectos pero sin conversaciones recientes
    const users = await db.user.findMany({
      where: {
        projects: {
          some: {
            conversations: {
              none: {
                createdAt: {
                  gte: fourteenDaysAgo
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true
      },
      take: 50 // Límite por ejecución
    });

    let sent = 0;
    for (const user of users) {
      try {
        await sendNoUsageEmail({
          email: user.email,
          name: user.name || undefined
        });
        sent++;
      } catch (error) {
        console.error(`[WeeklyEmailsWorker] Error sending no usage email to ${user.email}:`, error);
      }
    }

    console.log(`[WeeklyEmailsWorker] No usage: ${sent}/${users.length} emails sent`);
    return { sent };
  } catch (error) {
    console.error('[WeeklyEmailsWorker] Error in checkNoUsage:', error);
    return { sent: 0 };
  }
}

/**
 * Chequeo 3: Weekly Summary
 * Usuarios con actividad en la última semana
 */
async function checkWeeklySummary(): Promise<{ sent: number }> {
  console.log('[WeeklyEmailsWorker] Checking weekly summaries...');

  try {
    // Fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Usuarios con conversaciones en los últimos 7 días
    const users = await db.user.findMany({
      where: {
        projects: {
          some: {
            conversations: {
              some: {
                createdAt: {
                  gte: sevenDaysAgo
                }
              }
            }
          }
        }
      },
      select: {
        id: true,
        email: true,
        name: true,
        projects: {
          where: {
            conversations: {
              some: {
                createdAt: {
                  gte: sevenDaysAgo
                }
              }
            }
          },
          select: {
            id: true,
            name: true,
            conversations: {
              where: {
                createdAt: {
                  gte: sevenDaysAgo
                }
              },
              select: {
                id: true,
                messages: {
                  where: {
                    createdAt: {
                      gte: sevenDaysAgo
                    }
                  },
                  select: {
                    id: true
                  }
                }
              }
            }
          }
        }
      },
      take: 50 // Límite por ejecución
    });

    let sent = 0;
    for (const user of users) {
      try {
        // Calcular métricas del primer proyecto con actividad
        const project = user.projects[0];
        if (!project) continue;

        const totalConversations = project.conversations.length;
        const totalMessages = project.conversations.reduce(
          (sum, conv) => sum + conv.messages.length,
          0
        );
        const averageMessagesPerConversation = totalConversations > 0
          ? Math.round(totalMessages / totalConversations)
          : 0;

        await sendWeekSummaryEmail({
          email: user.email,
          name: user.name || undefined,
          chatbotName: project.name,
          metrics: {
            totalConversations,
            totalMessages,
            averageMessagesPerConversation
          }
        });
        sent++;
      } catch (error) {
        console.error(`[WeeklyEmailsWorker] Error sending summary to ${user.email}:`, error);
      }
    }

    console.log(`[WeeklyEmailsWorker] Weekly summaries: ${sent}/${users.length} emails sent`);
    return { sent };
  } catch (error) {
    console.error('[WeeklyEmailsWorker] Error in checkWeeklySummary:', error);
    return { sent: 0 };
  }
}

/**
 * Register weekly emails worker with Agenda
 */
export async function registerWeeklyEmailsWorker() {
  const agenda = await getAgenda();

  agenda.define<WeeklyEmailsJobData>(
    'send-weekly-emails',
    {
      priority: 'normal',
      concurrency: 1, // Solo una ejecución a la vez
    },
    async (job: Job<WeeklyEmailsJobData>) => {
      const startTime = Date.now();
      console.log('[WeeklyEmailsWorker] Starting weekly email checks...');

      try {
        // Ejecutar todos los chequeos en paralelo
        const [trialResult, noUsageResult, summaryResult] = await Promise.all([
          checkTrialExpiry(),
          checkNoUsage(),
          checkWeeklySummary()
        ]);

        const totalSent = trialResult.sent + noUsageResult.sent + summaryResult.sent;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(
          `[WeeklyEmailsWorker] Completed in ${duration}s. Total emails sent: ${totalSent}`,
          {
            trial: trialResult.sent,
            noUsage: noUsageResult.sent,
            summary: summaryResult.sent
          }
        );

        return { totalSent, ...trialResult, ...noUsageResult, ...summaryResult };
      } catch (error) {
        console.error('[WeeklyEmailsWorker] Job failed:', error);
        throw error;
      }
    }
  );

  // Programar el job para que corra cada lunes a las 9:00 AM
  await agenda.every('0 9 * * 1', 'send-weekly-emails', {
    runDate: new Date()
  });

  console.log('[WeeklyEmailsWorker] Registered successfully (runs every Monday at 9:00 AM)');
}

/**
 * Ejecutar manualmente el worker (para testing)
 */
export async function runWeeklyEmailsNow(): Promise<void> {
  const agenda = await getAgenda();
  await agenda.now('send-weekly-emails', { runDate: new Date() });
  console.log('[WeeklyEmailsWorker] Manual execution enqueued');
}
