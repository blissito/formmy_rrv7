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

import { db } from "~/utils/db.server";

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
 * ESTRATEGIA ATÓMICA:
 * - Intenta crear registro (unique constraint previene duplicados)
 * - Si falla por duplicate key → mensaje ya procesado (return false)
 * - Si tiene éxito → primera vez procesando (return true)
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
    const expiresAt = new Date(now.getTime() + 60000); // Expira en 1 minuto (TTL index limpiará)

    // 🔒 ESTRATEGIA ATÓMICA: Intentar crear registro con unique constraint
    // Si ya existe → MongoDB rechaza con error de duplicado
    // Si no existe → Se crea exitosamente
    try {
      await db.debouncedMessage.create({
        data: {
          messageId,
          phoneNumberId,
          type,
          processedAt: now,
          expiresAt,
        },
      });

      console.log(`✅ [Debounce] Message ${messageId} marcado como procesado (primera vez)`);
      return true; // ✅ Primera vez procesando - CONTINUAR
    } catch (createError: any) {
      // Error de duplicate key (código 11000 en MongoDB)
      if (createError.code === 'P2002' || createError.message?.includes('duplicate key')) {
        // Verificar si está en ventana de debounce
        const existingMessage = await db.debouncedMessage.findFirst({
          where: {
            messageId,
            phoneNumberId,
            type,
            processedAt: {
              gte: windowStart,
            },
          },
        });

        if (existingMessage) {
          const ageMs = now.getTime() - existingMessage.processedAt.getTime();
          console.log(`⏸️ [Debounce] Message ${messageId} ya procesado hace ${ageMs}ms - SKIP`);
          return false; // ❌ Duplicado en ventana - NO PROCESAR
        } else {
          // Existe pero fuera de ventana (registro viejo) - procesar de nuevo
          console.log(`♻️ [Debounce] Message ${messageId} existe pero fuera de ventana - PROCESAR`);
          return true;
        }
      }

      // Otro tipo de error - fail-open (procesar mensaje)
      throw createError;
    }
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
