/**
 * Script para enviar template de WhatsApp
 */
import { db } from '../app/utils/db.server';
import { WhatsAppSDKService } from '../server/integrations/whatsapp/WhatsAppSDKService';

const CHATBOT_ID = process.env.CHATBOT_ID || '';
const TO_NUMBER = process.env.TO_NUMBER || '';
const TEMPLATE_NAME = process.env.TEMPLATE_NAME || 'saludo_prueba';

async function sendWhatsAppTemplate() {
  if (!CHATBOT_ID) {
    console.error('❌ Debes proporcionar CHATBOT_ID');
    console.log('Uso: CHATBOT_ID=xxx TO_NUMBER=5215512345678 npx tsx scripts/send-whatsapp-template.ts');
    process.exit(1);
  }

  if (!TO_NUMBER) {
    console.error('❌ Debes proporcionar TO_NUMBER (sin +)');
    console.log('Uso: CHATBOT_ID=xxx TO_NUMBER=5215512345678 npx tsx scripts/send-whatsapp-template.ts');
    process.exit(1);
  }

  console.log('📤 Enviando WhatsApp Template...');
  console.log('📋 Chatbot ID:', CHATBOT_ID);
  console.log('📱 Destinatario:', TO_NUMBER);
  console.log('📄 Template:', TEMPLATE_NAME);
  console.log('');

  try {
    // Get WhatsApp integration
    const integration = await db.integration.findFirst({
      where: {
        chatbotId: CHATBOT_ID,
        platform: 'WHATSAPP',
      },
    });

    if (!integration) {
      console.error('❌ No se encontró integración de WhatsApp activa');
      process.exit(1);
    }

    console.log('✅ Integración encontrada');
    console.log('   Phone Number ID:', integration.phoneNumberId);
    console.log('');

    // Initialize WhatsApp service
    const whatsapp = new WhatsAppSDKService(integration);

    // Send template based on name
    let result;

    if (TEMPLATE_NAME === 'saludo_prueba') {
      // Simple template without variables
      result = await whatsapp.sendTemplate(
        TO_NUMBER,
        'saludo_prueba',
        'es_ES'
      );
    } else if (TEMPLATE_NAME === 'hello_world') {
      // Template with header/body/footer
      result = await whatsapp.sendTemplate(
        TO_NUMBER,
        'hello_world',
        'en_US'
      );
    } else if (TEMPLATE_NAME === 'test_quick') {
      // Template with variables
      result = await whatsapp.sendTemplate(
        TO_NUMBER,
        'test_quick',
        'en_US',
        [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: '2025-10-25' },
              { type: 'text', text: '10:00 AM' },
            ],
          },
        ]
      );
    }

    if (result?.success) {
      console.log('✅ ¡Mensaje enviado exitosamente!');
      console.log('📨 Message ID:', result.messageId);
      console.log('');
      console.log('🎉 Revisa tu WhatsApp!');
    } else {
      console.error('❌ Error al enviar mensaje:');
      console.error(result?.error || 'Unknown error');
      console.log('');
      console.log('Respuesta completa:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

sendWhatsAppTemplate();
