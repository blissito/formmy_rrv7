/**
 * Cloudflare Worker para WhatsApp Webhook con soporte de Coexistence
 *
 * Este worker maneja los webhooks de WhatsApp filtrando mensajes "echo"
 * que provienen del WhatsApp Business App para evitar loops y permitir
 * la coexistencia entre el chatbot y la aplicación móvil.
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Verificación del webhook (GET request de Meta)
    if (request.method === 'GET' && path.startsWith('/webhook/')) {
      const mode = url.searchParams.get('hub.mode');
      const token = url.searchParams.get('hub.verify_token');
      const challenge = url.searchParams.get('hub.challenge');

      if (mode === 'subscribe') {
        // Obtener el chatbotId del path
        const chatbotId = path.split('/')[2];

        // Verificar el token contra el almacenado para este chatbot
        // En producción, esto debe verificarse contra tu base de datos
        const expectedToken = await env.KV.get(`webhook_token_${chatbotId}`);

        if (token === expectedToken) {
          console.log('Webhook verified successfully');
          return new Response(challenge, { status: 200 });
        } else {
          console.error('Webhook verification failed - token mismatch');
          return new Response('Forbidden', { status: 403 });
        }
      }
    }

    // Procesar mensajes entrantes (POST request de Meta)
    if (request.method === 'POST' && path.startsWith('/webhook/')) {
      try {
        const chatbotId = path.split('/')[2];
        const body = await request.json();

        console.log('Received webhook:', JSON.stringify(body, null, 2));

        // Verificar que es un webhook válido de WhatsApp
        if (!body.entry || !Array.isArray(body.entry)) {
          return new Response('OK', { status: 200 });
        }

        // Procesar cada entrada
        for (const entry of body.entry) {
          if (!entry.changes || !Array.isArray(entry.changes)) continue;

          for (const change of entry.changes) {
            // Solo procesar mensajes
            if (change.field !== 'messages') continue;

            const value = change.value;
            if (!value || !value.messages) continue;

            // Filtrar mensajes
            const filteredMessages = value.messages.filter(message => {
              // IMPORTANTE: Filtrar mensajes "echo" (enviados desde el Business App)
              // Estos mensajes tienen la metadata `origin.type = "business_initiated"`
              if (value.metadata?.origin?.type === 'business_initiated') {
                console.log(`Filtering out echo message from Business App: ${message.id}`);
                return false;
              }

              // También filtrar mensajes del propio chatbot para evitar loops
              if (message.from === value.metadata?.phone_number_id) {
                console.log(`Filtering out self message: ${message.id}`);
                return false;
              }

              // Filtrar mensajes de estado (enviados, entregados, leídos)
              if (value.statuses && value.statuses.length > 0) {
                console.log(`Filtering out status update`);
                return false;
              }

              return true;
            });

            // Si no hay mensajes después del filtrado, continuar
            if (filteredMessages.length === 0) {
              console.log('No messages to process after filtering');
              continue;
            }

            // Procesar mensajes filtrados
            for (const message of filteredMessages) {
              // Verificar si el mensaje ya fue procesado (deduplicación)
              const messageKey = `processed_${message.id}`;
              const wasProcessed = await env.KV.get(messageKey);

              if (wasProcessed) {
                console.log(`Message ${message.id} already processed, skipping`);
                continue;
              }

              // Marcar mensaje como procesado (TTL de 24 horas)
              await env.KV.put(messageKey, 'true', { expirationTtl: 86400 });

              // Preparar el payload para enviar a Formmy
              const formmyPayload = {
                chatbotId,
                message: {
                  id: message.id,
                  from: message.from,
                  timestamp: message.timestamp,
                  type: message.type,
                  text: message.text,
                  image: message.image,
                  document: message.document,
                  audio: message.audio,
                  video: message.video,
                  location: message.location,
                  contacts: message.contacts,
                  context: message.context, // Para mensajes que son respuestas
                },
                contact: {
                  wa_id: message.from,
                  profile_name: value.contacts?.[0]?.profile?.name || null,
                },
                metadata: {
                  display_phone_number: value.metadata?.display_phone_number,
                  phone_number_id: value.metadata?.phone_number_id,
                  business_account_id: value.metadata?.business_account_id,
                },
                coexistence: {
                  enabled: true,
                  origin: value.metadata?.origin || null,
                  processing_timestamp: Date.now(),
                }
              };

              // Enviar a Formmy para procesamiento
              const formmyResponse = await fetch(`${env.FORMMY_API_URL}/api/v1/webhooks/whatsapp`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Webhook-Secret': env.WEBHOOK_SECRET,
                },
                body: JSON.stringify(formmyPayload),
              });

              if (!formmyResponse.ok) {
                console.error(`Failed to forward message to Formmy: ${formmyResponse.status}`);
                // No retornar error para no hacer que Meta reintente
              } else {
                console.log(`Message ${message.id} forwarded successfully`);
              }
            }
          }
        }

        // Siempre retornar 200 OK a Meta
        return new Response('OK', { status: 200 });

      } catch (error) {
        console.error('Error processing webhook:', error);
        // Retornar 200 para evitar reintentos de Meta
        return new Response('OK', { status: 200 });
      }
    }

    // Endpoint de salud
    if (request.method === 'GET' && path === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        coexistence: 'enabled',
        version: '1.0.0'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Ruta no encontrada
    return new Response('Not Found', { status: 404 });
  }
};

/**
 * Configuración requerida en Cloudflare:
 *
 * KV Namespaces:
 * - Crear un KV namespace para almacenar tokens y mensajes procesados
 *
 * Environment Variables:
 * - FORMMY_API_URL: URL de la API de Formmy (ej: https://formmy.app)
 * - WEBHOOK_SECRET: Secret compartido con Formmy para autenticación
 *
 * Bindings en wrangler.toml:
 * ```toml
 * name = "formmy-whatsapp-worker"
 * main = "cloudflare-worker-whatsapp-coexistence.js"
 * compatibility_date = "2024-01-01"
 *
 * [[kv_namespaces]]
 * binding = "KV"
 * id = "your-kv-namespace-id"
 *
 * [vars]
 * FORMMY_API_URL = "https://formmy.app"
 * WEBHOOK_SECRET = "your-webhook-secret"
 * ```
 */