/**
 * Test sending WhatsApp template directly
 */

const ACCESS_TOKEN = 'EAAQCKJqSLTMBPqqqbFZB2dbyx7qiW1ExiEH2VaCMXDtJ3bPbElqE6xP2LTWbvjAkGaGeOq3cJdrfX2MZCj7UJlZBGAUNKBXflJFVU6cDZBURG0NYFCZBByM3YGHOFW9adPWcvyhOR54jUoLSc9HTb20933SHXgZA6GeVNbYbgtMYmKlAXy52iCu4NXLEDEsjQ8oW5FWLZC5KJKDE1iL4TEpoCZBajZAPcL3DZBElQnNjaZBExmlrBaZCm9ixRrJQyEMZD';
const PHONE_NUMBER_ID = '699799846554182';
const TO_NUMBER = '5217712412825';
const TEMPLATE_NAME = 'saludo_prueba';

async function testSendTemplate() {
  console.log('🧪 Testing WhatsApp template send...\n');
  console.log('📋 Config:');
  console.log(`   Phone Number ID: ${PHONE_NUMBER_ID}`);
  console.log(`   To: ${TO_NUMBER}`);
  console.log(`   Template: ${TEMPLATE_NAME}`);
  console.log('');

  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: TO_NUMBER,
    type: 'template',
    template: {
      name: TEMPLATE_NAME,
      language: {
        code: 'es_ES'
      }
    }
  };

  console.log('📤 Sending payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ACCESS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error Response:');
      console.error(`   Status: ${response.status} ${response.statusText}`);
      console.error(`   Error: ${JSON.stringify(data, null, 2)}`);

      if (data.error?.message) {
        console.error(`\n💡 Error message: ${data.error.message}`);
      }

      process.exit(1);
    }

    console.log('✅ Success!');
    console.log('📨 Response:');
    console.log(JSON.stringify(data, null, 2));
    console.log('');
    console.log(`📱 Message ID: ${data.messages?.[0]?.id}`);
    console.log(`📊 Status: ${data.messages?.[0]?.message_status || 'N/A'}`);
    console.log('');
    console.log('🎉 Check your WhatsApp now!');

  } catch (error) {
    console.error('❌ Network error:', error);
    process.exit(1);
  }
}

testSendTemplate();
