/**
 * Eliminar el índice unique de customerId en MongoDB
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("🔍 Listando índices de la colección User...");

    // Primero listar los índices
    const indexes = await prisma.$runCommandRaw({
      listIndexes: "User"
    });

    console.log("📋 Índices encontrados:");
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n🗑️  Intentando eliminar índice unique de customerId...");

    // Ejecutar comando raw de MongoDB para eliminar el índice
    const result = await prisma.$runCommandRaw({
      dropIndexes: "User",
      index: "User_customerId_key"
    });

    console.log("✅ Índice eliminado exitosamente:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    console.log("\n💡 Intentando con nombre alternativo del índice...");

    try {
      const result = await prisma.$runCommandRaw({
        dropIndexes: "User",
        index: "customerId_1"
      });
      console.log("✅ Índice eliminado exitosamente con nombre alternativo");
    } catch (e: any) {
      console.error("❌ También falló:", e.message);
    }
  }
}

main().finally(() => prisma.$disconnect());
