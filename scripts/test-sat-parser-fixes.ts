/**
 * Script para testear los fixes del SAT Parser con el PDF real
 */
import { readFileSync } from "fs";
import { parsePDFSimple } from "../server/sat/sat-parser.service.server.js";

async function testParserFixes() {
  console.log("🧪 Testing SAT Parser Fixes con PDF real...\n");

  const pdfBuffer = readFileSync("/Users/bliss/Downloads/CFDI62579869_LOPM9704158A0_C_27675175.pdf");

  console.log("📄 PDF:", "CFDI62579869_LOPM9704158A0_C_27675175.pdf");
  console.log("📦 Tamaño:", (pdfBuffer.length / 1024).toFixed(2), "KB\n");

  console.log("⏳ Parseando con parsePDFSimple()...\n");
  const result = await parsePDFSimple(pdfBuffer);

  if ("needsAdvancedParsing" in result) {
    console.log("❌ FALLO: Parser dice que necesita LlamaParse avanzado");
    console.log("   Esto significa que no pudo extraer datos críticos con regex");
    return;
  }

  console.log("✅ ÉXITO: parsePDFSimple() extrajo datos\n");
  console.log("=== DATOS EXTRAÍDOS ===");
  console.log("UUID:", result.uuid);
  console.log("RFC Emisor:", result.rfcEmisor);
  console.log("RFC Receptor:", result.rfcReceptor);
  console.log("Nombre Emisor:", result.nombreEmisor);
  console.log("Total:", `$${result.total.toFixed(2)}`);
  console.log("Fecha:", result.fecha.toISOString());
  console.log("Concepto:", result.concepto);

  console.log("\n=== METADATA ===");
  console.log("Parse Method:", result.parseMethod);
  console.log("Confidence:", `${(result.confidence * 100).toFixed(1)}%`);
  console.log("Status:", result.status);
  console.log("Credits Used:", result.creditsUsed);
  console.log("Warnings:", result.warnings.length > 0 ? result.warnings : "Ninguna");

  console.log("\n=== VALORES ESPERADOS ===");
  console.log("UUID esperado: C1510F1D-A044-420E-83B9-943886D6E677");
  console.log("RFC Emisor esperado: CCF121101KQ4");
  console.log("RFC Receptor esperado: LOPM9704158A0");
  console.log("Nombre esperado: COMERCIAL CITY FRESKO");
  console.log("Total esperado: $847.49");

  console.log("\n=== VALIDACIÓN ===");
  const checks = {
    uuid: result.uuid === "C1510F1D-A044-420E-83B9-943886D6E677",
    rfcEmisor: result.rfcEmisor === "CCF121101KQ4",
    rfcReceptor: result.rfcReceptor === "LOPM9704158A0",
    nombreEmisor: result.nombreEmisor === "COMERCIAL CITY FRESKO",
    total: Math.abs(result.total - 847.49) < 0.01,
    noTitulos: !result.nombreEmisor.includes("DATOS") && !result.nombreEmisor.includes("EMISOR"),
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
