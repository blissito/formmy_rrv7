/**
 * Email Service Unificado
 * Centraliza toda la lógica de envío de correos con retry logic y error handling
 */

import { getSesTransport, getSesRemitent } from "server/notifyers/ses";
import type { Transporter } from "nodemailer";

interface BaseEmailParams {
  email: string | string[];
  name?: string;
  userId?: string; // Para tracking futuro
}

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  retries?: number;
  retryDelay?: number;
}

export class EmailService {
  private static transport: Transporter | null = null;
  private static readonly MAX_RETRIES = 3;
  private static readonly RETRY_DELAY = 2000; // 2 segundos

  /**
   * Obtener el transport de SES (singleton)
   */
  private static getTransport(): Transporter {
    if (!this.transport) {
      this.transport = getSesTransport();
    }
    return this.transport;
  }

  /**
   * Envío genérico con retry logic
   */
  static async send(options: SendEmailOptions): Promise<void> {
    const {
      to,
      subject,
      html,
      retries = this.MAX_RETRIES,
      retryDelay = this.RETRY_DELAY
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const result = await this.getTransport().sendMail({
          from: getSesRemitent(),
          to,
          subject,
          html,
        });

        console.log(`[EmailService] Email sent successfully to ${to}:`, result);
        return; // Éxito
      } catch (error) {
        lastError = error as Error;
        console.error(
          `[EmailService] Attempt ${attempt}/${retries} failed for ${to}:`,
          error
        );

        if (attempt < retries) {
          // Esperar antes del siguiente intento (exponential backoff)
          const delay = retryDelay * Math.pow(2, attempt - 1);
          console.log(`[EmailService] Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Si llegamos aquí, todos los intentos fallaron
    const errorMessage = `Failed to send email to ${to} after ${retries} attempts`;
    console.error(`[EmailService] ${errorMessage}:`, lastError);
    throw new Error(errorMessage);
  }

  /**
   * Envío batch (múltiples destinatarios con throttling)
   */
  static async sendBatch(
    emails: Array<{ to: string; subject: string; html: string }>,
    concurrency: number = 5
  ): Promise<{ sent: number; failed: number }> {
    let sent = 0;
    let failed = 0;

    // Procesar en batches para no saturar SES
    for (let i = 0; i < emails.length; i += concurrency) {
      const batch = emails.slice(i, i + concurrency);

      const results = await Promise.allSettled(
        batch.map(email => this.send(email))
      );

      results.forEach(result => {
        if (result.status === 'fulfilled') {
          sent++;
        } else {
          failed++;
        }
      });

      // Delay entre batches (respeto a rate limits de SES)
      if (i + concurrency < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`[EmailService] Batch complete: ${sent} sent, ${failed} failed`);
    return { sent, failed };
  }

  /**
   * Validar email
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validar emails antes de enviar
   */
  static validateEmails(emails: string | string[]): boolean {
    const emailArray = Array.isArray(emails) ? emails : [emails];
    return emailArray.every(email => this.isValidEmail(email));
  }
}
