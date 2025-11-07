/**
 * Script para disparar manualmente el job de sincronización de WhatsApp
 *
 * Uso:
 *   npx tsx scripts/trigger-whatsapp-sync.ts <integrationId>
 *
 * Este script:
 * 1. Obtiene los datos de la integración
 * 2. Dispara el job de Agenda
 * 3. Monitorea el progreso
 */

import { getAgenda } from '../server/jobs/agenda.server';
import { db } from '../app/utils/db.server';

async function main() {
  const integrationId = process.argv[2];

  if (!integrationId) {
    console.error('❌ Error: Debes proporcionar un integrationId');
    console.log('\nUso: npx tsx scripts/trigger-whatsapp-sync.ts <integrationId>');
    process.exit(1);
  }

  console.log('🚀 Disparando job de sincronización de WhatsApp...\n');

  try {
    // 1. Obtener integración
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      select: {
        id: true,
        phoneNumberId: true,
        token: true,
        syncStatus: true,
      },
    });

    if (!integration) {
      console.error('❌ Integración no encontrada');
      process.exit(1);
    }

    if (!integration.phoneNumberId || !integration.token) {
      console.error('❌ Integración sin phoneNumberId o token');
      process.exit(1);
    }

    console.log('✅ Integración encontrada');
    console.log('   Integration ID:', integrationId);
    console.log('   Phone Number ID:', integration.phoneNumberId);
    console.log('   Current Sync Status:', integration.syncStatus || 'null');

    // 2. Disparar job de Agenda
    console.log('\n🎯 Disparando job de Agenda...');
    const agenda = await getAgenda();

    await agenda.now('whatsapp-sync', {
      integrationId: integration.id,
      phoneNumberId: integration.phoneNumberId,
      accessToken: integration.token,
    });

    console.log('✅ Job disparado exitosamente');
    console.log('\n📊 El job se está ejecutando en segundo plano.');
    console.log('   Monitorea el progreso con:');
    console.log(`   - npx tsx scripts/test-whatsapp-sync-job.ts ${integrationId}`);
    console.log('   - fly logs (si está en producción)');
    console.log('\n⏳ Los webhooks pueden tardar varios minutos en llegar...');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  // Dar tiempo para que el job se ejecute antes de cerrar
  console.log('\n⏳ Esperando 5 segundos para ver logs del job...');
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Verificar estado actualizado
  const updatedIntegration = await db.integration.findUnique({
    where: { id: integrationId },
    select: { syncStatus: true, syncError: true, syncAttempts: true },
  });

  console.log('\n📊 Estado actualizado:');
  console.log('   Sync Status:', updatedIntegration?.syncStatus || 'null');
  console.log('   Sync Attempts:', updatedIntegration?.syncAttempts || 0);
  console.log('   Sync Error:', updatedIntegration?.syncError || 'none');

  process.exit(0);
}

main().catch(console.error);
