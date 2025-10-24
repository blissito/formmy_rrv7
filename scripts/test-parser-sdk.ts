import { FormmyParser } from 'formmy-sdk';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParserSDK() {
  console.log('🧪 Testing Formmy Parser SDK\n');

  // Usar API key desde variable de entorno
  const apiKey = process.env.FORMMY_TEST_API_KEY;
  if (!apiKey) {
    throw new Error('FORMMY_TEST_API_KEY environment variable is required');
  }

  const parser = new FormmyParser({
    apiKey,
    baseUrl: 'http://localhost:3000',
    debug: true, // Enable debug logging
    retries: 3
  });

  // Crear un txt con contenido único usando timestamp
  const testDocPath = path.join(__dirname, 'test-doc.txt');
  const timestamp = Date.now();
  fs.writeFileSync(testDocPath, `
Documento de Prueba para Parser API - Generado el ${new Date(timestamp).toISOString()}

Este es un documento de prueba ÚNICO con timestamp ${timestamp} para validar el funcionamiento del Parser API v1 en modo DEFAULT.

Sección 1: Introducción
Este sistema permite parsear documentos usando parsing básico (modo DEFAULT) sin costo de créditos.

Sección 2: Features del Modo DEFAULT
- Parsing básico de texto sin procesamiento avanzado
- Soporte para TXT y PDF
- GRATIS - 0 créditos por documento
- Extracción simple de texto plano

Datos Únicos de esta Prueba:
- Timestamp Unix: ${timestamp}
- Fecha ISO: ${new Date(timestamp).toISOString()}
- ID de Prueba: test-${timestamp}

Conclusión:
El modo DEFAULT está funcionando correctamente después de corregir el error de deserialización.
  `.trim());

  try {
    console.log('1️⃣ Iniciando parsing...');
    const job = await parser.parse(testDocPath, 'DEFAULT');

    console.log('✅ Job creado:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Archivo: ${job.fileName}`);
    console.log(`   Modo: ${job.mode}`);
    console.log(`   Créditos: ${job.creditsUsed}`);
    console.log(`   Fecha: ${job.createdAt}\n`);

    console.log('2️⃣ Esperando resultado (polling automático)...');
    const result = await parser.waitFor(job.id, {
      pollInterval: 2000,
      timeout: 60000, // 60 seconds total
      onProgress: (currentJob) => {
        console.log(`   ⏳ Status: ${currentJob.status}${currentJob.pages ? ` (${currentJob.pages} pages)` : ''}`);
      }
    });

    console.log('✅ Parsing completado:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Páginas: ${result.pages}`);
    console.log(`   Tiempo: ${result.processingTime}s`);
    console.log(`   Créditos usados: ${result.creditsUsed}\n`);

    console.log('📄 Markdown (preview):');
    console.log('---');
    console.log(result.markdown?.substring(0, 500) + '...');
    console.log('---\n');

    console.log('🎉 SDK Test Passed!\n');

    // Cleanup
    if (fs.existsSync(testDocPath)) {
      fs.unlinkSync(testDocPath);
      console.log('🧹 Cleaned up test files');
    }

  } catch (error: any) {
    console.error('❌ SDK Test Failed:');
    console.error(`   ${error.message}`);

    if (error.details) {
      console.error('   Details:', error.details);
    }

    process.exit(1);
  }
}

testParserSDK();
