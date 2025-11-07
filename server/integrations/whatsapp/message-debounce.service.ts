/**
 * Message Debouncing Service - Opción B: Window-based
 *
 * Previene mensajes duplicados usando ventana temporal de 5 segundos.
 * Cross-instance via MongoDB.
 *
 * Estrategia:
 * - Guardar (messageId + timestamp) en DB
 * - Rechazar duplicados dentro de ventana de 5s
 * - Auto-limpieza via TTL index
 */

import { db } from "../../utils/db.server";

const DEBOUNCE_WINDOW_MS = 5000; // 5 segundos

interface DebouncedMessage {
  id: string;
  messageId: string;
  phoneNumberId: string;
  type: 'message' | 'echo';
  processedAt: Date;
  expiresAt: Date; // Para TTL index
}

/**
 * Verifica si un mensaje debe ser procesado o está en ventana de debounce
 *
 * @returns {boolean} true si debe procesarse, false si está duplicado/en ventana
 */
export async function shouldProcessMessage(
  messageId: string,
  phoneNumberId: string,
  type: 'message' | 'echo' = 'message'
): Promise<boolean> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - DEBOUNCE_WINDOW_MS);

    // Buscar mensajes recientes en la ventana de debounce
    const recentMessage = await db.debouncedMessage.findFirst({
      where: {
        messageId,
        phoneNumberId,
        type,
        processedAt: {
          gte: windowStart,
        },
      },
    });

    if (recentMessage) {
      console.log(`⏸️ [Debounce] Message ${messageId} ya fue procesado hace ${now.getTime() - recentMessage.processedAt.getTime()}ms`);
      return false; // Duplicado en ventana - NO procesar
    }

    // Registrar este mensaje como procesado
    const expiresAt = new Date(now.getTime() + 60000); // Expira en 1 minuto (TTL index limpiará)

    await db.debouncedMessage.create({
      data: {
        messageId,
        phoneNumberId,
        type,
        processedAt: now,
        expiresAt,
      },
    });

    console.log(`✅ [Debounce] Message ${messageId} marcado como procesado`);
    return true; // Primera vez en ventana - procesar
  } catch (error) {
    console.error(`❌ [Debounce] Error checking message ${messageId}:`, error);
    // En caso de error, procesar el mensaje (fail-open para no perder mensajes)
    return true;
  }
}

/**
 * Limpia manualmente mensajes expirados (opcional - TTL index lo hace automáticamente)
 */
export async function cleanExpiredDebounceRecords(): Promise<number> {
  try {
    const now = new Date();
    const result = await db.debouncedMessage.deleteMany({
      where: {
        expiresAt: {
          lt: now,
        },
      },
    });

    console.log(`🧹 [Debounce] Limpiados ${result.count} registros expirados`);
    return result.count;
  } catch (error) {
    console.error(`❌ [Debounce] Error limpiando registros:`, error);
    return 0;
  }
}
