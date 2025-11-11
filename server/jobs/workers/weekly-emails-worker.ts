/**
 * Weekly Emails Worker for Agenda.js
 * Ejecuta todos los chequeos de emails semanales + conversión de trials expirados
 * Corre: Lunes a las 9:00 AM
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { db } from '~/utils/db.server';
import { sendFreeTrialEmail } from 'server/notifyers/freeTrial';
import { sendNoUsageEmail } from 'server/notifyers/noUsage';
import { sendWeekSummaryEmail } from 'server/notifyers/weekSummary';
import { checkTrialExpiration, applyFreeRestrictions } from 'server/chatbot/planLimits.server';
import { Plans } from '@prisma/client';

export interface WeeklyEmailsJobData {
  runDate: Date;
}

/**
 * Chequeo 1: Free Trial Expiry
 * Usuarios en trial que llevan 5-7 días sin uso
 */
async function checkTrialExpiry(): Promise<{ sent: number }> {

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
        plan: Plans.TRIAL, // Usuarios en trial
        createdAt: {
          gte: sevenDaysAgo,
          lte: fiveDaysAgo
        },
        // Usuarios que no han creado chatbots
        chatbots: {
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

  try {
    // Fecha de hace 14 días
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    // Usuarios con chatbots pero sin conversaciones recientes
    const users = await db.user.findMany({
      where: {
        chatbots: {
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

  try {
    // Fecha de hace 7 días
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Usuarios con conversaciones en los últimos 7 días
    const users = await db.user.findMany({
      where: {
        chatbots: {
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
        chatbots: {
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
        // Calcular métricas del primer chatbot con actividad
        const chatbot = user.chatbots[0];
        if (!chatbot) continue;

        const totalConversations = chatbot.conversations.length;
        const totalMessages = chatbot.conversations.reduce(
          (sum, conv) => sum + conv.messages.length,
          0
        );
        const averageMessagesPerConversation = totalConversations > 0
          ? Math.round(totalMessages / totalConversations)
          : 0;

        await sendWeekSummaryEmail({
          email: user.email,
          name: user.name || undefined,
          chatbotName: chatbot.name,
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

    return { sent };
  } catch (error) {
    console.error('[WeeklyEmailsWorker] Error in checkWeeklySummary:', error);
    return { sent: 0 };
  }
}

/**
 * Chequeo 4: Trial to FREE Conversion
 * Usuarios TRIAL que ya expiraron su período de 365 días → Convertir a FREE
 */
async function convertExpiredTrials(): Promise<{ converted: number; errors: number }> {

  try {
    // Obtener todos los usuarios TRIAL
    const trialUsers = await db.user.findMany({
      where: {
        plan: Plans.TRIAL
      },
      select: {
        id: true,
        email: true,
        name: true,
        trialStartedAt: true,
        createdAt: true
      }
    });


    let converted = 0;
    let errors = 0;

    for (const user of trialUsers) {
      try {
        // Verificar si el trial expiró
        const { isExpired, daysRemaining, trialEndDate } = await checkTrialExpiration(user.id);

        if (isExpired) {

          // 1. Convertir usuario a FREE
          await db.user.update({
            where: { id: user.id },
            data: { plan: Plans.FREE }
          });

          // 2. Aplicar restricciones FREE (desactivar chatbots y formmys excedentes)
          const restrictions = await applyFreeRestrictions(user.id);


          converted++;

          // TODO: Enviar email notificando la conversión a FREE y cómo reactivar con plan de pago
          // await sendTrialExpiredEmail({ email: user.email, name: user.name });
        } else {
        }
      } catch (error) {
        console.error(
          `[WeeklyEmailsWorker] Error converting ${user.email} to FREE:`,
          error
        );
        errors++;
      }
    }

    return { converted, errors };
  } catch (error) {
    console.error('[WeeklyEmailsWorker] Error in convertExpiredTrials:', error);
    return { converted: 0, errors: 0 };
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

      try {
        // Ejecutar todos los chequeos en paralelo
        const [trialResult, noUsageResult, summaryResult, conversionResult] = await Promise.all([
          checkTrialExpiry(),
          checkNoUsage(),
          checkWeeklySummary(),
          convertExpiredTrials() // 🆕 Nueva función para convertir trials expirados
        ]);

        const totalSent = trialResult.sent + noUsageResult.sent + summaryResult.sent;
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);


        return {
          totalSent,
          ...trialResult,
          ...noUsageResult,
          ...summaryResult,
          ...conversionResult
        };
      } catch (error) {
        console.error('[WeeklyEmailsWorker] Job failed:', error);
        throw error;
      }
    }
  );

  // Programar el job para que corra cada lunes a las 9:00 AM (timezone del servidor)
  // Con TZ=America/Mexico_City en fly.toml, esto será 9 AM hora México
  await agenda.every('0 9 * * 1', 'send-weekly-emails', {
    runDate: new Date()
  });

}

/**
 * Ejecutar manualmente el worker (para testing)
 */
export async function runWeeklyEmailsNow(): Promise<void> {
  const agenda = await getAgenda();
  await agenda.now('send-weekly-emails', { runDate: new Date() });
}
