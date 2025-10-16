/**
 * Revisar todos los chatbots y su configuración de seguridad
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL
});

async function checkAll() {
  console.log('🔍 Revisando configuración de seguridad de todos los chatbots...\n');

  const all = await prisma.chatbot.findMany({
    select: {
      id: true,
      name: true,
      isActive: true,
      settings: true,
      userId: true
    },
    take: 50
  });

  console.log(`Total chatbots: ${all.length}\n`);

  let withSecuritySettings = 0;
  let withAllowedDomains = 0;

  all.forEach((chatbot, i) => {
    const settings = chatbot.settings as any;
    const hasSecurity = settings?.security;
    const allowedDomains = settings?.security?.allowedDomains;

    if (hasSecurity) {
      withSecuritySettings++;
    }

    if (allowedDomains && Array.isArray(allowedDomains) && allowedDomains.length > 0) {
      withAllowedDomains++;
      console.log(`${i + 1}. ✅ ${chatbot.name} (${chatbot.id})`);
      console.log(`   Dominios: ${allowedDomains.join(', ')}`);
      console.log(`   Settings completos:`, JSON.stringify(settings.security, null, 2));
      console.log('');
    }
  });

  console.log(`\n📊 Estadísticas:`);
  console.log(`Total chatbots: ${all.length}`);
  console.log(`Con settings.security: ${withSecuritySettings}`);
  console.log(`Con allowedDomains configurados: ${withAllowedDomains}`);

  await prisma.$disconnect();
}

checkAll().catch(console.error);
