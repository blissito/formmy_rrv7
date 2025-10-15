/**
 * Script de debug para verificar el estado de conexión de Google Calendar
 * Uso: npx tsx scripts/debug-composio-status.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(process.cwd(), '.env') });

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
  provider: new LlamaindexProvider(),
});

async function debugConnectionStatus() {
  const userId = 'user_clzq5u3i10000fzz0ndhkx9z8'; // ID de usuario de prueba
  const entityId = `user_${userId}`;

  console.log(`\n${'🔍'.repeat(50)}`);
  console.log(`🔍 DEBUG: Estado de conexión Google Calendar`);
  console.log(`   entityId: ${entityId}`);
  console.log(`${'🔍'.repeat(50)}\n`);

  try {
    // Verificar todas las cuentas conectadas
    console.log('1️⃣ Listando TODAS las cuentas conectadas del usuario...\n');
    const allAccounts = await composio.connectedAccounts.list({
      entityId,
    });

    console.log(`📊 Total de cuentas encontradas: ${allAccounts.items?.length || 0}`);
    if (allAccounts.items && allAccounts.items.length > 0) {
      allAccounts.items.forEach((account: any, index: number) => {
        console.log(`\n   ${index + 1}. ${account.appName || account.toolkitSlug || 'Unknown'}`);
        console.log(`      ID: ${account.id}`);
        console.log(`      Status: ${account.status}`);
        console.log(`      Created: ${account.createdAt}`);
      });
    }

    // Filtrar solo Google Calendar con 'app'
    console.log(`\n2️⃣ Filtrando con app: 'googlecalendar'...\n`);
    const withApp = await composio.connectedAccounts.list({
      entityId,
      app: 'googlecalendar' as any,
    });

    console.log(`📊 Con app: ${withApp.items?.length || 0} cuentas`);
    if (withApp.items && withApp.items.length > 0) {
      console.log(JSON.stringify(withApp.items, null, 2));
    }

    // Filtrar solo Google Calendar con 'toolkitSlugs'
    console.log(`\n3️⃣ Filtrando con toolkitSlugs: ['googlecalendar']...\n`);
    const withToolkits = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['googlecalendar'],
    });

    console.log(`📊 Con toolkitSlugs: ${withToolkits.items?.length || 0} cuentas`);
    if (withToolkits.items && withToolkits.items.length > 0) {
      console.log(JSON.stringify(withToolkits.items, null, 2));
    }

    // Verificar si hay conexión activa
    const isConnectedWithApp = withApp.items && withApp.items.length > 0;
    const isConnectedWithToolkits = withToolkits.items && withToolkits.items.length > 0;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`\n✅ RESULTADO:`);
    console.log(`   Con 'app': ${isConnectedWithApp ? '✅ CONECTADO' : '❌ NO CONECTADO'}`);
    console.log(`   Con 'toolkitSlugs': ${isConnectedWithToolkits ? '✅ CONECTADO' : '❌ NO CONECTADO'}`);
    console.log(`\n${'='.repeat(50)}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
    }
  }
}

debugConnectionStatus().catch(console.error);
