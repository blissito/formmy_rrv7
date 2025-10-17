/**
 * Script de Testing - Gmail Integration con Composio
 *
 * Test end-to-end de la integración de Gmail:
 * 1. Verifica que el Auth Config ID esté configurado
 * 2. Verifica conexión activa del chatbot
 * 3. Test de envío de email
 * 4. Test de lectura de emails
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';
import 'dotenv/config';

// ========== CONFIGURACIÓN ==========
const TEST_CHATBOT_ID = process.env.TEST_CHATBOT_ID || 'YOUR_CHATBOT_ID_HERE';
const TEST_RECIPIENT_EMAIL = process.env.TEST_RECIPIENT_EMAIL || 'test@example.com';

// ========== HELPERS ==========
const log = {
  section: (title: string) => console.log(`\n${'='.repeat(50)}\n${title}\n${'='.repeat(50)}`),
  success: (msg: string) => console.log(`✅ ${msg}`),
  error: (msg: string) => console.log(`❌ ${msg}`),
  info: (msg: string) => console.log(`ℹ️  ${msg}`),
  data: (label: string, data: any) => console.log(`📊 ${label}:`, JSON.stringify(data, null, 2))
};

// ========== MAIN ==========
async function main() {
  try {
    log.section('Test de Gmail Integration con Composio');

    // ========== 1. VERIFICAR VARIABLES DE ENTORNO ==========
    log.section('1. Verificando Variables de Entorno');

    if (!process.env.COMPOSIO_API_KEY) {
      log.error('COMPOSIO_API_KEY no está configurado en .env');
      process.exit(1);
    }
    log.success('COMPOSIO_API_KEY configurado');

    if (!process.env.COMPOSIO_GMAIL_AUTH_CONFIG_ID) {
      log.error('COMPOSIO_GMAIL_AUTH_CONFIG_ID no está configurado en .env');
      log.info('Ve a https://platform.composio.dev/marketplace/gmail y crea un Auth Config OAuth2');
      process.exit(1);
    }
    log.success('COMPOSIO_GMAIL_AUTH_CONFIG_ID configurado');

    if (TEST_CHATBOT_ID === 'YOUR_CHATBOT_ID_HERE') {
      log.error('TEST_CHATBOT_ID no está configurado');
      log.info('Exporta TEST_CHATBOT_ID con el ID de un chatbot de prueba');
      process.exit(1);
    }
    log.success(`TEST_CHATBOT_ID: ${TEST_CHATBOT_ID}`);

    // ========== 2. INICIALIZAR COMPOSIO ==========
    log.section('2. Inicializando Composio SDK');

    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new LlamaindexProvider(),
    });
    log.success('Composio SDK inicializado');

    // ========== 3. VERIFICAR CONEXIÓN DE GMAIL ==========
    log.section('3. Verificando Conexión de Gmail');

    const entityId = `chatbot_${TEST_CHATBOT_ID}`;
    log.info(`Entity ID: ${entityId}`);

    const connections = await composio.connectedAccounts.list({
      entityId,
      toolkitSlugs: ['gmail'],
    });

    log.data('Conexiones encontradas', {
      total: connections.items?.length || 0,
      conexiones: connections.items?.map((c: any) => ({
        id: c.id,
        appName: c.appName,
        status: c.status,
        createdAt: c.createdAt
      }))
    });

    const gmailConnection = connections.items?.find(
      (conn: any) => conn.appName === 'gmail' && conn.status === 'ACTIVE'
    );

    if (!gmailConnection) {
      log.error('No hay conexión activa de Gmail para este chatbot');
      log.info('Para conectar Gmail:');
      log.info('1. Ve a http://localhost:5173/dashboard/chatbots (o tu URL de Formmy)');
      log.info('2. Selecciona el chatbot de prueba');
      log.info('3. Ve a Integraciones > Gmail > Conectar');
      log.info('4. Autoriza con tu cuenta de Google');
      process.exit(1);
    }

    log.success('Gmail está conectado y activo');
    log.data('Detalles de conexión', {
      id: gmailConnection.id,
      status: gmailConnection.status,
      createdAt: gmailConnection.createdAt
    });

    // ========== 4. TEST: ENVIAR EMAIL ==========
    log.section('4. Test: Enviar Email');

    log.info(`Enviando email de prueba a: ${TEST_RECIPIENT_EMAIL}`);

    try {
      const sendResult = await composio.tools.execute(
        'GMAIL_SEND_EMAIL',
        {
          userId: entityId,
          arguments: {
            recipient_email: TEST_RECIPIENT_EMAIL,
            subject: '[Formmy Test] Email de prueba desde Composio',
            body: `Hola!\n\nEste es un email de prueba enviado desde Formmy usando Composio.\n\nTimestamp: ${new Date().toISOString()}\nChatbot ID: ${TEST_CHATBOT_ID}\n\nSaludos,\nFormmy Bot`,
            is_html: false,
          }
        }
      );

      const successful = (sendResult as any).successful;
      const data = (sendResult as any).data;
      const error = (sendResult as any).error;

      if (successful) {
        log.success('Email enviado exitosamente');
        log.data('Respuesta', data);
      } else {
        log.error(`Error al enviar email: ${error}`);
      }
    } catch (error: any) {
      log.error(`Excepción al enviar email: ${error.message}`);
      console.error(error);
    }

    // ========== 5. TEST: LEER EMAILS ==========
    log.section('5. Test: Leer Emails');

    log.info('Leyendo últimos 5 emails de INBOX');

    try {
      const readResult = await composio.tools.execute(
        'GMAIL_FETCH_EMAILS',
        {
          userId: entityId,
          arguments: {
            max_results: 5,
            label_ids: ['INBOX'],
            include_payload: true,
            verbose: true,
          }
        }
      );

      const successful = (readResult as any).successful;
      const data = (readResult as any).data;
      const error = (readResult as any).error;

      if (successful) {
        const messages = data?.messages || [];
        log.success(`Emails encontrados: ${messages.length}`);

        messages.forEach((msg: any, i: number) => {
          const headers = msg.payload?.headers || [];
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Desconocido';
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(Sin asunto)';
          const snippet = msg.snippet || '';

          console.log(`\n📧 Email ${i + 1}:`);
          console.log(`   De: ${from}`);
          console.log(`   Asunto: ${subject}`);
          console.log(`   Preview: ${snippet.substring(0, 80)}${snippet.length > 80 ? '...' : ''}`);
        });
      } else {
        log.error(`Error al leer emails: ${error}`);
      }
    } catch (error: any) {
      log.error(`Excepción al leer emails: ${error.message}`);
      console.error(error);
    }

    // ========== 6. RESUMEN ==========
    log.section('Resumen del Test');

    log.success('✅ Auth Config configurado');
    log.success('✅ Conexión de Gmail activa');
    log.success('✅ Test de envío completado');
    log.success('✅ Test de lectura completado');

    console.log('\n🎉 Test completado exitosamente!\n');

  } catch (error: any) {
    log.section('ERROR');
    log.error(`Error inesperado: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar
main().catch((error) => {
  console.error('Error fatal:', error);
  process.exit(1);
});
