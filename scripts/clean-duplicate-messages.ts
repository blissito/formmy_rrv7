/**
 * Script para limpiar mensajes duplicados de WhatsApp antes de aplicar índice único
 *
 * Este script:
 * 1. Encuentra mensajes con el mismo conversationId + externalMessageId
 * 2. Mantiene el mensaje más antiguo (primero en llegar)
 * 3. Elimina los duplicados
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('🔍 Buscando mensajes duplicados...\n');

  // Encontrar todos los mensajes con externalMessageId (mensajes de WhatsApp)
  const messages = await db.message.findMany({
    where: {
      externalMessageId: { not: null }
    },
    orderBy: { createdAt: 'asc' }, // Más antiguos primero
    select: {
      id: true,
      conversationId: true,
      externalMessageId: true,
      createdAt: true,
      content: true
    }
  });

  console.log(`Total de mensajes con externalMessageId: ${messages.length}\n`);

  // Agrupar por conversationId + externalMessageId
  const groups = new Map<string, typeof messages>();

  for (const msg of messages) {
    const key = `${msg.conversationId}_${msg.externalMessageId}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(msg);
  }

  // Encontrar grupos con duplicados
  const duplicateGroups = Array.from(groups.entries())
    .filter(([_, msgs]) => msgs.length > 1);

  console.log(`Grupos con duplicados: ${duplicateGroups.length}\n`);

  if (duplicateGroups.length === 0) {
    console.log('✅ No hay duplicados, se puede aplicar el índice único');
    return;
  }

  // Mostrar resumen de duplicados
  let totalDuplicatesToDelete = 0;
  for (const [key, msgs] of duplicateGroups) {
    totalDuplicatesToDelete += msgs.length - 1; // Mantener el primero
  }

  console.log(`Total de mensajes a eliminar: ${totalDuplicatesToDelete}\n`);
  console.log('Primeros 5 grupos de duplicados:');
  duplicateGroups.slice(0, 5).forEach(([key, msgs]) => {
    console.log(`  ${key}: ${msgs.length} copias`);
    msgs.forEach(msg => {
      console.log(`    - ID: ${msg.id}, createdAt: ${msg.createdAt}, content: "${msg.content.substring(0, 50)}..."`);
    });
  });

  // Eliminar duplicados (mantener el más antiguo)
  console.log('\n🗑️  Eliminando duplicados...\n');

  let deletedCount = 0;
  for (const [key, msgs] of duplicateGroups) {
    // Mantener el primer mensaje (más antiguo), eliminar el resto
    const toDelete = msgs.slice(1);

    for (const msg of toDelete) {
      try {
        await db.message.delete({
          where: { id: msg.id }
        });
        deletedCount++;

        if (deletedCount % 100 === 0) {
          console.log(`  Eliminados: ${deletedCount}/${totalDuplicatesToDelete}`);
        }
      } catch (error) {
        console.error(`  ❌ Error eliminando mensaje ${msg.id}:`, error);
      }
    }
  }

  console.log(`\n✅ Duplicados eliminados: ${deletedCount}`);
  console.log('✅ Ahora se puede aplicar el índice único con: npx prisma db push');
}

main().catch(console.error).finally(() => process.exit(0));
