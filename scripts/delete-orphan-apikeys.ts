#!/usr/bin/env tsx
/**
 * Script para eliminar API keys huérfanas (sin chatbotId)
 *
 * USO: npx tsx scripts/delete-orphan-apikeys.ts
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('🔍 Buscando API keys sin chatbotId...\n');

  // Buscar todas las API keys sin chatbotId válido
  const orphanKeys = await db.apiKey.findMany({
    where: {
      OR: [
        { chatbotId: null },
        { chatbotId: { equals: null } }
      ]
    },
    select: {
      id: true,
      name: true,
      key: true,
      userId: true,
      createdAt: true
    }
  });

  if (orphanKeys.length === 0) {
    console.log('✅ No se encontraron API keys huérfanas\n');
    return;
  }

  console.log(`❌ Se encontraron ${orphanKeys.length} API keys sin chatbotId:\n`);

  for (const key of orphanKeys) {
    console.log(`  - ID: ${key.id}`);
    console.log(`    Nombre: ${key.name}`);
    console.log(`    Key: ${key.key.substring(0, 20)}...`);
    console.log(`    Usuario: ${key.userId}`);
    console.log(`    Creada: ${key.createdAt}`);
    console.log('');
  }

  console.log('🗑️  Eliminando API keys huérfanas...\n');

  const result = await db.apiKey.deleteMany({
    where: {
      OR: [
        { chatbotId: null },
        { chatbotId: { equals: null } }
      ]
    }
  });

  console.log(`✅ ${result.count} API keys eliminadas\n`);
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
