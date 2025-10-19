/**
 * Migration Script: ParsingJobs → ContextItems
 *
 * Convierte ParsingJobs antiguos (COMPLETED) sin ContextItem correspondiente
 * en ContextItems normales en chatbot.contexts[]
 *
 * Uso:
 *   npx tsx scripts/migrate-parsing-jobs-to-contexts.ts [--dry-run] [--chatbot-id=xxx]
 */

import { db } from "~/utils/db.server";
import { ObjectId } from "mongodb";

interface MigrationStats {
  totalParsingJobs: number;
  alreadyMigrated: number;
  migrated: number;
  failed: number;
  skipped: number;
}

async function main() {
  const isDryRun = process.argv.includes("--dry-run");
  const chatbotIdArg = process.argv.find((arg) => arg.startsWith("--chatbot-id="));
  const targetChatbotId = chatbotIdArg ? chatbotIdArg.split("=")[1] : null;

  console.log("🔄 Migration: ParsingJobs → ContextItems");
  console.log(`Mode: ${isDryRun ? "DRY RUN (no changes)" : "PRODUCTION"}`);
  if (targetChatbotId) {
    console.log(`Target: Chatbot ${targetChatbotId} only`);
  }
  console.log("============================================================\n");

  const stats: MigrationStats = {
    totalParsingJobs: 0,
    alreadyMigrated: 0,
    migrated: 0,
    failed: 0,
    skipped: 0,
  };

  // 1. Obtener todos los ParsingJobs completados
  const whereClause: any = {
    status: { in: ["COMPLETED", "COMPLETED_NO_VECTOR"] },
  };
  if (targetChatbotId) {
    whereClause.chatbotId = targetChatbotId;
  }

  const parsingJobs = await db.parsingJob.findMany({
    where: whereClause,
    orderBy: { createdAt: "asc" },
  });

  stats.totalParsingJobs = parsingJobs.length;
  console.log(`📋 Found ${parsingJobs.length} completed ParsingJobs\n`);

  if (parsingJobs.length === 0) {
    console.log("✅ No ParsingJobs to migrate!");
    return;
  }

  // 2. Procesar cada ParsingJob
  for (const job of parsingJobs) {
    console.log(`\n📄 Processing: ${job.fileName} (${job.id})`);
    console.log(`   Chatbot: ${job.chatbotId}`);
    console.log(`   Mode: ${job.mode} | Pages: ${job.pages || "N/A"} | Credits: ${job.creditsUsed}`);

    try {
      // 2.1. Verificar si el chatbot existe
      const chatbot = await db.chatbot.findUnique({
        where: { id: job.chatbotId },
        select: { id: true, contexts: true },
      });

      if (!chatbot) {
        console.log(`   ⚠️  Chatbot ${job.chatbotId} not found - SKIPPED`);
        stats.skipped++;
        continue;
      }

      // 2.2. Verificar si ya existe un ContextItem con este ID
      const contexts = chatbot.contexts as any[];
      const existingContext = contexts.find((ctx: any) => ctx.id === job.id);

      if (existingContext) {
        console.log(`   ✅ Already migrated (ContextItem exists)`);
        stats.alreadyMigrated++;
        continue;
      }

      // 2.3. Verificar que tenga resultMarkdown
      if (!job.resultMarkdown) {
        console.log(`   ⚠️  No resultMarkdown - SKIPPED`);
        stats.skipped++;
        continue;
      }

      // 2.4. Construir ContextItem
      const sizeKB = Math.round(Buffer.byteLength(job.resultMarkdown, 'utf8') / 1024);

      const contextItem = {
        id: job.id, // Usar job.id para preservar referencia
        type: "FILE",
        fileName: job.fileName,
        fileType: job.fileType,
        fileUrl: null,
        url: null,
        title: null,
        sizeKB,
        content: job.resultMarkdown,
        routes: [],
        questions: null,
        answer: null,
        createdAt: job.createdAt,
        // Metadata de parsing
        parsingMode: job.mode,
        parsingPages: job.pages || null,
        parsingCredits: job.creditsUsed,
      };

      console.log(`   📝 Creating ContextItem (${sizeKB} KB)`);

      // 2.5. Insertar en chatbot.contexts[] usando $push MongoDB
      if (!isDryRun) {
        // Obtener contexts actuales
        const currentChatbot = await db.chatbot.findUnique({
          where: { id: job.chatbotId },
          select: { contexts: true, contextSizeKB: true }
        });

        if (!currentChatbot) {
          throw new Error("Chatbot not found");
        }

        // Agregar nuevo contexto al array
        const updatedContexts = [...(currentChatbot.contexts as any[]), contextItem];

        // Actualizar chatbot con nuevo array
        await db.chatbot.update({
          where: { id: job.chatbotId },
          data: {
            contexts: updatedContexts,
            contextSizeKB: (currentChatbot.contextSizeKB || 0) + sizeKB
          }
        });

        console.log(`   ✅ MIGRATED successfully`);
        stats.migrated++;
      } else {
        console.log(`   🔍 Would migrate (DRY RUN)`);
        stats.migrated++;
      }

    } catch (error) {
      console.error(`   ❌ FAILED:`, error instanceof Error ? error.message : error);
      stats.failed++;
    }
  }

  // 3. Resumen final
  console.log("\n============================================================");
  console.log("📊 MIGRATION SUMMARY");
  console.log("============================================================");
  console.log(`Total ParsingJobs: ${stats.totalParsingJobs}`);
  console.log(`Already migrated: ${stats.alreadyMigrated}`);
  console.log(`Migrated: ${stats.migrated} ${isDryRun ? "(DRY RUN)" : ""}`);
  console.log(`Skipped: ${stats.skipped}`);
  console.log(`Failed: ${stats.failed}`);
  console.log("============================================================\n");

  if (isDryRun && stats.migrated > 0) {
    console.log("💡 Run without --dry-run to apply changes");
  } else if (stats.migrated > 0) {
    console.log("✅ Migration completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("   1. Verify ContextItems appear in Entrenamiento section");
    console.log("   2. Test deletion from UI");
    console.log("   3. Verify embeddings still work (contextId unchanged)");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
