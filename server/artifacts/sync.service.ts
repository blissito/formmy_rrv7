/**
 * Sync Service - Sincroniza artefactos nativos al startup
 *
 * Este servicio se ejecuta automáticamente al iniciar la aplicación.
 * Garantiza que todos los artefactos nativos de Formmy estén en la DB
 * con su código más reciente.
 *
 * USO:
 *   import { syncNativeArtifacts } from "server/artifacts/sync.service";
 *   await syncNativeArtifacts(); // En entry.server.ts o startup
 */

import { db } from "../../app/utils/db.server";
import { transpileJSX } from "./transpiler.service";
import {
  NATIVE_REGISTRY,
  SYSTEM_AUTHOR_ID,
  SYSTEM_AUTHOR_EMAIL,
} from "./native";

// ============================================================================
// SYNC FUNCTION
// ============================================================================

/**
 * Sincroniza todos los artefactos nativos a la base de datos.
 *
 * - Crea artefactos que no existen
 * - Actualiza código si cambió
 * - Marca como isNative: true y status: PUBLISHED
 *
 * @returns Número de artefactos sincronizados
 */
export async function syncNativeArtifacts(): Promise<{
  created: number;
  updated: number;
  errors: string[];
}> {
  const results = {
    created: 0,
    updated: 0,
    errors: [] as string[],
  };

  const entries = Object.entries(NATIVE_REGISTRY);

  if (entries.length === 0) {
    console.log("📦 No native artifacts to sync");
    return results;
  }

  console.log(`📦 Syncing ${entries.length} native artifact(s)...`);

  for (const [name, config] of entries) {
    try {
      // Transpilar código
      const transpiled = transpileJSX(config.code);
      if (!transpiled.success) {
        results.errors.push(`${name}: Transpile error - ${transpiled.error}`);
        console.error(`❌ [${name}] Transpile error:`, transpiled.error);
        continue;
      }

      // Verificar si ya existe
      const existing = await db.artifact.findUnique({
        where: { name },
      });

      if (existing) {
        // Actualizar si el código cambió
        const codeChanged = existing.code !== config.code;
        const metadataChanged =
          existing.displayName !== config.metadata.displayName ||
          existing.description !== config.metadata.description ||
          existing.category !== config.metadata.category;

        if (codeChanged || metadataChanged) {
          await db.artifact.update({
            where: { id: existing.id },
            data: {
              code: config.code,
              compiledCode: transpiled.code,
              displayName: config.metadata.displayName,
              description: config.metadata.description,
              category: config.metadata.category,
              events: config.metadata.events,
              propsSchema: config.metadata.propsSchema,
              iconUrl: config.metadata.iconUrl,
              isNative: true,
              status: "PUBLISHED",
            },
          });
          results.updated++;
          console.log(`🔄 [${name}] Updated`);
        } else {
          console.log(`✓ [${name}] Already up to date`);
        }
      } else {
        // Crear nuevo
        await db.artifact.create({
          data: {
            name,
            code: config.code,
            compiledCode: transpiled.code,
            displayName: config.metadata.displayName,
            description: config.metadata.description,
            category: config.metadata.category,
            events: config.metadata.events,
            propsSchema: config.metadata.propsSchema,
            iconUrl: config.metadata.iconUrl,
            authorId: SYSTEM_AUTHOR_ID,
            authorEmail: SYSTEM_AUTHOR_EMAIL,
            isNative: true,
            status: "PUBLISHED",
            reviewedAt: new Date(),
          },
        });
        results.created++;
        console.log(`✅ [${name}] Created`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.errors.push(`${name}: ${message}`);
      console.error(`❌ [${name}] Error:`, message);
    }
  }

  console.log(
    `📦 Sync complete: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`
  );

  return results;
}

// ============================================================================
// OPTIONAL: Mark orphaned natives
// ============================================================================

/**
 * Marca como deprecated los artefactos nativos que ya no están en el registry.
 * Útil si se elimina un artefacto nativo del código.
 *
 * NOTA: No elimina, solo marca. La eliminación es manual.
 */
export async function markOrphanedNatives(): Promise<string[]> {
  const registryNames = Object.keys(NATIVE_REGISTRY);

  // Buscar nativos en DB que no están en el registry
  const orphans = await db.artifact.findMany({
    where: {
      isNative: true,
      name: { notIn: registryNames },
    },
    select: { id: true, name: true },
  });

  if (orphans.length === 0) {
    return [];
  }

  // Marcar como DRAFT (para revisión manual)
  await db.artifact.updateMany({
    where: {
      id: { in: orphans.map((o) => o.id) },
    },
    data: {
      status: "DRAFT",
      reviewNotes: "Artefacto nativo removido del código. Revisar si eliminar.",
    },
  });

  console.log(
    `⚠️ Marked ${orphans.length} orphaned native(s) as DRAFT:`,
    orphans.map((o) => o.name)
  );

  return orphans.map((o) => o.name);
}
