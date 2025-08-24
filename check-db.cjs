const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRecords() {
  try {
    const count = await prisma.scheduledAction.count();
    console.log(`📊 Total ScheduledAction records: ${count}`);
    
    const lastHour = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await prisma.scheduledAction.count({
      where: { createdAt: { gte: lastHour } }
    });
    console.log(`📈 Records created in last hour: ${recentCount}`);
    
    if (count > 0) {
      const sample = await prisma.scheduledAction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true, type: true, chatbotId: true, createdAt: true }
      });
      console.log('📋 Sample records:', JSON.stringify(sample, null, 2));
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkRecords();