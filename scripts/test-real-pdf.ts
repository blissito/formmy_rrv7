/**
 * Test REAL con PDF verdadero
 * No más false positives con TXT
 */

import { FormmyParser } from '../sdk/formmy-parser/client';
import fs from 'fs/promises';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

const API_KEY = process.env.FORMMY_TEST_API_KEY;

if (!API_KEY) {
  console.error('❌ Falta FORMMY_TEST_API_KEY');
  process.exit(1);
}

async function createTestPDF(): Promise<string> {
  // Crear PDF real usando pdf-lib
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([600, 400]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const timestamp = Date.now();

  page.drawText('Test PDF Document', {
    x: 50,
    y: 350,
    size: 24,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText(`Generated: ${new Date().toISOString()}`, {
    x: 50,
    y: 320,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText(`Timestamp: ${timestamp}`, {
    x: 50,
    y: 300,
    size: 12,
    font,
    color: rgb(0.3, 0.3, 0.3),
  });

  page.drawText('This is a REAL PDF file to test unpdf parsing.', {
    x: 50,
    y: 250,
    size: 14,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText('Section 1: Testing unpdf', {
    x: 50,
    y: 220,
    size: 12,
    font,
    color: rgb(0, 0, 0),
  });

  page.drawText('This library requires Uint8Array, not Buffer.', {
    x: 50,
    y: 200,
    size: 10,
    font,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  const filePath = `/tmp/test-real-${timestamp}.pdf`;
  await fs.writeFile(filePath, pdfBytes);

  console.log(`✅ PDF creado: ${filePath} (${pdfBytes.length} bytes)`);
  return filePath;
}

async function testRealPDF() {
  console.log('\n🧪 Testing con PDF REAL\n');

  const pdfPath = await createTestPDF();

  try {
    const parser = new FormmyParser(API_KEY, {
      baseUrl: 'http://localhost:3000'
    });

    console.log('1️⃣ Subiendo PDF real...');
    const job = await parser.parse(pdfPath, 'DEFAULT');

    console.log(`✅ Job creado: ${job.id}`);
    console.log(`   Archivo: ${job.fileName}`);
    console.log(`   Modo: ${job.mode}`);

    console.log('\n2️⃣ Esperando resultado...');
    const result = await parser.waitFor(job.id, {
      maxAttempts: 30,
      pollInterval: 2000
    });

    if (result.status === 'COMPLETED') {
      console.log('\n✅ PARSING EXITOSO:');
      console.log(`   Status: ${result.status}`);
      console.log(`   Páginas: ${result.pages}`);
      console.log(`   Tiempo: ${result.processingTime}s`);
      console.log('\n📄 Contenido extraído:');
      console.log('---');
      console.log(result.markdown);
      console.log('---');
      console.log('\n🎉 Test REAL con PDF pasó!\n');
      return true;
    } else {
      console.error(`\n❌ Status: ${result.status}`);
      if (result.error) {
        console.error(`Error: ${result.error}`);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ Test FALLÓ:', error);
    return false;
  } finally {
    // Cleanup
    try {
      await fs.unlink(pdfPath);
      console.log('🧹 PDF de prueba eliminado');
    } catch {}
  }
}

testRealPDF().then((success) => {
  process.exit(success ? 0 : 1);
});
