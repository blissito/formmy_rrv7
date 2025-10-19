/**
 * Test: Llamar directamente al RAG sin pasar por HTTP
 * Para ver exactamente qué metadata devuelve
 */

import { vectorSearch } from '../server/vector/vector-search.service';
import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔍 === TEST: RAG Directo "precios" ===\n');

  const CHATBOT_ID = '68f456dca443330f35f8c81d';

  try {
    // 1. Hacer búsqueda vectorial directa
    console.log('🔎 Buscando "precios"...\n');

    const results = await vectorSearch('precios', CHATBOT_ID, 5);

    console.log(`✅ ${results.length} resultados encontrados\n`);

    // 2. Obtener lista de documentos (como hace el componente)
    const chatbot = await db.chatbot.findUnique({
      where: { id: CHATBOT_ID },
      select: { contexts: true }
    });

    const parsingJobs = await db.parsingJob.findMany({
      where: { chatbotId: CHATBOT_ID, status: 'COMPLETED' },
      select: {
        id: true,
        fileName: true
      }
    });

    // Crear lookup de documentos por ID (como hace DeveloperTools)
    const docsById: Record<string, any> = {};

    if (chatbot?.contexts) {
      chatbot.contexts.forEach((ctx: any) => {
        docsById[ctx.id] = {
          id: ctx.id,
          fileName: ctx.fileName || ctx.title || ctx.url || 'Unknown',
          type: ctx.type
        };
      });
    }

    parsingJobs.forEach((job: any) => {
      docsById[job.id] = {
        id: job.id,
        fileName: job.fileName || 'Unknown',
        type: 'PARSING_JOB'
      };
    });

    console.log(`📚 Documentos disponibles: ${Object.keys(docsById).length}\n`);

    // 3. Analizar cada resultado exactamente como lo hace el componente
    results.forEach((chunk, i) => {
      console.log(`═══════════════════════════════════════════════════════`);
      console.log(`CHUNK #${i + 1}`);
      console.log(`═══════════════════════════════════════════════════════\n`);

      console.log(`Score: ${(chunk.score * 100).toFixed(1)}%`);
      console.log(`Chunk Index: ${chunk.metadata.chunkIndex ?? 'N/A'}\n`);

      // Metadata del chunk
      console.log(`📦 Metadata del chunk:`);
      console.log(`   contextId: ${chunk.metadata.contextId || 'NO'}`);
      console.log(`   contextType: ${chunk.metadata.contextType || 'NO'}`);
      console.log(`   fileName: ${chunk.metadata.fileName === null ? 'null' : chunk.metadata.fileName === undefined ? 'undefined' : `"${chunk.metadata.fileName}"`}`);
      console.log(`   title: ${chunk.metadata.title === null ? 'null' : chunk.metadata.title === undefined ? 'undefined' : `"${chunk.metadata.title}"`}`);
      console.log(`   url: ${chunk.metadata.url === null ? 'null' : chunk.metadata.url === undefined ? 'undefined' : `"${chunk.metadata.url}"`}\n`);

      // Documento asociado
      const contextId = chunk.metadata.contextId;
      const sourceDoc = contextId ? docsById[contextId] : null;

      if (sourceDoc) {
        console.log(`📄 Documento asociado:`);
        console.log(`   ID: ${sourceDoc.id}`);
        console.log(`   Type: ${sourceDoc.type}`);
        console.log(`   fileName: ${sourceDoc.fileName}\n`);
      } else {
        console.log(`⚠️  Documento NO encontrado en lookup\n`);
      }

      // Simular EXACTAMENTE la lógica del componente (línea 482)
      // const sourceName = getSourceName(chunk.metadata) || sourceDoc?.fileName || 'Unknown';

      // Paso 1: getSourceName
      let sourceName;
      if (chunk.metadata.fileName) {
        sourceName = chunk.metadata.fileName;
      } else if (chunk.metadata.title) {
        sourceName = chunk.metadata.title;
      } else if (chunk.metadata.url) {
        try {
          sourceName = new URL(chunk.metadata.url).hostname;
        } catch {
          sourceName = chunk.metadata.url;
        }
      } else {
        sourceName = 'Unknown';
      }

      console.log(`🎯 getSourceName() retorna: "${sourceName}"`);

      // Paso 2: Fallback a sourceDoc
      const finalName = sourceName || sourceDoc?.fileName || 'Unknown';

      console.log(`🎯 RESULTADO FINAL: "${finalName}"`);

      if (finalName === 'Unknown') {
        console.log(`\n❌❌❌ ESTE ES EL CHUNK QUE MUESTRA "UNKNOWN" ❌❌❌\n`);
        console.log(`DIAGNÓSTICO:`);
        console.log(`  1. chunk.metadata.fileName = ${chunk.metadata.fileName}`);
        console.log(`  2. chunk.metadata.title = ${chunk.metadata.title}`);
        console.log(`  3. chunk.metadata.url = ${chunk.metadata.url}`);
        console.log(`  4. sourceDoc = ${sourceDoc ? 'EXISTS' : 'NULL'}`);
        console.log(`  5. sourceDoc?.fileName = ${sourceDoc?.fileName}\n`);
      }

      console.log(`Content: ${chunk.content.substring(0, 100)}...\n`);
    });

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
