import { config } from 'dotenv';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar variables de entorno
config({ path: resolve(__dirname, '../.env') });

// URL del webhook local
const WEBHOOK_URL = 'http://localhost:3000/stripe/webhook';

// Crear un evento de prueba de suscripción creada
const testEvent = {
  id: 'evt_test_webhook',
  type: 'customer.subscription.created',
  data: {
    object: {
      id: 'sub_test123',
      customer: 'cus_test123', // Reemplaza con un customerId de prueba válido de tu base de datos
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

// Función para probar el webhook
async function testWebhook() {
  try {
    console.log('Enviando evento de prueba al webhook...');
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 'test_signature' // En producción, esto debería ser una firma válida
      },
      body: JSON.stringify(testEvent)
    });

    console.log('Respuesta del servidor:');
    console.log(`Estado: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error en la respuesta:', errorText);
      return;
    }
    
    console.log('Webhook probado exitosamente!');
    console.log('Verifica los logs del servidor para ver el procesamiento del evento.');
    
  } catch (error) {
    console.error('Error al probar el webhook:', error);
  }
}

// Ejecutar la prueba
testWebhook();
