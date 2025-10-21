/**
 * Script para debuggear templates de WhatsApp
 * Muestra todos los templates y sus estados desde Meta Graph API
 */

// Necesitas proporcionar estos valores desde tu integración activa
const CHATBOT_ID = process.env.CHATBOT_ID || '';

async function debugWhatsAppTemplates() {
  if (!CHATBOT_ID) {
    console.error('❌ Debes proporcionar CHATBOT_ID como variable de entorno');
    console.log('Uso: CHATBOT_ID=tu_chatbot_id npx tsx scripts/debug-whatsapp-templates.ts');
    process.exit(1);
  }

  console.log('🔍 Debugging WhatsApp Templates...');
  console.log('📋 Chatbot ID:', CHATBOT_ID);
  console.log('');

  try {
    const response = await fetch(
      `https://formmy-v2.fly.dev/api/v1/integrations/whatsapp?intent=list_templates&chatbotId=${CHATBOT_ID}`
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error al obtener templates:', response.status);
      console.error('Detalles:', error);
      process.exit(1);
    }

    const data = await response.json();

    console.log('✅ Respuesta del servidor:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');

    if (data.templates && data.templates.length > 0) {
      console.log(`📊 Total de templates: ${data.templates.length}`);
      console.log('');

      data.templates.forEach((template: any, index: number) => {
        const statusEmoji = template.status === 'APPROVED' ? '✅' :
                           template.status === 'PENDING' ? '⏳' : '❌';

        console.log(`${statusEmoji} Template ${index + 1}:`);
        console.log(`   Nombre: ${template.name}`);
        console.log(`   Estado: ${template.status}`);
        console.log(`   Categoría: ${template.category}`);
        console.log(`   Idioma: ${template.language}`);
        if (template.components) {
          const body = template.components.find((c: any) => c.type === 'BODY');
          if (body) {
            console.log(`   Contenido: ${body.text?.substring(0, 50)}...`);
          }
        }
        console.log('');
      });

      const approvedCount = data.templates.filter((t: any) => t.status === 'APPROVED').length;
      const pendingCount = data.templates.filter((t: any) => t.status === 'PENDING').length;
      const rejectedCount = data.templates.filter((t: any) => t.status === 'REJECTED').length;

      console.log('📈 Resumen:');
      console.log(`   ✅ Aprobados: ${approvedCount}`);
      console.log(`   ⏳ Pendientes: ${pendingCount}`);
      console.log(`   ❌ Rechazados: ${rejectedCount}`);
      console.log('');

      if (approvedCount === 0) {
        console.log('⚠️  No tienes templates aprobados aún.');
        if (pendingCount > 0) {
          console.log('💡 Espera 1-15 minutos para que Meta apruebe los templates pendientes.');
        } else {
          console.log('💡 Crea templates en: https://business.facebook.com/wa/manage/message-templates/');
        }
      }
    } else {
      console.log('❌ No se encontraron templates.');
      console.log('💡 Crea templates en: https://business.facebook.com/wa/manage/message-templates/');
    }

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugWhatsAppTemplates();
