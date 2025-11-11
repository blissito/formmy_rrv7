/**
 * Agenda.js Configuration for Background Jobs
 * Handles async parser jobs with MongoDB persistence
 */

import Agenda from 'agenda';
import { db as prisma } from '~/utils/db.server';

const MONGO_URI = process.env.MONGO_ATLAS!;

if (!MONGO_URI) {
  throw new Error('MONGO_ATLAS environment variable is required for Agenda.js');
}

// Singleton instance
let agendaInstance: Agenda | null = null;
let agendaReady: Promise<void> | null = null;

/**
 * Get or create Agenda instance and wait for it to be ready
 */
export async function getAgenda(): Promise<Agenda> {
  if (!agendaInstance) {
    agendaInstance = new Agenda({
      db: {
        address: MONGO_URI,
        collection: 'agendaJobs', // Separate collection from Prisma models
      },
      processEvery: '30 seconds', // How often to check for new jobs (optimized for lower resource usage)
      maxConcurrency: 5, // Max parallel jobs
      defaultConcurrency: 3, // Default per job type
      defaultLockLifetime: 10 * 60 * 1000, // 10 minutes max job time
    });

    // Error handling
    agendaInstance.on('error', (error) => {
      console.error('[Agenda] System error:', error);
    });

    agendaInstance.on('fail', (error, job) => {
      console.error(`❌ [Agenda] Job "${job.attrs.name}" failed:`, {
        error: error.message,
        failCount: job.attrs.failCount,
        lastRunAt: job.attrs.lastRunAt,
        data: job.attrs.data,
      });
    });

    agendaInstance.on('success', (job) => {
      const runTime = job.attrs.lastFinishedAt && job.attrs.lastRunAt
        ? job.attrs.lastFinishedAt.getTime() - job.attrs.lastRunAt.getTime()
        : 0;

      console.log(`✅ [Agenda] Job "${job.attrs.name}" completed`, {
        runTimeMs: runTime,
        runTimeSec: (runTime / 1000).toFixed(2),
        nextRunAt: job.attrs.nextRunAt,
        type: job.attrs.type, // 'single' | 'normal'
      });
    });

    agendaInstance.on('start', (job) => {
      console.log(`▶️  [Agenda] Job "${job.attrs.name}" started`, {
        data: job.attrs.data,
        scheduledFor: job.attrs.nextRunAt,
      });
    });

    // Start agenda and wait for connection
    agendaReady = agendaInstance.start().then(() => {
    });
  }

  // Wait for agenda to be ready
  if (agendaReady) {
    await agendaReady;
  }

  return agendaInstance;
}

/**
 * Graceful shutdown
 */
export async function shutdownAgenda(): Promise<void> {
  if (agendaInstance) {
    await agendaInstance.stop();
    agendaInstance = null;
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  await shutdownAgenda();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await shutdownAgenda();
  process.exit(0);
});
