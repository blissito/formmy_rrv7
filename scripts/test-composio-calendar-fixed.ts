/**
 * Script de prueba para verificar integración Google Calendar via Composio
 * Con formato correcto de composio.tools.execute()
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';

const CHATBOT_ID = '68a8bccb2b5f4db764eb931d';
const ENTITY_ID = `chatbot_${CHATBOT_ID}`;

async function main() {
  console.log('\n🧪 TEST: Composio Google Calendar - Formato Correcto\n');
  console.log(`📋 Chatbot ID: ${CHATBOT_ID}`);
  console.log(`📋 Entity ID: ${ENTITY_ID}\n`);

  // Initialize Composio
  const composio = new Composio({
    apiKey: process.env.COMPOSIO_API_KEY,
    provider: new LlamaindexProvider(),
  });

  try {
    // 1. Verificar conexión
    console.log('1️⃣ Verificando conexión del chatbot...');
    const connection = await composio.connectedAccounts.list({
      userId: ENTITY_ID,
    });

    console.log(`   ✅ Conexiones encontradas: ${connection.items.length}`);

    const googleCalConn = connection.items.find(
      (conn: any) => conn.toolkit?.slug === 'googlecalendar' && conn.status === 'ACTIVE'
    );

    if (!googleCalConn) {
      console.log('   ❌ No hay conexión activa de Google Calendar');
      return;
    }

    console.log(`   ✅ Conexión Google Calendar activa (ID: ${googleCalConn.id})`);

    // 2. Probar LIST EVENTS con formato correcto
    console.log('\n2️⃣ Probando GOOGLECALENDAR_EVENTS_LIST...');

    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    console.log(`   📅 Rango: ${now.toISOString()} a ${nextWeek.toISOString()}`);

    const result = await composio.tools.execute(
      'GOOGLECALENDAR_EVENTS_LIST',  // ← Tool slug
      {
        userId: ENTITY_ID,  // ← EntityId del chatbot
        arguments: {  // ← "arguments" no "params"
          calendarId: 'primary',
          maxResults: 10,
          timeMin: now.toISOString(),
          timeMax: nextWeek.toISOString(),
          singleEvents: true,
          orderBy: 'startTime',
        },
      }
    );

    console.log('\n✅ RESULTADO:');
    console.log(JSON.stringify(result, null, 2));

    // Formatear eventos
    const events = (result as any).items || (result as any).data?.items || [];

    if (events.length === 0) {
      console.log('\n📭 No hay eventos próximos en los próximos 7 días');
    } else {
      console.log(`\n📅 EVENTOS ENCONTRADOS (${events.length}):\n`);

      events.forEach((event: any, index: number) => {
        const start = event.start?.dateTime || event.start?.date;
        const summary = event.summary || 'Sin título';
        const location = event.location ? ` 📍 ${event.location}` : '';

        console.log(`${index + 1}. ${summary}`);
        console.log(`   🕐 ${new Date(start).toLocaleString('es-MX')}${location}`);
      });
    }

    console.log('\n✅ TEST COMPLETADO EXITOSAMENTE!\n');

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
    console.error('\n📋 Stack:', error.stack);

    if (error.response) {
      console.error('\n📋 Response:', JSON.stringify(error.response, null, 2));
    }
  }
}

main();
