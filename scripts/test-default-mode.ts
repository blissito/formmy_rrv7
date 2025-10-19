import { FormmyParser } from '../sdk/formmy-parser';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testDefaultMode() {
  console.log('🧪 Testing DEFAULT mode (FREE parsing)\n');

  const apiKey = process.env.FORMMY_TEST_API_KEY;
  if (!apiKey) {
    throw new Error('FORMMY_TEST_API_KEY required');
  }

  const parser = new FormmyParser({
    apiKey,
    baseUrl: 'http://localhost:3000',
  });

  // Crear archivo de prueba
  const testFile = path.join(__dirname, 'test-free.txt');
  fs.writeFileSync(testFile, 'Este es un documento de prueba GRATIS sin usar LlamaParse.\n\nModo DEFAULT = 0 créditos.');

  try {
    console.log('1️⃣ Parsing con modo DEFAULT (gratis)...');
    const job = await parser.parse(testFile, 'DEFAULT');

    console.log('✅ Job creado:');
    console.log(`   ID: ${job.id}`);
    console.log(`   Modo: ${job.mode}`);
    console.log(`   Créditos: ${job.creditsUsed} (should be 0)\n`);

    console.log('2️⃣ Esperando resultado...');
    const result = await parser.waitFor(job.id, {
      pollInterval: 2000,
      timeout: 30000,
    });

    console.log('✅ Parsing completado:');
    console.log(`   Status: ${result.status}`);
    console.log(`   Páginas: ${result.pages}`);
    console.log(`   Tiempo: ${result.processingTime}s`);
    console.log(`   Créditos: ${result.creditsUsed} (should be 0)\n`);

    console.log('📄 Markdown:');
    console.log(result.markdown);

    fs.unlinkSync(testFile);
    console.log('\n🎉 DEFAULT Mode Test Passed!');
  } catch (error: any) {
    console.error('❌ Test failed:', error.message);
    if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
    process.exit(1);
  }
}

testDefaultMode();
