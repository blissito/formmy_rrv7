/**
 * Script para eliminar datos dummy/seed de SAT
 * Uso: npx tsx scripts/clean-sat-dummy-data.ts
 */

import { db } from "../app/utils/db.server";

async function cleanSATDummyData() {
  console.log("🧹 Limpiando datos dummy de SAT...\n");

  // UUIDs de facturas dummy
  const dummyUUIDs = [
    "11111111-1111-1111-1111-111111111111",
    "22222222-2222-2222-2222-222222222222",
    "33333333-3333-3333-3333-333333333333",
    "44444444-4444-4444-4444-444444444444",
    "55555555-5555-5555-5555-555555555555",
  ];

  // RFCs de contactos dummy
  const dummyRFCs = ["AAA010101AAA", "BBB020202BBB", "CCC030303CCC"];

  // 1. Eliminar facturas dummy
  console.log("🗑️  Eliminando facturas dummy...");
  const deletedInvoices = await db.satInvoice.deleteMany({
    where: {
      uuid: {
        in: dummyUUIDs,
      },
    },
  });
  console.log(`  ✓ ${deletedInvoices.count} facturas eliminadas`);

  // 2. Eliminar contactos dummy
  console.log("\n🗑️  Eliminando contactos dummy...");
  const deletedContacts = await db.satContact.deleteMany({
    where: {
      rfc: {
        in: dummyRFCs,
      },
    },
  });
  console.log(`  ✓ ${deletedContacts.count} contactos eliminados`);

  console.log("\n✅ Limpieza completada!");
  console.log("💡 La base de datos SAT está lista para datos reales");
}

cleanSATDummyData()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(() => {
    db.$disconnect();
  });
