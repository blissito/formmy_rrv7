/**
 * Server Initialization
 * Handles background jobs and other server startup tasks
 * This file is imported by server.js after the build
 */

import { getAgenda } from './jobs/agenda.server';
import { WhatsAppSyncService } from './integrations/whatsapp/sync.service.server';
import { registerWeeklyEmailsWorker } from './jobs/workers/weekly-emails-worker';
import { registerParserWorker } from './jobs/workers/parser-worker';
import { registerAutoReleaseWorker } from './jobs/workers/auto-release-worker';
import { registerCleanupWorker } from './jobs/workers/cleanup-jobs';
import { registerRefreshWebsiteWorker } from './jobs/workers/refresh-website-worker';
import { registerCleanupOrphanedEmbeddingsWorker } from './jobs/workers/cleanup-orphaned-embeddings-worker';

/**
 * Initialize all server background tasks
 * Called once when the server starts
 */
export async function initializeServer() {
  const agenda = await getAgenda();

  // Define WhatsApp sync job
  agenda.define('whatsapp-sync', async (job) => {
    const { integrationId, phoneNumberId, accessToken } = job.attrs.data;

    console.log(`[Agenda] WhatsApp sync started for integration ${integrationId}`);

    const result = await WhatsAppSyncService.initializeSync(
      integrationId,
      phoneNumberId,
      accessToken
    );

    if (result.success) {
      console.log(`[Agenda] WhatsApp sync completed for integration ${integrationId}`);
    } else {
      console.error(`[Agenda] WhatsApp sync failed:`, result.error);
      throw new Error(result.error);
    }
  });

  // Register all Agenda workers
  await registerWeeklyEmailsWorker();
  await registerParserWorker();
  await registerAutoReleaseWorker();
  await registerCleanupWorker();
  await registerRefreshWebsiteWorker();
  await registerCleanupOrphanedEmbeddingsWorker();

  console.log('✅ Agenda.js: All jobs registered (weekly-emails, parser, auto-release, cleanup, refresh-website, cleanup-orphaned-embeddings)');
}
