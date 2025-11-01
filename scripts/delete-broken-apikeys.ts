#!/usr/bin/env tsx
/**
 * Script para eliminar API keys que apuntan a chatbots eliminados
 *
 * USO: npx tsx scripts/delete-broken-apikeys.ts
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('🔍 Buscando API keys con chatbots eliminados...\n');

  // Obtener todas las API keys
  const allKeys = await db.apiKey.findMany({
    select: {
      id: true,
      name: true,
      key: true,
      chatbotId: true,
      userId: true,
      createdAt: true
    }
  });

  console.log(`📊 Total de API keys: ${allKeys.length}\n`);

  // Buscar cuáles tienen chatbots que no existen
  const brokenKeys = [];

  for (const key of allKeys) {
    const chatbot = await db.chatbot.findUnique({
      where: { id: key.chatbotId }
    });

    if (!chatbot) {
      brokenKeys.push(key);
    }
  }

  if (brokenKeys.length === 0) {
    console.log('✅ Todas las API keys tienen chatbots válidos\n');
    return;
  }

  console.log(`❌ Se encontraron ${brokenKeys.length} API keys con chatbots eliminados:\n`);

  for (const key of brokenKeys) {
    console.log(`  - ID: ${key.id}`);
    console.log(`    Nombre: ${key.name}`);
    console.log(`    Key: ${key.key.substring(0, 20)}...`);
    console.log(`    ChatbotId (eliminado): ${key.chatbotId}`);
    console.log(`    Usuario: ${key.userId}`);
    console.log(`    Creada: ${key.createdAt}`);
    console.log('');
  }

  console.log('🗑️  Eliminando API keys con chatbots eliminados...\n');

  let deleted = 0;
  for (const key of brokenKeys) {
    await db.apiKey.delete({
      where: { id: key.id }
    });
    deleted++;
  }

  console.log(`✅ ${deleted} API keys eliminadas\n`);
}

main()
  .then(() => {
    console.log('✅ Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
