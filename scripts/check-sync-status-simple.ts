/**
 * Script simple para verificar syncStatus de una integración
 */

const integrationId = process.argv[2] || '690d72379cfc22bbc9d8e4ee';

// Conectar a MongoDB directamente
const { MongoClient } = require('mongodb');

async function main() {
  const client = await MongoClient.connect(process.env.DATABASE_URL!);
  const db = client.db();

  const integration = await db.collection('Integration').findOne({
    _id: { $oid: integrationId }
  });

  console.log('\n📊 Integration Status:');
  console.log('   ID:', integrationId);
  console.log('   syncStatus:', integration?.syncStatus || 'null');
  console.log('   syncAttempts:', integration?.syncAttempts || 0);
  console.log('   syncError:', integration?.syncError || 'none');
  console.log('   syncCompletedAt:', integration?.syncCompletedAt || 'never');
  console.log('');

  await client.close();
}

main().catch(console.error).finally(() => process.exit(0));
