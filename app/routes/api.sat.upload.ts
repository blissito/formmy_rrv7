/**
 * API endpoint para subir y procesar facturas SAT
 * POST /api/sat/upload
 *
 * Soporta:
 * - Múltiples archivos (batch upload)
 * - XML (gratis, 100% confianza)
 * - PDF (gratis, 60-85% confianza)
 * - Auto-aprobación si confianza >= 90%
 */

import type { ActionFunctionArgs } from "react-router";
import { getUserOrRedirect } from "server/getUserUtils.server";
import { db } from "~/utils/db.server";
import { parseXMLInvoice, isValidSATXML } from "server/sat/xml-parser.service.server";
import { parsePDFInvoice, isValidPDF } from "server/sat/pdf-parser.service.server";
import {
  validateInvoice,
  checkBlacklists,
  addBlacklistWarnings,
} from "server/sat/invoice-validator.service.server";

export async function action({ request }: ActionFunctionArgs) {
  const userFromSession = await getUserOrRedirect(request);

  const user = await db.user.findUnique({
    where: { id: userFromSession.id },
    include: {
      chatbots: {
        where: { status: { not: "DELETED" } },
        take: 1,
      },
    },
  });

  if (!user) {
    return Response.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const chatbotId =
    (formData.get("chatbotId") as string) || user.chatbots[0]?.id;
  const parseMode = (formData.get("parseMode") as string) || "auto";

  if (!chatbotId) {
    return Response.json(
      { error: "No tienes chatbots disponibles. Crea uno primero." },
      { status: 400 }
    );
  }

  if (!files || files.length === 0) {
    return Response.json(
      { error: "No se enviaron archivos" },
      { status: 400 }
    );
  }

  const results: any[] = [];
  let processedCount = 0;
  let approvedCount = 0;
  let needsReviewCount = 0;
  let errorCount = 0;

  // Procesar cada archivo
  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;

      // Determinar método de parseo
      let parsedData;
      let selectedParseMode = parseMode;

      if (selectedParseMode === "auto") {
        if (isValidSATXML(buffer)) {
          selectedParseMode = "XML_LOCAL";
        } else if (isValidPDF(buffer)) {
          selectedParseMode = "PDF_SIMPLE";
        } else {
          throw new Error("Formato de archivo no soportado. Solo se aceptan archivos XML (CFDI) o PDF de facturas SAT.");
        }
      }

      // Parsear según método
      if (selectedParseMode === "XML_LOCAL") {
        parsedData = await parseXMLInvoice(buffer);
      } else if (selectedParseMode === "PDF_SIMPLE") {
        parsedData = await parsePDFInvoice(buffer);
      } else {
        throw new Error(`Método de parseo no implementado: ${selectedParseMode}`);
      }


      // Validar datos parseados
      const validation = validateInvoice(parsedData);

      // Verificar listas negras (EFOS/EDOS)
      const emisorBlacklist = await checkBlacklists(
        parsedData.rfcEmisor,
        db
      );
      const receptorBlacklist = await checkBlacklists(
        parsedData.rfcReceptor,
        db
      );

      // Agregar advertencias de listas negras
      let finalWarnings = validation.warnings;
      finalWarnings = addBlacklistWarnings(
        finalWarnings,
        emisorBlacklist.isEFOS,
        emisorBlacklist.isEDOS,
        "emisor"
      );
      finalWarnings = addBlacklistWarnings(
        finalWarnings,
        receptorBlacklist.isEFOS,
        receptorBlacklist.isEDOS,
        "receptor"
      );

      // Si el emisor está en listas negras, forzar revisión manual
      if (emisorBlacklist.isEFOS || emisorBlacklist.isEDOS) {
        validation.status = "NEEDS_REVIEW";
        if (validation.reviewReasons) {
          validation.reviewReasons.push("RFC emisor en lista negra SAT");
        } else {
          validation.reviewReasons = ["RFC emisor en lista negra SAT"];
        }
      }

      // Buscar o crear contacto para el emisor
      const contact = await db.satContact.upsert({
        where: {
          rfc: parsedData.rfcEmisor,
        },
        create: {
          userId: user.id,
          chatbotId,
          rfc: parsedData.rfcEmisor,
          name: parsedData.nombreEmisor,
          type: parsedData.tipo === "INGRESO" ? "CLIENTE" : "PROVEEDOR",
          isEFOS: emisorBlacklist.isEFOS,
          isEDOS: emisorBlacklist.isEDOS,
          firstSeen: new Date(),
          lastSeen: new Date(),
          totalInvoices: 1,
          totalAmount: parsedData.total,
        },
        update: {
          name: parsedData.nombreEmisor, // Actualizar nombre si cambió
          lastSeen: new Date(),
          totalInvoices: { increment: 1 },
          totalAmount: { increment: parsedData.total },
        },
      });

      // Guardar factura en BD
      const invoice = await db.satInvoice.create({
        data: {
          userId: user.id,
          chatbotId,
          contactId: contact.id,

          // Datos CFDI (campos exactos del schema)
          uuid: parsedData.uuid,
          rfcEmisor: parsedData.rfcEmisor,
          rfcReceptor: parsedData.rfcReceptor,
          nombreEmisor: parsedData.nombreEmisor,
          tipo: parsedData.tipo,
          fecha: parsedData.fecha,
          subtotal: parsedData.subtotal,
          iva: parsedData.iva,
          total: parsedData.total,
          concepto: parsedData.concepto,
          metodoPago: parsedData.metodoPago,

          // Validación SAT
          satStatus: "PENDING_VALIDATION",

          // Parseo con confianza
          parseMethod: parsedData.parseMethod,
          confidence: validation.confidence,
          status: validation.status,
          creditsUsed: 0, // XML y PDF_SIMPLE son gratis
          warnings: finalWarnings,
        },
      });

      processedCount++;
      if (validation.status === "APPROVED") {
        approvedCount++;
      } else {
        needsReviewCount++;
      }

      results.push({
        success: true,
        fileName,
        invoiceId: invoice.id,
        uuid: parsedData.uuid,
        total: parsedData.total,
        status: validation.status,
        confidence: validation.confidence,
        warnings: finalWarnings,
      });
    } catch (error: any) {
      console.error(`❌ [SAT Upload] Error procesando ${file.name}:`, error);
      errorCount++;
      results.push({
        success: false,
        fileName: file.name,
        error: error.message || "Error desconocido al procesar archivo",
        status: "PARSE_ERROR",
      });
    }
  }


  return Response.json({
    success: true,
    processed: processedCount,
    approved: approvedCount,
    needsReview: needsReviewCount,
    errors: errorCount,
    results,
  });
}
