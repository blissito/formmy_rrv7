/**
 * Servicio de validación y auto-aprobación de facturas SAT
 * Determina si una factura debe ser:
 * - APPROVED: Auto-aprobada (confianza >= 90%)
 * - NEEDS_REVIEW: Requiere revisión manual (confianza < 90% o warnings críticos)
 * - PARSE_ERROR: Error en parseo
 */

import type { ParsedInvoiceData } from "./xml-parser.service.server";

export type InvoiceStatus = "APPROVED" | "NEEDS_REVIEW" | "PARSE_ERROR";

export interface ValidationResult {
  status: InvoiceStatus;
  confidence: number;
  warnings: string[];
  autoApprovalReasons?: string[];
  reviewReasons?: string[];
}

/**
 * Valida una factura parseada y determina si debe ser auto-aprobada
 */
export function validateInvoice(
  parsedData: ParsedInvoiceData
): ValidationResult {
  const warnings = [...parsedData.warnings];
  const autoApprovalReasons: string[] = [];
  const reviewReasons: string[] = [];

  // 1. Validación de confianza
  if (parsedData.confidence >= 0.9) {
    autoApprovalReasons.push(
      `Alta confianza en parseo: ${(parsedData.confidence * 100).toFixed(0)}%`
    );
  } else if (parsedData.confidence < 0.75) {
    reviewReasons.push(
      `Baja confianza en parseo: ${(parsedData.confidence * 100).toFixed(0)}%`
    );
  }

  // 2. Validación de campos obligatorios
  if (!parsedData.uuid || parsedData.uuid.length < 10) {
    reviewReasons.push("Folio Fiscal (UUID) inválido o faltante");
  } else if (parsedData.uuid.length !== 36) {
    // UUID debe tener formato 8-4-4-4-12 (36 chars con guiones)
    warnings.push("Folio Fiscal no tiene formato estándar UUID");
  }

  if (!parsedData.rfcEmisor || parsedData.rfcEmisor.length < 12) {
    reviewReasons.push("RFC del emisor inválido");
  }

  if (!parsedData.rfcReceptor || parsedData.rfcReceptor.length < 12) {
    reviewReasons.push("RFC del receptor inválido");
  }

  // 3. Validación de montos
  if (parsedData.total <= 0) {
    reviewReasons.push("Total debe ser mayor a 0");
  }

  if (parsedData.subtotal <= 0) {
    reviewReasons.push("Subtotal debe ser mayor a 0");
  }

  // Validar coherencia de montos (tolerancia de 1 peso por redondeos)
  const calculatedTotal = parsedData.subtotal + parsedData.iva;
  const difference = Math.abs(parsedData.total - calculatedTotal);
  if (difference > 1.0) {
    reviewReasons.push(
      `Discrepancia en montos: Total=${parsedData.total.toFixed(
        2
      )}, Subtotal+IVA=${calculatedTotal.toFixed(2)}, Diferencia=${difference.toFixed(2)}`
    );
  }

  // 4. Validación de fecha
  const now = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(now.getFullYear() - 1);
  const oneYearAhead = new Date();
  oneYearAhead.setFullYear(now.getFullYear() + 1);

  if (parsedData.fecha < oneYearAgo) {
    warnings.push("Factura tiene más de 1 año de antigüedad");
  }

  if (parsedData.fecha > oneYearAhead) {
    reviewReasons.push("Fecha de factura está muy en el futuro");
  }

  // 5. Validación de método de parseo
  if (parsedData.parseMethod === "XML_LOCAL") {
    autoApprovalReasons.push("Parseado desde XML original (máxima confianza)");
  } else if (parsedData.parseMethod === "PDF_SIMPLE") {
    reviewReasons.push("Parseado desde PDF (puede tener errores)");
  }

  // 6. Validar warnings críticos
  const criticalWarnings = [
    "UUID no encontrado",
    "RFC Emisor no encontrado",
    "Total no encontrado",
  ];

  const hasCriticalWarnings = warnings.some((w) =>
    criticalWarnings.some((cw) => w.includes(cw))
  );

  if (hasCriticalWarnings) {
    reviewReasons.push("Contiene advertencias críticas");
  }

  // 7. Decisión final
  let status: InvoiceStatus;

  if (reviewReasons.length > 0) {
    status = "NEEDS_REVIEW";
  } else if (
    parsedData.confidence >= 0.9 &&
    parsedData.parseMethod === "XML_LOCAL"
  ) {
    status = "APPROVED";
  } else if (parsedData.confidence >= 0.85) {
    status = "APPROVED";
  } else {
    status = "NEEDS_REVIEW";
  }

  return {
    status,
    confidence: parsedData.confidence,
    warnings,
    autoApprovalReasons:
      status === "APPROVED" ? autoApprovalReasons : undefined,
    reviewReasons: status === "NEEDS_REVIEW" ? reviewReasons : undefined,
  };
}

/**
 * Determina si un contacto (RFC) está en listas negras EFOS/EDOS
 * NOTA: Por ahora solo verifica el modelo SatContact
 * En el futuro puede integrarse con API del SAT
 */
export async function checkBlacklists(
  rfc: string,
  db: any
): Promise<{ isEFOS: boolean; isEDOS: boolean }> {
  const contact = await db.satContact.findFirst({
    where: { rfc },
    select: { isEFOS: true, isEDOS: true },
  });

  return {
    isEFOS: contact?.isEFOS || false,
    isEDOS: contact?.isEDOS || false,
  };
}

/**
 * Agrega advertencias si el RFC está en listas negras
 */
export function addBlacklistWarnings(
  warnings: string[],
  isEFOS: boolean,
  isEDOS: boolean,
  rfcType: "emisor" | "receptor"
): string[] {
  const newWarnings = [...warnings];

  if (isEFOS) {
    newWarnings.push(
      `⚠️ RFC ${rfcType} está en lista EFOS (Empresas que Facturan Operaciones Simuladas)`
    );
  }

  if (isEDOS) {
    newWarnings.push(
      `⚠️ RFC ${rfcType} está en lista EDOS (Empresas que Deducen Operaciones Simuladas)`
    );
  }

  return newWarnings;
}
