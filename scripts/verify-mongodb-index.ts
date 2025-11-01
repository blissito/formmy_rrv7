/**
 * Script de Verificación: MongoDB Vector Search Index
 *
 * Este script verifica que el índice vectorial requerido para RAG
 * esté correctamente configurado en MongoDB Atlas.
 *
 * IMPORTANTE: Ejecutar ANTES de deploy a producción oficial
 */

import { MongoClient } from 'mongodb';

const MONGO_ATLAS = process.env.MONGO_ATLAS || process.env.DATABASE_URL;
const VECTOR_INDEX_NAME = process.env.VECTOR_INDEX_NAME || 'vector_index_bliss';
const EXPECTED_DIMENSIONS = 768; // text-embedding-3-small

async function verifyVectorIndex() {
  if (!MONGO_ATLAS) {
    console.error('❌ ERROR: MONGO_ATLAS o DATABASE_URL no está configurado');
    console.error('   Configura la variable de entorno antes de ejecutar este script');
    process.exit(1);
  }

  console.log('🔍 Verificando Vector Search Index en MongoDB Atlas...\n');

  const client = new MongoClient(MONGO_ATLAS);

  try {
    await client.connect();
    console.log('✅ Conectado a MongoDB Atlas\n');

    const db = client.db();
    const collection = db.collection('EmbeddedContext');

    // Obtener información de la colección
    const stats = await collection.stats();
    console.log(`📊 Colección: EmbeddedContext`);
    console.log(`   - Documentos: ${stats.count}`);
    console.log(`   - Tamaño: ${(stats.size / 1024 / 1024).toFixed(2)} MB\n`);

    // Intentar listar índices (MongoDB Atlas Search indexes no son visibles via driver)
    const indexes = await collection.listIndexes().toArray();
    console.log(`📋 Índices regulares encontrados: ${indexes.length}`);
    indexes.forEach(idx => {
      console.log(`   - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    console.log('\n⚠️  IMPORTANTE: Vector Search Indexes NO son visibles via MongoDB driver');
    console.log('   Debes verificar manualmente en MongoDB Atlas:\n');
    console.log('   1. Ir a: https://cloud.mongodb.com');
    console.log('   2. Seleccionar tu cluster');
    console.log('   3. Navegar a: Atlas Search → Search Indexes');
    console.log(`   4. Buscar índice: "${VECTOR_INDEX_NAME}"`);
    console.log(`   5. Verificar:`);
    console.log(`      - Status: "Active" (verde)`);
    console.log(`      - Database: formmy (o tu DB)`);
    console.log(`      - Collection: EmbeddedContext`);
    console.log(`      - Type: Vector Search`);
    console.log(`      - Dimensions: ${EXPECTED_DIMENSIONS}`);
    console.log(`      - Similarity: cosine\n`);

    console.log('📝 Configuración esperada del índice:');
    console.log(`{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": ${EXPECTED_DIMENSIONS},
      "similarity": "cosine"
    }
  ]
}\n`);

    // Verificar que hay documentos con embeddings
    const sampleDoc = await collection.findOne({ embedding: { $exists: true } });

    if (sampleDoc) {
      console.log('✅ Documento de prueba con embedding encontrado');
      if (Array.isArray(sampleDoc.embedding)) {
        console.log(`   - Dimensiones: ${sampleDoc.embedding.length}`);
        if (sampleDoc.embedding.length === EXPECTED_DIMENSIONS) {
          console.log(`   - ✅ Dimensiones correctas (${EXPECTED_DIMENSIONS})`);
        } else {
          console.log(`   - ⚠️  Dimensiones incorrectas (esperado: ${EXPECTED_DIMENSIONS})`);
        }
      }
    } else {
      console.log('⚠️  No se encontraron documentos con embeddings');
      console.log('   Esto es normal si no se ha subido contenido aún\n');
    }

    console.log('\n✅ Verificación completada');
    console.log('   Si el índice NO existe en Atlas, créalo con la configuración mostrada arriba\n');

  } catch (error) {
    console.error('❌ ERROR durante verificación:', error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Ejecutar verificación
verifyVectorIndex().catch(console.error);
