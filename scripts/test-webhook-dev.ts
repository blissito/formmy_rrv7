import { createHmac, timingSafeEqual } from 'crypto';

// Configuración para desarrollo
const LOCAL_WEBHOOK_SECRET = 'whsec_test';
const WEBHOOK_URL = 'http://localhost:3000/stripe/webhook';

// Función para generar una firma de webhook simulada
function generateTestSignature(payload: string, secret: string): string {
  const hmac = createHmac('sha256', secret);
  const signature = hmac.update(payload).digest('hex');
  return `t=${Date.now()},v1=${signature},v0=6ffbb79b7690c20518c4d6ceee3f2126d17625d925a71bffa55d7a3cabc09d5a`;
}

// Evento de prueba
const testEvent = {
  id: 'evt_test_webhook',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_test123',
      customer: 'cus_test123',
      status: 'active',
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60, // 30 días desde ahora
      items: {
        data: [{
          price: {
            id: 'price_test123',
            product: 'prod_test123'
          }
        }]
      }
    }
  }
};

// Convertir el evento a string
const payload = JSON.stringify(testEvent);

// Generar firma de prueba
const signature = generateTestSignature(payload, LOCAL_WEBHOOK_SECRET);

// Enviar solicitud al webhook
async function testWebhook() {
  try {
    console.log('Enviando evento de prueba al webhook local...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': signature
      },
      body: payload
    });

    console.log('Respuesta del servidor:');
    console.log(`Estado: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', errorText);
    } else {
      console.log('Webhook probado exitosamente!');
      console.log('Verifica los logs del servidor para ver el procesamiento del evento.');
    }
  } catch (error) {
    console.error('Error al probar el webhook:', error);
  }
}

// Ejecutar la prueba
testWebhook();
