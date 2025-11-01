/**
 * SAT Parser Service - Parseo Inteligente 4 Niveles
 *
 * Implementa el sistema de parseo progresivo:
 * 1. XML Local (GRATIS ✅) - Extracción perfecta de CFDI XML
 * 2. PDF Simple (GRATIS ✅) - Regex para UUID/RFC/Total en PDFs de texto
 * 3. LlamaParse COST_EFFECTIVE (1 crédito/pág) - Para PDFs estructurados
 * 4. LlamaParse AGENTIC (3 créditos/pág) - Para PDFs complejos/escaneados
 *
 * Features:
 * - Auto-aprobación por confianza (>90% = APPROVED)
 * - Detección de anomalías fiscales
 * - Auto-extracción de contactos
 */

import { XMLParser } from "fast-xml-parser";
import { extractText } from "unpdf";
import { llamaParse } from "../llamaparse/llamaparse.service";
import type { ParsingMode } from "@prisma/client";

// ========================================
// Types
// ========================================

export type ParseMethod = "XML_LOCAL" | "PDF_SIMPLE" | "LLAMAPARSE_CE" | "LLAMAPARSE_AG";
export type InvoiceStatus = "APPROVED" | "NEEDS_REVIEW" | "PARSE_ERROR";
export type SATStatus = "PENDING_VALIDATION" | "VALIDATING" | "VALID_VIGENTE" | "VALID_CANCELADA";

export interface ParsedInvoice {
  // Datos CFDI
  uuid: string;
  rfcEmisor: string;
  rfcReceptor: string;
  nombreEmisor: string;
  tipo: string; // INGRESO, EGRESO, NOMINA, PAGO
  fecha: Date;
  subtotal: number;
  iva: number;
  total: number;
  concepto: string;
  metodoPago: string; // PUE, PPD

  // Metadata de parseo
  parseMethod: ParseMethod;
  confidence: number; // 0.0 - 1.0
  status: InvoiceStatus;
  satStatus: SATStatus;
  creditsUsed: number;
  warnings: string[];

  // URLs de archivos originales
  xmlUrl?: string;
  pdfUrl?: string;
}

export interface ParseOptions {
  forceLlamaParse?: boolean; // Forzar LlamaParse aunque sea PDF simple
  agenticMode?: boolean; // Usar modo AGENTIC en vez de COST_EFFECTIVE
}

// ========================================
// Nivel 1: XML Local (GRATIS ✅)
// ========================================

/**
 * Parsea XML CFDI nativo del SAT.
 * Confianza: 1.0 (100%)
 * Costo: GRATIS
 */
export async function parseXMLLocal(xmlBuffer: Buffer): Promise<ParsedInvoice> {

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
  });

  const xmlString = xmlBuffer.toString("utf-8");
  const parsed = parser.parse(xmlString);

  // El CFDI 3.3 tiene estructura: cfdi:Comprobante
  const comprobante = parsed["cfdi:Comprobante"] || parsed["Comprobante"];

  if (!comprobante) {
    throw new Error("XML no es un CFDI válido");
  }

  // Extraer datos del comprobante
  const emisor = comprobante["cfdi:Emisor"] || comprobante["Emisor"];
  const receptor = comprobante["cfdi:Receptor"] || comprobante["Receptor"];
  const timbreFiscal =
    comprobante["cfdi:Complemento"]?.["tfd:TimbreFiscalDigital"] ||
    comprobante["Complemento"]?.["TimbreFiscalDigital"];

  // Conceptos
  const conceptos = comprobante["cfdi:Conceptos"]?.["cfdi:Concepto"] || [];
  const primerConcepto = Array.isArray(conceptos) ? conceptos[0] : conceptos;

  return {
    // Datos CFDI
    uuid: timbreFiscal?.["@_UUID"] || "",
    rfcEmisor: emisor?.["@_Rfc"] || "",
    rfcReceptor: receptor?.["@_Rfc"] || "",
    nombreEmisor: emisor?.["@_Nombre"] || "",
    tipo: comprobante["@_TipoDeComprobante"] || "INGRESO",
    fecha: new Date(comprobante["@_Fecha"] || Date.now()),
    subtotal: parseFloat(comprobante["@_SubTotal"] || "0"),
    iva: parseFloat(comprobante["@_TotalImpuestosTrasladados"] || "0"),
    total: parseFloat(comprobante["@_Total"] || "0"),
    concepto: primerConcepto?.["@_Descripcion"] || "",
    metodoPago: comprobante["@_MetodoPago"] || "PUE",

    // Metadata
    parseMethod: "XML_LOCAL",
    confidence: 1.0, // ✅ Confianza perfecta
    status: "APPROVED", // Auto-aprobado
    satStatus: "PENDING_VALIDATION",
    creditsUsed: 0, // GRATIS
    warnings: detectAnomalies({
      subtotal: parseFloat(comprobante["@_SubTotal"] || "0"),
      iva: parseFloat(comprobante["@_TotalImpuestosTrasladados"] || "0"),
      total: parseFloat(comprobante["@_Total"] || "0"),
      rfcEmisor: emisor?.["@_Rfc"] || "",
    }),
  };
}

// ========================================
// Nivel 2: PDF Simple (GRATIS ✅)
// ========================================

/**
 * Parsea PDF de texto plano con regex.
 * Confianza: Variable (0.70 - 0.95)
 * Costo: GRATIS
 */
export async function parsePDFSimple(pdfBuffer: Buffer): Promise<ParsedInvoice | { needsAdvancedParsing: true }> {

  const uint8Array = new Uint8Array(pdfBuffer);
  const result = await extractText(uint8Array);

  // unpdf retorna array de strings (uno por página), unirlos
  const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;

  // Extraer datos con regex
  const uuid = extractUUID(text);
  const rfcEmisor = extractRFC(text, "Emisor");
  const rfcReceptor = extractRFC(text, "Receptor");
  const total = extractTotal(text);
  const fecha = extractFecha(text);

  // Si falta data crítica, necesita LlamaParse
  if (!uuid || !rfcEmisor || !total) {
    return { needsAdvancedParsing: true };
  }

  // Calcular confianza basada en datos extraídos
  const confidence = calculateSimplePDFConfidence({ uuid, rfcEmisor, rfcReceptor, total, fecha });

  return {
    uuid,
    rfcEmisor,
    rfcReceptor: rfcReceptor || "",
    nombreEmisor: extractNombre(text) || "DESCONOCIDO",
    tipo: "INGRESO",
    fecha: fecha || new Date(),
    subtotal: total * 0.84, // Estimado (total - 16% IVA)
    iva: total * 0.16, // Estimado
    total,
    concepto: extractConcepto(text) || "Sin descripción",
    metodoPago: "PUE",

    // Metadata
    parseMethod: "PDF_SIMPLE",
    confidence,
    status: confidence >= 0.9 ? "APPROVED" : "NEEDS_REVIEW",
    satStatus: "PENDING_VALIDATION",
    creditsUsed: 0, // GRATIS
    warnings: confidence < 0.9 ? ["Verificar datos extraídos manualmente"] : [],
  };
}

// ========================================
// Nivel 3 & 4: LlamaParse (1 o 3 créditos/pág)
// ========================================

/**
 * Parsea con LlamaParse avanzado.
 * COST_EFFECTIVE: 1 crédito/pág, confianza ~0.90
 * AGENTIC: 3 créditos/pág, confianza ~0.95
 */
export async function parseLlamaParse(
  pdfBuffer: Buffer,
  mode: "COST_EFFECTIVE" | "AGENTIC",
  userId: string
): Promise<ParsedInvoice> {

  // Determinar modo de parsing
  const parsingMode: ParsingMode = mode === "COST_EFFECTIVE" ? "COST_EFFECTIVE" : "AGENTIC";

  // Llamar LlamaParse
  const result = await llamaParse(pdfBuffer, parsingMode, userId);

  if (!result.success || !result.markdown) {
    throw new Error(`LlamaParse falló: ${result.error}`);
  }

  // Extraer datos del markdown parseado
  const markdown = result.markdown;
  const uuid = extractUUID(markdown);
  const rfcEmisor = extractRFC(markdown, "Emisor");
  const rfcReceptor = extractRFC(markdown, "Receptor");
  const total = extractTotal(markdown);
  const fecha = extractFecha(markdown);

  if (!uuid || !rfcEmisor || !total) {
    throw new Error("LlamaParse no pudo extraer datos críticos");
  }

  const confidence = mode === "COST_EFFECTIVE" ? 0.9 : 0.95;

  return {
    uuid,
    rfcEmisor,
    rfcReceptor: rfcReceptor || "",
    nombreEmisor: extractNombre(markdown) || "DESCONOCIDO",
    tipo: "INGRESO",
    fecha: fecha || new Date(),
    subtotal: total * 0.84,
    iva: total * 0.16,
    total,
    concepto: extractConcepto(markdown) || "Sin descripción",
    metodoPago: "PUE",

    // Metadata
    parseMethod: mode === "COST_EFFECTIVE" ? "LLAMAPARSE_CE" : "LLAMAPARSE_AG",
    confidence,
    status: "APPROVED", // >90% siempre aprobado
    satStatus: "PENDING_VALIDATION",
    creditsUsed: result.creditsUsed,
    warnings: [],
  };
}

// ========================================
// Smart Parse - Selector Automático
// ========================================

/**
 * Parser inteligente que selecciona automáticamente el mejor método.
 * Orden de prioridad:
 * 1. XML Local (GRATIS) si es XML
 * 2. PDF Simple (GRATIS) si es PDF de texto
 * 3. LlamaParse COST_EFFECTIVE si necesita parseo avanzado
 * 4. LlamaParse AGENTIC si el usuario lo fuerza
 */
export async function smartParse(
  fileBuffer: Buffer,
  fileType: string,
  userId: string,
  options: ParseOptions = {}
): Promise<ParsedInvoice> {

  // Nivel 1: XML Local
  if (fileType === "application/xml" || fileType === "text/xml") {
    try {
      return await parseXMLLocal(fileBuffer);
    } catch (error) {
      console.error("❌ [SAT Parser] Error en XML Local:", error);
      throw error;
    }
  }

  // Nivel 2: PDF Simple (si no se fuerza LlamaParse)
  if ((fileType === "application/pdf") && !options.forceLlamaParse) {
    try {
      const result = await parsePDFSimple(fileBuffer);
      if ("needsAdvancedParsing" in result) {
      } else {
        return result;
      }
    } catch (error) {
      console.error("⚠️ [SAT Parser] Error en PDF Simple, escalando...");
    }
  }

  // Nivel 3/4: LlamaParse
  const mode = options.agenticMode ? "AGENTIC" : "COST_EFFECTIVE";
  return await parseLlamaParse(fileBuffer, mode, userId);
}

// ========================================
// Utilidades de Extracción (Regex)
// ========================================

function extractUUID(text: string): string | null {
  // Folio Fiscal (UUID del SAT en CFDI): 8-4-4-4-12 caracteres hex
  const folioFiscalRegex = /Folio\s+Fiscal[:\s]*([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i;
  const match = text.match(folioFiscalRegex);
  return match ? match[1] : null;
}

function extractRFC(text: string, tipo: "Emisor" | "Receptor"): string | null {
  // RFC: 12-13 caracteres alfanuméricos
  // Patrón 1: Buscar "RFC: XXX" después de "DATOS DEL EMISOR/RECEPTOR"
  const rfcConLabelRegex = new RegExp(`DATOS\\s+DEL\\s+${tipo.toUpperCase()}[\\s\\S]{0,200}?RFC[:\\s]*([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})`, "i");
  const labelMatch = text.match(rfcConLabelRegex);
  if (labelMatch) {
    return labelMatch[1];
  }

  // Patrón 2: Buscar directamente "RFC: XXX" cerca del tipo
  const rfcDirectRegex = new RegExp(`${tipo}[\\s\\S]{0,100}?RFC[:\\s]*([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})`, "i");
  const directMatch = text.match(rfcDirectRegex);
  if (directMatch) {
    return directMatch[1];
  }

  // Patrón 3: Fallback - buscar cualquier RFC válido después de mencionar el tipo
  const fallbackRegex = new RegExp(`${tipo}[\\s\\S]{0,50}?([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})`, "i");
  const fallbackMatch = text.match(fallbackRegex);
  return fallbackMatch ? fallbackMatch[1] : null;
}

function extractTotal(text: string): number | null {
  // Total: buscar "Total" seguido de cantidad
  const totalRegex = /Total[:\s]*\$?\s*([\d,]+\.?\d*)/i;
  const match = text.match(totalRegex);
  if (match) {
    const cleanNumber = match[1].replace(/,/g, "");
    return parseFloat(cleanNumber);
  }
  return null;
}

function extractFecha(text: string): Date | null {
  // Fecha ISO del SAT: 2025-10-03T11:59:17
  const fechaISORegex = /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/;
  const isoMatch = text.match(fechaISORegex);
  if (isoMatch) {
    return new Date(isoMatch[1]);
  }

  // Fallback: DD/MM/YYYY o YYYY-MM-DD
  const fechaRegex = /(\d{2}\/\d{2}\/\d{4})|(\d{4}-\d{2}-\d{2})/;
  const match = text.match(fechaRegex);
  if (match) {
    return new Date(match[0]);
  }
  return null;
}

function extractNombre(text: string): string | null {
  // Patrón 1: "Nombre: COMERCIAL CITY FRESKO" (más común en PDFs)
  const nombreConLabelRegex = /Nombre[:\s]+([A-ZÑ0-9\s,\.&]+?)(?:\s+RFC|\s+Régimen|\n|$)/i;
  const labelMatch = text.match(nombreConLabelRegex);
  if (labelMatch) {
    const nombre = labelMatch[1].trim();
    // Validar que NO sea un título/keyword
    if (isValidNombre(nombre)) {
      return nombre;
    }
  }

  // Patrón 2: "RFC: XXX Nombre: YYY" (cuando están en la misma línea)
  const nombreDespuesRFCRegex = /RFC[:\s]+[A-Z&Ñ0-9]{12,13}[\s]+Nombre[:\s]+([A-ZÑ0-9\s,\.&]{3,100}?)(?:\s+Régimen|\n|$)/i;
  const rfcNombreMatch = text.match(nombreDespuesRFCRegex);
  if (rfcNombreMatch) {
    const nombre = rfcNombreMatch[1].trim();
    if (isValidNombre(nombre)) {
      return nombre;
    }
  }

  // Patrón 3: Fallback - buscar después de "DATOS DEL EMISOR"
  const nombreDespuesEmisorRegex = /DATOS\s+DEL\s+EMISOR[\s\S]{0,200}?Nombre[:\s]+([A-ZÑ0-9\s,\.&]{3,100}?)(?:\s+Régimen|\n|$)/i;
  const emisorMatch = text.match(nombreDespuesEmisorRegex);
  if (emisorMatch) {
    const nombre = emisorMatch[1].trim();
    if (isValidNombre(nombre)) {
      return nombre;
    }
  }

  return null;
}

function extractConcepto(text: string): string | null {
  // Buscar en tabla de productos CFDI: PRODUCTO o DESCRIPCIÓN
  const productoRegex = /(?:PRODUCTO|DESCRIPCIÓN)\s+([^\n]{10,100})/i;
  const match = text.match(productoRegex);
  if (match) {
    return match[1].trim();
  }

  // Fallback: buscar línea después de DESCRIPCIÓN
  const descripcionRegex = /DESCRIPCIÓN[^\n]*\n\s*([^\n]{10,100})/i;
  const descMatch = text.match(descripcionRegex);
  return descMatch ? descMatch[1].trim() : null;
}

// ========================================
// Sistema de Confianza
// ========================================

function calculateSimplePDFConfidence(data: {
  uuid: string | null;
  rfcEmisor: string | null;
  rfcReceptor: string | null;
  total: number | null;
  fecha: Date | null;
}): number {
  let confidence = 0.5; // Base

  if (data.uuid) confidence += 0.2;
  if (data.rfcEmisor) confidence += 0.15;
  if (data.rfcReceptor) confidence += 0.05;
  if (data.total) confidence += 0.1;
  if (data.fecha) confidence += 0.05;

  return Math.min(confidence, 0.95); // Max 95% para PDF simple
}

export function determineStatus(confidence: number): InvoiceStatus {
  if (confidence >= 0.9) return "APPROVED";
  if (confidence >= 0.7) return "NEEDS_REVIEW";
  return "PARSE_ERROR";
}

// ========================================
// Detección de Anomalías
// ========================================

export function detectAnomalies(invoice: {
  subtotal: number;
  iva: number;
  total: number;
  rfcEmisor: string;
}): string[] {
  const warnings: string[] = [];

  // 1. Verificar cálculo de total
  const expectedTotal = invoice.subtotal + invoice.iva;
  const diff = Math.abs(expectedTotal - invoice.total);
  if (diff > 0.01) {
    warnings.push("⚠️ Subtotal + IVA no coincide con Total");
  }

  // 2. Validar formato RFC
  if (!validateRFCFormat(invoice.rfcEmisor)) {
    warnings.push("⚠️ RFC Emisor tiene formato inválido");
  }

  // 3. Monto sospechoso (>100K)
  if (invoice.total > 100000) {
    warnings.push("⚠️ Factura de monto alto, verificar manualmente");
  }

  return warnings;
}

function validateRFCFormat(rfc: string): boolean {
  // RFC: 12-13 caracteres, 3-4 letras + 6 dígitos + 3 alfanuméricos
  const rfcRegex = /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/;
  return rfcRegex.test(rfc);
}

/**
 * Valida que un nombre extraído NO sea un título o keyword del SAT.
 * Evita capturar cosas como "DATOS DEL EMISOR", "RFC", "EMISOR", etc.
 */
function isValidNombre(nombre: string): boolean {
  if (!nombre || nombre.length < 3) {
    return false;
  }

  // Lista de keywords/títulos que NO son nombres válidos
  const invalidKeywords = [
    "DATOS",
    "EMISOR",
    "RECEPTOR",
    "RFC",
    "REGIMEN",
    "FISCAL",
    "NOMBRE",
    "COMPROBANTE",
    "CFDI",
    "FACTURA",
    "TOTAL",
    "SUBTOTAL",
    "IVA",
    "FOLIO",
    "FECHA",
    "EXPEDICION",
    "LUGAR",
    "DATOS DEL EMISOR",
    "DATOS DEL RECEPTOR",
  ];

  // Normalizar para comparación
  const nombreUpper = nombre.toUpperCase().trim();

  // Verificar si el nombre es exactamente un keyword inválido
  if (invalidKeywords.includes(nombreUpper)) {
    return false;
  }

  // Verificar si el nombre es solo un keyword (sin otros caracteres)
  for (const keyword of invalidKeywords) {
    if (nombreUpper === keyword || nombreUpper.startsWith(keyword + " ") || nombreUpper.endsWith(" " + keyword)) {
      return false;
    }
  }

  // Verificar que tenga al menos 3 caracteres alfabéticos
  const alphaChars = nombre.match(/[A-ZÑ]/gi);
  if (!alphaChars || alphaChars.length < 3) {
    return false;
  }

  return true;
}
