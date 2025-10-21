import { db } from '../app/utils/db.server';

async function verifyIntegration() {
  try {
    const integration = await db.integration.findUnique({
      where: { id: '68f6adf288c6f1e41f18c1f6' },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!integration) {
      console.error('❌ Integración no encontrada');
      process.exit(1);
    }

    console.log('✅ INTEGRACIÓN DE WHATSAPP VERIFICADA:\n');
    console.log('🆔 Integration ID:', integration.id);
    console.log('📱 Platform:', integration.platform);
    console.log('✅ Active:', integration.isActive);
    console.log('📞 Phone Number ID:', integration.phoneNumberId);
    console.log('🏢 Business Account ID:', integration.businessAccountId);
    console.log('🔐 Webhook Verify Token:', integration.webhookVerifyToken);
    console.log('🤖 Chatbot:', integration.chatbot?.name, `(${integration.chatbot?.slug})`);
    console.log('📅 Created:', integration.createdAt);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verifyIntegration();
