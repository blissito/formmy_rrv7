import { db } from "~/utils/db.server";
import { sendNoUsageEmail } from "~/utils/notifyers/noUsage";
import { sendFreeTrialEmail } from "~/utils/notifyers/freeTrial";
import { sendWeekSummaryEmail } from "~/utils/notifyers/weekSummary";

export class EmailScheduler {
  /**
   * Sends "no usage" emails to users who haven't created any projects
   * after 3+ days of registration
   */
  async sendNoUsageEmails() {
    try {
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      // Find users who:
      // 1. Registered 3+ days ago
      // 2. Have no projects (forms or chatbots)
      // 3. Haven't received a no-usage email in the last 7 days
      const usersWithoutProjects = await db.user.findMany({
        where: {
          createdAt: {
            lte: threeDaysAgo,
          },
          projects: {
            none: {},
          },
          chatbots: {
            none: {},
          },
          // Optionally check if we already sent this email recently
          // lastNoUsageEmailSent: {
          //   OR: [
          //     { equals: null },
          //     { lt: sevenDaysAgo }
          //   ]
          // }
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      console.log(
        `[EmailScheduler] Found ${usersWithoutProjects.length} users for no-usage emails`
      );

      for (const user of usersWithoutProjects) {
        try {
          await sendNoUsageEmail({ email: user.email, name: user.name });
          
          // Optionally update user record to track when we sent this email
          // await db.user.update({
          //   where: { id: user.id },
          //   data: { lastNoUsageEmailSent: new Date() }
          // });
          
          console.log(`[EmailScheduler] Sent no-usage email to ${user.email}`);
        } catch (error) {
          console.error(
            `[EmailScheduler] Failed to send no-usage email to ${user.email}:`,
            error
          );
        }
      }

      return { sent: usersWithoutProjects.length };
    } catch (error) {
      console.error("[EmailScheduler] Error in sendNoUsageEmails:", error);
      return { sent: 0, error };
    }
  }

  /**
   * Sends free trial expiry emails to users who are 3 days away from their
   * 30-day trial expiration (27 days after registration)
   */
  async sendFreeTrialExpiryEmails() {
    try {
      const twentySevenDaysAgo = new Date();
      twentySevenDaysAgo.setDate(twentySevenDaysAgo.getDate() - 27);

      const twentySixDaysAgo = new Date();
      twentySixDaysAgo.setDate(twentySixDaysAgo.getDate() - 26);

      // Find users who:
      // 1. Registered exactly 27 days ago (give or take a day for scheduling flexibility)
      // 2. Are still on FREE plan
      // 3. Have at least one project (are actually using the product)
      const usersNearTrialEnd = await db.user.findMany({
        where: {
          createdAt: {
            gte: twentySevenDaysAgo,
            lte: twentySixDaysAgo,
          },
          plan: "FREE",
          OR: [
            {
              projects: {
                some: {},
              },
            },
            {
              chatbots: {
                some: {},
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      console.log(
        `[EmailScheduler] Found ${usersNearTrialEnd.length} users for free trial expiry emails`
      );

      for (const user of usersNearTrialEnd) {
        try {
          await sendFreeTrialEmail({ email: user.email, name: user.name });
          console.log(`[EmailScheduler] Sent trial expiry email to ${user.email}`);
        } catch (error) {
          console.error(
            `[EmailScheduler] Failed to send trial expiry email to ${user.email}:`,
            error
          );
        }
      }

      return { sent: usersNearTrialEnd.length };
    } catch (error) {
      console.error("[EmailScheduler] Error in sendFreeTrialExpiryEmails:", error);
      return { sent: 0, error };
    }
  }

  /**
   * Sends weekly summary emails to PRO users who have active projects
   * and have had activity in the past week
   */
  async sendWeeklySummaryEmails() {
    try {
      // Find PRO users with active chatbots or projects
      const proUsersWithActivity = await db.user.findMany({
        where: {
          plan: "PRO",
          OR: [
            {
              projects: {
                some: {},
              },
            },
            {
              chatbots: {
                some: {},
              },
            },
          ],
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });

      console.log(
        `[EmailScheduler] Found ${proUsersWithActivity.length} PRO users for weekly summary emails`
      );

      for (const user of proUsersWithActivity) {
        try {
          await sendWeekSummaryEmail({ email: user.email, name: user.name, chatbotName: user.chatbots?.[0]?.name });
          console.log(`[EmailScheduler] Sent weekly summary email to ${user.email}`);
        } catch (error) {
          console.error(
            `[EmailScheduler] Failed to send weekly summary email to ${user.email}:`,
            error
          );
        }
      }

      return { sent: proUsersWithActivity.length };
    } catch (error) {
      console.error("[EmailScheduler] Error in sendWeeklySummaryEmails:", error);
      return { sent: 0, error };
    }
  }

  /**
   * Runs all scheduled email jobs
   */
  async runAllJobs() {
    console.log("[EmailScheduler] Starting scheduled email jobs...");
    
    const results = await Promise.allSettled([
      this.sendNoUsageEmails(),
      this.sendFreeTrialExpiryEmails(),
      this.sendWeeklySummaryEmails(),
    ]);

    const [noUsageResult, trialResult, summaryResult] = results;

    console.log("[EmailScheduler] Email jobs completed:", {
      noUsage: noUsageResult.status === "fulfilled" ? noUsageResult.value : noUsageResult.reason,
      trial: trialResult.status === "fulfilled" ? trialResult.value : trialResult.reason,
      summary: summaryResult.status === "fulfilled" ? summaryResult.value : summaryResult.reason,
    });

    return results;
  }
}

// Export singleton instance
export const emailScheduler = new EmailScheduler();