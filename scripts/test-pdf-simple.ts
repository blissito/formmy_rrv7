/**
 * Test simple con PDF real usando SDK
 */

import { FormmyParser } from '../sdk/formmy-parser/client';

const API_KEY = process.env.FORMMY_TEST_API_KEY;
const PDF_PATH = '/tmp/test-real.pdf';

if (!API_KEY) {
  console.error('❌ Falta FORMMY_TEST_API_KEY');
  process.exit(1);
}

async function test() {
  console.log('\n🧪 Testing con PDF REAL\n');

  const parser = new FormmyParser(API_KEY, {
    baseUrl: 'http://localhost:3000'
  });

  console.log('1️⃣ Subiendo PDF...');
  const job = await parser.parse(PDF_PATH, 'DEFAULT');
  console.log(`✅ Job: ${job.id} - Status: ${job.status}`);

  console.log('\n2️⃣ Esperando...');
  const result = await parser.waitFor(job.id);

  console.log(`\n📊 Status final: ${result.status}`);
  if (result.status === 'COMPLETED') {
    console.log(`✅ Páginas: ${result.pages}`);
    console.log(`✅ Tiempo: ${result.processingTime}s`);
    console.log(`\n📄 Contenido:\n${result.markdown}\n`);
    console.log('🎉 Test PASÓ!\n');
    return true;
  } else {
    console.error(`❌ Error: ${result.error || 'Unknown'}`);
    return false;
  }
}

test().then((ok) => process.exit(ok ? 0 : 1)).catch((err) => {
  console.error('❌ Exception:', err);
  process.exit(1);
});
