/**
 * Parser Worker for Agenda.js
 * Processes parsing jobs asynchronously in the background
 */

import type { Job } from 'agenda';
import { getAgenda } from '../agenda.server';
import { processParsingJob } from '~/server/llamaparse/job.service';

export interface ParserJobData {
  jobId: string;
  fileUrl: string;
  fileKey: string;
  llamaApiKey?: string;
}

/**
 * Register parser worker with Agenda
 */
export function registerParserWorker() {
  const agenda = getAgenda();

  agenda.define<ParserJobData>(
    'process-parsing-job',
    {
      priority: 'high',
      concurrency: 3, // Process up to 3 parsing jobs simultaneously
    },
    async (job: Job<ParserJobData>) => {
      const { jobId, fileUrl, fileKey, llamaApiKey } = job.attrs.data;

      console.log(`[ParserWorker] Starting job ${jobId}`);

      try {
        await processParsingJob(jobId, fileUrl, fileKey, llamaApiKey);
        console.log(`[ParserWorker] Job ${jobId} completed successfully`);
      } catch (error) {
        console.error(`[ParserWorker] Job ${jobId} failed:`, error);
        throw error; // Re-throw to mark job as failed in Agenda
      }
    }
  );

  console.log('[ParserWorker] Registered successfully');
}

/**
 * Enqueue a new parsing job
 */
export async function enqueueParsingJob(data: ParserJobData): Promise<void> {
  const agenda = getAgenda();

  await agenda.now('process-parsing-job', data);

  console.log(`[ParserWorker] Enqueued job ${data.jobId}`);
}
