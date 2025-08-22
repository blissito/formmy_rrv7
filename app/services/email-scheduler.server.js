// Compiled version of email-scheduler.server.ts for production
import { db } from "~/utils/db.server";
import { sendNoUsageEmail } from "~/utils/notifyers/noUsage";
import { sendFreeTrialEmail } from "~/utils/notifyers/freeTrial";
import { sendWeekSummaryEmail } from "~/utils/notifyers/weekSummary";

export class EmailScheduler {
  constructor() {
    this.emailsPerBatch = 50; // AWS SES rate limit friendly
    this.delayBetweenBatches = 1000; // 1 second delay between batches
  }

  /**
   * Processes emails in batches with rate limiting
   */
  async processBatched(items, processor, context) {
    let sent = 0;
    
    for (let i = 0; i < items.length; i += this.emailsPerBatch) {
      const batch = items.slice(i, i + this.emailsPerBatch);
      console.log(`[EmailScheduler] Processing ${context} batch ${Math.floor(i / this.emailsPerBatch) + 1} of ${Math.ceil(items.length / this.emailsPerBatch)} (${batch.length} items)`);
      
      const batchResults = await Promise.allSettled(
        batch.map(item => processor(item))
      );
      
      const batchSuccesses = batchResults.filter(result => result.status === 'fulfilled').length;
      sent += batchSuccesses;
      
      console.log(`[EmailScheduler] Batch completed: ${batchSuccesses}/${batch.length} emails sent`);
      
      // Rate limiting delay between batches (except for the last batch)
      if (i + this.emailsPerBatch < items.length) {
        console.log(`[EmailScheduler] Rate limiting: waiting ${this.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, this.delayBetweenBatches));
      }
    }
    
    return sent;
  }

  /**
   * Calculates weekly metrics for a user's chatbots
   */
  async calculateWeeklyMetrics(userId) {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    try {
      // Get user's chatbots
      const userChatbots = await db.chatbot.findMany({
        where: { userId },
        select: { id: true }
      });

      const chatbotIds = userChatbots.map(cb => cb.id);

      if (chatbotIds.length === 0) {
        return {
          totalConversations: 0,
          totalMessages: 0,
          averageMessagesPerConversation: 0,
        };
      }

      // Get conversations from last week
      const weeklyConversations = await db.conversation.findMany({
        where: {
          chatbotId: { in: chatbotIds },
          startedAt: { gte: oneWeekAgo }
        },
        select: {
          id: true,
          messageCount: true,
          messages: {
            select: {
              responseTime: true
            },
            where: {
              role: 'assistant',
              responseTime: { not: null }
            }
          }
        }
      });

      const totalConversations = weeklyConversations.length;
      const totalMessages = weeklyConversations.reduce((sum, conv) => sum + conv.messageCount, 0);
      const averageMessagesPerConversation = totalConversations > 0 ? Math.round(totalMessages / totalConversations) : 0;

      // Calculate average response time
      const responseTimes = weeklyConversations.flatMap(conv => 
        conv.messages.map(msg => msg.responseTime).filter(rt => rt !== null)
      );
      const averageResponseTime = responseTimes.length > 0 
        ? Math.round(responseTimes.reduce((sum, rt) => sum + rt, 0) / responseTimes.length)
        : undefined;

      return {
        totalConversations,
        totalMessages,
        averageMessagesPerConversation,
        averageResponseTime
      };
    } catch (error) {
      console.error(`[EmailScheduler] Error calculating metrics for user ${userId}:`, error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        averageMessagesPerConversation: 0,
      };
    }
  }

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

      const sent = await this.processBatched(
        usersWithoutProjects,
        async (user) => {
          await sendNoUsageEmail({ email: user.email, name: user.name });
          console.log(`[EmailScheduler] Sent no-usage email to ${user.email}`);
        },
        "no-usage emails"
      );

      return { sent };
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

      const sent = await this.processBatched(
        usersNearTrialEnd,
        async (user) => {
          await sendFreeTrialEmail({ email: user.email, name: user.name });
          console.log(`[EmailScheduler] Sent trial expiry email to ${user.email}`);
        },
        "trial expiry emails"
      );

      return { sent };
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
          chatbots: {
            select: {
              name: true,
              conversationCount: true,
            }
          },
        },
      });

      console.log(
        `[EmailScheduler] Found ${proUsersWithActivity.length} PRO users for weekly summary emails`
      );

      const sent = await this.processBatched(
        proUsersWithActivity,
        async (user) => {
          const metrics = await this.calculateWeeklyMetrics(user.id);
          await sendWeekSummaryEmail({ 
            email: user.email, 
            name: user.name, 
            chatbotName: user.chatbots?.[0]?.name,
            metrics
          });
          console.log(`[EmailScheduler] Sent weekly summary email to ${user.email}`);
        },
        "weekly summary emails"
      );

      return { sent };
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