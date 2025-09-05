// Test del Scheduler directamente
const { PrismaClient } = require('@prisma/client');

async function testSchedulerDirect() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing Scheduler.schedule directly...');
    
    // Importar dinámicamente el scheduler
    const { Scheduler } = await import('./server/integrations/scheduler.js');
    
    // Test data
    const chatbotId = '66c66f5c4e3a0f2b4c789abc'; // ObjectID válido
    const type = 'email';
    const data = {
      to: 'test@formmy.app',
      title: 'Test Reminder',
      date: new Date(Date.now() + 24 * 60 * 60 * 1000), // mañana
      chatbotName: 'Test Bot'
    };
    const runAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // mañana
    
    console.log('📦 Creating scheduled action...');
    const result = await Scheduler.schedule(chatbotId, type, data, runAt);
    
    console.log('✅ Created:', result);
    
    // Verificar en BD
    const count = await prisma.scheduledAction.count();
    console.log(`📊 Total records now: ${count}`);
    
    const latest = await prisma.scheduledAction.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📋 Latest record:', latest);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testSchedulerDirect();