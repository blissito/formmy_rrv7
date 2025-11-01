import type { ToolContext, ToolResponse } from "../types";
import { db as prisma } from "~/utils/db.server";
import PDFDocument from "pdfkit";
import { Readable } from "stream";

interface GenerateReportParams {
  format?: "pdf";
  includeMetrics?: boolean;
}

// Sistema de storage temporal en memoria (TTL 5min)
const reportStorage = new Map<
  string,
  { buffer: Buffer; filename: string; createdAt: number }
>();

// Cleanup automático cada 1 minuto
setInterval(() => {
  const now = Date.now();
  const TTL = 5 * 60 * 1000; // 5 minutos

  for (const [id, data] of reportStorage.entries()) {
    if (now - data.createdAt > TTL) {
      reportStorage.delete(id);
    }
  }
}, 60 * 1000);

// Helper para convertir stream a buffer
async function streamToBuffer(stream: PDFDocument): Promise<Buffer> {
  const chunks: Buffer[] = [];
  const readable = stream as unknown as Readable;

  return new Promise((resolve, reject) => {
    readable.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    readable.on("end", () => resolve(Buffer.concat(chunks)));
    readable.on("error", reject);
  });
}

export async function handleGenerateChatbotReport(
  params: GenerateReportParams,
  context: ToolContext
): Promise<ToolResponse> {

  try {
    const { userId } = context;
    const { format = "pdf", includeMetrics = true } = params;


    // 1. Obtener chatbots del usuario
    const chatbots = await prisma.chatbot.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            conversations: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (chatbots.length === 0) {
      return {
        success: false,
        message: "No tienes chatbots para generar reporte",
      };
    }

    // 2. Obtener métricas adicionales si se solicita
    let totalConversations = 0;
    let totalMessages = 0;

    if (includeMetrics) {
      totalConversations = chatbots.reduce(
        (sum, bot) => sum + bot._count.conversations,
        0
      );

      // Obtener total de mensajes
      const conversations = await prisma.conversation.findMany({
        where: {
          chatbotId: { in: chatbots.map((b) => b.id) },
        },
        select: {
          messages: {
            select: { id: true },
          },
        },
      });

      totalMessages = conversations.reduce(
        (sum, conv) => sum + conv.messages.length,
        0
      );
    }

    // 3. Generar PDF
    const doc = new PDFDocument({ size: "A4", margin: 50 });

    // Header
    doc
      .fontSize(24)
      .fillColor("#1a1a1a")
      .text("Reporte de Chatbots", { align: "center" });

    doc
      .moveDown(0.5)
      .fontSize(10)
      .fillColor("#666")
      .text(`Generado: ${new Date().toLocaleString("es-MX")}`, {
        align: "center",
      });

    doc.moveDown(2);

    // Métricas generales
    if (includeMetrics) {
      doc.fontSize(16).fillColor("#1a1a1a").text("Resumen General");
      doc.moveDown(0.5);

      const metrics = [
        { label: "Total de Chatbots", value: chatbots.length },
        { label: "Total de Conversaciones", value: totalConversations },
        { label: "Total de Mensajes", value: totalMessages },
        {
          label: "Promedio Mensajes/Chatbot",
          value:
            chatbots.length > 0
              ? Math.round(totalMessages / chatbots.length)
              : 0,
        },
      ];

      metrics.forEach((metric) => {
        doc
          .fontSize(11)
          .fillColor("#333")
          .text(`${metric.label}: `, { continued: true })
          .fillColor("#0066cc")
          .text(metric.value.toString());
      });

      doc.moveDown(2);
    }

    // Tabla de chatbots
    doc.fontSize(16).fillColor("#1a1a1a").text("Detalle de Chatbots");
    doc.moveDown(1);

    // Headers de tabla
    const tableTop = doc.y;
    const colWidths = { name: 200, conversations: 100, created: 150 };

    doc
      .fontSize(10)
      .fillColor("#666")
      .text("Nombre", 50, tableTop, { width: colWidths.name })
      .text("Conversaciones", 250, tableTop, { width: colWidths.conversations })
      .text("Creado", 350, tableTop, { width: colWidths.created });

    // Línea separadora
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(500, tableTop + 15)
      .stroke("#ddd");

    let yPosition = tableTop + 25;

    // Rows
    chatbots.forEach((chatbot, index) => {
      // Check si necesitamos nueva página
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      const bgColor = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
      doc.rect(50, yPosition - 5, 450, 20).fill(bgColor);

      doc
        .fontSize(9)
        .fillColor("#1a1a1a")
        .text(chatbot.name || "Sin nombre", 50, yPosition, {
          width: colWidths.name,
          ellipsis: true,
        })
        .text(chatbot._count.conversations.toString(), 250, yPosition, {
          width: colWidths.conversations,
        })
        .text(
          new Date(chatbot.createdAt).toLocaleDateString("es-MX"),
          350,
          yPosition,
          { width: colWidths.created }
        );

      yPosition += 25;
    });

    // Footer
    doc
      .moveDown(3)
      .fontSize(8)
      .fillColor("#999")
      .text("Formmy - Tu asistente de chatbots AI", { align: "center" })
      .text("https://formmy.app", { align: "center", link: "https://formmy.app" });

    // Finalizar PDF
    doc.end();

    // 4. Convertir a buffer
    const buffer = await streamToBuffer(doc);

    // 5. Guardar en storage temporal
    const reportId = `report_${userId}_${Date.now()}`;
    const filename = `chatbots_${new Date().toISOString().split("T")[0]}.pdf`;

    reportStorage.set(reportId, {
      buffer,
      filename,
      createdAt: Date.now(),
    });

    // 6. Retornar URL de descarga
    const downloadUrl = `/api/ghosty/download/${reportId}`;

    return {
      success: true,
      message: `Reporte generado con ${chatbots.length} chatbot${chatbots.length !== 1 ? "s" : ""}`,
      data: {
        downloadUrl,
        filename,
        size: `${(buffer.length / 1024).toFixed(2)} KB`,
        expiresIn: "5 minutos",
        chatbotsCount: chatbots.length,
        totalConversations,
        totalMessages,
      },
    };
  } catch (error) {
    console.error("❌ [generate-chatbot-report] Error completo:", error);
    return {
      success: false,
      message: `Error al generar reporte: ${error instanceof Error ? error.message : "Error desconocido"}`,
    };
  }
}

// Export función para obtener reporte del storage
export function getReportFromStorage(reportId: string) {
  return reportStorage.get(reportId);
}

// Export función para eliminar reporte después de descarga
export function deleteReportFromStorage(reportId: string) {
  reportStorage.delete(reportId);
}
