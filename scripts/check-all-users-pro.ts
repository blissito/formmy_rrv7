import { db } from '../app/utils/db.server';

async function check() {
  // Ver todos los usuarios con planes PRO+
  const users = await db.user.findMany({
    where: {
      plan: { in: ['PRO', 'ENTERPRISE', 'TRIAL'] }
    },
    select: {
      id: true,
      email: true,
      plan: true,
      _count: {
        select: { chatbots: true }
      }
    }
  });

  console.log('\n👥 USUARIOS PRO/ENTERPRISE/TRIAL:\n');
  users.forEach(u => {
    console.log(`${u.plan.padEnd(10)} | ${u.email.padEnd(30)} | Chatbots: ${u._count.chatbots}`);
  });

  console.log(`\nTotal usuarios PRO+: ${users.length}\n`);

  // Ver chatbots con y sin isActive
  const allChatbots = await db.chatbot.findMany({
    where: {
      user: {
        plan: { in: ['PRO', 'ENTERPRISE', 'TRIAL'] }
      }
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      user: {
        select: { email: true, plan: true }
      },
      contexts: true
    }
  });

  console.log('📊 TODOS LOS CHATBOTS PRO+ (activos + inactivos):\n');
  allChatbots.forEach(c => {
    const status = c.isActive ? '✅ Activo' : '❌ Inactivo';
    console.log(`${status} | ${c.user.plan.padEnd(10)} | ${c.name.substring(0, 30).padEnd(30)} | Contexts: ${c.contexts.length} | ${c.user.email}`);
  });

  console.log(`\nTotal chatbots PRO+: ${allChatbots.length}`);
  console.log(`Activos: ${allChatbots.filter(c => c.isActive).length}`);
  console.log(`Inactivos: ${allChatbots.filter(c => !c.isActive).length}\n`);

  await db.$disconnect();
}

check();
