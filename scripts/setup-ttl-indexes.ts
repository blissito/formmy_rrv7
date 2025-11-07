/**
 * Script para crear índices TTL en MongoDB
 *
 * MongoDB no crea automáticamente los índices TTL desde Prisma schema.
 * Este script crea manualmente el índice TTL para auto-eliminar
 * webhooks procesados después de X tiempo.
 */

import { db } from "../app/utils/db.server";

async function setupTTLIndexes() {
  console.log("🔧 Setting up TTL indexes...");

  try {
    // Usar raw query para acceder a la colección nativa de MongoDB
    const result = await db.$runCommandRaw({
      createIndexes: "ProcessedWebhook",
      indexes: [
        {
          key: { expiresAt: 1 },
          name: "expiresAt_ttl",
          expireAfterSeconds: 0, // 0 = delete immediately when expiresAt is in the past
        },
      ],
    });

    console.log("✅ TTL index created on ProcessedWebhook.expiresAt");
    console.log("Result:", result);

    // Verificar índices existentes
    const indexes = await db.$runCommandRaw({
      listIndexes: "ProcessedWebhook",
    });

    console.log("\n📊 Current indexes on ProcessedWebhook:");
    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n✅ Setup completed successfully!");
  } catch (error: any) {
    // Si el error es "index already exists", está bien
    if (error.code === 85 || error.message?.includes("already exists")) {
      console.log("⚠️ TTL index already exists (OK)");
    } else {
      console.error("❌ Error setting up TTL indexes:", error);
      throw error;
    }
  } finally {
    await db.$disconnect();
  }
}

setupTTLIndexes().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
