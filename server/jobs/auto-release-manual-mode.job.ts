import { db } from "~/utils/db.server";

/**
 * Job para desactivar automáticamente el modo manual en conversaciones inactivas
 *
 * Lógica:
 * - Si una conversación está en manualMode = true
 * - Y han pasado 30 minutos desde el último eco (lastEchoAt)
 * - Entonces desactivar manualMode automáticamente para que el bot retome la conversación
 *
 * Este comportamiento es estándar en la industria (Respond.io, 360Dialog, etc.)
 */

const MANUAL_MODE_TIMEOUT_MINUTES = 30;

export async function autoReleaseManualMode() {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000);

    // Buscar conversaciones en modo manual con último eco hace más de 30 minutos
    const expiredConversations = await db.conversation.findMany({
      where: {
        manualMode: true,
        lastEchoAt: {
          lt: thirtyMinutesAgo,
        },
      },
      select: {
        id: true,
        sessionId: true,
        lastEchoAt: true,
        chatbotId: true,
      },
    });

    if (expiredConversations.length === 0) {
      console.log("[Auto-Release] No conversations to release");
      return { released: 0 };
    }

    // Desactivar modo manual en batch
    const result = await db.conversation.updateMany({
      where: {
        id: {
          in: expiredConversations.map((c) => c.id),
        },
      },
      data: {
        manualMode: false,
      },
    });

    console.log(
      `✅ [Auto-Release] Released ${result.count} conversations from manual mode (timeout: ${MANUAL_MODE_TIMEOUT_MINUTES} min)`
    );

    // Log cada conversación liberada
    for (const conv of expiredConversations) {
      const inactiveMins = Math.floor(
        (Date.now() - (conv.lastEchoAt?.getTime() || 0)) / 1000 / 60
      );
      console.log(
        `  - Conversation ${conv.sessionId} (inactive for ${inactiveMins} min)`
      );
    }

    return { released: result.count };
  } catch (error) {
    console.error("[Auto-Release] Error releasing conversations:", error);
    return { released: 0, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Estadísticas de conversaciones en modo manual
 */
export async function getManualModeStats() {
  try {
    const [total, recent, expired] = await Promise.all([
      db.conversation.count({
        where: { manualMode: true },
      }),
      db.conversation.count({
        where: {
          manualMode: true,
          lastEchoAt: {
            gte: new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000),
          },
        },
      }),
      db.conversation.count({
        where: {
          manualMode: true,
          lastEchoAt: {
            lt: new Date(Date.now() - MANUAL_MODE_TIMEOUT_MINUTES * 60 * 1000),
          },
        },
      }),
    ]);

    return {
      total,
      active: recent,
      expired,
      timeoutMinutes: MANUAL_MODE_TIMEOUT_MINUTES,
    };
  } catch (error) {
    console.error("[Auto-Release] Error getting stats:", error);
    return { total: 0, active: 0, expired: 0, timeoutMinutes: MANUAL_MODE_TIMEOUT_MINUTES };
  }
}
