/**
 * Facebook Messenger OAuth Service
 *
 * Maneja el flujo completo de OAuth 2.0 para Facebook Messenger:
 * 1. Generar URL de autorización
 * 2. Intercambiar código por tokens
 * 3. Obtener páginas de Facebook del usuario
 * 4. Guardar tokens en la base de datos
 *
 * Docs: https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow
 */

import { db } from "~/utils/db.server";

const META_APP_ID = process.env.META_APP_ID;
const META_APP_SECRET = process.env.META_APP_SECRET;
const BASE_URL = process.env.NODE_ENV === "production"
  ? (process.env.APP_URL || "https://formmy.app")
  : "http://localhost:3000";
const REDIRECT_URI = `${BASE_URL}/api/v1/integrations/messenger/callback`;

// Scopes requeridos para Messenger
const REQUIRED_SCOPES = [
  "pages_messaging", // Enviar y recibir mensajes
  "pages_manage_metadata", // Gestionar metadata de la página
  "pages_read_engagement", // Leer engagement de la página
  "pages_show_list", // Listar páginas del usuario
];

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
}

interface ExchangeTokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface PagesResponse {
  data: FacebookPage[];
}

export class MessengerOAuthService {
  /**
   * Genera la URL de autorización OAuth de Facebook
   */
  static getAuthorizationUrl(chatbotId: string): string {
    if (!META_APP_ID) {
      throw new Error("META_APP_ID no está configurado");
    }

    const params = new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: REDIRECT_URI,
      scope: REQUIRED_SCOPES.join(","),
      state: chatbotId, // Usamos el chatbotId como state para validar el callback
      response_type: "code",
    });

    return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
  }

  /**
   * Intercambia el código de autorización por un access token
   */
  static async exchangeCodeForToken(code: string): Promise<string> {
    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID o META_APP_SECRET no están configurados");
    }

    const params = new URLSearchParams({
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      redirect_uri: REDIRECT_URI,
      code,
    });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al intercambiar código por token: ${error}`);
    }

    const data: ExchangeTokenResponse = await response.json();
    return data.access_token;
  }

  /**
   * Obtiene las páginas de Facebook del usuario y sus tokens de acceso
   */
  static async getUserPages(userAccessToken: string): Promise<FacebookPage[]> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${userAccessToken}`,
      { method: "GET" }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al obtener páginas: ${error}`);
    }

    const data: PagesResponse = await response.json();
    return data.data || [];
  }

  /**
   * Convierte un Page Access Token de corta duración a uno de larga duración (long-lived)
   * Los Page Access Tokens no expiran si la página no cambia de configuración
   */
  static async exchangeForLongLivedToken(shortLivedToken: string): Promise<string> {
    if (!META_APP_ID || !META_APP_SECRET) {
      throw new Error("META_APP_ID o META_APP_SECRET no están configurados");
    }

    const params = new URLSearchParams({
      grant_type: "fb_exchange_token",
      client_id: META_APP_ID,
      client_secret: META_APP_SECRET,
      fb_exchange_token: shortLivedToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?${params.toString()}`,
      { method: "GET" }
    );

    if (!response.ok) {
      // Si falla la conversión, devolver el token original
      // Los Page Access Tokens ya son de larga duración por defecto
      console.warn("No se pudo convertir a long-lived token, usando token original");
      return shortLivedToken;
    }

    const data: ExchangeTokenResponse = await response.json();
    return data.access_token;
  }

  /**
   * Suscribe la página a la app de Facebook para recibir webhooks
   */
  static async subscribePageToApp(pageId: string, pageAccessToken: string): Promise<void> {
    const response = await fetch(
      `https://graph.facebook.com/v21.0/${pageId}/subscribed_apps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_token: pageAccessToken,
          subscribed_fields: [
            "messages",
            "messaging_postbacks",
            "message_reactions",
            "message_reads",
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error al suscribir página a la app: ${error}`);
    }
  }

  /**
   * Guarda la integración de Messenger en la base de datos
   */
  static async saveIntegration(
    chatbotId: string,
    pageId: string,
    pageAccessToken: string,
    pageName?: string
  ): Promise<void> {
    // Convertir a long-lived token si es posible
    const longLivedToken = await this.exchangeForLongLivedToken(pageAccessToken);

    // Suscribir la página a la app para recibir webhooks
    await this.subscribePageToApp(pageId, longLivedToken);

    // Guardar o actualizar la integración
    await db.integration.upsert({
      where: {
        platform_chatbotId: {
          platform: "MESSENGER",
          chatbotId,
        },
      },
      create: {
        platform: "MESSENGER",
        chatbotId,
        pageId,
        pageAccessToken: longLivedToken,
        isActive: true,
        metadata: {
          pageName: pageName || "Página de Facebook",
          subscribedFields: ["messages", "messaging_postbacks", "message_reactions"],
        },
      },
      update: {
        pageId,
        pageAccessToken: longLivedToken,
        isActive: true,
        errorMessage: null, // Limpiar errores previos
        metadata: {
          pageName: pageName || "Página de Facebook",
          subscribedFields: ["messages", "messaging_postbacks", "message_reactions"],
        },
      },
    });
  }

  /**
   * Flujo completo de OAuth: intercambiar código, obtener páginas, y guardar
   */
  static async completeOAuthFlow(
    code: string,
    chatbotId: string,
    selectedPageId?: string
  ): Promise<{ success: boolean; pages?: FacebookPage[]; error?: string }> {
    try {
      // 1. Intercambiar código por user access token
      const userAccessToken = await this.exchangeCodeForToken(code);

      // 2. Obtener páginas del usuario
      const pages = await this.getUserPages(userAccessToken);

      if (pages.length === 0) {
        return {
          success: false,
          error: "No se encontraron páginas de Facebook. Asegúrate de tener al menos una página.",
        };
      }

      // 3. Si se especificó una página, guardar la integración
      if (selectedPageId) {
        const selectedPage = pages.find((p) => p.id === selectedPageId);
        if (!selectedPage) {
          return {
            success: false,
            error: "La página seleccionada no existe.",
          };
        }

        await this.saveIntegration(
          chatbotId,
          selectedPage.id,
          selectedPage.access_token,
          selectedPage.name
        );

        return { success: true };
      }

      // 4. Si no se especificó página, devolver la lista para que el usuario elija
      return { success: true, pages };
    } catch (error) {
      console.error("Error en OAuth flow de Messenger:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      };
    }
  }
}
