/**
 * Test del Parser API v1 en PRODUCCIÓN
 * Usa la API key real del usuario
 */

import { FormmyParser } from '../sdk/formmy-parser/client';
import fs from 'fs/promises';

const API_KEY = process.env.FORMMY_TEST_API_KEY;

if (!API_KEY) {
  console.error('❌ Falta FORMMY_TEST_API_KEY en environment');
  process.exit(1);
}

async function testProduction() {
  console.log('\n🧪 Testing Formmy Parser SDK - PRODUCCIÓN');
  console.log('='.repeat(50));

  // Crear documento de prueba único
  const timestamp = Date.now();
  const testContent = `Documento de Prueba PRODUCCIÓN - ${new Date().toISOString()}

Este es un documento de prueba con timestamp ${timestamp} para validar el Parser API v1 en producción.

Sección 1: Test en Producción
Verificando que el modo DEFAULT funciona correctamente con unpdf.

Sección 2: Timestamp único
ID: ${timestamp}
Fecha: ${new Date().toLocaleString('es-MX')}

Fin del documento de prueba.
`;

  const testFile = `/tmp/test-prod-${timestamp}.txt`;
  await fs.writeFile(testFile, testContent, 'utf-8');

  try {
    // Inicializar SDK con URL de producción
    const parser = new FormmyParser(API_KEY, {
      baseUrl: 'https://formmy-v2.fly.dev'
    });

    // 1. Upload
    console.log('\n1️⃣ Subiendo documento a producción...');
    const job = await parser.parse(testFile, 'DEFAULT');

    console.log('✅ Job creado:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   Archivo: ${job.fileName}`);
    console.log(`   Modo: ${job.mode}`);
    console.log(`   Créditos: ${job.creditsUsed}`);

    // 2. Wait for completion
    console.log('\n2️⃣ Esperando resultado...');
    const result = await parser.waitFor(job.id, {
      maxAttempts: 30,
      pollInterval: 2000
    });

    if (result.status === 'COMPLETED') {
      console.log('✅ Parsing completado:');
      console.log(`   Status: ${result.status}`);
      console.log(`   Páginas: ${result.pages}`);
      console.log(`   Tiempo: ${result.processingTime}s`);
      console.log(`   Créditos usados: ${result.creditsUsed}`);

      console.log('\n📄 Markdown (preview):');
      console.log('---');
      console.log(result.markdown?.substring(0, 500) + '...');
      console.log('---');

      console.log('\n🎉 Production Test Passed!\n');
      return true;
    } else {
      console.error(`❌ Status inesperado: ${result.status}`);
      if (result.error) {
        console.error(`Error: ${result.error}`);
      }
      return false;
    }
  } catch (error) {
    console.error('\n❌ Production Test Failed:', error);
    return false;
  } finally {
    // Cleanup
    try {
      await fs.unlink(testFile);
      console.log('\n🧹 Cleaned up test files');
    } catch {}
  }
}

testProduction().then((success) => {
  process.exit(success ? 0 : 1);
});
