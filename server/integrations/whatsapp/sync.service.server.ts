/**
 * WhatsApp Coexistence Sync Service
 *
 * Inicia sincronización de contactos e historial desde WhatsApp Business App
 * Documentación: https://developers.facebook.com/docs/whatsapp/embedded-signup/custom-flows/onboarding-business-app-users/
 */

import { db } from "~/utils/db.server";

interface SyncResponse {
  messaging_product: string;
  request_id: string;
}

export class WhatsAppSyncService {
  /**
   * Inicia sincronización completa (contactos + historial)
   * DEBE llamarse dentro de las 24 horas después de onboarding
   */
  static async initializeSync(
    integrationId: string,
    phoneNumberId: string,
    accessToken: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Actualizar estado a "syncing"
      await db.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: "syncing",
          syncAttempts: { increment: 1 },
          syncError: null,
        },
      });

      // Step 1: Sincronizar contactos
      const contactsResult = await this.syncContacts(phoneNumberId, accessToken);

      if (!contactsResult.success) {
        await db.integration.update({
          where: { id: integrationId },
          data: {
            syncStatus: "failed",
            syncError: `Contacts sync failed: ${contactsResult.error}`,
          },
        });
        return { success: false, error: contactsResult.error };
      }

      // Step 2: Sincronizar historial
      const historyResult = await this.syncHistory(phoneNumberId, accessToken);

      if (!historyResult.success) {
        await db.integration.update({
          where: { id: integrationId },
          data: {
            syncStatus: "failed",
            syncError: `History sync failed: ${historyResult.error}`,
          },
        });
        return { success: false, error: historyResult.error };
      }

      // ✅ Sync iniciado correctamente
      // Los webhooks llegarán automáticamente con los datos
      // La actualización a "completed" se hará cuando los webhooks lleguen con progress: 100

      return { success: true };
    } catch (error) {
      console.error("[WhatsAppSync] Error:", error);

      await db.integration.update({
        where: { id: integrationId },
        data: {
          syncStatus: "failed",
          syncError: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Step 1: Sincronizar contactos
   * Trigger webhooks: smb_app_state_sync
   */
  private static async syncContacts(
    phoneNumberId: string,
    accessToken: string
  ): Promise<{ success: boolean; request_id?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/smb_app_data`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          sync_type: "smb_app_state_sync",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[WhatsAppSync] Contacts sync failed:", errorText);
        return { success: false, error: errorText };
      }

      const data: SyncResponse = await response.json();
      console.log("[WhatsAppSync] ✅ Contacts sync initiated:", data.request_id);

      return { success: true, request_id: data.request_id };
    } catch (error) {
      console.error("[WhatsAppSync] Contacts sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Step 2: Sincronizar historial de mensajes (hasta 6 meses)
   * Trigger webhooks: history (pueden ser múltiples con diferentes fases/chunks)
   */
  private static async syncHistory(
    phoneNumberId: string,
    accessToken: string
  ): Promise<{ success: boolean; request_id?: string; error?: string }> {
    try {
      const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/smb_app_data`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          sync_type: "history",
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();

        // Error 2593109 = Usuario no compartió historial (es esperado, no es error fatal)
        if (errorText.includes("2593109")) {
          console.log("[WhatsAppSync] ℹ️ User declined history sharing (expected)");
          return { success: true, request_id: "history_declined" };
        }

        console.error("[WhatsAppSync] History sync failed:", errorText);
        return { success: false, error: errorText };
      }

      const data: SyncResponse = await response.json();
      console.log("[WhatsAppSync] ✅ History sync initiated:", data.request_id);

      return { success: true, request_id: data.request_id };
    } catch (error) {
      console.error("[WhatsAppSync] History sync error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Obtener estado de sincronización
   */
  static async getSyncStatus(integrationId: string) {
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      select: {
        syncStatus: true,
        syncAttempts: true,
        syncError: true,
        syncCompletedAt: true,
      },
    });

    return integration;
  }

  /**
   * Reintentar sincronización manualmente
   */
  static async retrySync(
    integrationId: string
  ): Promise<{ success: boolean; error?: string }> {
    const integration = await db.integration.findUnique({
      where: { id: integrationId },
      select: {
        phoneNumberId: true,
        token: true,
      },
    });

    if (!integration || !integration.phoneNumberId || !integration.token) {
      return { success: false, error: "Integration not found or missing credentials" };
    }

    return this.initializeSync(
      integrationId,
      integration.phoneNumberId,
      integration.token
    );
  }
}
