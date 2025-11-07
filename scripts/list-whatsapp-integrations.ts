/**
 * Script para listar todas las integraciones de WhatsApp
 *
 * Uso:
 *   npx tsx scripts/list-whatsapp-integrations.ts
 */

import { db } from '../app/utils/db.server';

async function main() {
  console.log('📋 Listando integraciones de WhatsApp...\n');

  try {
    const integrations = await db.integration.findMany({
      where: { platform: 'WHATSAPP' },
      include: { chatbot: true },
      orderBy: { createdAt: 'desc' },
    }).catch(() => []);

    // Filtrar integraciones sin chatbot (datos huérfanos)
    const validIntegrations = integrations.filter(i => i.chatbot !== null);

    if (validIntegrations.length === 0) {
      console.log('❌ No se encontraron integraciones válidas de WhatsApp');
      process.exit(0);
    }

    console.log(`✅ Encontradas ${validIntegrations.length} integración(es) válida(s):\n`);

    for (const integration of validIntegrations) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔑 ID:', integration.id);
      console.log('🤖 Chatbot:', integration.chatbot.name);
      console.log('📱 Phone Number ID:', integration.phoneNumberId || 'null');
      console.log('🔒 Token:', integration.token ? '***' + integration.token.slice(-8) : 'null');
      console.log('✅ Is Active:', integration.isActive);
      console.log('📊 Sync Status:', integration.syncStatus || 'null');
      console.log('🔢 Sync Attempts:', integration.syncAttempts);
      console.log('⚠️  Sync Error:', integration.syncError || 'none');
      console.log('📅 Created At:', integration.createdAt.toISOString());
      console.log('✅ Sync Completed At:', integration.syncCompletedAt?.toISOString() || 'never');
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n💡 Para diagnosticar una integración:');
    console.log('   npx tsx scripts/test-whatsapp-sync-job.ts <integrationId>');
    console.log('\n💡 Para disparar sincronización manualmente:');
    console.log('   npx tsx scripts/trigger-whatsapp-sync.ts <integrationId>');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }

  process.exit(0);
}

main().catch(console.error);
