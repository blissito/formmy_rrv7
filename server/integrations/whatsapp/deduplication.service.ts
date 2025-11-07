import { db } from "~/utils/db.server";

/**
 * Servicio de deduplicación de webhooks de WhatsApp usando MongoDB
 *
 * Reemplaza el sistema de Set en memoria con almacenamiento persistente
 * que funciona correctamente en múltiples instancias de Fly.io
 */

const DEDUPLICATION_TTL_MINUTES = 10; // 10 minutos de TTL para mensajes procesados

/**
 * Verifica si un mensaje ya fue procesado y lo marca como procesado si no lo fue
 *
 * @param externalId - ID del mensaje de WhatsApp
 * @param phoneNumberId - ID del número de teléfono
 * @param type - Tipo de webhook ("message" | "echo" | "status")
 * @returns true si el mensaje ya fue procesado, false si es nuevo
 */
export async function isMessageProcessed(
  externalId: string,
  phoneNumberId: string,
  type: "message" | "echo" | "status"
): Promise<boolean> {
  try {
    // Primero verificar si ya existe
    const existing = await db.processedWebhook.findUnique({
      where: { externalId },
    });

    if (existing) {
      // Ya fue procesado
      return true;
    }

    // No existe, crear registro para marcarlo como procesado
    const expiresAt = new Date(Date.now() + DEDUPLICATION_TTL_MINUTES * 60 * 1000);

    await db.processedWebhook.create({
      data: {
        externalId,
        phoneNumberId,
        type,
        expiresAt,
      },
    });

    // Mensaje nuevo y marcado como procesado
    return false;
  } catch (error: any) {
    // Race condition: otro proceso creó el registro justo entre findUnique y create
    if (error.code === 11000 || error.message?.includes("duplicate") || error.code === "P2002") {
      return true;
    }

    // Si es otro tipo de error, loguear y retornar false (permitir procesamiento)
    console.error(`[Deduplication] Error checking message ${externalId}:`, error);
    return false;
  }
}

/**
 * Limpia mensajes procesados expirados
 *
 * Nota: MongoDB con TTL index hace esto automáticamente,
 * pero esta función puede usarse para limpieza manual si es necesario
 */
export async function cleanExpiredMessages(): Promise<number> {
  try {
    const result = await db.processedWebhook.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    return result.count;
  } catch (error) {
    console.error("[Deduplication] Error cleaning expired messages:", error);
    return 0;
  }
}

/**
 * Estadísticas de deduplicación (para debugging)
 */
export async function getDeduplicationStats(phoneNumberId?: string) {
  try {
    const where = phoneNumberId ? { phoneNumberId } : {};

    const [total, byType] = await Promise.all([
      db.processedWebhook.count({ where }),
      db.processedWebhook.groupBy({
        by: ["type"],
        where,
        _count: true,
      }),
    ]);

    return {
      total,
      byType: Object.fromEntries(byType.map((item) => [item.type, item._count])),
    };
  } catch (error) {
    console.error("[Deduplication] Error getting stats:", error);
    return { total: 0, byType: {} };
  }
}
