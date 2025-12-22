/**
 * Script para verificar integraciones de WhatsApp
 * Uso: npx tsx scripts/check-whatsapp-integrations.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const targetPhoneNumberId = "845237608662425";

  console.log("\n📱 Buscando integración específica...");
  console.log(`   phoneNumberId: ${targetPhoneNumberId}`);

  // 1. Buscar integración exacta (activa)
  const exactMatch = await db.integration.findFirst({
    where: {
      platform: "WHATSAPP",
      phoneNumberId: targetPhoneNumberId,
      isActive: true,
    },
    include: {
      chatbot: {
        select: { name: true, slug: true },
      },
    },
  });

  if (exactMatch) {
    console.log("\n✅ Integración ACTIVA encontrada:");
    console.log(`   ID: ${exactMatch.id}`);
    console.log(`   Chatbot: ${exactMatch.chatbot?.name} (${exactMatch.chatbot?.slug})`);
    console.log(`   phoneNumberId: ${exactMatch.phoneNumberId}`);
  } else {
    console.log("\n❌ No se encontró integración ACTIVA con ese phoneNumberId");

    // Buscar si existe pero inactiva
    const inactiveMatch = await db.integration.findFirst({
      where: {
        platform: "WHATSAPP",
        phoneNumberId: targetPhoneNumberId,
        isActive: false,
      },
      include: {
        chatbot: {
          select: { name: true, slug: true },
        },
      },
    });

    if (inactiveMatch) {
      console.log("\n⚠️  Integración encontrada pero INACTIVA:");
      console.log(`   ID: ${inactiveMatch.id}`);
      console.log(`   Chatbot: ${inactiveMatch.chatbot?.name}`);
      console.log(`   isActive: ${inactiveMatch.isActive}`);
    }
  }

  // 2. Listar TODAS las integraciones de WhatsApp
  console.log("\n📋 Todas las integraciones de WhatsApp:");
  const allIntegrations = await db.integration.findMany({
    where: {
      platform: "WHATSAPP",
    },
    include: {
      chatbot: {
        select: { name: true, slug: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (allIntegrations.length === 0) {
    console.log("   (ninguna integración encontrada)");
  } else {
    for (const integration of allIntegrations) {
      const status = integration.isActive ? "✅" : "❌";
      console.log(`\n   ${status} ${integration.chatbot?.name || "Sin chatbot"}`);
      console.log(`      ID: ${integration.id}`);
      console.log(`      phoneNumberId: ${integration.phoneNumberId}`);
      console.log(`      isActive: ${integration.isActive}`);
      console.log(`      createdAt: ${integration.createdAt}`);
    }
  }

  // 3. Buscar coincidencias parciales
  console.log("\n🔍 Buscando coincidencias parciales del phoneNumberId...");
  const partialMatches = await db.integration.findMany({
    where: {
      platform: "WHATSAPP",
      phoneNumberId: {
        contains: targetPhoneNumberId.slice(-6), // Últimos 6 dígitos
      },
    },
    include: {
      chatbot: {
        select: { name: true, slug: true },
      },
    },
  });

  if (partialMatches.length > 0 && partialMatches.some((m) => m.phoneNumberId !== targetPhoneNumberId)) {
    console.log("   Posibles coincidencias:");
    for (const match of partialMatches) {
      if (match.phoneNumberId !== targetPhoneNumberId) {
        console.log(`      ${match.phoneNumberId} -> ${match.chatbot?.name}`);
      }
    }
  } else {
    console.log("   (ninguna coincidencia parcial)");
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
