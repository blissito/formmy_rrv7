import { db } from "~/utils/db.server";
import { sendReminderEmail } from "~/utils/notifyers/reminder";

// Ultra-simple handlers
const handlers = {
  email: async (data: any) => {
    await sendReminderEmail({
      email: data.to,
      title: data.title,
      date: new Date(data.date),
      chatbotName: data.chatbotName || 'Tu Asistente'
    });
  },
  
  webhook: async (data: any) => {
    await fetch(data.url, {
      method: data.method || 'POST',
      headers: data.headers || { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.payload)
    });
  },
  
  sms: async (data: any) => {
    // TODO: Implement SMS when needed
    console.log('SMS not implemented yet:', data);
  }
};

export class Scheduler {
  // Schedule any action
  static async schedule(chatbotId: string, type: string, data: any, runAt: Date) {
    console.log(`📅 SCHEDULER: Creating scheduled action:`, {
      chatbotId,
      type,
      data,
      runAt: runAt.toISOString()
    });
    
    try {
      // Test database connection first
      console.log(`🔗 SCHEDULER: Testing database connection...`);
      await db.$connect();
      console.log(`✅ SCHEDULER: Database connected`);
      
      const result = await db.scheduledAction.create({
        data: {
          chatbotId,
          type,
          data,
          runAt,
          status: 'pending'
        }
      });
      
      console.log(`✅ SCHEDULER: Created scheduled action with ID: ${result.id}`);
      
      // Verify the record was actually created
      const verification = await db.scheduledAction.findUnique({
        where: { id: result.id }
      });
      
      if (verification) {
        console.log(`✅ SCHEDULER: Verified record exists in DB:`, verification);
      } else {
        console.error(`❌ SCHEDULER: Record not found after creation! ID: ${result.id}`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ SCHEDULER ERROR:`, error);
      throw error;
    }
  }
  
  // Process pending actions (called by cron)
  static async processPending() {
    const now = new Date();
    const tasks = await db.scheduledAction.findMany({
      where: {
        status: 'pending',
        runAt: { lte: now }
      }
    });
    
    for (const task of tasks) {
      try {
        const handler = handlers[task.type as keyof typeof handlers];
        if (!handler) {
          throw new Error(`Unknown task type: ${task.type}`);
        }
        
        await handler(task.data);
        
        await db.scheduledAction.update({
          where: { id: task.id },
          data: { status: 'done' }
        });
        
        console.log(`✅ Executed ${task.type} task: ${task.id}`);
        
      } catch (error) {
        await db.scheduledAction.update({
          where: { id: task.id },
          data: { status: 'failed' }
        });
        
        console.error(`❌ Failed ${task.type} task: ${task.id}`, error);
      }
    }
    
    return tasks.length;
  }
}