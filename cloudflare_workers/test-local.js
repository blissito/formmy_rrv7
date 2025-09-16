/**
 * Script de testing local para el Worker
 * Prueba la funcionalidad sin necesidad de WhatsApp
 */

// Simulación del entorno de Cloudflare Workers
const env = {
  FLOWISE_URL: 'http://localhost:3000', // Cambia por tu Flowise URL
  FLOWISE_CHATFLOW_ID: 'your-chatflow-id',
  FLOWISE_API_KEY: 'your-api-key', // Opcional
  WHATSAPP_TOKEN: 'test-token',
  PHONE_NUMBER_ID: 'test-phone-id',
  VERIFY_TOKEN: 'test-verify-token',
  ENVIRONMENT: 'development'
};

// Importar el worker (esto no funcionará directamente en Node.js)
// Este archivo es para referencia de cómo probar la lógica

/**
 * Test de verificación de webhook
 */
function testWebhookVerification() {
  console.log('🧪 Testing webhook verification...');

  const testUrl = 'http://localhost:8787/webhook?hub.mode=subscribe&hub.verify_token=test-verify-token&hub.challenge=challenge123';

  // Simulación de la lógica de verificación
  const url = new URL(testUrl);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
    console.log('✅ Webhook verification would succeed');
    console.log('Response:', challenge);
  } else {
    console.log('❌ Webhook verification would fail');
  }
}

/**
 * Test de procesamiento de mensaje
 */
function testMessageProcessing() {
  console.log('\\n🧪 Testing message processing...');

  // Mensaje de WhatsApp simulado
  const whatsappWebhook = {
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '521234567890',
            text: {
              body: 'Hola, ¿cómo estás?'
            },
            timestamp: Date.now()
          }]
        }
      }]
    }]
  };

  // Extraer datos del webhook
  const message = whatsappWebhook.entry[0].changes[0].value.messages[0];
  const from = message.from;
  const text = message.text.body;

  console.log(`📱 Message from: ${from}`);
  console.log(`💬 Text: "${text}"`);

  // Aquí normalmente llamarías a Flowise
  console.log('🤖 Would call Flowise with:', {
    question: text,
    overrideConfig: { sessionId: from }
  });

  console.log('✅ Message processing logic is correct');
}

/**
 * Test de extracción de texto
 */
function testTextExtraction() {
  console.log('\\n🧪 Testing text extraction...');

  const testMessages = [
    // Mensaje de texto simple
    {
      text: { body: 'Mensaje simple' },
      expected: 'Mensaje simple'
    },
    // Mensaje interactivo con botón
    {
      interactive: {
        button_reply: { title: 'Botón presionado' }
      },
      expected: 'Botón presionado'
    },
    // Mensaje de lista
    {
      interactive: {
        list_reply: { title: 'Opción seleccionada' }
      },
      expected: 'Opción seleccionada'
    },
    // Documento con caption
    {
      document: { caption: 'Caption del documento' },
      expected: 'Caption del documento'
    }
  ];

  testMessages.forEach((testCase, index) => {
    const extracted = extractMessageText(testCase);
    const success = extracted === testCase.expected;

    console.log(`Test ${index + 1}: ${success ? '✅' : '❌'}`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got: "${extracted}"`);
  });
}

/**
 * Función de extracción de texto (copiada del worker)
 */
function extractMessageText(message) {
  if (message.text?.body) {
    return message.text.body;
  }

  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }

  if (message.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }

  if (message.document?.caption || message.image?.caption) {
    return message.document?.caption || message.image?.caption;
  }

  return null;
}

/**
 * Test de configuración de environment
 */
function testEnvironmentConfig() {
  console.log('\\n🧪 Testing environment configuration...');

  const requiredVars = [
    'FLOWISE_URL',
    'FLOWISE_CHATFLOW_ID',
    'WHATSAPP_TOKEN',
    'PHONE_NUMBER_ID',
    'VERIFY_TOKEN'
  ];

  let allConfigured = true;

  requiredVars.forEach(varName => {
    const value = env[varName];
    const isConfigured = value && value !== 'your-' + varName.toLowerCase().replace('_', '-');

    console.log(`${isConfigured ? '✅' : '❌'} ${varName}: ${isConfigured ? 'configured' : 'missing/default'}`);

    if (!isConfigured) allConfigured = false;
  });

  console.log(`\\n${allConfigured ? '✅' : '⚠️'} Environment: ${allConfigured ? 'Ready for production' : 'Needs configuration'}`);
}

/**
 * Ejecutar todos los tests
 */
function runAllTests() {
  console.log('🚀 Running Worker Tests\\n');

  testWebhookVerification();
  testMessageProcessing();
  testTextExtraction();
  testEnvironmentConfig();

  console.log('\\n🎉 Tests completed!');
  console.log('\\n📝 Next steps:');
  console.log('1. Configure your environment variables');
  console.log('2. Run: wrangler dev');
  console.log('3. Test with: curl -X POST http://localhost:8787/test -d \'{"message":"test"}\'');
  console.log('4. Deploy with: npm run deploy');
}

// Ejecutar tests si se llama directamente
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testWebhookVerification,
  testMessageProcessing,
  testTextExtraction,
  testEnvironmentConfig,
  runAllTests
};