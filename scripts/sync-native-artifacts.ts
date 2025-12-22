#!/usr/bin/env npx tsx
/**
 * Sync Native Artifacts
 *
 * Sincroniza los artefactos nativos de Formmy a la base de datos.
 * Se ejecuta automáticamente en el deploy (ver fly.toml o Dockerfile).
 *
 * USO:
 *   npx tsx scripts/sync-native-artifacts.ts
 *
 * Este script:
 * 1. Lee los artefactos del registry en server/artifacts/native/
 * 2. Crea o actualiza cada uno en la DB
 * 3. Los marca como isNative: true y status: PUBLISHED
 */

import { syncNativeArtifacts, markOrphanedNatives } from "../server/artifacts/sync.service.js";

async function main() {
  console.log("🚀 Starting native artifacts sync...\n");

  try {
    // Sincronizar nativos del código a DB
    const results = await syncNativeArtifacts();

    // Marcar huérfanos (nativos en DB que ya no están en código)
    const orphans = await markOrphanedNatives();

    // Resumen
    console.log("\n========================================");
    console.log("📊 SYNC SUMMARY");
    console.log("========================================");
    console.log(`✅ Created: ${results.created}`);
    console.log(`🔄 Updated: ${results.updated}`);
    console.log(`⚠️  Orphans: ${orphans.length}`);
    console.log(`❌ Errors:  ${results.errors.length}`);

    if (results.errors.length > 0) {
      console.log("\nErrors:");
      results.errors.forEach((err) => console.log(`  - ${err}`));
    }

    if (orphans.length > 0) {
      console.log("\nOrphaned (marked as DRAFT):");
      orphans.forEach((name) => console.log(`  - ${name}`));
    }

    console.log("========================================\n");

    // Exit con error si hubo errores de transpilación
    if (results.errors.length > 0) {
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Fatal error during sync:", error);
    process.exit(1);
  }
}

main();
