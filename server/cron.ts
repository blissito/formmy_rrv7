import { Scheduler } from "./integrations/scheduler";

// Ultra-simple cron job - runs every minute
setInterval(async () => {
  try {
    const processed = await Scheduler.processPending();
    if (processed > 0) {
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
}, 60000); // Every minute
