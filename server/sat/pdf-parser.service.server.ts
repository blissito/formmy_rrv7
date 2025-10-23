/**
 * Servicio de parseo de PDF de facturas SAT (método simple, gratis)
 * Método: PDF_SIMPLE (gratis, confianza variable 60-85%)
 *
 * NOTA: Este es un parser básico con regex. Para mejor calidad usa:
 * - FORMMY_AG (LlamaParse AGENTIC): 3 créditos/página
 * - FORMMY_AG_PLUS (LlamaParse AGENTIC_PLUS): 6 créditos/página
 */

import { extractText } from "unpdf";
import type { ParsedInvoiceData } from "./xml-parser.service.server";

/**
 * Parsea un PDF de factura SAT usando extracción de texto simple
 * Confianza: 60-85% según calidad del PDF
 */
export async function parsePDFInvoice(
  pdfBuffer: Buffer
): Promise<ParsedInvoiceData> {
  const warnings: string[] = [];
  let confidence = 0.85; // Inicial optimista

  try {
    const uint8Array = new Uint8Array(pdfBuffer);
    const result = await extractText(uint8Array);

    // unpdf retorna array de strings (uno por página), unirlos
    const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;

    // Validar que sea una factura SAT (búsqueda case-insensitive)
    const textLower = text.toLowerCase();
    if (
      !textLower.includes("cfdi") &&
      !textLower.includes("factura") &&
      !textLower.includes("uuid") &&
      !textLower.includes("rfc")
    ) {
      throw new Error("El PDF no parece ser una factura SAT");
    }

    // Extraer Folio Fiscal (UUID en CFDI mexicano)
    const folioFiscalMatch = text.match(
      /Folio\s+Fiscal[:\s]*([A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12})/i
    );
    const uuid = folioFiscalMatch ? folioFiscalMatch[1] : "";
    if (!uuid) {
      warnings.push("Folio Fiscal no encontrado en PDF");
      confidence -= 0.3;
    }

    // Extraer fecha (formato ISO del SAT: 2025-10-03T11:59:17)
    let fecha = new Date();
    const fechaISOMatch = text.match(
      /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/
    );
    if (fechaISOMatch) {
      fecha = new Date(fechaISOMatch[1]);
    } else {
      // Intentar formato DD/MM/YYYY o DD-MM-YYYY
      const fechaMatch = text.match(
        /(?:Fecha|FECHA)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i
      );
      if (fechaMatch) {
        fecha = parseDateFromString(fechaMatch[1]);
      } else {
        warnings.push("Fecha no encontrada, usando fecha actual");
        confidence -= 0.1;
      }
    }

    // Extraer totales
    const totalMatch = text.match(/Total[:\s]*\$?\s*([\d,]+\.?\d*)/i);
    const total = totalMatch ? parseFloat(totalMatch[1].replace(/,/g, "")) : 0;

    const subtotalMatch = text.match(/Subtotal[:\s]*\$?\s*([\d,]+\.?\d*)/i);
    const subtotal = subtotalMatch
      ? parseFloat(subtotalMatch[1].replace(/,/g, ""))
      : total / 1.16; // Estimación si no se encuentra

    const ivaMatch = text.match(/IVA[:\s]*\$?\s*([\d,]+\.?\d*)/i);
    const iva = ivaMatch
      ? parseFloat(ivaMatch[1].replace(/,/g, ""))
      : total - subtotal;

    if (!totalMatch) {
      warnings.push("Total no encontrado, usando valor 0");
      confidence -= 0.15;
    }

    // Extraer RFCs
    const rfcPattern = /([A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9]\d)/g;
    const rfcs = text.match(rfcPattern) || [];

    // Heurística: el primer RFC suele ser el emisor
    const rfcEmisor = rfcs[0] || "";
    const rfcReceptor = rfcs[1] || rfcs[0] || ""; // Si solo hay uno, es el receptor

    if (!rfcEmisor) {
      warnings.push("RFC Emisor no encontrado");
      confidence -= 0.15;
    }

    // Extraer nombres (más difícil, usamos líneas cercanas a RFC)
    let nombreEmisor = "Sin nombre";
    let nombreReceptor = "Sin nombre";

    const lines = text.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes(rfcEmisor) && i > 0) {
        // El nombre suele estar antes del RFC
        nombreEmisor = lines[i - 1]?.trim() || nombreEmisor;
      }
      if (rfcReceptor && line.includes(rfcReceptor) && i > 0 && rfcReceptor !== rfcEmisor) {
        nombreReceptor = lines[i - 1]?.trim() || nombreReceptor;
      }
    }

    // Extraer concepto/descripción del primer producto (tabla de CFDI)
    let concepto = "Sin concepto";
    // Buscar patrón: PRODUCTO o DESCRIPCIÓN seguido de texto
    const conceptoMatch = text.match(/(?:PRODUCTO|DESCRIPCIÓN)\s+([^\n]{10,100})/i);
    if (conceptoMatch) {
      concepto = conceptoMatch[1].trim().substring(0, 200);
    } else {
      // Intentar buscar después de "DESCRIPCIÓN" en la tabla
      const descripcionMatch = text.match(/DESCRIPCIÓN[^\n]*\n\s*([^\n]{10,100})/i);
      if (descripcionMatch) {
        concepto = descripcionMatch[1].trim().substring(0, 200);
      } else {
        warnings.push("Concepto/productos no encontrados claramente");
        confidence -= 0.05;
      }
    }

    // Detectar tipo de comprobante
    const tipoMatch = text.match(/Tipo[:\s]*(Ingreso|Egreso)/i);
    const tipo = tipoMatch
      ? tipoMatch[1].toUpperCase() === "INGRESO"
        ? "INGRESO"
        : "EGRESO"
      : "INGRESO"; // Default

    // Método de pago
    const metodoPagoMatch = text.match(/M[ée]todo de Pago[:\s]*(PUE|PPD)/i);
    const metodoPago = metodoPagoMatch ? metodoPagoMatch[1].toUpperCase() : "PUE";

    // Validar consistencia (con margen para errores de redondeo)
    const expectedTotal = subtotal + iva;
    if (Math.abs(total - expectedTotal) > 0.50) {
      warnings.push(
        `Discrepancia en totales: Total=${total.toFixed(2)}, Subtotal+IVA=${expectedTotal.toFixed(2)}`
      );
      confidence -= 0.1;
    }

    // Ajustar confianza final basado en datos críticos encontrados
    if (uuid && rfcEmisor && rfcReceptor && total > 0) {
      confidence = Math.max(0.75, confidence); // Mínimo 75% si tenemos datos clave
    }
    confidence = Math.max(0.6, Math.min(1.0, confidence));

    return {
      uuid,
      version: "3.3", // Asumimos 3.3 por defecto
      tipo,
      fecha,
      total,
      subtotal,
      iva,
      moneda: "MXN",
      metodoPago,
      nombreEmisor,
      rfcEmisor,
      nombreReceptor,
      rfcReceptor,
      concepto,
      conceptos: [
        {
          claveProdServ: "",
          cantidad: 1,
          claveUnidad: "",
          descripcion: concepto,
          valorUnitario: subtotal,
          importe: subtotal,
        },
      ],
      parseMethod: "PDF_SIMPLE",
      confidence: parseFloat(confidence.toFixed(2)),
      warnings,
    };
  } catch (error: any) {
    throw new Error(`Error parseando PDF: ${error.message}`);
  }
}

/**
 * Parsea una fecha de string en múltiples formatos
 */
function parseDateFromString(dateStr: string): Date {
  // Formato: DD/MM/YYYY o DD-MM-YYYY
  const ddmmyyyyMatch = dateStr.match(/(\d{2})[-\/](\d{2})[-\/](\d{4})/);
  if (ddmmyyyyMatch) {
    return new Date(
      parseInt(ddmmyyyyMatch[3]),
      parseInt(ddmmyyyyMatch[2]) - 1,
      parseInt(ddmmyyyyMatch[1])
    );
  }

  // Formato: YYYY-MM-DD o YYYY/MM/DD
  const yyyymmddMatch = dateStr.match(/(\d{4})[-\/](\d{2})[-\/](\d{2})/);
  if (yyyymmddMatch) {
    return new Date(
      parseInt(yyyymmddMatch[1]),
      parseInt(yyyymmddMatch[2]) - 1,
      parseInt(yyyymmddMatch[3])
    );
  }

  // Fallback
  return new Date();
}

/**
 * Valida si un buffer es un PDF válido
 */
export function isValidPDF(buffer: Buffer): boolean {
  const header = buffer.toString("utf-8", 0, 5);
  return header === "%PDF-";
}
