/**
 * Script de testing para enviar emails de prueba
 * Uso: npx tsx scripts/test-emails.ts
 */

// Cargar variables de entorno
import { config } from 'dotenv';
config();

import { sendProEmail } from '../server/notifyers/pro';
import { sendInvite } from '../server/notifyers/notifyOwner';
import { sendWeekSummaryEmail } from '../server/notifyers/weekSummary';

const TEST_EMAIL = 'fixtergeek@gmail.com';
const TEST_NAME = 'Héctor (Test)';

async function testEmails() {
  console.log('🧪 Iniciando tests de emails...\n');

  try {
    // 1. Email PRO
    console.log('📧 1/3 Enviando email de upgrade a PRO...');
    await sendProEmail({
      email: TEST_EMAIL,
      name: TEST_NAME
    });
    console.log('✅ Email PRO enviado\n');

    // Esperar 2 segundos entre emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Email Invite
    console.log('📧 2/3 Enviando email de invitación...');
    await sendInvite({
      project: {
        id: 'test-project-id',
        name: 'Chatbot Demo',
        userId: 'test-user-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'ACTIVE' as any,
        settings: {},
        type: 'CHAT' as any
      },
      email: TEST_EMAIL
    });
    console.log('✅ Email de invitación enviado\n');

    // Esperar 2 segundos entre emails
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Email Weekly Summary
    console.log('📧 3/3 Enviando resumen semanal...');
    await sendWeekSummaryEmail({
      email: TEST_EMAIL,
      name: TEST_NAME,
      chatbotName: 'Ghosty',
      metrics: {
        totalConversations: 47,
        totalMessages: 189,
        averageMessagesPerConversation: 4,
        averageResponseTime: 1250
      }
    });
    console.log('✅ Resumen semanal enviado\n');

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
