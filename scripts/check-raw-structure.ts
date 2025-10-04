/**
 * Verificar la estructura RAW en MongoDB
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('\n🔍 Verificando estructura RAW en MongoDB...\n');

  // Obtener documento RAW
  const raw: any = await (db as any).$runCommandRaw({
    find: 'embeddings',
    limit: 1
  });

  if (raw.cursor?.firstBatch?.[0]) {
    const doc = raw.cursor.firstBatch[0];

    console.log('📄 Documento RAW de MongoDB:');
    console.log(JSON.stringify(doc, null, 2));

    console.log('\n📊 Campos del documento:');
    Object.keys(doc).forEach(key => {
      console.log(`   - ${key}: ${typeof doc[key]} ${Array.isArray(doc[key]) ? `(array de ${doc[key].length})` : ''}`);
    });

    console.log('\n⚠️  IMPORTANTE:');
    console.log('   El índice de Atlas debe usar EXACTAMENTE estos nombres de campos.');
    console.log('   Si el campo se llama "embedding" en MongoDB, el path debe ser "embedding"');
  } else {
    console.log('❌ No se pudo obtener documento raw');
  }
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
