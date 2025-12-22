#!/usr/bin/env npx tsx
/**
 * Load Native Artifacts
 *
 * Lee los componentes de app/components/native-artifacts/ y los carga a la DB.
 * Usa el manifest.ts para la metadata de cada artefacto.
 *
 * USO:
 *   npm run load:artifacts
 *
 * FLUJO:
 * 1. Lee el manifest con la metadata de cada artefacto
 * 2. Lee el código fuente de cada archivo .tsx
 * 3. Hace upsert a la DB (crea o actualiza)
 * 4. Marca como isNative: true y status: PUBLISHED
 */

import { readFileSync } from "fs";
import { join } from "path";
import { db } from "../app/utils/db.server";
import { transpileJSX } from "../server/artifacts/transpiler.service";
import { NATIVE_ARTIFACTS_MANIFEST } from "../app/components/native-artifacts/manifest";

const ARTIFACTS_DIR = join(process.cwd(), "app/components/native-artifacts");
const SYSTEM_AUTHOR_ID = "000000000000000000000000";
const SYSTEM_AUTHOR_EMAIL = "team@formmy.app";

interface LoadResult {
  created: number;
  updated: number;
  errors: string[];
}

async function loadNativeArtifacts(): Promise<LoadResult> {
  const results: LoadResult = {
    created: 0,
    updated: 0,
    errors: [],
  };

  console.log(`📦 Loading ${NATIVE_ARTIFACTS_MANIFEST.length} native artifact(s)...\n`);

  for (const entry of NATIVE_ARTIFACTS_MANIFEST) {
    const filePath = join(ARTIFACTS_DIR, `${entry.file}.tsx`);

    try {
      // Leer código fuente
      const code = readFileSync(filePath, "utf-8");

      // Transpilar JSX → JavaScript
      const transpiled = transpileJSX(code);
      if (!transpiled.success) {
        results.errors.push(`${entry.name}: Transpile error - ${transpiled.error}`);
        console.error(`❌ [${entry.name}] Transpile error:`, transpiled.error);
        continue;
      }

      // Verificar si existe
      const existing = await db.artifact.findUnique({
        where: { name: entry.name },
      });

      if (existing) {
        // Actualizar
        await db.artifact.update({
          where: { id: existing.id },
          data: {
            code,
            compiledCode: transpiled.code,
            displayName: entry.displayName,
            description: entry.description,
            category: entry.category,
            events: entry.events,
            propsSchema: entry.propsSchema,
            isNative: true,
            status: "PUBLISHED",
          },
        });
        results.updated++;
        console.log(`🔄 [${entry.name}] Updated`);
      } else {
        // Crear nuevo
        await db.artifact.create({
          data: {
            name: entry.name,
            code,
            compiledCode: transpiled.code,
            displayName: entry.displayName,
            description: entry.description,
            category: entry.category,
            events: entry.events,
            propsSchema: entry.propsSchema,
            authorId: SYSTEM_AUTHOR_ID,
            authorEmail: SYSTEM_AUTHOR_EMAIL,
            isNative: true,
            status: "PUBLISHED",
            reviewedAt: new Date(),
          },
        });
        results.created++;
        console.log(`✅ [${entry.name}] Created`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.errors.push(`${entry.name}: ${message}`);
      console.error(`❌ [${entry.name}] Error:`, message);
    }
  }

  return results;
}

async function main() {
  console.log("🚀 Loading native artifacts from app/components/native-artifacts/\n");

  const results = await loadNativeArtifacts();

  console.log("\n========================================");
  console.log("📊 LOAD SUMMARY");
  console.log("========================================");
  console.log(`✅ Created: ${results.created}`);
  console.log(`🔄 Updated: ${results.updated}`);
  console.log(`❌ Errors:  ${results.errors.length}`);

  if (results.errors.length > 0) {
    console.log("\nErrors:");
    results.errors.forEach((err) => console.log(`  - ${err}`));
  }

  console.log("========================================\n");

  process.exit(results.errors.length > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("\n❌ Fatal error:", error);
  process.exit(1);
});
