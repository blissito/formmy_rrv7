/**
 * Facebook Messenger Service
 *
 * Servicio para enviar mensajes a través de la API de Messenger
 * Docs: https://developers.facebook.com/docs/messenger-platform/reference/send-api
 */

import { db } from "~/utils/db.server";

const MESSENGER_API_URL = "https://graph.facebook.com/v21.0";

interface SendMessageOptions {
  recipientId: string; // PSID (Page-Scoped ID) del usuario
  text?: string;
  attachmentUrl?: string;
  attachmentType?: "image" | "audio" | "video" | "file";
  quickReplies?: Array<{
    content_type: "text";
    title: string;
    payload: string;
  }>;
}

interface SendMessageResponse {
  recipient_id: string;
  message_id: string;
}

export class MessengerService {
  private pageAccessToken: string;

  constructor(pageAccessToken: string) {
    this.pageAccessToken = pageAccessToken;
  }

  /**
   * Crear instancia del servicio desde la base de datos
   */
  static async fromChatbot(chatbotId: string): Promise<MessengerService | null> {
    const integration = await db.integration.findFirst({
      where: {
        chatbotId,
        platform: "MESSENGER",
        isActive: true,
      },
    });

    if (!integration || !integration.pageAccessToken) {
      return null;
    }

    return new MessengerService(integration.pageAccessToken);
  }

  /**
   * Enviar mensaje de texto
   */
  async sendTextMessage(
    recipientId: string,
    text: string,
    quickReplies?: SendMessageOptions["quickReplies"]
  ): Promise<SendMessageResponse> {
    const messageData: any = {
      text,
    };

    if (quickReplies && quickReplies.length > 0) {
      messageData.quick_replies = quickReplies;
    }

    return this.sendMessage(recipientId, messageData);
  }

  /**
   * Enviar adjunto (imagen, video, audio, archivo)
   */
  async sendAttachment(
    recipientId: string,
    attachmentType: "image" | "audio" | "video" | "file",
    attachmentUrl: string
  ): Promise<SendMessageResponse> {
    const messageData = {
      attachment: {
        type: attachmentType,
        payload: {
          url: attachmentUrl,
          is_reusable: true,
        },
      },
    };

    return this.sendMessage(recipientId, messageData);
  }

  /**
   * Enviar indicador de escritura (typing on/off)
   */
  async sendTypingIndicator(
    recipientId: string,
    action: "typing_on" | "typing_off"
  ): Promise<void> {
    try {
      await fetch(
        `${MESSENGER_API_URL}/me/messages?access_token=${this.pageAccessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: {
              id: recipientId,
            },
            sender_action: action,
          }),
        }
      );
    } catch (error) {
      console.error("Error sending typing indicator:", error);
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async markSeen(recipientId: string): Promise<void> {
    try {
      await fetch(
        `${MESSENGER_API_URL}/me/messages?access_token=${this.pageAccessToken}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            recipient: {
              id: recipientId,
            },
            sender_action: "mark_seen",
          }),
        }
      );
    } catch (error) {
      console.error("Error marking message as seen:", error);
    }
  }

  /**
   * Obtener información del usuario
   */
  async getUserProfile(userId: string): Promise<{
    id: string;
    name?: string;
    first_name?: string;
    last_name?: string;
    profile_pic?: string;
  } | null> {
    try {
      const response = await fetch(
        `${MESSENGER_API_URL}/${userId}?fields=first_name,last_name,profile_pic&access_token=${this.pageAccessToken}`,
        { method: "GET" }
      );

      if (!response.ok) {
        console.error("Error fetching user profile:", await response.text());
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  }

  /**
   * Método privado para enviar mensaje genérico
   */
  private async sendMessage(
    recipientId: string,
    messageData: any
  ): Promise<SendMessageResponse> {
    const payload = {
      recipient: {
        id: recipientId,
      },
      message: messageData,
    };

    const response = await fetch(
      `${MESSENGER_API_URL}/me/messages?access_token=${this.pageAccessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Error sending Messenger message: ${error}`);
    }

    return await response.json();
  }

  /**
   * Configurar botón "Get Started" (solo disponible si la página tiene permisos)
   */
  static async configureGetStartedButton(
    pageAccessToken: string,
    payload: string = "GET_STARTED"
  ): Promise<void> {
    const response = await fetch(
      `${MESSENGER_API_URL}/me/messenger_profile?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          get_started: {
            payload,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error configuring Get Started button:", error);
    }
  }

  /**
   * Configurar mensaje de bienvenida
   */
  static async configureGreeting(
    pageAccessToken: string,
    greetingText: string
  ): Promise<void> {
    const response = await fetch(
      `${MESSENGER_API_URL}/me/messenger_profile?access_token=${pageAccessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          greeting: [
            {
              locale: "default",
              text: greetingText,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Error configuring greeting:", error);
    }
  }
}
