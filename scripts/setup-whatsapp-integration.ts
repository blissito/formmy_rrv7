import { db } from '../app/utils/db.server';

async function setupWhatsAppIntegration() {
  try {
    console.log('🔍 Buscando usuario fixtergeek@gmail.com...');

    const user = await db.user.findUnique({
      where: { email: 'fixtergeek@gmail.com' },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      console.error('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log('✅ Usuario encontrado:', { id: user.id, email: user.email, name: user.name });

    console.log('\n🔍 Buscando chatbot del usuario...');

    const chatbot = await db.chatbot.findFirst({
      where: { userId: user.id },
      select: { id: true, name: true, slug: true }
    });

    if (!chatbot) {
      console.error('❌ Chatbot no encontrado');
      process.exit(1);
    }

    console.log('✅ Chatbot encontrado:', { id: chatbot.id, name: chatbot.name, slug: chatbot.slug });

    // Datos de WhatsApp
    const whatsappData = {
      phoneNumberId: '699799846554182',
      accessToken: 'EAAQCKJqSLTMBPojExoX9KDraZCQ9AQU1DYhZBwCRHFEE6zfbfPAv0IzZA5d3Ol0YUd3CgyZBqA8JIefY8Gsah1E0CmBkIeFHQDA9vayKiDGkjayZBGRUQupcOU0VrDJ7nu5SJw1dN9F2XTM94Tz1CaYk07YjLvLDyTZA0GNYdLMbyBZAHznZBgBrOhmNrD0gj4fmOuc0VCREcWK5HaW9tI9ZCDUppQQVOzI2BYNi3N78ZBrZBD2DGJRpKnA2oOj7VwZD',
      wabaId: '1649369379786047'
    };

    console.log('\n🔍 Verificando si ya existe integración de WhatsApp...');

    const existingIntegration = await db.integration.findFirst({
      where: {
        chatbotId: chatbot.id,
        platform: 'WHATSAPP'
      }
    });

    if (existingIntegration) {
      console.log('⚠️  Ya existe una integración de WhatsApp, actualizando...');

      const updated = await db.integration.update({
        where: { id: existingIntegration.id },
        data: {
          token: `encrypted_${whatsappData.accessToken}`,
          phoneNumberId: whatsappData.phoneNumberId,
          businessAccountId: whatsappData.wabaId,
          webhookVerifyToken: 'formmy',
          isActive: true,
          lastActivity: new Date()
        }
      });

      console.log('✅ Integración actualizada:', { id: updated.id });
    } else {
      console.log('✨ Creando nueva integración de WhatsApp...');

      const integration = await db.integration.create({
        data: {
          chatbotId: chatbot.id,
          platform: 'WHATSAPP',
          token: `encrypted_${whatsappData.accessToken}`,
          phoneNumberId: whatsappData.phoneNumberId,
          businessAccountId: whatsappData.wabaId,
          webhookVerifyToken: 'formmy',
          isActive: true
        }
      });

      console.log('✅ Integración creada:', { id: integration.id });
    }

    console.log('\n✅ PROCESO COMPLETADO EXITOSAMENTE');
    console.log('📱 Phone Number ID:', whatsappData.phoneNumberId);
    console.log('🏢 WABA ID:', whatsappData.wabaId);
    console.log('🔗 Chatbot:', chatbot.slug);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

setupWhatsAppIntegration();
