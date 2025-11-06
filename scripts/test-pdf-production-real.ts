import { FormmyParser } from '../sdk/formmy-parser/client';

const API_KEY = process.env.FORMMY_TEST_API_KEY!;
const PDF_PATH = '/tmp/test-real.pdf';

async function test() {
  console.log('\n🧪 Testing PRODUCCIÓN con PDF REAL\n');

  const parser = new FormmyParser(API_KEY, {
    baseUrl: 'https://formmy.app'
  });

  console.log('1️⃣ Subiendo PDF a producción...');
  const job = await parser.parse(PDF_PATH, 'DEFAULT');
  console.log(`✅ Job: ${job.id}`);

  console.log('\n2️⃣ Esperando...');
  const result = await parser.waitFor(job.id);

  console.log(`\n📊 Status: ${result.status}`);
  if (result.status === 'COMPLETED') {
    console.log(`✅ Páginas: ${result.pages}`);
    console.log(`✅ Tiempo: ${result.processingTime}s`);
    console.log(`📄 Contenido: ${result.markdown}\n`);
    console.log('🎉 PRODUCCIÓN Test PASÓ!\n');
    return true;
  } else {
    console.error(`❌ Error: ${result.error}`);
    return false;
  }
}

test().then((ok) => process.exit(ok ? 0 : 1)).catch((err) => {
  console.error('❌ Exception:', err);
  process.exit(1);
});
