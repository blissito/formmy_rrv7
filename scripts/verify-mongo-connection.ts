/**
 * Verificar conexión a MongoDB y database actual
 */
import { db } from '~/utils/db.server';

async function main() {
  console.log('\n🔍 === VERIFICACIÓN CONEXIÓN MONGODB ===\n');

  try {
    // Obtener información de conexión desde DATABASE_URL
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      console.error('❌ DATABASE_URL no encontrada en .env');
      process.exit(1);
    }

    // Parsear URL para extraer database name
    const urlMatch = dbUrl.match(/mongodb(?:\+srv)?:\/\/[^\/]+\/([^?]+)/);
    const databaseName = urlMatch ? urlMatch[1] : 'unknown';

    console.log('📊 Información de conexión:');
    console.log(`   Database URL: ${dbUrl.replace(/:[^:@]+@/, ':****@')}`); // Ocultar password
    console.log(`   Database Name: ${databaseName}\n`);

    // Verificar que podemos acceder a la colección Embedding
    const embeddingCount = await db.embedding.count();
    console.log(`✅ Conexión exitosa a colección Embedding`);
    console.log(`   Total documentos: ${embeddingCount}\n`);

    // Listar algunas colecciones (usando aggregateRaw para acceder a MongoDB nativo)
    console.log('📦 Verificando acceso a MongoDB...');

    // Obtener un documento sample para verificar estructura
    const sample = await db.embedding.findFirst();
    if (sample) {
      console.log(`✅ Ejemplo de documento:`);
      console.log(`   _id: ${sample.id}`);
      console.log(`   chatbotId: ${sample.chatbotId}`);
      console.log(`   Tiene embedding: ${sample.embedding ? 'Sí' : 'No'}`);
      console.log(`   Dimensiones: ${(sample.embedding as any)?.length || 0}\n`);
    }

    console.log('💡 Para crear el índice vector_index_2 en Atlas:');
    console.log(`   1. Ve a Atlas → Database: "${databaseName}"`);
    console.log(`   2. Collection: "Embedding"`);
    console.log(`   3. Search Indexes → Create Search Index → Atlas Vector Search`);
    console.log(`   4. Index Name: "vector_index_2"`);
    console.log(`   5. JSON Editor → Pega:`);
    console.log('\n' + JSON.stringify({
      "fields": [
        {
          "type": "vector",
          "path": "embedding",
          "numDimensions": 768,
          "similarity": "cosine"
        },
        {
          "type": "filter",
          "path": "chatbotId"
        }
      ]
    }, null, 2));
    console.log('\n   6. Create Search Index y espera a que esté Active\n');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    process.exit(0);
  }
}

main();
