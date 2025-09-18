/**
 * WhatsApp Business Platform Service using official SDK
 * https://github.com/WhatsApp/WhatsApp-Nodejs-SDK
 */

import WhatsApp from 'whatsapp';
import type { Integration } from '@prisma/client';
import { decryptText } from '~/utils/encryption.server';

interface WhatsAppConfig {
  phoneNumberId: string;
  accessToken: string;
  businessAccountId: string;
  webhookVerifyToken?: string;
  apiVersion?: string;
}

interface SendMessageParams {
  to: string;
  message: string;
  type?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
  mediaUrl?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
}

interface WebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  text?: {
    body: string;
  };
  type: string;
  image?: {
    id: string;
    mime_type: string;
    sha256: string;
    caption?: string;
  };
  audio?: {
    id: string;
    mime_type: string;
  };
  video?: {
    id: string;
    mime_type: string;
    caption?: string;
  };
  document?: {
    id: string;
    mime_type: string;
    filename?: string;
    caption?: string;
  };
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: {
      formatted_name: string;
      first_name?: string;
      last_name?: string;
    };
    phones?: Array<{
      phone: string;
      type: string;
    }>;
  }>;
  context?: {
    from: string;
    id: string;
  };
}

export class WhatsAppSDKService {
  private wa: any;
  private config: WhatsAppConfig;
  private phoneNumberId: string;

  constructor(integration: Integration) {
    const settings = integration.settings as any;

    // Desencriptar el access token
    const decryptedToken = decryptText(settings.accessToken);

    this.config = {
      phoneNumberId: settings.phoneNumberId,
      accessToken: decryptedToken,
      businessAccountId: settings.businessAccountId,
      webhookVerifyToken: settings.webhookVerifyToken,
      apiVersion: settings.apiVersion || 'v18.0'
    };

    this.phoneNumberId = this.config.phoneNumberId;

    // Inicializar el SDK
    this.wa = new WhatsApp(this.config.accessToken);
  }

  /**
   * Enviar un mensaje de texto simple
   */
  async sendTextMessage(to: string, message: string): Promise<any> {
    try {
      const response = await this.wa.messages.text(
        {
          body: message
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enviar mensaje con imagen
   */
  async sendImageMessage(to: string, imageUrl: string, caption?: string): Promise<any> {
    try {
      const response = await this.wa.messages.image(
        {
          link: imageUrl,
          caption: caption
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp image:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enviar documento
   */
  async sendDocumentMessage(to: string, documentUrl: string, filename?: string, caption?: string): Promise<any> {
    try {
      const response = await this.wa.messages.document(
        {
          link: documentUrl,
          filename: filename,
          caption: caption
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp document:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enviar ubicación
   */
  async sendLocationMessage(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<any> {
    try {
      const response = await this.wa.messages.location(
        {
          latitude,
          longitude,
          name,
          address
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp location:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enviar mensaje con botones interactivos
   */
  async sendInteractiveButtons(
    to: string,
    bodyText: string,
    buttons: Array<{ id: string; title: string }>,
    headerText?: string,
    footerText?: string
  ): Promise<any> {
    try {
      const response = await this.wa.messages.interactive(
        {
          type: 'button',
          header: headerText ? { type: 'text', text: headerText } : undefined,
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            buttons: buttons.map(btn => ({
              type: 'reply',
              reply: {
                id: btn.id,
                title: btn.title
              }
            }))
          }
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp interactive message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Enviar lista interactiva
   */
  async sendInteractiveList(
    to: string,
    bodyText: string,
    buttonText: string,
    sections: Array<{
      title: string;
      rows: Array<{ id: string; title: string; description?: string }>;
    }>,
    headerText?: string,
    footerText?: string
  ): Promise<any> {
    try {
      const response = await this.wa.messages.interactive(
        {
          type: 'list',
          header: headerText ? { type: 'text', text: headerText } : undefined,
          body: { text: bodyText },
          footer: footerText ? { text: footerText } : undefined,
          action: {
            button: buttonText,
            sections
          }
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp list message:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Marcar mensaje como leído
   */
  async markAsRead(messageId: string): Promise<any> {
    try {
      const response = await this.wa.messages.markAsRead(messageId, this.phoneNumberId);
      return {
        success: true,
        response
      };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Procesar webhook entrante
   */
  static processWebhook(body: any): {
    messages: WebhookMessage[];
    statuses: any[];
    errors: any[];
  } {
    const result = {
      messages: [] as WebhookMessage[],
      statuses: [] as any[],
      errors: [] as any[]
    };

    if (!body.entry || !Array.isArray(body.entry)) {
      return result;
    }

    for (const entry of body.entry) {
      if (!entry.changes || !Array.isArray(entry.changes)) continue;

      for (const change of entry.changes) {
        const value = change.value;

        // Procesar mensajes entrantes
        if (change.field === 'messages' && value.messages) {
          result.messages.push(...value.messages);
        }

        // Procesar actualizaciones de estado
        if (value.statuses) {
          result.statuses.push(...value.statuses);
        }

        // Procesar errores
        if (value.errors) {
          result.errors.push(...value.errors);
        }
      }
    }

    return result;
  }

  /**
   * Verificar webhook (para la verificación inicial de Meta)
   */
  static verifyWebhook(
    mode: string,
    token: string,
    challenge: string,
    expectedToken: string
  ): { verified: boolean; challenge?: string } {
    if (mode === 'subscribe' && token === expectedToken) {
      return { verified: true, challenge };
    }
    return { verified: false };
  }

  /**
   * Obtener URL de descarga de media
   */
  async getMediaUrl(mediaId: string): Promise<string | null> {
    try {
      const response = await this.wa.media.get(mediaId);
      return response.url;
    } catch (error) {
      console.error('Error getting media URL:', error);
      return null;
    }
  }

  /**
   * Descargar archivo de media
   */
  async downloadMedia(mediaId: string): Promise<Buffer | null> {
    try {
      const url = await this.getMediaUrl(mediaId);
      if (!url) return null;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download media: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer);
    } catch (error) {
      console.error('Error downloading media:', error);
      return null;
    }
  }

  /**
   * Enviar plantilla de mensaje
   */
  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string = 'es',
    components?: any[]
  ): Promise<any> {
    try {
      const response = await this.wa.messages.template(
        {
          name: templateName,
          language: { code: languageCode },
          components
        },
        to,
        this.phoneNumberId
      );

      return {
        success: true,
        messageId: response.messages?.[0]?.id,
        response
      };
    } catch (error) {
      console.error('Error sending WhatsApp template:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Obtener información del perfil de negocio
   */
  async getBusinessProfile(): Promise<any> {
    try {
      const response = await this.wa.businessProfile.get(this.phoneNumberId);
      return {
        success: true,
        profile: response
      };
    } catch (error) {
      console.error('Error getting business profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Actualizar perfil de negocio
   */
  async updateBusinessProfile(profile: {
    about?: string;
    address?: string;
    description?: string;
    email?: string;
    vertical?: string;
    websites?: string[];
  }): Promise<any> {
    try {
      const response = await this.wa.businessProfile.update(profile, this.phoneNumberId);
      return {
        success: true,
        response
      };
    } catch (error) {
      console.error('Error updating business profile:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default WhatsAppSDKService;