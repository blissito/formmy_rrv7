/**
 * Script para verificar que el job de sincronización de WhatsApp funciona
 *
 * Uso:
 *   npx tsx scripts/test-whatsapp-sync-job.ts <integrationId>
 *
 * Verifica:
 * 1. Que Agenda esté inicializado
 * 2. Que el job 'whatsapp-sync' esté definido
 * 3. El estado actual de la integración
 * 4. Dispara el job manualmente (opcional)
 */

import { getAgenda } from '../server/jobs/agenda.server';
import { db } from '../app/utils/db.server';
import { WhatsAppSyncService } from '../server/integrations/whatsapp/sync.service.server';

async function main() {
  const integrationId = process.argv[2];

  if (!integrationId) {
    console.error('❌ Error: Debes proporcionar un integrationId');
    console.log('\nUso: npx tsx scripts/test-whatsapp-sync-job.ts <integrationId>');
    process.exit(1);
  }

  console.log('🔍 Verificando job de sincronización de WhatsApp...\n');

  // 1. Verificar que Agenda esté inicializado
  console.log('1️⃣ Verificando Agenda...');
  try {
    const agenda = await getAgenda();
    console.log('   ✅ Agenda inicializado correctamente');

    // Verificar que el job esté definido
    const jobs = agenda._definitions;
    if (jobs['whatsapp-sync']) {
      console.log('   ✅ Job "whatsapp-sync" está definido');
    } else {
      console.log('   ❌ Job "whatsapp-sync" NO está definido');
      console.log('   📋 Jobs disponibles:', Object.keys(jobs));
    }
  } catch (error) {
    console.log('   ❌ Error al inicializar Agenda:', error);
    process.exit(1);
  }

  // 2. Verificar estado de la integración
  console.log('\n2️⃣ Verificando integración...');
  try {
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      include: { chatbot: true },
    });

    if (!integration) {
      console.log('   ❌ Integración no encontrada');
      process.exit(1);
    }

    console.log('   ✅ Integración encontrada');
    console.log('   📱 Phone Number ID:', integration.phoneNumberId);
    console.log('   🔑 Token:', integration.token ? '***' + integration.token.slice(-8) : 'null');
    console.log('   📊 Sync Status:', integration.syncStatus || 'null');
    console.log('   🔢 Sync Attempts:', integration.syncAttempts);
    console.log('   ⚠️  Sync Error:', integration.syncError || 'none');
    console.log('   ✅ Sync Completed At:', integration.syncCompletedAt || 'never');

    // 3. Obtener estado actual usando el servicio
    console.log('\n3️⃣ Estado actual (vía servicio)...');
    const syncStatus = await WhatsAppSyncService.getSyncStatus(integrationId);
    console.log('   Status:', JSON.stringify(syncStatus, null, 2));

    // 4. Preguntar si quiere disparar el job manualmente
    console.log('\n4️⃣ ¿Disparar job de sincronización manualmente?');
    console.log('   Comando: npx tsx scripts/trigger-whatsapp-sync.ts', integrationId);

  } catch (error) {
    console.log('   ❌ Error:', error);
    process.exit(1);
  }

  console.log('\n✅ Diagnóstico completo');
  process.exit(0);
}

main().catch(console.error);
