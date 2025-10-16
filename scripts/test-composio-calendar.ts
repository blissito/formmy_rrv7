/**
 * Script de prueba para verificar integración de Composio Google Calendar
 *
 * USO:
 * 1. Asegurar que COMPOSIO_API_KEY está en .env
 * 2. Ejecutar: npx tsx scripts/test-composio-calendar.ts
 * 3. Seguir las instrucciones en consola
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import 'dotenv/config';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

async function main() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     TEST: Composio Google Calendar Integration          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  // Test 1: Verificar que Composio API Key está configurado
  console.log('📋 Test 1: Verificando configuración...');
  if (!process.env.COMPOSIO_API_KEY) {
    console.error('❌ COMPOSIO_API_KEY no está configurado en .env');
    process.exit(1);
  }
  console.log('✅ COMPOSIO_API_KEY configurado\n');

  // Test 2: Listar toolkits disponibles
  console.log('📋 Test 2: Listando toolkits disponibles...');
  try {
    const toolkits = await composio.toolkits.list({ search: 'calendar' });
    console.log(`✅ Encontrados ${toolkits.items.length} toolkits relacionados con calendar:`);
    toolkits.items.forEach(toolkit => {
      console.log(`   - ${toolkit.name} (${toolkit.slug}): ${toolkit.toolsCount} tools`);
    });
    console.log('');
  } catch (error: any) {
    console.error('❌ Error listando toolkits:', error.message);
    process.exit(1);
  }

  // Test 3: Obtener tools de Google Calendar
  console.log('📋 Test 3: Obteniendo tools de Google Calendar...');
  try {
    const tools = await composio.tools.get('default', {
      toolkits: ['googlecalendar'],
      limit: 20,
    });

    console.log(`✅ Encontradas ${tools.length} tools de Google Calendar:`);
    const relevantTools = tools.filter((t: any) =>
      ['CREATE', 'LIST', 'UPDATE', 'DELETE'].some(action => t.name?.toUpperCase().includes(action))
    );

    relevantTools.forEach((tool: any, index: number) => {
      console.log(`   ${index + 1}. ${tool.name}`);
      console.log(`      Descripción: ${tool.description?.substring(0, 80)}...`);
    });
    console.log('');
  } catch (error: any) {
    console.error('❌ Error obteniendo tools:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }

  // Test 4: Crear entidad de prueba
  console.log('📋 Test 4: Creando entidad de prueba...');
  const testEntityId = `test_user_${Date.now()}`;
  try {
    const entity = await composio.entities.create({ id: testEntityId });
    console.log(`✅ Entidad creada: ${entity.id}`);
    console.log('');
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log(`⚠️  Entidad ya existe (OK): ${testEntityId}`);
      console.log('');
    } else {
      console.error('❌ Error creando entidad:', error.message);
      process.exit(1);
    }
  }

  // Test 5: Iniciar conexión (generar URL de OAuth)
  console.log('📋 Test 5: Generando URL de OAuth...');
  try {
    const connection = await composio.connectedAccounts.initiate(
      testEntityId,
      'googlecalendar',
      {
        redirectUrl: 'http://localhost:3000/api/v1/composio/google-calendar/callback',
      }
    );

    console.log('✅ URL de OAuth generada exitosamente!');
    console.log('');
    console.log('┌────────────────────────────────────────────────────────────┐');
    console.log('│  SIGUIENTE PASO: Conectar Google Calendar manualmente     │');
    console.log('└────────────────────────────────────────────────────────────┘');
    console.log('');
    console.log('🔗 Abre esta URL en tu navegador para conectar:');
    console.log('');
    console.log(`   ${connection.redirectUrl}`);
    console.log('');
    console.log('⚠️  NOTA: Esta URL es para testing. En producción, el flujo será:');
    console.log('   1. Usuario hace clic en "Conectar Google Calendar" en dashboard');
    console.log('   2. GET /api/v1/composio/google-calendar?intent=connect');
    console.log('   3. Redirect a Google OAuth');
    console.log('   4. Callback a /api/v1/composio/google-calendar/callback');
    console.log('   5. Ghosty ahora puede usar las tools de Calendar');
    console.log('');
  } catch (error: any) {
    console.error('❌ Error generando URL de OAuth:', error.message);
    console.error('   Stack:', error.stack);
    process.exit(1);
  }

  // Test 6: Verificar estado de conexión
  console.log('📋 Test 6: Verificando estado de conexión...');
  try {
    const connectedAccounts = await composio.connectedAccounts.list({
      entityId: testEntityId,
      app: 'googlecalendar',
    });

    if (connectedAccounts.items && connectedAccounts.items.length > 0) {
      console.log('✅ Cuenta conectada encontrada:');
      const account = connectedAccounts.items[0];
      console.log(`   ID: ${account.id}`);
      console.log(`   App: ${account.appName}`);
      console.log(`   Status: ${account.status}`);
      console.log(`   Creada: ${account.createdAt}`);
    } else {
      console.log('⚠️  No hay cuenta conectada aún (normal si acabas de generar la URL)');
      console.log('   Conecta usando la URL de arriba y vuelve a ejecutar este script.');
    }
    console.log('');
  } catch (error: any) {
    console.error('⚠️  Error verificando conexión:', error.message);
    console.log('   (Esto es normal si acabas de crear la entidad)');
    console.log('');
  }

  // Resumen final
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                    TESTS COMPLETADOS                       ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('📊 RESUMEN:');
  console.log('   ✅ Composio SDK configurado correctamente');
  console.log('   ✅ Tools de Google Calendar disponibles');
  console.log('   ✅ Sistema de entidades funcionando');
  console.log('   ✅ OAuth flow configurado');
  console.log('');
  console.log('🚀 PRÓXIMOS PASOS PARA POC:');
  console.log('   1. npm run dev');
  console.log('   2. Login en dashboard');
  console.log('   3. Conectar Google Calendar via UI (crear botón en settings)');
  console.log('   4. Abrir Ghosty y decir: "Agenda reunión mañana a las 2pm"');
  console.log('   5. Ghosty usará create_calendar_event tool automáticamente');
  console.log('');
  console.log('💡 TIP: Verifica que en agent-workflow.server.ts el usuario tenga:');
  console.log('   - Plan: STARTER, PRO, ENTERPRISE o TRIAL');
  console.log('   - isGhosty: true');
  console.log('   - integrations.googleCalendar: true');
  console.log('');
}

main().catch(console.error);
