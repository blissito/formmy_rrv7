/**
 * WhatsApp Business + Flowise Bridge
 * Cloudflare Worker que conecta WhatsApp Business API con Flowise
 *
 * Este worker recibe webhooks de WhatsApp, procesa mensajes con Flowise
 * y envía respuestas de vuelta a WhatsApp automáticamente.
 */

import {
  CONFIG,
  getActiveFlowiseConfig,
  getFlowisePredictionURL,
  getFallbackConfigs,
  applyEnvironmentConfig
} from './config.js';

export default {
  async fetch(request, env, ctx) {
    // Aplicar configuración según ambiente
    const config = applyEnvironmentConfig(env);

    const url = new URL(request.url);

    // CORS headers para desarrollo
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Manejar OPTIONS para CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Verificación de webhook de WhatsApp (GET)
      if (request.method === 'GET' && url.pathname === '/webhook') {
        return handleWhatsAppVerification(request, env);
      }

      // Procesar mensajes de WhatsApp (POST)
      if (request.method === 'POST' && url.pathname === '/webhook') {
        return await handleWhatsAppMessage(request, env);
      }

      // Health check endpoint
      if (url.pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          environment: env.ENVIRONMENT || 'production'
        }), {
          headers: { 'Content-Type': 'application/json', ...corsHeaders }
        });
      }

      // Endpoint de testing
      if (url.pathname === '/test' && request.method === 'POST') {
        return await handleTestMessage(request, env);
      }

      return new Response('Not Found', {
        status: 404,
        headers: corsHeaders
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
};

/**
 * Maneja la verificación de webhook de WhatsApp Business
 */
function handleWhatsAppVerification(request, env) {
  const url = new URL(request.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  console.log('Webhook verification attempt:', { mode, token: token ? '***' : 'missing' });

  if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
    console.log('Webhook verified successfully');
    return new Response(challenge, {
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  console.log('Webhook verification failed');
  return new Response('Forbidden', { status: 403 });
}

/**
 * Procesa mensajes entrantes de WhatsApp
 */
async function handleWhatsAppMessage(request, env) {
  const body = await request.json();

  console.log('Received WhatsApp webhook:', JSON.stringify(body, null, 2));

  // Extraer mensaje del webhook
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const messages = value?.messages;

  if (!messages || messages.length === 0) {
    console.log('No messages found in webhook');
    return new Response('OK - No messages');
  }

  const message = messages[0];
  const from = message.from;
  const messageText = extractMessageText(message);

  if (!messageText) {
    console.log('No text content found in message');
    return new Response('OK - No text content');
  }

  console.log(`Processing message from ${from}: "${messageText}"`);

  try {
    // Procesar con Flowise
    const flowiseResponse = await callFlowise(messageText, from, env);

    // Enviar respuesta a WhatsApp
    await sendWhatsAppMessage(from, flowiseResponse, env);

    console.log(`Successfully processed message from ${from}`);
    return new Response('OK');

  } catch (error) {
    console.error('Error processing message:', error);

    // Enviar mensaje de error al usuario
    await sendWhatsAppMessage(
      from,
      'Lo siento, hubo un error procesando tu mensaje. Por favor intenta de nuevo.',
      env
    );

    return new Response('Error processed', { status: 200 }); // Retornar 200 para evitar reintento de WhatsApp
  }
}

/**
 * Extrae texto del mensaje de WhatsApp (soporta varios tipos)
 */
function extractMessageText(message) {
  // Mensaje de texto simple
  if (message.text?.body) {
    return message.text.body;
  }

  // Mensaje interactivo (botones, listas)
  if (message.interactive?.button_reply?.title) {
    return message.interactive.button_reply.title;
  }

  if (message.interactive?.list_reply?.title) {
    return message.interactive.list_reply.title;
  }

  // Mensaje de documento/imagen con caption
  if (message.document?.caption || message.image?.caption) {
    return message.document?.caption || message.image?.caption;
  }

  return null;
}

/**
 * Llama a la API de Flowise para procesar el mensaje
 */
async function callFlowise(text, sessionId, env) {
  const activeConfig = getActiveFlowiseConfig();
  const flowiseUrl = getFlowisePredictionURL();

  const payload = {
    question: text,
    overrideConfig: {
      sessionId: sessionId,
      returnSourceDocuments: false
    }
  };

  const startTime = Date.now();

  console.log(`🔗 Calling Flowise [${CONFIG.flowise.active}]: ${activeConfig.name}`);
  console.log(`📍 URL: ${flowiseUrl}`);

  if (CONFIG.behavior.enableDetailedLogs) {
    console.log('📝 Payload:', JSON.stringify(payload, null, 2));
  }

  try {
    const response = await fetch(flowiseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(activeConfig.apiKey && env.FLOWISE_API_KEY && {
          'Authorization': `Bearer ${env.FLOWISE_API_KEY}`
        })
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(CONFIG.behavior.timeout)
    });

    const responseTime = Date.now() - startTime;

    if (CONFIG.monitoring.logPerformance) {
      console.log(`⏱️ Response time: ${responseTime}ms`);

      if (responseTime > CONFIG.monitoring.latencyThreshold) {
        console.warn(`🐌 Slow response detected: ${responseTime}ms > ${CONFIG.monitoring.latencyThreshold}ms`);
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Flowise API error [${activeConfig.name}]:`, response.status, errorText);

      // Intentar fallback si está habilitado
      if (CONFIG.behavior.enableFallback) {
        return await tryFallbackEndpoints(text, sessionId, env, activeConfig.name);
      }

      throw new Error(`Flowise API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    if (CONFIG.behavior.enableDetailedLogs) {
      console.log('✅ Flowise response:', JSON.stringify(data, null, 2));
    }

    return data.text || data.result || CONFIG.messages.invalidMessage;

  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.error(`⏰ Timeout after ${responseTime}ms`);

      if (CONFIG.behavior.enableFallback) {
        return await tryFallbackEndpoints(text, sessionId, env, activeConfig.name);
      }

      return CONFIG.messages.timeoutMessage;
    }

    console.error(`💥 Error calling Flowise [${activeConfig.name}]:`, error.message);

    if (CONFIG.behavior.enableFallback) {
      return await tryFallbackEndpoints(text, sessionId, env, activeConfig.name);
    }

    throw error;
  }
}

/**
 * Intenta endpoints de fallback cuando el principal falla
 */
async function tryFallbackEndpoints(text, sessionId, env, failedEndpoint) {
  const fallbackConfigs = getFallbackConfigs();

  console.log(`🔄 Trying fallback endpoints after ${failedEndpoint} failed...`);

  for (const fallbackConfig of fallbackConfigs) {
    if (fallbackConfig.name === failedEndpoint) continue;

    try {
      console.log(`🔧 Attempting fallback: ${fallbackConfig.name}`);

      const fallbackUrl = `${fallbackConfig.url}/api/v1/prediction/${fallbackConfig.chatflowId}`;

      const response = await fetch(fallbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(fallbackConfig.apiKey && env.FLOWISE_API_KEY && {
            'Authorization': `Bearer ${env.FLOWISE_API_KEY}`
          })
        },
        body: JSON.stringify({
          question: text,
          overrideConfig: { sessionId }
        }),
        signal: AbortSignal.timeout(CONFIG.behavior.timeout)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Fallback successful: ${fallbackConfig.name}`);
        return data.text || data.result || CONFIG.messages.invalidMessage;
      }

    } catch (error) {
      console.error(`❌ Fallback ${fallbackConfig.name} failed:`, error.message);
      continue;
    }
  }

  console.error('💀 All fallback endpoints failed');
  return CONFIG.messages.systemError;
}

/**
 * Envía mensaje de respuesta a WhatsApp Business API
 */
async function sendWhatsAppMessage(to, text, env) {
  const url = `https://graph.facebook.com/v18.0/${env.PHONE_NUMBER_ID}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    to: to,
    text: {
      body: text.substring(0, 4096) // WhatsApp tiene límite de 4096 caracteres
    }
  };

  console.log(`Sending WhatsApp message to ${to}: "${text.substring(0, 100)}..."`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.WHATSAPP_TOKEN}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('WhatsApp API error:', response.status, errorText);
    throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('WhatsApp message sent successfully:', result);
  return result;
}

/**
 * Endpoint de testing para probar la integración sin WhatsApp
 */
async function handleTestMessage(request, env) {
  const { message, sessionId = 'test-session' } = await request.json();

  if (!message) {
    return new Response(JSON.stringify({
      error: 'Message is required'
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const response = await callFlowise(message, sessionId, env);

    return new Response(JSON.stringify({
      success: true,
      input: message,
      output: response,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      input: message,
      sessionId: sessionId,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}