/**
 * Script para limpiar customerIds null de la base de datos
 * Esto permite que la migración funcione correctamente
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Analizando todos los usuarios...");

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, customerId: true }
  });

  console.log(`📊 Total de usuarios: ${allUsers.length}`);

  const withCustomerId = allUsers.filter(u => u.customerId);
  const withoutCustomerId = allUsers.filter(u => !u.customerId);

  console.log(`✅ Con customerId: ${withCustomerId.length}`);
  console.log(`❌ Sin customerId: ${withoutCustomerId.length}`);

  if (withoutCustomerId.length > 0) {
    console.log("\n📋 Usuarios sin customerId (primeros 10):");
    withoutCustomerId.slice(0, 10).forEach(u => {
      console.log(`  - ${u.email}`);
    });
  }

  // Verificar customerIds duplicados
  const customerIdCounts = new Map<string, number>();
  withCustomerId.forEach(u => {
    const count = customerIdCounts.get(u.customerId!) || 0;
    customerIdCounts.set(u.customerId!, count + 1);
  });

  const duplicates = Array.from(customerIdCounts.entries()).filter(([_, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log(`\n⚠️  CustomerIds duplicados: ${duplicates.length}`);
    duplicates.forEach(([id, count]) => {
      console.log(`  - ${id}: ${count} usuarios`);
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
