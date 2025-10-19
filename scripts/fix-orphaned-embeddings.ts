/**
 * Script: Arreglar Embeddings Huérfanos y Duplicados
 *
 * Problema:
 * - Embeddings creados ANTES del sistema de ContextItems no aparecen en la UI
 * - Archivos parseados múltiples veces generan duplicados
 *
 * Solución:
 * 1. Detectar embeddings sin ContextItem correspondiente
 * 2. Crear ContextItems para embeddings huérfanos
 * 3. Detectar y eliminar duplicados (mantener el más reciente)
 */

import { db } from '../app/utils/db.server';

interface EmbeddingMetadata {
  fileName: string;
  fileType: string;
  chunksCount: number;
  charCount: number;
  uploadedAt: string;
  chatbotId: string;
}

interface EmbeddingData {
  id: string;
  metadata: any;
  createdAt: Date;
}

// Parsear argumentos CLI
const args = process.argv.slice(2);
const isDryRun = !args.includes('--apply');
const migrateAll = args.includes('--all');
const chatbotIdArg = args.find(arg => arg.startsWith('--chatbotId='))?.split('=')[1];

async function fixChatbot(chatbotId: string) {
  console.log(`\n${"─".repeat(60)}`);

  const chatbot = await db.chatbot.findUnique({
    where: { id: chatbotId },
    select: {
      id: true,
      name: true,
      contexts: true,
    }
  });

  if (!chatbot) {
    console.log(`❌ Chatbot ${chatbotId} no encontrado`);
    return { orphaned: 0, duplicates: 0, created: 0, deleted: 0 };
  }

  console.log(`🤖 Chatbot: ${chatbot.name} (${chatbot.id})`);
  console.log(`${"─".repeat(60)}`);

  // 1. Obtener todos los embeddings del chatbot
  const embeddings = await db.embedding.findMany({
    where: { chatbotId },
    select: {
      id: true,
      metadata: true,
      createdAt: true,
    }
  });

  if (embeddings.length === 0) {
    console.log(`  ⚠️  Sin embeddings\n`);
    return { orphaned: 0, duplicates: 0, created: 0, deleted: 0 };
  }

  console.log(`  📊 Embeddings totales: ${embeddings.length}`);

  // 2. Agrupar embeddings por fileName
  const fileGroups = new Map<string, EmbeddingData[]>();

  for (const emb of embeddings) {
    const meta = emb.metadata as unknown as EmbeddingMetadata;
    if (!meta?.fileName) continue;

    const fileName = meta.fileName;
    if (!fileGroups.has(fileName)) {
      fileGroups.set(fileName, []);
    }
    fileGroups.get(fileName)!.push(emb);
  }

  console.log(`  📁 Archivos únicos: ${fileGroups.size}`);

  // 3. Mapear contexts existentes
  const existingFileNames = new Set(
    chatbot.contexts.map((c: any) => c.fileName)
  );

  let orphanedCount = 0;
  let duplicatesCount = 0;
  let createdCount = 0;
  let deletedCount = 0;

  // 4. Procesar cada grupo de archivos
  for (const [fileName, embeddingGroup] of fileGroups.entries()) {
    const isDuplicate = embeddingGroup.length > 1;
    const hasContext = existingFileNames.has(fileName);

    if (isDuplicate) {
      console.log(`  🔴 DUPLICADO: "${fileName}" (${embeddingGroup.length} copias)`);
      duplicatesCount++;

      // Ordenar por fecha (más reciente primero)
      embeddingGroup.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const [keepEmbedding, ...deleteEmbeddings] = embeddingGroup;

      console.log(`    ✅ Mantener: ${keepEmbedding.id} (${keepEmbedding.createdAt.toISOString()})`);

      // Eliminar duplicados antiguos
      for (const embToDelete of deleteEmbeddings) {
        console.log(`    ❌ Eliminar: ${embToDelete.id} (${embToDelete.createdAt.toISOString()})`);

        if (!isDryRun) {
          await db.embedding.delete({
            where: { id: embToDelete.id }
          });
          deletedCount++;
        }
      }

      // Si no tiene context, crearlo con el embedding que se mantiene
      if (!hasContext) {
        orphanedCount++;
        const meta = keepEmbedding.metadata as unknown as EmbeddingMetadata;

        console.log(`    🆕 Crear ContextItem: "${fileName}"`);

        if (!isDryRun) {
          await db.chatbot.update({
            where: { id: chatbotId },
            data: {
              contexts: {
                push: {
                  id: keepEmbedding.id,
                  type: 'FILE',
                  fileName: meta.fileName,
                  fileType: meta.fileType || 'pdf',
                  sizeKB: meta.charCount ? Math.ceil(meta.charCount / 1024) : undefined,
                  createdAt: new Date(meta.uploadedAt || keepEmbedding.createdAt),
                }
              }
            }
          });
          createdCount++;
        }
      }
    } else {
      // Archivo único, verificar si necesita context
      const embedding = embeddingGroup[0];

      if (!hasContext) {
        orphanedCount++;
        const meta = embedding.metadata as unknown as EmbeddingMetadata;

        console.log(`  🟡 HUÉRFANO: "${fileName}"`);
        console.log(`    🆕 Crear ContextItem`);

        if (!isDryRun) {
          await db.chatbot.update({
            where: { id: chatbotId },
            data: {
              contexts: {
                push: {
                  id: embedding.id,
                  type: 'FILE',
                  fileName: meta.fileName,
                  fileType: meta.fileType || 'pdf',
                  sizeKB: meta.charCount ? Math.ceil(meta.charCount / 1024) : undefined,
                  createdAt: new Date(meta.uploadedAt || embedding.createdAt),
                }
              }
            }
          });
          createdCount++;
        }
      } else {
        console.log(`  ✅ OK: "${fileName}"`);
      }
    }
  }

  console.log(`\n  📊 Resumen ${chatbot.name}:`);
  console.log(`     Huérfanos detectados: ${orphanedCount}`);
  console.log(`     Duplicados detectados: ${duplicatesCount}`);
  if (!isDryRun) {
    console.log(`     Contexts creados: ${createdCount}`);
    console.log(`     Embeddings eliminados: ${deletedCount}`);
  }

  return {
    orphaned: orphanedCount,
    duplicates: duplicatesCount,
    created: createdCount,
    deleted: deletedCount
  };
}

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`🔧 REPARACIÓN DE EMBEDDINGS HUÉRFANOS Y DUPLICADOS`);
  console.log(`Modo: ${isDryRun ? "DRY RUN (simulación)" : "PRODUCCIÓN"}`);
  console.log(`${"=".repeat(60)}\n`);

  let chatbotIds: string[] = [];

  // Determinar qué chatbots procesar
  if (chatbotIdArg) {
    console.log(`📌 Procesando chatbot específico: ${chatbotIdArg}\n`);
    chatbotIds = [chatbotIdArg];
  } else if (migrateAll) {
    console.log(`📌 Procesando TODOS los chatbots con embeddings\n`);

    // Buscar todos los chatbots
    const allChatbots = await db.chatbot.findMany({
      select: {
        id: true,
        _count: {
          select: {
            embeddings: true
          }
        }
      }
    });

    // Filtrar solo los que tienen embeddings
    const chatbotsWithEmbeddings = allChatbots.filter(c => c._count.embeddings > 0);
    chatbotIds = chatbotsWithEmbeddings.map(c => c.id);
    console.log(`✅ Encontrados ${chatbotIds.length} chatbots con embeddings\n`);
  } else {
    console.log('❌ Error: Debes especificar --chatbotId=XXX o --all\n');
    console.log('Ejemplos de uso:');
    console.log('  npx tsx scripts/fix-orphaned-embeddings.ts --chatbotId=abc123');
    console.log('  npx tsx scripts/fix-orphaned-embeddings.ts --all --dry-run');
    console.log('  npx tsx scripts/fix-orphaned-embeddings.ts --all --apply\n');
    return;
  }

  if (chatbotIds.length === 0) {
    console.log('⚠️  No hay chatbots para procesar.\n');
    return;
  }

  // Ejecutar reparación
  let totalOrphaned = 0;
  let totalDuplicates = 0;
  let totalCreated = 0;
  let totalDeleted = 0;

  for (let i = 0; i < chatbotIds.length; i++) {
    console.log(`\n[${i + 1}/${chatbotIds.length}]`);
    const result = await fixChatbot(chatbotIds[i]);

    totalOrphaned += result.orphaned;
    totalDuplicates += result.duplicates;
    totalCreated += result.created;
    totalDeleted += result.deleted;
  }

  // Resumen final
  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ RESUMEN FINAL`);
  console.log(`${"=".repeat(60)}`);
  console.log(`Chatbots procesados: ${chatbotIds.length}`);
  console.log(`Huérfanos detectados: ${totalOrphaned}`);
  console.log(`Duplicados detectados: ${totalDuplicates}`);
  if (!isDryRun) {
    console.log(`Contexts creados: ${totalCreated}`);
    console.log(`Embeddings eliminados: ${totalDeleted}`);
    console.log(`\n🎉 ¡Reparación completada exitosamente!`);
  } else {
    console.log(`\n💡 Ejecuta con --apply para aplicar los cambios`);
  }
  console.log(`${"=".repeat(60)}\n`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
