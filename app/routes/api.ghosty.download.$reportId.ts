import {
  getReportFromStorage,
  deleteReportFromStorage,
} from "server/tools/handlers/generate-chatbot-report";

/**
 * Endpoint de descarga de reportes generados en memoria
 * Pattern: 100% streaming, archivos en memoria, descarga directa
 *
 * Features:
 * - Sin persistencia (memoria temporal con TTL 5min)
 * - Cleanup automático después de descarga
 * - Headers apropiados para download
 * - Validación de existencia y expiración
 */
export async function loader({ params }: Route.LoaderArgs) {
  const { reportId } = params;

  if (!reportId) {
    return new Response("Report ID is required", { status: 400 });
  }

  // Obtener reporte del storage temporal
  const report = getReportFromStorage(reportId);

  if (!report) {
    return new Response(
      "Reporte no encontrado o expirado. Los reportes expiran después de 5 minutos.",
      { status: 404 }
    );
  }

  // Eliminar del storage después de descarga (one-time download)
  deleteReportFromStorage(reportId);

  // Retornar archivo con headers apropiados
  return new Response(report.buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.filename}"`,
      "Content-Length": report.buffer.length.toString(),
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  });
}
