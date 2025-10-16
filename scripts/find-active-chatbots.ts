/**
 * Buscar chatbots activos en producción para testing
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function findChatbots() {
  console.log('🔍 Buscando chatbots activos...\n');

  // Chatbots activos con información de dominios
  const allActive = await prisma.chatbot.findMany({
    where: {
      isActive: true
    },
    select: {
      id: true,
      name: true,
      isActive: true,
      settings: true
    },
    take: 10
  });

  console.log(`Total chatbots activos: ${allActive.length}\n`);

  const withDomains = allActive.find(c => {
    const domains = (c.settings as any)?.security?.allowedDomains;
    return domains && Array.isArray(domains) && domains.length > 0;
  });

  const withoutDomains = allActive.find(c => {
    const domains = (c.settings as any)?.security?.allowedDomains;
    return !domains || !Array.isArray(domains) || domains.length === 0;
  });

  console.log('✅ Chatbot CON dominios configurados:');
  if (withDomains) {
    console.log(`  ID: ${withDomains.id}`);
    console.log(`  Nombre: ${withDomains.name}`);
    const domains = (withDomains.settings as any)?.security?.allowedDomains;
    console.log(`  Dominios:`, domains);
  } else {
    console.log('  ⚠️  No encontrado');
  }

  console.log('\n✅ Chatbot SIN dominios configurados:');
  if (withoutDomains) {
    console.log(`  ID: ${withoutDomains.id}`);
    console.log(`  Nombre: ${withoutDomains.name}`);
  } else {
    console.log('  ⚠️  No encontrado');
  }

  await prisma.$disconnect();

  return { withDomains, withoutDomains };
}

findChatbots().catch(console.error);
