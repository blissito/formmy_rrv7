/**
 * Script para auditar qué extrae unpdf del PDF SAT
 */
import { extractText } from "unpdf";
import { readFileSync } from "fs";

async function testUnpdfExtraction() {
  const pdfBuffer = readFileSync("/Users/bliss/Downloads/CFDI62579869_LOPM9704158A0_C_27675175.pdf");
  const uint8Array = new Uint8Array(pdfBuffer);
  const result = await extractText(uint8Array);
  const text = Array.isArray(result.text) ? result.text.join("\n") : result.text;

  console.log("=== TEXTO EXTRAÍDO POR UNPDF ===");
  console.log(text);
  console.log("\n=== LONGITUD ===");
  console.log("Caracteres:", text.length);

  // Probar extractores actuales
  console.log("\n=== PRUEBA DE EXTRACTORES ===");

  // extractNombre actual
  const nombreConLabelRegex = /Nombre[:\s]+([A-ZÑ0-9\s,\.&]+?)(?:\n|RFC|Régimen|$)/i;
  const labelMatch = text.match(nombreConLabelRegex);
  console.log("\n[extractNombre] Patrón 1 match:", labelMatch ? labelMatch[1].trim() : "null");

  const nombreRegex = /Emisor[:\s]*([A-ZÑ\s]+)/i;
  const match = text.match(nombreRegex);
  console.log("[extractNombre] Patrón 2 match:", match ? match[1].trim() : "null");

  // extractRFC
  const rfcEmisorRegex = new RegExp(`Emisor.*?RFC[:\\s]*([A-Z&Ñ]{3,4}[0-9]{6}[A-Z0-9]{3})`, "i");
  const rfcMatch = text.match(rfcEmisorRegex);
  console.log("\n[extractRFC] Emisor match:", rfcMatch ? rfcMatch[1] : "null");

  // extractTotal
  const totalRegex = /Total[:\s]*\$?\s*([\d,]+\.?\d*)/i;
  const totalMatch = text.match(totalRegex);
  console.log("\n[extractTotal] match:", totalMatch ? totalMatch[1] : "null");

  // extractUUID
  const folioFiscalRegex = /Folio\s+Fiscal[:\s]*([0-9A-F]{8}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{12})/i;
  const uuidMatch = text.match(folioFiscalRegex);
  console.log("\n[extractUUID] match:", uuidMatch ? uuidMatch[1] : "null");
}

testUnpdfExtraction().catch(console.error);
