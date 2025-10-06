import { PrismaClient } from '@prisma/client';
import { getOptimalTemperature } from '../server/config/model-temperatures';

const prisma = new PrismaClient();

async function migrateTemperatures(dryRun = true) {
  console.log(dryRun ? '🔍 DRY RUN MODE - No changes will be made\n' : '🚀 LIVE MODE - Updating temperatures\n');

  const chatbots = await prisma.chatbot.findMany({
    select: {
      id: true,
      name: true,
      aiModel: true,
      temperature: true
    }
  });

  console.log(`Found ${chatbots.length} chatbots\n`);

  const updates: Array<{
    id: string;
    name: string;
    model: string;
    currentTemp: number;
    optimalTemp: number;
    shouldUpdate: boolean;
  }> = [];

  for (const chatbot of chatbots) {
    const optimalTemp = getOptimalTemperature(chatbot.aiModel);
    const shouldUpdate = chatbot.temperature !== optimalTemp;

    updates.push({
      id: chatbot.id,
      name: chatbot.name,
      model: chatbot.aiModel,
      currentTemp: chatbot.temperature,
      optimalTemp,
      shouldUpdate
    });

    if (shouldUpdate) {
      console.log(`📝 ${chatbot.name}`);
      console.log(`   Model: ${chatbot.aiModel}`);
      console.log(`   Current: ${chatbot.temperature} → Optimal: ${optimalTemp}`);
      console.log('');
    }
  }

  const needsUpdate = updates.filter(u => u.shouldUpdate);
  console.log(`\n📊 Summary:`);
  console.log(`   Total chatbots: ${chatbots.length}`);
  console.log(`   Need update: ${needsUpdate.length}`);
  console.log(`   Already optimal: ${chatbots.length - needsUpdate.length}`);

  if (!dryRun && needsUpdate.length > 0) {
    console.log('\n🔄 Applying updates...\n');

    for (const update of needsUpdate) {
      await prisma.chatbot.update({
        where: { id: update.id },
        data: { temperature: update.optimalTemp }
      });
      console.log(`✅ Updated ${update.name}: ${update.currentTemp} → ${update.optimalTemp}`);
    }

    console.log('\n✅ Migration completed!');
  } else if (dryRun && needsUpdate.length > 0) {
    console.log('\n💡 Run with --live to apply changes');
  }

  await prisma.$disconnect();
}

const isLive = process.argv.includes('--live');
migrateTemperatures(!isLive);
