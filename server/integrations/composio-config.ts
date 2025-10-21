/**
 * Composio Integrations - Configuración Declarativa
 * Define todas las integraciones en un solo lugar para evitar duplicación
 */

import type { IntegrationType } from "@prisma/client";

/**
 * Auth method type para integraciones Composio
 */
export type ComposioAuthMethod = "oauth2" | "api_key";

/**
 * Configuración base de una integración Composio
 */
export interface ComposioIntegrationConfig {
  /** Nombre de la integración (debe coincidir con Prisma IntegrationType) */
  name: IntegrationType;

  /** Display name para UI */
  displayName: string;

  /** Toolkit slug en Composio (ej: 'gmail', 'whatsapp') */
  toolkitSlug: string;

  /** Método de autenticación */
  authMethod: ComposioAuthMethod;

  /** Variable de entorno para Auth Config ID */
  authConfigEnvVar: string;

  /** Emoji para logs */
  emoji: string;

  /** Requiere datos adicionales del chatbot (ej: WhatsApp phone_number_id) */
  requiresChatbotData?: {
    field: string; // Campo en chatbot config (ej: 'whatsappConfig')
    key: string;   // Key dentro del campo (ej: 'phoneNumberId')
  };

  /** HTML de éxito para OAuth callback (personalizado por integración) */
  successCallbackHtml?: (params: {
    displayName: string;
    emoji: string;
    chatbotId?: string;
  }) => string;
}

/**
 * 🎯 ÚNICA FUENTE DE VERDAD - Configuración de todas las integraciones
 *
 * Para agregar nueva integración:
 * 1. Agregar valor al enum IntegrationType en schema.prisma
 * 2. Agregar configuración aquí
 * 3. Crear handlers en /server/tools/handlers/[nombre].ts
 * 4. Registrar tools en /server/tools/index.ts
 * 5. ✅ Las rutas de API se generan automáticamente
 */
export const COMPOSIO_INTEGRATIONS: Record<string, ComposioIntegrationConfig> = {
  GMAIL: {
    name: "GMAIL",
    displayName: "Gmail",
    toolkitSlug: "gmail",
    authMethod: "oauth2",
    authConfigEnvVar: "COMPOSIO_GMAIL_AUTH_CONFIG_ID",
    emoji: "📧",
  },

  GOOGLE_CALENDAR: {
    name: "GOOGLE_CALENDAR",
    displayName: "Google Calendar",
    toolkitSlug: "googlecalendar",
    authMethod: "oauth2",
    authConfigEnvVar: "COMPOSIO_GOOGLE_CALENDAR_AUTH_CONFIG_ID",
    emoji: "📅",
  },

  // Agregar más integraciones aquí...
  // NOTA: WhatsApp NO usa Composio (deprecado) - usa WhatsAppSDKService directo
};

/**
 * Helper: Obtener configuración de integración por nombre
 */
export function getIntegrationConfig(name: IntegrationType): ComposioIntegrationConfig | null {
  return COMPOSIO_INTEGRATIONS[name] || null;
}

/**
 * Helper: Validar que existe el Auth Config ID en env vars
 */
export function validateAuthConfig(config: ComposioIntegrationConfig): {
  valid: boolean;
  error?: string;
} {
  const authConfigId = process.env[config.authConfigEnvVar];

  if (!authConfigId) {
    return {
      valid: false,
      error: `${config.authConfigEnvVar} no está configurado. Ve a https://platform.composio.dev/marketplace/${config.toolkitSlug.toLowerCase()} y crea un Auth Config ${config.authMethod === 'oauth2' ? 'OAuth2' : 'API Key'}.`
    };
  }

  return { valid: true };
}

/**
 * Helper: Generar entityId consistente
 */
export function generateEntityId(chatbotId: string): string {
  return `chatbot_${chatbotId}`;
}

/**
 * Helper: HTML de callback de éxito por defecto
 */
export function getDefaultSuccessCallbackHtml(params: {
  displayName: string;
  emoji: string;
  chatbotId?: string;
}): string {
  const { displayName, emoji, chatbotId } = params;

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Autorización Exitosa - ${displayName}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 1rem;
      }
      .container {
        background: white;
        padding: 3rem 2rem;
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 500px;
        width: 100%;
        animation: slideIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      }
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-30px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      .emoji {
        font-size: 5rem;
        margin-bottom: 1rem;
        animation: bounce 0.8s ease-in-out;
      }
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-15px); }
      }
      h1 {
        color: #1a202c;
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 0.75rem;
      }
      .subtitle {
        color: #4a5568;
        font-size: 1.125rem;
        margin-bottom: 1.5rem;
      }
      .countdown-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 1rem;
        background: #f7fafc;
        border-radius: 12px;
        margin-top: 1.5rem;
      }
      .countdown {
        color: #667eea;
        font-weight: 700;
        font-size: 1.5rem;
      }
      .countdown-text {
        color: #4a5568;
        font-size: 1rem;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="emoji">${emoji}</div>
      <h1>¡Autorización Exitosa!</h1>
      <p class="subtitle">${displayName} conectado correctamente</p>

      <div class="countdown-container">
        <span class="countdown-text">Cerrando en</span>
        <span class="countdown" id="countdown">3</span>
        <span class="countdown-text">segundos...</span>
      </div>
    </div>

    <script>
      // ✅ CRÍTICO: Notificar a ventana padre INMEDIATAMENTE
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'composio_oauth_success',
          provider: '${displayName.toLowerCase()}',
          message: '${displayName} conectado exitosamente'
        }, window.location.origin);
      }

      // Countdown y cerrar ventana
      let seconds = 3;
      const countdownEl = document.getElementById('countdown');

      const interval = setInterval(() => {
        seconds--;
        if (countdownEl) countdownEl.textContent = seconds.toString();

        if (seconds <= 0) {
          clearInterval(interval);
          window.close();

          // Fallback si window.close() no funciona (algunos navegadores)
          setTimeout(() => {
            if (!window.closed) {
              window.location.href = '/dashboard${chatbotId ? `/chatbots/${chatbotId}/settings` : ''}?integration=success';
            }
          }, 500);
        }
      }, 1000);
    </script>
  </body>
</html>
`;
}

/**
 * Helper: HTML de callback de error
 */
export function getErrorCallbackHtml(params: {
  displayName: string;
  emoji: string;
  error: string;
}): string {
  const { displayName, emoji, error } = params;

  return `
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error de Autorización - ${displayName}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
        padding: 1rem;
      }
      .container {
        background: white;
        padding: 3rem 2rem;
        border-radius: 20px;
        box-shadow: 0 25px 60px rgba(0,0,0,0.3);
        text-align: center;
        max-width: 500px;
        width: 100%;
      }
      .emoji { font-size: 4rem; margin-bottom: 1rem; }
      h1 { color: #e53e3e; font-size: 2rem; margin-bottom: 0.75rem; }
      .error { color: #742a2a; background: #fed7d7; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
      .countdown { color: #4a5568; margin-top: 1.5rem; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="emoji">❌</div>
      <h1>Error de Autorización</h1>
      <div class="error">${error}</div>
      <p class="countdown">Cerrando en <span id="countdown">5</span>s...</p>
    </div>

    <script>
      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({
          type: 'composio_oauth_error',
          error: 'authorization_failed',
          description: '${error.replace(/'/g, "\\'")}'
        }, window.location.origin);
      }

      let seconds = 5;
      const interval = setInterval(() => {
        seconds--;
        document.getElementById('countdown').textContent = seconds;
        if (seconds <= 0) {
          clearInterval(interval);
          window.close();
          setTimeout(() => {
            if (!window.closed) {
              window.location.href = '/dashboard?integration=error';
            }
          }, 500);
        }
      }, 1000);
    </script>
  </body>
</html>
`;
}
