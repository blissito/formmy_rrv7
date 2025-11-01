/**
 * SAT Validation Service - Facturama API Integration
 *
 * Valida facturas CFDI con el SAT usando Facturama como PAC (Proveedor Autorizado de Certificación).
 *
 * API Docs: https://api.facturama.mx/docs
 * Auth: Basic Auth (username:password en Base64)
 *
 * Pricing: $1,650 MXN/año + $0.50 MXN por validación = 1 crédito Formmy
 *
 * Sandbox Credentials (testing):
 * - Username: pruebas
 * - Password: pruebas2011
 *
 * Production: Configure via .env
 */

import { db } from "~/utils/db.server";
import { consumeCredits } from "../llamaparse/credits.service";

// ========================================
// Types
// ========================================

export interface InvoiceToValidate {
  id: string; // ID en nuestra BD
  uuid: string;
  issuerRfc: string; // rfcEmisor
  receiverRfc: string; // rfcReceptor
  total: number;
}

export interface FacturamaValidationResponse {
  uuid: string;
  status: "Vigente" | "Cancelado"; // Status del SAT
  cancellationDate?: string;
  validatedAt: Date;
}

export interface ValidationResult {
  invoiceId: string;
  uuid: string;
  satStatus: "VALID_VIGENTE" | "VALID_CANCELADA";
  validatedAt: Date;
  error?: string;
}

// ========================================
// Facturama API Client
// ========================================

class FacturamaClient {
  private baseUrl: string;
  private authToken: string;

  constructor() {
    const username = process.env.FACTURAMA_USERNAME || "pruebas";
    const password = process.env.FACTURAMA_PASSWORD || "pruebas2011";

    // Basic Auth: Base64(username:password)
    this.authToken = Buffer.from(`${username}:${password}`).toString("base64");

    // URL base (sandbox vs production)
    this.baseUrl =
      process.env.FACTURAMA_ENV === "production"
        ? "https://api.facturama.mx"
        : "https://apisandbox.facturama.mx";

  }

  /**
   * Valida el status de un CFDI con el SAT.
   *
   * Endpoint: GET /cfdi/status
   * Params: uuid, issuerRfc, receiverRfc, total
   */
  async validateInvoiceStatus(params: {
    uuid: string;
    issuerRfc: string;
    receiverRfc: string;
    total: number;
  }): Promise<FacturamaValidationResponse> {
    const url = new URL(`${this.baseUrl}/cfdi/status`);
    url.searchParams.append("uuid", params.uuid);
    url.searchParams.append("issuerRfc", params.issuerRfc);
    url.searchParams.append("receiverRfc", params.receiverRfc);
    url.searchParams.append("total", params.total.toString());


    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Basic ${this.authToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [Facturama] Validation failed (${response.status}):`, errorText);
      throw new Error(`Facturama API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();


    return {
      uuid: params.uuid,
      status: data.status || "Vigente",
      cancellationDate: data.cancellationDate,
      validatedAt: new Date(),
    };
  }
}

// Singleton instance
const facturamaClient = new FacturamaClient();

// ========================================
// Validación Manual Selectiva
// ========================================

/**
 * Valida múltiples facturas con Facturama.
 * El contador selecciona manualmente qué facturas validar (control de créditos).
 *
 * Costo: 1 crédito Formmy por factura validada.
 */
export async function validateInvoicesWithFacturama(
  invoices: InvoiceToValidate[],
  userId: string
): Promise<ValidationResult[]> {

  // Calcular créditos necesarios (1 por factura)
  const creditsNeeded = invoices.length;

  // Verificar y consumir créditos
  try {
    await consumeCredits(userId, creditsNeeded);
  } catch (error) {
    throw new Error(`Créditos insuficientes. Necesitas ${creditsNeeded} créditos para validar ${invoices.length} facturas.`);
  }

  const results: ValidationResult[] = [];

  // Validar cada factura secuencialmente
  for (const invoice of invoices) {
    try {
      const validation = await facturamaClient.validateInvoiceStatus({
        uuid: invoice.uuid,
        issuerRfc: invoice.issuerRfc,
        receiverRfc: invoice.receiverRfc,
        total: invoice.total,
      });

      // Mapear status de Facturama a nuestro enum
      const satStatus: "VALID_VIGENTE" | "VALID_CANCELADA" =
        validation.status === "Vigente" ? "VALID_VIGENTE" : "VALID_CANCELADA";

      // Actualizar factura en BD
      await db.satInvoice.update({
        where: { id: invoice.id },
        data: {
          satStatus,
          validatedAt: validation.validatedAt,
          validatedBy: userId,
        },
      });

      results.push({
        invoiceId: invoice.id,
        uuid: invoice.uuid,
        satStatus,
        validatedAt: validation.validatedAt,
      });

    } catch (error) {
      console.error(`❌ [SAT Validation] Error validating ${invoice.uuid}:`, error);

      results.push({
        invoiceId: invoice.id,
        uuid: invoice.uuid,
        satStatus: "VALID_VIGENTE", // Mantener estado por defecto en caso de error
        validatedAt: new Date(),
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }


  return results;
}

/**
 * Valida una sola factura (wrapper de conveniencia).
 */
export async function validateSingleInvoice(
  invoiceId: string,
  userId: string
): Promise<ValidationResult> {
  // Buscar factura en BD
  const invoice = await db.satInvoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    throw new Error(`Factura ${invoiceId} no encontrada`);
  }

  const results = await validateInvoicesWithFacturama(
    [
      {
        id: invoice.id,
        uuid: invoice.uuid,
        issuerRfc: invoice.rfcEmisor,
        receiverRfc: invoice.rfcReceptor,
        total: invoice.total,
      },
    ],
    userId
  );

  return results[0];
}

// ========================================
// Validación Batch Optimizada
// ========================================

/**
 * Valida un lote de facturas de manera optimizada.
 * Procesa en chunks para evitar timeouts.
 */
export async function validateInvoicesBatch(
  invoiceIds: string[],
  userId: string,
  chunkSize: number = 10
): Promise<{
  total: number;
  validated: number;
  vigentes: number;
  canceladas: number;
  errors: number;
  results: ValidationResult[];
}> {

  // Buscar facturas en BD
  const invoices = await db.satInvoice.findMany({
    where: {
      id: { in: invoiceIds },
      userId,
    },
    select: {
      id: true,
      uuid: true,
      rfcEmisor: true,
      rfcReceptor: true,
      total: true,
    },
  });

  const invoicesToValidate: InvoiceToValidate[] = invoices.map((inv) => ({
    id: inv.id,
    uuid: inv.uuid,
    issuerRfc: inv.rfcEmisor,
    receiverRfc: inv.rfcReceptor,
    total: inv.total,
  }));

  // Procesar en chunks
  const allResults: ValidationResult[] = [];
  for (let i = 0; i < invoicesToValidate.length; i += chunkSize) {
    const chunk = invoicesToValidate.slice(i, i + chunkSize);

    const chunkResults = await validateInvoicesWithFacturama(chunk, userId);
    allResults.push(...chunkResults);

    // Delay entre chunks para no saturar la API
    if (i + chunkSize < invoicesToValidate.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Calcular estadísticas
  const stats = {
    total: allResults.length,
    validated: allResults.filter((r) => !r.error).length,
    vigentes: allResults.filter((r) => r.satStatus === "VALID_VIGENTE").length,
    canceladas: allResults.filter((r) => r.satStatus === "VALID_CANCELADA").length,
    errors: allResults.filter((r) => r.error).length,
    results: allResults,
  };


  return stats;
}

// ========================================
// Helpers
// ========================================

/**
 * Verifica si una factura necesita validación.
 * Criterios:
 * - Status es PENDING_VALIDATION
 * - O fue validada hace >30 días (re-validación periódica)
 */
export function needsValidation(invoice: {
  satStatus: string;
  validatedAt: Date | null;
}): boolean {
  if (invoice.satStatus === "PENDING_VALIDATION") {
    return true;
  }

  if (!invoice.validatedAt) {
    return true;
  }

  const daysSinceValidation = Math.floor(
    (Date.now() - invoice.validatedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSinceValidation > 30;
}

/**
 * Obtiene facturas pendientes de validación para un chatbot.
 */
export async function getPendingValidationInvoices(
  chatbotId: string,
  userId: string,
  limit: number = 50
) {
  return await db.satInvoice.findMany({
    where: {
      chatbotId,
      userId,
      satStatus: "PENDING_VALIDATION",
      status: "APPROVED", // Solo validar facturas aprobadas
    },
    take: limit,
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Estadísticas de validación para un chatbot.
 */
export async function getValidationStats(chatbotId: string, userId: string) {
  const [total, pending, vigentes, canceladas] = await Promise.all([
    db.satInvoice.count({
      where: { chatbotId, userId },
    }),
    db.satInvoice.count({
      where: { chatbotId, userId, satStatus: "PENDING_VALIDATION" },
    }),
    db.satInvoice.count({
      where: { chatbotId, userId, satStatus: "VALID_VIGENTE" },
    }),
    db.satInvoice.count({
      where: { chatbotId, userId, satStatus: "VALID_CANCELADA" },
    }),
  ]);

  return {
    total,
    pending,
    vigentes,
    canceladas,
    percentageValidated: total > 0 ? Math.round(((vigentes + canceladas) / total) * 100) : 0,
  };
}
