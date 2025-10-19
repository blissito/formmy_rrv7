/**
 * Script para crear índice en metadata.contextId
 * Soluciona bug de filtrado por contextId en RAG API
 */
import { db } from "~/utils/db.server";

async function createIndex() {
  try {
    console.log("🔧 Creando índice en metadata.contextId...\n");

    // Crear índice usando Prisma raw query
    const result = await db.$runCommandRaw({
      createIndexes: "embeddings",
      indexes: [
        {
          key: { "metadata.contextId": 1 },
          name: "metadata_contextId_1",
        },
      ],
    });

    console.log("✅ Índice creado exitosamente:");
    console.log(JSON.stringify(result, null, 2));

    // Listar todos los índices
    console.log("\n📋 Verificando índices en colección embeddings:");
    const indexes = await db.$runCommandRaw({
      listIndexes: "embeddings",
    });

    console.log(JSON.stringify(indexes, null, 2));

    console.log("\n✅ Script completado");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

createIndex();
