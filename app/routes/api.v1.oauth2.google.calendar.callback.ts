import { updateIntegration } from "../../server/chatbot/integrationModel.server";

interface StateData {
  integrationId: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export async function loader({ request }: any) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    // Handle OAuth error
    if (error) {
      const errorDescription = url.searchParams.get("error_description") || "Error de autorización";
      return new Response(`
        <html>
          <head><title>Error de Autorización</title></head>
          <body>
            <h1>Error de Autorización</h1>
            <p>Error: ${error}</p>
            <p>Descripción: ${errorDescription}</p>
            <script>
              window.opener?.postMessage({ 
                type: 'oauth_error', 
                error: '${error}',
                description: '${errorDescription}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
        status: 400
      });
    }

    if (!code || !state) {
      return new Response(`
        <html>
          <head><title>Error de Autorización</title></head>
          <body>
            <h1>Error de Autorización</h1>
            <p>Faltan parámetros requeridos (code o state)</p>
            <script>
              window.opener?.postMessage({ 
                type: 'oauth_error', 
                error: 'missing_params',
                description: 'Faltan parámetros requeridos'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
        status: 400
      });
    }

    // Parse state to get integration data
    const stateData: StateData = JSON.parse(decodeURIComponent(state));
    const { integrationId, clientId, clientSecret, redirectUri } = stateData;

    // Exchange authorization code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json().catch(() => ({ error: "unknown_error" }));
      
      return new Response(`
        <html>
          <head><title>Error de Token</title></head>
          <body>
            <h1>Error al obtener token</h1>
            <p>Error: ${errorData.error || 'Error desconocido'}</p>
            <script>
              window.opener?.postMessage({ 
                type: 'oauth_error', 
                error: 'token_error',
                description: '${errorData.error_description || 'Error al obtener token'}'
              }, '*');
              window.close();
            </script>
          </body>
        </html>
      `, {
        headers: { "Content-Type": "text/html" },
        status: 400
      });
    }

    const tokenData = await tokenResponse.json();

    // Update integration with tokens
    const updatedIntegration = await updateIntegration(integrationId, {
      token: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      isActive: true,
      lastActivity: new Date(),
      errorMessage: undefined
    });

    // Return success page that closes popup and notifies parent
    return new Response(`
      <html>
        <head><title>Autorización Exitosa</title></head>
        <body>
          <h1>¡Autorización Exitosa!</h1>
          <p>Google Calendar se ha conectado correctamente.</p>
          <p>Esta ventana se cerrará automáticamente...</p>
          <script>
            window.opener?.postMessage({ 
              type: 'oauth_success', 
              integration: ${JSON.stringify(updatedIntegration)}
            }, '*');
            setTimeout(() => window.close(), 2000);
          </script>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    return new Response(`
      <html>
        <head><title>Error</title></head>
        <body>
          <h1>Error</h1>
          <p>${errorMessage}</p>
          <script>
            window.opener?.postMessage({ 
              type: 'oauth_error', 
              error: 'server_error',
              description: '${errorMessage}'
            }, '*');
            window.close();
          </script>
        </body>
      </html>
    `, {
      headers: { "Content-Type": "text/html" },
      status: 500
    });
  }
}
