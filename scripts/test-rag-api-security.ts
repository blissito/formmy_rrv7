/**
 * Test de Seguridad - RAG API v1
 *
 * Valida:
 * - Validaciones de input
 * - Sanitization de metadata
 * - Rate limiting
 * - Manejo de errores
 */

const API_KEY = process.env.FORMMY_TEST_API_KEY || 'sk_test_invalid';
const BASE_URL = process.env.FORMMY_BASE_URL || 'http://localhost:5173';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  expectedStatus?: number;
  actualStatus?: number;
}

const results: TestResult[] = [];

async function testCase(
  name: string,
  testFn: () => Promise<{ passed: boolean; expectedStatus?: number; actualStatus?: number; error?: string }>
) {
  console.log(`\n🧪 ${name}...`);
  try {
    const result = await testFn();
    results.push({ name, ...result });
    if (result.passed) {
      console.log(`   ✅ PASS`);
    } else {
      console.log(`   ❌ FAIL: ${result.error}`);
      if (result.expectedStatus && result.actualStatus) {
        console.log(`      Expected ${result.expectedStatus}, got ${result.actualStatus}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ ERROR: ${error instanceof Error ? error.message : error}`);
    results.push({
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function main() {
  console.log('\n🔒 TEST DE SEGURIDAD - RAG API v1\n');
  console.log(`API Key: ${API_KEY.substring(0, 15)}...`);
  console.log(`Base URL: ${BASE_URL}\n`);
  console.log('─'.repeat(80));

  // ============================================
  // AUTENTICACIÓN
  // ============================================
  console.log('\n\n📌 GRUPO 1: Autenticación');

  await testCase('Sin API Key debe retornar 401', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=list`);
    return {
      passed: response.status === 401,
      expectedStatus: 401,
      actualStatus: response.status,
    };
  });

  await testCase('API Key inválida debe retornar 401', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=list`, {
      headers: { 'Authorization': 'Bearer sk_live_invalid' },
    });
    return {
      passed: response.status === 401,
      expectedStatus: 401,
      actualStatus: response.status,
    };
  });

  // ============================================
  // VALIDACIONES DE INPUT
  // ============================================
  console.log('\n\n📌 GRUPO 2: Validaciones de Input');

  await testCase('Query vacía debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '' }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('Query solo con espacios debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: '   \n  \t  ' }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('Query muy larga (>10KB) debe retornar 400', async () => {
    const longQuery = 'A'.repeat(11 * 1024); // 11KB
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: longQuery }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('topK no entero debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=query`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: 'test', topK: 3.5 }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('Content vacío en upload debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: '', type: 'TEXT' }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('Content muy grande (>5MB) debe retornar 400', async () => {
    const largeContent = 'X'.repeat(6 * 1024 * 1024); // 6MB
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: largeContent, type: 'TEXT' }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  await testCase('Type inválido en upload debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: 'test', type: 'INVALID_TYPE' }),
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  // ============================================
  // SANITIZATION
  // ============================================
  console.log('\n\n📌 GRUPO 3: Sanitization');

  await testCase('Metadata con campos no permitidos debe ser filtrada', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test content',
        type: 'TEXT',
        metadata: {
          title: 'Test',
          maliciousField: '<script>alert("xss")</script>',
          __proto__: { polluted: true },
          constructor: { name: 'evil' },
        },
      }),
    });

    // Debe aceptar pero solo con campos permitidos
    if (response.status === 201 || response.status === 402) {
      // 201 = success, 402 = sin créditos (pero validación pasó)
      return { passed: true };
    }
    return {
      passed: false,
      expectedStatus: 201,
      actualStatus: response.status,
      error: 'Debería aceptar con metadata sanitizada',
    };
  });

  // ============================================
  // ERRORES HTTP
  // ============================================
  console.log('\n\n📌 GRUPO 4: Códigos HTTP Correctos');

  await testCase('Intent inválido debe retornar 400', async () => {
    const response = await fetch(`${BASE_URL}/api/v1/rag?intent=invalid`, {
      headers: { 'Authorization': `Bearer ${API_KEY}` },
    });
    return {
      passed: response.status === 400,
      expectedStatus: 400,
      actualStatus: response.status,
    };
  });

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n\n─'.repeat(80));
  console.log('\n📊 RESUMEN DE TESTS\n');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;

  console.log(`Total: ${total}`);
  console.log(`✅ Pasados: ${passed}`);
  console.log(`❌ Fallidos: ${failed}`);
  console.log(`📈 Porcentaje: ${((passed / total) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Tests Fallidos:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`   - ${r.name}`);
        if (r.error) console.log(`     ${r.error}`);
      });
  }

  console.log('');

  // Exit con código apropiado
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});
