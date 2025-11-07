import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { autoReleaseManualMode, getManualModeStats } from "~/server/jobs/auto-release-manual-mode.job";

/**
 * Cron endpoint para ejecutar el job de auto-release de modo manual
 *
 * Este endpoint debe ser llamado periódicamente por:
 * - Fly.io Machine (usando fly-cron o similar)
 * - Uptime monitoring service (como cron-job.org o similar)
 * - Sistema interno de scheduling
 *
 * Configuración recomendada: cada 30 minutos
 *
 * Seguridad:
 * - Requiere header X-Cron-Secret para autenticar (prevenir abuso)
 * - O puede ser llamado desde red interna de Fly.io
 */

const CRON_SECRET = process.env.CRON_SECRET || "default-cron-secret-change-me";

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    // Verificar autenticación
    const cronSecret = request.headers.get("X-Cron-Secret");

    if (cronSecret !== CRON_SECRET) {
      console.warn("[Auto-Release Cron] Unauthorized attempt");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Auto-Release Cron] Starting job...");

    // Obtener estadísticas antes
    const statsBefore = await getManualModeStats();
    console.log("[Auto-Release Cron] Stats before:", statsBefore);

    // Ejecutar job
    const result = await autoReleaseManualMode();

    // Obtener estadísticas después
    const statsAfter = await getManualModeStats();

    console.log("[Auto-Release Cron] Job completed:", result);
    console.log("[Auto-Release Cron] Stats after:", statsAfter);

    return Response.json({
      success: true,
      result,
      stats: {
        before: statsBefore,
        after: statsAfter,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Auto-Release Cron] Error:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};

// GET endpoint para verificar el estado (sin autenticación, solo stats)
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const stats = await getManualModeStats();

    return Response.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Auto-Release Cron] Error getting stats:", error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
};
