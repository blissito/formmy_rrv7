import { Scheduler } from "./integrations/scheduler";

// Ultra-simple cron job - runs every minute
setInterval(async () => {
  try {
    const processed = await Scheduler.processPending();
    if (processed > 0) {
      console.log(`📅 Processed ${processed} scheduled actions`);
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}, 60000); // Every minute

console.log('⏰ Scheduler cron job started - checking every minute');