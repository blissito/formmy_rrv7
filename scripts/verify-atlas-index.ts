/**
 * Script para verificar la configuración del índice de Atlas
 * Ayuda a diagnosticar problemas con vector search
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('\n🔍 === VERIFICACIÓN DE ÍNDICE ATLAS ===\n');

  // 1. Verificar que hay embeddings en la BD
  const totalEmbeddings = await db.embedding.count();
  console.log(`📊 Total embeddings en BD: ${totalEmbeddings}`);

  if (totalEmbeddings === 0) {
    console.log('⚠️  No hay embeddings. Ejecuta primero: npx tsx scripts/test-vector-rag.ts');
    return;
  }

  // 2. Verificar estructura de un embedding
  const sampleEmbedding = await db.embedding.findFirst({
    select: {
      id: true,
      chatbotId: true,
      embedding: true,
      metadata: true
    }
  });

  if (!sampleEmbedding) {
    console.log('❌ No se pudo obtener un embedding de muestra');
    return;
  }

  console.log(`\n✅ Embedding de muestra:`);
  console.log(`   ID: ${sampleEmbedding.id}`);
  console.log(`   ChatbotId: ${sampleEmbedding.chatbotId}`);
  console.log(`   Embedding dimensions: ${Array.isArray(sampleEmbedding.embedding) ? (sampleEmbedding.embedding as number[]).length : 'NO ES ARRAY'}`);
  console.log(`   Metadata: ${JSON.stringify(sampleEmbedding.metadata)}`);

  // 3. Intentar una búsqueda vectorial básica SIN filtros
  console.log(`\n🔎 Test 1: Búsqueda vectorial SIN filtros...`);

  // Crear un vector de prueba simple (todos 0.1)
  const testVector = new Array(768).fill(0.1);

  try {
    const result = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: testVector,
            numCandidates: 10,
            limit: 1
          }
        },
        {
          $project: {
            _id: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   ✅ Query ejecutada exitosamente`);
    console.log(`   Resultados: ${(result as any[]).length}`);

    if ((result as any[]).length > 0) {
      console.log(`   Score del primer resultado: ${(result as any[])[0].score}`);
    }
  } catch (error: any) {
    console.log(`   ❌ Error en búsqueda:`);

    if (error.message.includes('vector field is indexed')) {
      console.log(`      → PROBLEMA DE DIMENSIONES: El índice tiene dimensiones diferentes a 768`);
      console.log(`      → SOLUCIÓN: Recrear el índice con numDimensions: 768`);
    } else if (error.message.includes('index not found') || error.message.includes('$vectorSearch')) {
      console.log(`      → ÍNDICE NO ENCONTRADO: 'vector_index' no existe`);
      console.log(`      → SOLUCIÓN: Crear el índice en Atlas UI`);
    } else if (error.message.includes('filter')) {
      console.log(`      → PROBLEMA DE FILTROS: El campo de filtro no está indexado`);
      console.log(`      → SOLUCIÓN: Agregar campo 'chatbotId' como filter en el índice`);
    } else {
      console.log(`      → Error: ${error.message}`);
    }
  }

  // 4. Test con filtro de chatbotId
  console.log(`\n🔎 Test 2: Búsqueda vectorial CON filtro chatbotId...`);

  try {
    const result = await db.embedding.aggregateRaw({
      pipeline: [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: testVector,
            numCandidates: 10,
            limit: 1,
            filter: {
              chatbotId: { $oid: sampleEmbedding.chatbotId }
            }
          }
        },
        {
          $project: {
            _id: 1,
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ]
    });

    console.log(`   ✅ Query con filtro ejecutada exitosamente`);
    console.log(`   Resultados: ${(result as any[]).length}`);
  } catch (error: any) {
    console.log(`   ❌ Error con filtro:`);

    if (error.message.includes('needs to be indexed as filter')) {
      console.log(`      → FILTRO NO INDEXADO: 'chatbotId' no está configurado como filter`);
      console.log(`      → SOLUCIÓN: Agregar al índice:`);
      console.log(`         {`);
      console.log(`           "type": "filter",`);
      console.log(`           "path": "chatbotId"`);
      console.log(`         }`);
    } else {
      console.log(`      → Error: ${error.message}`);
    }
  }

  // 5. Resumen y recomendaciones
  console.log(`\n📋 === RESUMEN ===\n`);
  console.log(`Configuración esperada del índice 'vector_index':`);
  console.log(`\n{`);
  console.log(`  "fields": [`);
  console.log(`    {`);
  console.log(`      "type": "vector",`);
  console.log(`      "path": "embedding",`);
  console.log(`      "numDimensions": 768,`);
  console.log(`      "similarity": "cosine"`);
  console.log(`    },`);
  console.log(`    {`);
  console.log(`      "type": "filter",`);
  console.log(`      "path": "chatbotId"`);
  console.log(`    }`);
  console.log(`  ]`);
  console.log(`}\n`);

  console.log(`📍 Ubicación: MongoDB Atlas → Tu Cluster → Atlas Search → vector_index\n`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
