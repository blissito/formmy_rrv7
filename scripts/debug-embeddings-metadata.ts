/**
 * Script para diagnosticar metadatos de embeddings
 * Investigar por qué algunos tienen fileName "Unknown"
 */

import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔍 === DIAGNÓSTICO METADATOS DE EMBEDDINGS ===\n');

  try {
    // 1. Contar embeddings totales
    const total = await db.embedding.count();
    console.log(`📊 Total embeddings: ${total}\n`);

    // 2. Obtener todos los embeddings con sus metadatos
    const embeddings = await db.embedding.findMany({
      select: {
        id: true,
        chatbotId: true,
        content: true,
        metadata: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 3. Analizar metadatos
    console.log('📋 Análisis de metadatos:\n');

    let withFileName = 0;
    let withoutFileName = 0;
    let withUnknownFileName = 0;
    let withNullFileName = 0;

    const fileNames = new Set<string>();
    const problematicEmbeddings: any[] = [];

    embeddings.forEach((emb) => {
      const metadata = emb.metadata as any;

      if (metadata?.fileName) {
        if (metadata.fileName === 'Unknown') {
          withUnknownFileName++;
          problematicEmbeddings.push({
            id: emb.id,
            metadata,
            contentPreview: emb.content?.substring(0, 100)
          });
        } else {
          fileNames.add(metadata.fileName);
          withFileName++;
        }
      } else if (metadata?.fileName === null) {
        withNullFileName++;
        problematicEmbeddings.push({
          id: emb.id,
          metadata,
          contentPreview: emb.content?.substring(0, 100)
        });
      } else {
        withoutFileName++;
        problematicEmbeddings.push({
          id: emb.id,
          metadata,
          contentPreview: emb.content?.substring(0, 100)
        });
      }
    });

    console.log(`   ✅ Con fileName válido: ${withFileName}`);
    console.log(`   ❌ Con fileName "Unknown": ${withUnknownFileName}`);
    console.log(`   ⚠️  Con fileName null: ${withNullFileName}`);
    console.log(`   ⚠️  Sin campo fileName: ${withoutFileName}`);
    console.log();

    // 4. Mostrar archivos únicos
    if (fileNames.size > 0) {
      console.log('📁 Archivos únicos encontrados:');
      Array.from(fileNames).forEach((name, i) => {
        console.log(`   ${i + 1}. ${name}`);
      });
      console.log();
    }

    // 5. Mostrar embeddings problemáticos
    if (problematicEmbeddings.length > 0) {
      console.log(`⚠️  Embeddings problemáticos (${problematicEmbeddings.length}):\n`);

      problematicEmbeddings.slice(0, 5).forEach((emb, i) => {
        console.log(`${i + 1}. ID: ${emb.id}`);
        console.log(`   Metadata:`, JSON.stringify(emb.metadata, null, 2));
        console.log(`   Content preview: ${emb.contentPreview}...`);
        console.log();
      });

      if (problematicEmbeddings.length > 5) {
        console.log(`   ... y ${problematicEmbeddings.length - 5} más\n`);
      }
    }

    // 6. Verificar si hay contextos asociados
    console.log('🔗 Verificando contextos asociados:\n');

    const contextsWithMetadata = new Map<string, any>();

    for (const emb of problematicEmbeddings.slice(0, 3)) {
      const metadata = emb.metadata as any;
      const contextId = metadata?.contextId;

      if (contextId) {
        console.log(`   Buscando contexto: ${contextId}`);

        const context = await db.context.findUnique({
          where: { id: contextId },
          select: {
            id: true,
            type: true,
            content: true,
            fileName: true,
            url: true,
            title: true
          }
        });

        if (context) {
          console.log(`   ✅ Contexto encontrado:`);
          console.log(`      Type: ${context.type}`);
          console.log(`      FileName: ${context.fileName || 'null'}`);
          console.log(`      Title: ${context.title || 'null'}`);
          console.log(`      URL: ${context.url || 'null'}`);
          contextsWithMetadata.set(contextId, context);
        } else {
          console.log(`   ❌ Contexto NO encontrado (huérfano)`);
        }
        console.log();
      }
    }

    // 7. Proponer solución
    console.log('\n' + '='.repeat(60));
    console.log('💡 ANÁLISIS Y SOLUCIÓN');
    console.log('='.repeat(60) + '\n');

    if (withUnknownFileName > 0 || withNullFileName > 0 || withoutFileName > 0) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log(`   ${withUnknownFileName + withNullFileName + withoutFileName} embeddings tienen metadata incompleta.\n`);

      console.log('📖 Posibles causas:');
      console.log('   1. El contexto original fue eliminado');
      console.log('   2. La metadata no se copió correctamente al crear el embedding');
      console.log('   3. El proceso de vectorización tuvo un error\n');

      console.log('🔧 SOLUCIONES:');
      console.log('   A. Re-sincronizar metadata desde contextos existentes');
      console.log('   B. Eliminar embeddings huérfanos sin contexto asociado');
      console.log('   C. Re-vectorizar los documentos desde cero\n');

      if (contextsWithMetadata.size > 0) {
        console.log('✅ Hay contextos válidos disponibles para re-sincronizar metadata\n');
      }
    } else {
      console.log('✅ Todos los embeddings tienen metadata válida!');
    }

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
