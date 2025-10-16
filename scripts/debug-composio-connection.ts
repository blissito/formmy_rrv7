/**
 * Script de debug para verificar el estado real de la conexión de Composio
 *
 * USO:
 * npx tsx scripts/debug-composio-connection.ts <connectionId>
 *
 * Ejemplo:
 * npx tsx scripts/debug-composio-connection.ts ca_ETbWTU9PfaFb
 */

import { Composio } from '@composio/core';
import 'dotenv/config';

const composio = new Composio({
  apiKey: process.env.COMPOSIO_API_KEY,
});

async function debugConnection(connectionId: string) {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     DEBUG: Composio Connection Status                     ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log(`🔍 Connection ID: ${connectionId}\n`);

  try {
    // Método 1: Get connection directamente por ID
    console.log('📋 Método 1: Obtener conexión por ID...');
    try {
      const connection = await composio.connectedAccounts.get(connectionId);
      console.log('✅ Conexión encontrada:\n');
      console.log(JSON.stringify(connection, null, 2));
      console.log('\n');

      // Verificar status
      console.log('📊 STATUS ANALYSIS:');
      console.log(`   - Status: ${connection.status}`);
      console.log(`   - App: ${connection.appName}`);
      console.log(`   - Entity ID: ${connection.entityId || 'N/A'}`);
      console.log(`   - Created: ${connection.createdAt}`);
      console.log(`   - Updated: ${connection.updatedAt}`);
      console.log('\n');

      if (connection.status === 'ACTIVE') {
        console.log('✅ ¡La conexión está ACTIVA en Composio!');
        console.log('   El problema es que Flowise no está reconociendo este estado.\n');
      } else {
        console.log(`⚠️  Status actual: ${connection.status}`);
        console.log(`   Esperado: ACTIVE\n`);
      }

    } catch (error: any) {
      console.error('❌ Error obteniendo conexión por ID:', error.message);
      console.log('   Intentando método alternativo...\n');
    }

    // Método 2: Listar todas las conexiones
    console.log('📋 Método 2: Listar todas las conexiones...');
    const allConnections = await composio.connectedAccounts.list({});

    console.log(`\n✅ Total de conexiones encontradas: ${allConnections.items?.length || 0}\n`);

    if (allConnections.items && allConnections.items.length > 0) {
      allConnections.items.forEach((conn, index) => {
        console.log(`${index + 1}. Connection:`);
        console.log(`   ID: ${conn.id}`);
        console.log(`   App: ${conn.appName}`);
        console.log(`   Status: ${conn.status}`);
        console.log(`   Entity: ${conn.entityId || 'N/A'}`);
        console.log(`   Created: ${conn.createdAt}`);
        console.log('');
      });

      // Buscar la conexión específica
      const targetConnection = allConnections.items.find(c => c.id === connectionId);
      if (targetConnection) {
        console.log('✅ Conexión encontrada en la lista:\n');
        console.log(JSON.stringify(targetConnection, null, 2));
      }
    }

  } catch (error: any) {
    console.error('❌ Error general:', error.message);
    console.error('   Stack:', error.stack);
  }

  // Diagnóstico de Flowise
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║     DIAGNÓSTICO: Problema Flowise                         ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 POSIBLES CAUSAS:\n');
  console.log('1. VERSION DESACTUALIZADA:');
  console.log(`   - Tu versión: @composio/core@0.1.55`);
  console.log(`   - Versión recomendada: >= 0.5.39`);
  console.log(`   - Acción: npm install @composio/core@latest @composio/llamaindex@latest\n`);

  console.log('2. BUG CONOCIDO EN FLOWISE:');
  console.log(`   - Issue: https://github.com/FlowiseAI/Flowise/issues/4570`);
  console.log(`   - Flowise no actualiza el estado de Auth a "Connected"`);
  console.log(`   - Aunque Composio muestre status="ACTIVE"\n`);

  console.log('3. WORKAROUNDS SUGERIDOS:\n');
  console.log('   a) Actualizar Composio core:');
  console.log('      npm install @composio/core@latest @composio/llamaindex@latest\n');

  console.log('   b) Reiniciar Flowise completamente\n');

  console.log('   c) Habilitar debug logging:');
  console.log('      export COMPOSIO_LOGGING_LEVEL=debug\n');

  console.log('   d) Verificar que el entityId en Flowise coincide con:');
  console.log(`      - El que usaste para crear la conexión\n`);

  console.log('📊 SIGUIENTE PASO RECOMENDADO:');
  console.log('   1. Actualizar versiones de Composio');
  console.log('   2. Si persiste, reportar bug en GitHub de Flowise');
  console.log('   3. Como alternativa temporal, usar API directa de Composio\n');
}

// Main
const connectionId = process.argv[2];

if (!connectionId) {
  console.error('\n❌ Error: Debes proporcionar un Connection ID\n');
  console.log('Uso: npx tsx scripts/debug-composio-connection.ts <connectionId>\n');
  console.log('Ejemplo: npx tsx scripts/debug-composio-connection.ts ca_ETbWTU9PfaFb\n');
  process.exit(1);
}

if (!process.env.COMPOSIO_API_KEY) {
  console.error('\n❌ Error: COMPOSIO_API_KEY no está configurado en .env\n');
  process.exit(1);
}

debugConnection(connectionId).catch(console.error);
