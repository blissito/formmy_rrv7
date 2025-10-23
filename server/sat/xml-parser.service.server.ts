/**
 * Servicio de parseo de XML de facturas SAT (CFDI 3.3 y 4.0)
 * Método: XML_LOCAL (gratis, 100% confianza)
 */

import { parseStringPromise } from "xml2js";

export interface ParsedInvoiceData {
  uuid: string;
  version: string; // "3.3" | "4.0"
  tipo: string; // "INGRESO" | "EGRESO"
  fecha: Date;
  total: number;
  subtotal: number;
  iva: number;
  moneda: string;
  metodoPago: string; // "PUE" | "PPD"
  formaPago?: string; // "01" = Efectivo, "03" = Transferencia, etc.

  // Emisor
  nombreEmisor: string;
  rfcEmisor: string;
  regimenFiscalEmisor?: string;

  // Receptor
  nombreReceptor: string;
  rfcReceptor: string;
  usoCFDI?: string; // "G03" = Gastos en general, etc.

  // Conceptos
  concepto: string; // Concatenado de todos los conceptos
  conceptos: Array<{
    claveProdServ: string;
    cantidad: number;
    claveUnidad: string;
    descripcion: string;
    valorUnitario: number;
    importe: number;
  }>;

  // Complementos
  timbreFiscal?: {
    uuid: string;
    fechaTimbrado: Date;
    selloCFD: string;
    noCertificadoSAT: string;
  };

  // Metadata
  parseMethod: "XML_LOCAL";
  confidence: number; // Siempre 1.0 para XML
  warnings: string[];
}

/**
 * Parsea un XML de factura SAT (CFDI 3.3 o 4.0)
 */
export async function parseXMLInvoice(
  xmlBuffer: Buffer
): Promise<ParsedInvoiceData> {
  const xmlString = xmlBuffer.toString("utf-8");
  const warnings: string[] = [];

  try {
    const result = await parseStringPromise(xmlString, {
      explicitArray: false,
      mergeAttrs: true,
      ignoreAttrs: false,
    });

    // Detectar versión (3.3 o 4.0)
    const comprobante =
      result["cfdi:Comprobante"] || result["Comprobante"] || result;
    const version = comprobante.Version || comprobante.version || "3.3";

    // Validar que sea un CFDI válido
    if (!comprobante) {
      throw new Error("XML no es un CFDI válido");
    }

    // Extraer datos principales
    const total = parseFloat(comprobante.Total || 0);
    const subtotal = parseFloat(comprobante.SubTotal || 0);

    // Calcular IVA desde impuestos
    let iva = 0;
    const impuestos = comprobante.Impuestos || comprobante["cfdi:Impuestos"];
    if (impuestos) {
      const traslados =
        impuestos.Traslados?.Traslado || impuestos["cfdi:Traslados"]?.["cfdi:Traslado"];
      if (traslados) {
        const trasladosArray = Array.isArray(traslados) ? traslados : [traslados];
        iva = trasladosArray
          .filter((t: any) => t.Impuesto === "002") // 002 = IVA
          .reduce((sum: number, t: any) => sum + parseFloat(t.Importe || 0), 0);
      }
    }

    // Extraer emisor
    const emisor = comprobante.Emisor || comprobante["cfdi:Emisor"];
    const nombreEmisor = emisor.Nombre || emisor.nombre || "Sin nombre";
    const rfcEmisor = emisor.Rfc || emisor.rfc || "";

    // Extraer receptor
    const receptor = comprobante.Receptor || comprobante["cfdi:Receptor"];
    const nombreReceptor = receptor.Nombre || receptor.nombre || "Sin nombre";
    const rfcReceptor = receptor.Rfc || receptor.rfc || "";

    // Extraer conceptos
    const conceptosNode =
      comprobante.Conceptos?.Concepto || comprobante["cfdi:Conceptos"]?.["cfdi:Concepto"];
    const conceptosArray = conceptosNode
      ? Array.isArray(conceptosNode)
        ? conceptosNode
        : [conceptosNode]
      : [];

    const conceptos = conceptosArray.map((c: any) => ({
      claveProdServ: c.ClaveProdServ || c.claveProdServ || "",
      cantidad: parseFloat(c.Cantidad || c.cantidad || 1),
      claveUnidad: c.ClaveUnidad || c.claveUnidad || "",
      descripcion: c.Descripcion || c.descripcion || "",
      valorUnitario: parseFloat(c.ValorUnitario || c.valorUnitario || 0),
      importe: parseFloat(c.Importe || c.importe || 0),
    }));

    const concepto =
      conceptos.map((c) => c.descripcion).join(", ") || "Sin concepto";

    // Extraer UUID del TimbreFiscalDigital
    const complemento =
      comprobante.Complemento || comprobante["cfdi:Complemento"];
    const timbre =
      complemento?.TimbreFiscalDigital ||
      complemento?.[0]?.TimbreFiscalDigital ||
      complemento?.["tfd:TimbreFiscalDigital"];

    const uuid = timbre?.UUID || timbre?.uuid || "";
    if (!uuid) {
      warnings.push("UUID no encontrado en TimbreFiscalDigital");
    }

    const timbreFiscal = timbre
      ? {
          uuid: timbre.UUID || timbre.uuid,
          fechaTimbrado: new Date(timbre.FechaTimbrado || timbre.fechaTimbrado),
          selloCFD: timbre.SelloCFD || timbre.selloCFD || "",
          noCertificadoSAT: timbre.NoCertificadoSAT || timbre.noCertificadoSAT || "",
        }
      : undefined;

    // Validaciones
    if (!rfcEmisor) {
      warnings.push("RFC del emisor no encontrado");
    }
    if (!rfcReceptor) {
      warnings.push("RFC del receptor no encontrado");
    }
    if (Math.abs(total - (subtotal + iva)) > 0.01) {
      warnings.push(
        `Discrepancia en totales: Total=${total}, Subtotal+IVA=${subtotal + iva}`
      );
    }

    return {
      uuid,
      version,
      tipo: (comprobante.TipoDeComprobante || comprobante.tipoDeComprobante || "I") === "I"
        ? "INGRESO"
        : "EGRESO",
      fecha: new Date(comprobante.Fecha || comprobante.fecha),
      total,
      subtotal,
      iva,
      moneda: comprobante.Moneda || comprobante.moneda || "MXN",
      metodoPago: comprobante.MetodoPago || comprobante.metodoPago || "PUE",
      formaPago: comprobante.FormaPago || comprobante.formaPago,
      nombreEmisor,
      rfcEmisor,
      regimenFiscalEmisor: emisor.RegimenFiscal || emisor.regimenFiscal,
      nombreReceptor,
      rfcReceptor,
      usoCFDI: receptor.UsoCFDI || receptor.usoCFDI,
      concepto,
      conceptos,
      timbreFiscal,
      parseMethod: "XML_LOCAL",
      confidence: 1.0, // XML siempre tiene 100% confianza
      warnings,
    };
  } catch (error: any) {
    throw new Error(`Error parseando XML: ${error.message}`);
  }
}

/**
 * Valida si un buffer es un XML de factura SAT válido
 */
export function isValidSATXML(buffer: Buffer): boolean {
  const xmlString = buffer.toString("utf-8");
  return (
    xmlString.includes("cfdi:Comprobante") || xmlString.includes("<Comprobante")
  );
}
