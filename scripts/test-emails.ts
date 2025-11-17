/**
 * Script de testing para enviar emails de prueba
 * Uso: npx tsx scripts/test-emails.ts
 */

// Cargar variables de entorno
import { config } from 'dotenv';
config();

import { sendProEmail } from '../server/notifyers/pro';
import { sendStarterEmail } from '../server/notifyers/starter';

const TEST_EMAIL = 'brenda@fixter.org';
const TEST_NAME = 'Brenda';

async function testEmails() {
  console.log('🧪 Iniciando tests de emails...\n');

  try {
    // 1. Email PRO
    console.log('📧 1/2 Enviando email de upgrade a PRO...');
    await sendProEmail({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email PRO enviado\n');

    // Esperar 2 segundos entre emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Email STARTER
    console.log('📧 2/2 Enviando email de upgrade a STARTER...');
    await sendStarterEmail({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email STARTER enviado\n');

    console.log('🎉 Todos los emails fueron enviados exitosamente!');
    console.log(`📬 Revisa tu bandeja de entrada: ${TEST_EMAIL}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error enviando emails:', error);
    process.exit(1);
  }
}

// Ejecutar tests
testEmails();
