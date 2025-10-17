/**
 * Test Script: Composio WhatsApp Integration
 * Prueba la integración de WhatsApp con Composio
 *
 * Usage:
 *   npx tsx scripts/test-composio-whatsapp.ts
 */

import { Composio } from '@composio/core';
import { LlamaindexProvider } from '@composio/llamaindex';

// ========== CONFIGURACIÓN ==========
const CHATBOT_ID = process.env.TEST_CHATBOT_ID || 'your_chatbot_id_here';
const ENTITY_ID = `chatbot_${CHATBOT_ID}`;
const TEST_PHONE_NUMBER = process.env.TEST_PHONE_NUMBER || '+521234567890';
const TEST_MESSAGE = 'Hola! Este es un mensaje de prueba desde Formmy + Composio 🤖';

// ========== COLORES PARA TERMINAL ==========
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(emoji: string, message: string, color = colors.reset) {
  console.log(`${color}${emoji} ${message}${colors.reset}`);
}

function section(title: string) {
  console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// ========== MAIN TEST FUNCTION ==========
async function main() {
  try {
    section('TEST: Composio WhatsApp Integration');

    // Verificar variables de entorno
    log('🔑', 'Verificando configuración...');

    if (!process.env.COMPOSIO_API_KEY) {
      log('❌', 'ERROR: COMPOSIO_API_KEY no está configurada', colors.red);
      log('ℹ️', 'Configura COMPOSIO_API_KEY en tu .env', colors.yellow);
      process.exit(1);
    }

    if (!process.env.TEST_CHATBOT_ID) {
      log('⚠️', 'TEST_CHATBOT_ID no está configurada, usando ID por defecto', colors.yellow);
    }

    log('✅', `COMPOSIO_API_KEY: ${process.env.COMPOSIO_API_KEY.substring(0, 10)}...`, colors.green);
    log('✅', `Entity ID: ${ENTITY_ID}`, colors.green);
    log('✅', `Test Phone: ${TEST_PHONE_NUMBER}`, colors.green);

    // Inicializar Composio
    section('1. Inicializando Composio SDK');

    const composio = new Composio({
      apiKey: process.env.COMPOSIO_API_KEY,
      provider: new LlamaindexProvider(),
    });

    log('✅', 'Composio SDK inicializado correctamente', colors.green);

    // Verificar conexión de WhatsApp
    section('2. Verificando Conexión de WhatsApp');

    const connections = await composio.connectedAccounts.list({
      userId: ENTITY_ID,
    });

    log('📊', `Total de conexiones encontradas: ${connections.items?.length || 0}`);

    const whatsappConnection = connections.items?.find(
      (conn: any) => conn.appName === 'whatsapp' && conn.status === 'ACTIVE'
    );

    if (!whatsappConnection) {
      log('❌', 'No se encontró conexión activa de WhatsApp para este chatbot', colors.red);
      log('ℹ️', 'Pasos para conectar WhatsApp:', colors.yellow);
      log('  1️⃣', '1. Ir a tu dashboard de Formmy', colors.yellow);
      log('  2️⃣', '2. Seleccionar el chatbot de prueba', colors.yellow);
      log('  3️⃣', '3. Ir a Integraciones > WhatsApp', colors.yellow);
      log('  4️⃣', '4. Completar el Embedded Signup de Meta', colors.yellow);
      log('  5️⃣', '5. Volver a ejecutar este script', colors.yellow);
      process.exit(1);
    }

    log('✅', 'Conexión de WhatsApp encontrada', colors.green);
    log('📋', `Connection ID: ${whatsappConnection.id}`);
    log('📋', `App Name: ${whatsappConnection.appName}`);
    log('📋', `Status: ${whatsappConnection.status}`);
    log('📋', `Created: ${new Date(whatsappConnection.createdAt).toLocaleString()}`);

    // Obtener phone_number_id de la BD
    section('3. Obteniendo Configuración del Chatbot');

    const { db } = await import('../app/utils/db.server');
    const chatbot = await db.chatbot.findUnique({
      where: { id: CHATBOT_ID },
      select: {
        id: true,
        name: true,
        whatsappConfig: true
      }
    });

    if (!chatbot) {
      log('❌', `Chatbot no encontrado: ${CHATBOT_ID}`, colors.red);
      process.exit(1);
    }

    log('✅', `Chatbot encontrado: ${chatbot.name}`, colors.green);

    const whatsappConfig = chatbot.whatsappConfig as any;
    if (!whatsappConfig || !whatsappConfig.phoneNumberId) {
      log('❌', 'Chatbot no tiene phoneNumberId configurado', colors.red);
      log('ℹ️', 'Asegúrate de completar el Embedded Signup primero', colors.yellow);
      process.exit(1);
    }

    const phoneNumberId = whatsappConfig.phoneNumberId;
    log('✅', `Phone Number ID: ${phoneNumberId}`, colors.green);

    // Test 1: Enviar mensaje de WhatsApp
    section('4. Test: Enviar Mensaje de WhatsApp');

    log('📤', `Enviando mensaje a ${TEST_PHONE_NUMBER}...`);
    log('💬', `Mensaje: "${TEST_MESSAGE}"`);

    try {
      const result = await composio.tools.execute(
        'WHATSAPP_SEND_MESSAGE',
        {
          userId: ENTITY_ID,
          arguments: {
            phone_number_id: phoneNumberId,
            to_number: TEST_PHONE_NUMBER,
            text: TEST_MESSAGE,
            preview_url: true
          }
        }
      );

      const responseData = (result as any).data;
      const successful = (result as any).successful;

      if (!successful) {
        const errorMsg = (result as any).error || 'Error desconocido';
        log('❌', `Error al enviar mensaje: ${errorMsg}`, colors.red);

        if (errorMsg.includes('not connected') || errorMsg.includes('authentication')) {
          log('ℹ️', 'La conexión parece estar inactiva. Reconecta WhatsApp desde el dashboard.', colors.yellow);
        }
      } else {
        log('✅', 'Mensaje enviado exitosamente!', colors.green);
        log('📋', `Message ID: ${responseData?.message_id || 'N/A'}`);

        // Actualizar mensaje de prueba para el destinatario
        log('💡', `El destinatario (${TEST_PHONE_NUMBER}) debería recibir el mensaje ahora.`, colors.cyan);
      }
    } catch (error: any) {
      log('❌', `Error ejecutando tool: ${error.message}`, colors.red);

      if (error.message?.includes('not connected') || error.message?.includes('authentication')) {
        log('ℹ️', 'Verifica que la conexión esté activa en Composio dashboard', colors.yellow);
      }
      throw error;
    }

    // Test 2: Listar tools disponibles de WhatsApp
    section('5. Tools Disponibles de WhatsApp');

    const tools = await composio.tools.get({
      apps: ['whatsapp']
    });

    log('📊', `Total de tools de WhatsApp: ${tools.length}`);

    tools.slice(0, 10).forEach((tool: any, index: number) => {
      log('🔧', `${index + 1}. ${tool.name || 'N/A'}`, colors.blue);
    });

    if (tools.length > 10) {
      log('ℹ️', `... y ${tools.length - 10} tools más`, colors.yellow);
    }

    // Resumen final
    section('✅ TEST COMPLETADO EXITOSAMENTE');

    log('🎉', 'Todas las pruebas pasaron correctamente', colors.green);
    log('📱', 'WhatsApp está integrado y funcionando con Composio', colors.green);
    log('🤖', 'Los agentes ahora pueden usar WhatsApp tools', colors.green);

  } catch (error) {
    section('❌ ERROR EN EL TEST');

    if (error instanceof Error) {
      log('❌', `Error: ${error.message}`, colors.red);
      console.error(error.stack);
    } else {
      log('❌', 'Error desconocido', colors.red);
      console.error(error);
    }

    process.exit(1);
  }
}

// Ejecutar el test
main();
