/**
 * Script standalone para testear los fixes del SAT Parser
 * Copia las funciones de extracción directamente
 */
import { readFileSync } from "fs";
import { extractText } from "unpdf";

// ========================================
// Funciones de Extracción (copiadas)
// ========================================

function extractUUID(text: string): string | null {
  const folioFiscalRegex = /Folio\s+Fiscal[:\s]*([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i;
  const match = text.match(folioFiscalRegex);
  return match ? match[1] : null;
}

function extractRFC(text: string, tipo: "Emisor" | "Receptor"): string | null {
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

function isValidNombre(nombre: string): boolean {
  if (!nombre || nombre.length < 3) {
    return false;
  }

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

  const nombreUpper = nombre.toUpperCase().trim();

  if (invalidKeywords.includes(nombreUpper)) {
    return false;
  }

  for (const keyword of invalidKeywords) {
    if (nombreUpper === keyword || nombreUpper.startsWith(keyword + " ") || nombreUpper.endsWith(" " + keyword)) {
      return false;
    }
  }

  const alphaChars = nombre.match(/[A-ZÑ]/gi);
  if (!alphaChars || alphaChars.length < 3) {
    return false;
  }

  return true;
}

function extractNombre(text: string): string | null {
  // Patrón 1: "Nombre: COMERCIAL CITY FRESKO" (más común en PDFs)
  const nombreConLabelRegex = /Nombre[:\s]+([A-ZÑ0-9\s,\.&]+?)(?:\s+RFC|\s+Régimen|\n|$)/i;
  const labelMatch = text.match(nombreConLabelRegex);
  if (labelMatch) {
    const nombre = labelMatch[1].trim();
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

// ========================================
// Test
// ========================================

async function testParserFixes() {
  console.log("🧪 Testing SAT Parser Fixes con PDF real...\n");

  const pdfBuffer = readFileSync("/Users/bliss/Downloads/CFDI62579869_LOPM9704158A0_C_27675175.pdf");

  console.log("📄 PDF:", "CFDI62579869_LOPM9704158A0_C_27675175.pdf");
  console.log("📦 Tamaño:", (pdfBuffer.length / 1024).toFixed(2), "KB\n");

  console.log("⏳ Extrayendo texto con unpdf...");
  const uint8Array = new Uint8Array(pdfBuffer);
  const result = await extractText(uint8Array);
  const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;
  console.log("✅ Texto extraído:", text.length, "caracteres\n");

  console.log("⏳ Extrayendo datos con regex...\n");

  const uuid = extractUUID(text);
  const rfcEmisor = extractRFC(text, "Emisor");
  const rfcReceptor = extractRFC(text, "Receptor");
  const nombreEmisor = extractNombre(text);
  const total = extractTotal(text);
  const fecha = extractFecha(text);

  console.log("=== DATOS EXTRAÍDOS ===");
  console.log("UUID:", uuid || "❌ NO EXTRAÍDO");
  console.log("RFC Emisor:", rfcEmisor || "❌ NO EXTRAÍDO");
  console.log("RFC Receptor:", rfcReceptor || "❌ NO EXTRAÍDO");
  console.log("Nombre Emisor:", nombreEmisor || "❌ NO EXTRAÍDO");
  console.log("Total:", total ? `$${total.toFixed(2)}` : "❌ NO EXTRAÍDO");
  console.log("Fecha:", fecha ? fecha.toISOString() : "❌ NO EXTRAÍDO");

  console.log("\n=== VALORES ESPERADOS ===");
  console.log("UUID esperado: C1510F1D-A044-420E-83B9-943886D6E677");
  console.log("RFC Emisor esperado: CCF121101KQ4");
  console.log("RFC Receptor esperado: LOPM9704158A0");
  console.log("Nombre esperado: COMERCIAL CITY FRESKO");
  console.log("Total esperado: $847.49");

  console.log("\n=== VALIDACIÓN ===");
  const checks = {
    uuid: uuid === "C1510F1D-A044-420E-83B9-943886D6E677",
    rfcEmisor: rfcEmisor === "CCF121101KQ4",
    rfcReceptor: rfcReceptor === "LOPM9704158A0",
    nombreEmisor: nombreEmisor === "COMERCIAL CITY FRESKO",
    total: total ? Math.abs(total - 847.49) < 0.01 : false,
    noTitulos: nombreEmisor ? !nombreEmisor.includes("DATOS") && !nombreEmisor.includes("EMISOR") : false,
  };

  let passed = 0;
  let failed = 0;

  Object.entries(checks).forEach(([key, value]) => {
    const icon = value ? "✅" : "❌";
    const status = value ? "PASS" : "FAIL";
    console.log(`${icon} ${key}: ${status}`);
    if (value) passed++;
    else failed++;
  });

  console.log(`\n📊 RESULTADO: ${passed}/${passed + failed} tests pasados`);

  if (failed === 0) {
    console.log("\n🎉 ¡TODOS LOS TESTS PASARON! Parser funciona correctamente.");
  } else {
    console.log("\n⚠️ Algunos tests fallaron. Revisar extracción.");
  }
}

testParserFixes().catch(console.error);
