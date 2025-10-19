/**
 * Ultra Diagnóstico Vector Search
 * Pruebas exhaustivas para identificar exactamente qué está fallando
 */

import { db } from '~/utils/db.server';
import { generateEmbedding } from '../server/vector/embedding.service';
import { VECTOR_INDEX_NAME } from '../server/vector/vector-config';

async function main() {
  console.log('\n🔬 === ULTRA DIAGNÓSTICO VECTOR SEARCH ===\n');
  console.log(`📇 Index configurado: ${VECTOR_INDEX_NAME}\n`);

  const results: any = {
    embeddings: null,
    chatbotId: null,
    chatbotIdType: null,
    searchNoFilter: null,
    searchWithStringFilter: null,
    searchWithObjectIdFilter: null,
  };

  try {
    // ===== PASO 1: Verificar embeddings en DB =====
    console.log('📊 PASO 1: Verificar embeddings en DB\n');

    const totalEmbeddings = await db.embedding.count();
    console.log(`   Total embeddings: ${totalEmbeddings}`);

    if (totalEmbeddings === 0) {
      console.log('   ❌ No hay embeddings en la DB');
      process.exit(1);
    }

    results.embeddings = totalEmbeddings;

    // Obtener un embedding de muestra
    const sampleEmbedding = await db.embedding.findFirst();
    if (!sampleEmbedding) {
      console.log('   ❌ No se pudo obtener embedding de muestra');
      process.exit(1);
    }

    console.log(`   ✅ Embedding de muestra:`);
    console.log(`      ID: ${sampleEmbedding.id}`);
    console.log(`      ChatbotId: ${sampleEmbedding.chatbotId}`);
    console.log(`      ChatbotId Type: ${typeof sampleEmbedding.chatbotId}`);
    console.log(`      Content preview: ${sampleEmbedding.content?.substring(0, 50)}...`);
    console.log(`      Embedding length: ${(sampleEmbedding.embedding as any)?.length || 0}\n`);

    results.chatbotId = sampleEmbedding.chatbotId;
    results.chatbotIdType = typeof sampleEmbedding.chatbotId;

    // ===== PASO 2: Generar embedding de búsqueda =====
    console.log('🔍 PASO 2: Generar embedding para "animal"\n');

    const queryEmbedding = await generateEmbedding('animal');
    console.log(`   ✅ Embedding generado: ${queryEmbedding.length} dimensiones\n`);

    // ===== PASO 3: Búsqueda SIN filtro =====
    console.log('🧪 PASO 3: Búsqueda SIN filtro\n');

    try {
      const noFilterResults = await db.embedding.aggregateRaw({
        pipeline: [
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit: 10
              // SIN FILTER
            }
          },
          {
            $project: {
              _id: 1,
              chatbotId: 1,
              content: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ]
      });

      results.searchNoFilter = (noFilterResults as any[]).length;
      console.log(`   ✅ Resultados sin filtro: ${(noFilterResults as any[]).length}\n`);

      if ((noFilterResults as any[]).length > 0) {
        console.log('   📋 Top 3 resultados:');
        (noFilterResults as any[]).slice(0, 3).forEach((r: any, i: number) => {
          console.log(`      ${i + 1}. [${r.score?.toFixed(4)}] ChatbotId: ${r.chatbotId?.$oid || r.chatbotId}`);
          console.log(`         ${r.content?.substring(0, 60)}...\n`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.searchNoFilter = `ERROR: ${error.message}`;
    }

    // ===== PASO 4: Búsqueda CON filtro (String) =====
    console.log('🧪 PASO 4: Búsqueda CON filtro de chatbotId (String)\n');

    const chatbotIdString = sampleEmbedding.chatbotId;
    console.log(`   Usando chatbotId como String: ${chatbotIdString}`);

    try {
      const stringFilterResults = await db.embedding.aggregateRaw({
        pipeline: [
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit: 10,
              filter: {
                chatbotId: chatbotIdString // String directo
              }
            }
          },
          {
            $project: {
              _id: 1,
              chatbotId: 1,
              content: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ]
      });

      results.searchWithStringFilter = (stringFilterResults as any[]).length;
      console.log(`   ✅ Resultados con filtro String: ${(stringFilterResults as any[]).length}\n`);

      if ((stringFilterResults as any[]).length > 0) {
        console.log('   📋 Top 3 resultados:');
        (stringFilterResults as any[]).slice(0, 3).forEach((r: any, i: number) => {
          console.log(`      ${i + 1}. [${r.score?.toFixed(4)}] ${r.content?.substring(0, 60)}...\n`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.searchWithStringFilter = `ERROR: ${error.message}`;
    }

    // ===== PASO 5: Búsqueda CON filtro (ObjectId) =====
    console.log('🧪 PASO 5: Búsqueda CON filtro de chatbotId (ObjectId format)\n');

    try {
      const objectIdFilterResults = await db.embedding.aggregateRaw({
        pipeline: [
          {
            $vectorSearch: {
              index: VECTOR_INDEX_NAME,
              path: 'embedding',
              queryVector: queryEmbedding,
              numCandidates: 50,
              limit: 10,
              filter: {
                chatbotId: { $oid: chatbotIdString } // ObjectId format
              }
            }
          },
          {
            $project: {
              _id: 1,
              chatbotId: 1,
              content: 1,
              score: { $meta: 'vectorSearchScore' }
            }
          }
        ]
      });

      results.searchWithObjectIdFilter = (objectIdFilterResults as any[]).length;
      console.log(`   ✅ Resultados con filtro ObjectId: ${(objectIdFilterResults as any[]).length}\n`);

      if ((objectIdFilterResults as any[]).length > 0) {
        console.log('   📋 Top 3 resultados:');
        (objectIdFilterResults as any[]).slice(0, 3).forEach((r: any, i: number) => {
          console.log(`      ${i + 1}. [${r.score?.toFixed(4)}] ${r.content?.substring(0, 60)}...\n`);
        });
      }
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
      results.searchWithObjectIdFilter = `ERROR: ${error.message}`;
    }

    // ===== PASO 6: Verificar tipo de chatbotId en MongoDB raw =====
    console.log('🔬 PASO 6: Verificar tipo de chatbotId directamente en MongoDB\n');

    try {
      const rawDoc = await db.embedding.aggregateRaw({
        pipeline: [
          { $limit: 1 },
          {
            $project: {
              chatbotId: 1,
              chatbotIdType: { $type: '$chatbotId' }
            }
          }
        ]
      });

      console.log('   Raw document from MongoDB:');
      console.log(JSON.stringify(rawDoc, null, 2));
      console.log();
    } catch (error: any) {
      console.log(`   ❌ Error: ${error.message}\n`);
    }

    // ===== RESUMEN =====
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN DEL DIAGNÓSTICO');
    console.log('='.repeat(60) + '\n');

    console.log(`Index usado: ${VECTOR_INDEX_NAME}`);
    console.log(`Total embeddings: ${results.embeddings}`);
    console.log(`ChatbotId de muestra: ${results.chatbotId}`);
    console.log(`Tipo de ChatbotId: ${results.chatbotIdType}`);
    console.log(`\nResultados de búsqueda:`);
    console.log(`  - Sin filtro: ${results.searchNoFilter}`);
    console.log(`  - Con filtro String: ${results.searchWithStringFilter}`);
    console.log(`  - Con filtro ObjectId: ${results.searchWithObjectIdFilter}`);

    console.log('\n' + '='.repeat(60));
    console.log('💡 ANÁLISIS');
    console.log('='.repeat(60) + '\n');

    if (results.searchNoFilter > 0 && results.searchWithStringFilter === 0 && results.searchWithObjectIdFilter === 0) {
      console.log('❌ PROBLEMA IDENTIFICADO:');
      console.log('   El índice funciona SIN filtro pero NO funciona CON filtro.\n');
      console.log('   Esto significa que el campo "chatbotId" NO está configurado');
      console.log('   como filtro en el índice de Atlas.\n');
      console.log('📖 SOLUCIÓN:');
      console.log(`   Edita el índice "${VECTOR_INDEX_NAME}" en MongoDB Atlas`);
      console.log('   y agrega este campo en "fields":\n');
      console.log('   {');
      console.log('     "type": "filter",');
      console.log('     "path": "chatbotId"');
      console.log('   }\n');
    } else if (results.searchWithStringFilter > 0) {
      console.log('✅ ¡FUNCIONA CON FILTRO STRING!');
      console.log('   El vector search está funcionando correctamente.');
    } else if (results.searchWithObjectIdFilter > 0) {
      console.log('✅ ¡FUNCIONA CON FILTRO OBJECTID!');
      console.log('   El vector search funciona pero necesita formato ObjectId.');
      console.log('   Actualiza el código para usar: { $oid: chatbotId }');
    } else if (results.searchNoFilter === 0) {
      console.log('❌ PROBLEMA CRÍTICO:');
      console.log(`   El índice "${VECTOR_INDEX_NAME}" no existe o no está funcionando.`);
      console.log('   Verifica que el índice esté Active en Atlas.');
    }

    console.log('\n');

  } catch (error: any) {
    console.error('❌ Error durante el diagnóstico:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
