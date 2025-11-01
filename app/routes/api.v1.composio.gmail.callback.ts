/**
 * Composio Gmail OAuth Callback
 * Maneja el redirect después de que el usuario autoriza Gmail
 */

import { db } from '~/utils/db.server';

export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);

    // Composio Auth Config devuelve estos parámetros
    const status = url.searchParams.get("status");
    const connectedAccountId = url.searchParams.get("connectedAccountId");
    const appName = url.searchParams.get("appName");
    const chatbotId = url.searchParams.get("chatbotId");

    // OAuth tradicional (por si acaso)
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");


    // Handle OAuth error (tradicional)
    if (error) {
      const errorDescription = url.searchParams.get("error_description") || "Error de autorización";
      console.error(`❌ OAuth error:`, error, errorDescription);

      return new Response(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error de Autorización</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 {
                color: #e53e3e;
                margin: 0 0 1rem 0;
              }
              p {
                color: #666;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Error de Autorización</h1>
              <p><strong>Error:</strong> ${error}</p>
              <p>${errorDescription}</p>
              <p>Esta ventana se cerrará automáticamente...</p>
            </div>
            <script>
              // Notificar a la ventana padre
              if (window.opener) {
                window.opener.postMessage({
                  type: 'composio_oauth_error',
                  error: '${error}',
                  description: '${errorDescription}'
                }, '*');
              }

              // Cerrar ventana después de 3 segundos
              setTimeout(() => {
                window.close();
                // Si no se cierra, redirigir
                if (!window.closed) {
                  window.location.href = '/dashboard';
                }
              }, 3000);
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
        status: 400
      });
    }

    // Handle error from Composio (status != success)
    if (status && status !== 'success') {
      console.error(`❌ Composio error: status=${status}`);

      return new Response(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error de Autorización</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: #f5f5f5;
              }
              .container {
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                max-width: 500px;
                text-align: center;
              }
              h1 {
                color: #e53e3e;
                margin: 0 0 1rem 0;
              }
              p {
                color: #666;
                line-height: 1.6;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>❌ Error de Composio</h1>
              <p><strong>Estado:</strong> ${status}</p>
              <p>Esta ventana se cerrará automáticamente...</p>
            </div>
            <script>
              if (window.opener) {
                window.opener.postMessage({
                  type: 'composio_oauth_error',
                  error: 'composio_error',
                  description: 'Status: ${status}'
                }, '*');
              }
              setTimeout(() => {
                window.close();
                if (!window.closed) {
                  window.location.href = '/dashboard';
                }
              }, 3000);
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
        status: 400
      });
    }

    // ✅ Composio Auth Config Flow - Ya está todo conectado
    if (status === 'success' && connectedAccountId) {

      // Guardar integración en BD si tenemos chatbotId
      if (chatbotId) {
        try {
          await db.integration.upsert({
            where: {
              platform_chatbotId: {
                platform: 'GMAIL',
                chatbotId: chatbotId,
              },
            },
            create: {
              platform: 'GMAIL',
              chatbotId: chatbotId,
              isActive: true,
              lastActivity: new Date(),
              // Guardar el connectedAccountId de Composio en el campo token
              token: connectedAccountId,
            },
            update: {
              isActive: true,
              lastActivity: new Date(),
              errorMessage: null,
              // Actualizar el connectedAccountId
              token: connectedAccountId,
            },
          });

        } catch (dbError) {
          console.error('❌ Error guardando integración en BD:', dbError);
          // No fallar el OAuth por un error de BD, solo loguear
        }
      }

      return new Response(`
        <!DOCTYPE html>
        <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Autorización Exitosa</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              }
              .container {
                background: white;
                padding: 3rem;
                border-radius: 16px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                max-width: 500px;
                text-align: center;
                animation: slideIn 0.5s ease-out;
              }
              @keyframes slideIn {
                from {
                  opacity: 0;
                  transform: translateY(-20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              h1 {
                color: #48bb78;
                margin: 0 0 1rem 0;
                font-size: 2rem;
              }
              p {
                color: #666;
                line-height: 1.8;
                margin: 0.5rem 0;
              }
              .success-icon {
                font-size: 4rem;
                margin-bottom: 1rem;
              }
              .countdown {
                color: #667eea;
                font-weight: bold;
                font-size: 1.2rem;
                margin-top: 1.5rem;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="success-icon">✅</div>
              <h1>¡Autorización Exitosa!</h1>
              <p>Gmail se ha conectado correctamente a tu cuenta de Formmy.</p>
              <p>Ahora puedes usar tu agente para enviar y leer correos electrónicos.</p>
              <p class="countdown">Esta ventana se cerrará en <span id="countdown">3</span> segundos...</p>
            </div>
            <script>
              // Notificar a la ventana padre INMEDIATAMENTE
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage({
                  type: 'composio_oauth_success',
                  provider: 'gmail',
                  message: 'Gmail conectado exitosamente'
                }, window.location.origin);
              }

              // Countdown para cerrar la ventana
              let seconds = 3;
              const countdownEl = document.getElementById('countdown');

              const interval = setInterval(() => {
                seconds--;
                if (countdownEl) countdownEl.textContent = seconds.toString();

                if (seconds <= 0) {
                  clearInterval(interval);

                  // Cerrar ventana
                  window.close();

                  // Si no se cierra (bloqueado por navegador), redirigir
                  setTimeout(() => {
                    if (!window.closed) {
                      window.location.href = '/dashboard?integration=success';
                    }
                  }, 500);
                }
              }, 1000);
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" }
      });
    }

    // Si llegamos aquí, no hubo ni error ni éxito de Composio
    console.warn('⚠️ Callback recibido pero sin parámetros reconocidos');
    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Callback Inválido</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
              text-align: center;
            }
            h1 {
              color: #f59e0b;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⚠️ Callback Inválido</h1>
            <p>No se recibieron los parámetros esperados.</p>
            <p>Esta ventana se cerrará automáticamente...</p>
          </div>
          <script>
            setTimeout(() => {
              window.close();
              if (!window.closed) {
                window.location.href = '/dashboard';
              }
            }, 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
      status: 400
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    console.error("❌ Error en callback de Composio Gmail:", error);

    return new Response(`
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Error</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f5f5f5;
            }
            .container {
              background: white;
              padding: 2rem;
              border-radius: 8px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              max-width: 500px;
              text-align: center;
            }
            h1 {
              color: #e53e3e;
            }
            p {
              color: #666;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>❌ Error del Servidor</h1>
            <p>${errorMessage}</p>
            <p>Esta ventana se cerrará automáticamente...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage({
                type: 'composio_oauth_error',
                error: 'server_error',
                description: '${errorMessage}'
              }, '*');
            }
            setTimeout(() => {
              window.close();
              if (!window.closed) {
                window.location.href = '/dashboard';
              }
            }, 3000);
          </script>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
      status: 500
    });
  }
}
