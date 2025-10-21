/**
 * Enviar template hello_world con header/footer
 */

const ACCESS_TOKEN = 'EAAQCKJqSLTMBPqqqbFZB2dbyx7qiW1ExiEH2VaCMXDtJ3bPbElqE6xP2LTWbvjAkGaGeOq3cJdrfX2MZCj7UJlZBGAUNKBXflJFVU6cDZBURG0NYFCZBByM3YGHOFW9adPWcvyhOR54jUoLSc9HTb20933SHXgZA6GeVNbYbgtMYmKlAXy52iCu4NXLEDEsjQ8oW5FWLZC5KJKDE1iL4TEpoCZBajZAPcL3DZBElQnNjaZBExmlrBaZCm9ixRrJQyEMZD';
const PHONE_NUMBER_ID = '699799846554182';
const TO_NUMBER = '5217712412825';

async function sendTemplate() {
  console.log('📤 Enviando template "hello_world" (con header/footer)...\n');

  const url = `https://graph.facebook.com/v20.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: TO_NUMBER,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US',
      },
    },
  };

  console.log('📋 Template: hello_world');
  console.log('   Header: "Hello World"');
  console.log('   Body: "Welcome and congratulations!..."');
  console.log('   Footer: "WhatsApp Business Platform sample message"');
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error:');
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log('✅ ¡Mensaje enviado!');
    console.log('📨 Message ID:', data.messages?.[0]?.id);
    console.log('📊 Status:', data.messages?.[0]?.message_status);
    console.log('');
    console.log('🎉 Revisa tu WhatsApp - deberías ver un mensaje con header y footer!');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

sendTemplate();
