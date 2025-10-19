import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const keys = await prisma.apiKey.findMany({
    where: {
      userId: '68f456dba443330f35f8c81c' // Usuario fixtergeek@gmail.com
    },
    select: {
      id: true,
      key: true,
      name: true,
      isActive: true,
      createdAt: true
    }
  });

  console.log('API Keys del usuario fixtergeek@gmail.com:');
  console.log(JSON.stringify(keys, null, 2));

  // Si existe una key activa, usarla para el test
  const activeKey = keys.find(k => k.isActive);
  if (activeKey) {
    console.log('\nAPI Key activa para testing:');
    console.log(activeKey.key);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
