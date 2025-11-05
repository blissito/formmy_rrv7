/**
 * Server Initialization
 * Handles background jobs and other server startup tasks
 * This file is imported by server.js after the build
 */

import { registerWeeklyEmailsWorker } from './jobs/workers/weekly-emails-worker';

/**
 * Initialize all server background tasks
 * Called once when the server starts
 */
export async function initializeServer() {
  // Initialize Agenda.js workers
  await registerWeeklyEmailsWorker();
  console.log('✅ Agenda.js: Weekly emails worker registered (Mondays 9:00 AM)');
}
