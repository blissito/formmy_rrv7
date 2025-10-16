/**
 * Test del fix de seguridad en PRODUCCIÓN
 * Bug #3: Bypass de validación de dominios sin origin header
 */

async function runProductionTests() {
  const PROD_API = 'https://formmy-v2.fly.dev/api/v0/chatbot';

  console.log('\n' + '='.repeat(70));
  console.log('🧪 TEST DE SEGURIDAD - BUG #3: Bypass sin origin header');
  console.log('='.repeat(70) + '\n');

  // Test 1: Chatbot CON dominios configurados - SIN origin header
  console.log('📋 Test 1: Request SIN origin header + chatbot CON dominios');
  console.log('   Chatbot: Brenda Go (68ba2400acaca27f1371ed2a)');
  console.log('   Dominios permitidos: www.perro.design');
  console.log('   Expected: ❌ BLOQUEADO (403)\n');

  const test1 = await fetch(PROD_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // NO enviar origin/referer (simular navegador con privacidad)
    },
    body: new URLSearchParams({
      intent: 'chat',
      chatbotId: '68ba2400acaca27f1371ed2a',
      message: 'Test security fix - sin origin header',
      sessionId: 'test-no-origin-' + Date.now(),
      visitorId: 'visitor-' + Date.now(),
      stream: 'false'
    })
  });

  const test1Response = await test1.json();
  console.log('   Status:', test1.status);
  console.log('   Response:', JSON.stringify(test1Response, null, 2));

  const test1Pass = test1.status === 403;
  console.log('   Result:', test1Pass ? '✅ PASS - Bloqueado correctamente' : '❌ FAIL - Bypass detectado');

  // Test 2: Chatbot SIN dominios configurados - SIN origin header
  console.log('\n📋 Test 2: Request SIN origin header + chatbot SIN dominios');
  console.log('   Chatbot: Mi Chatbot (687eced5cd352f36e1ff8214)');
  console.log('   Dominios permitidos: (ninguno - chatbot público)');
  console.log('   Expected: ✅ PERMITIDO (200)\n');

  const test2 = await fetch(PROD_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      intent: 'chat',
      chatbotId: '687eced5cd352f36e1ff8214',
      message: 'Test security fix - chatbot público',
      sessionId: 'test-public-' + Date.now(),
      visitorId: 'visitor-' + Date.now(),
      stream: 'false'
    })
  });

  const test2Response = await test2.json();
  console.log('   Status:', test2.status);
  console.log('   Response:', JSON.stringify(test2Response, null, 2));

  const test2Pass = test2.status === 200;
  console.log('   Result:', test2Pass ? '✅ PASS - Permitido correctamente' : '❌ FAIL - Bloqueó chatbot público');

  // Test 3: Chatbot CON dominios - CON origin válido
  console.log('\n📋 Test 3: Request CON origin válido + chatbot CON dominios');
  console.log('   Chatbot: Brenda Go (68ba2400acaca27f1371ed2a)');
  console.log('   Origin: https://www.perro.design (válido)');
  console.log('   Expected: ✅ PERMITIDO (200)\n');

  const test3 = await fetch(PROD_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://www.perro.design',
      'Referer': 'https://www.perro.design/'
    },
    body: new URLSearchParams({
      intent: 'chat',
      chatbotId: '68ba2400acaca27f1371ed2a',
      message: 'Test security fix - origin válido',
      sessionId: 'test-valid-origin-' + Date.now(),
      visitorId: 'visitor-' + Date.now(),
      stream: 'false'
    })
  });

  const test3Response = await test3.json();
  console.log('   Status:', test3.status);
  console.log('   Response:', JSON.stringify(test3Response, null, 2));

  const test3Pass = test3.status === 200;
  console.log('   Result:', test3Pass ? '✅ PASS - Permitido correctamente' : '❌ FAIL - Bloqueó origin válido');

  // Test 4: Chatbot CON dominios - CON origin INVÁLIDO
  console.log('\n📋 Test 4: Request CON origin inválido + chatbot CON dominios');
  console.log('   Chatbot: Brenda Go (68ba2400acaca27f1371ed2a)');
  console.log('   Origin: https://sitio-malicioso.com (NO permitido)');
  console.log('   Expected: ❌ BLOQUEADO (403)\n');

  const test4 = await fetch(PROD_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Origin': 'https://sitio-malicioso.com',
      'Referer': 'https://sitio-malicioso.com/'
    },
    body: new URLSearchParams({
      intent: 'chat',
      chatbotId: '68ba2400acaca27f1371ed2a',
      message: 'Test security fix - origin malicioso',
      sessionId: 'test-invalid-origin-' + Date.now(),
      visitorId: 'visitor-' + Date.now(),
      stream: 'false'
    })
  });

  const test4Response = await test4.json();
  console.log('   Status:', test4.status);
  console.log('   Response:', JSON.stringify(test4Response, null, 2));

  const test4Pass = test4.status === 403;
  console.log('   Result:', test4Pass ? '✅ PASS - Bloqueado correctamente' : '❌ FAIL - Permitió origin malicioso');

  // Resumen
  console.log('\n' + '='.repeat(70));
  console.log('📊 RESUMEN DE TESTS');
  console.log('='.repeat(70));
  console.log(`Test 1 (sin origin, con dominios):     ${test1Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 2 (sin origin, sin dominios):     ${test2Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 3 (origin válido):                ${test3Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Test 4 (origin inválido):              ${test4Pass ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));

  const allPassed = test1Pass && test2Pass && test3Pass && test4Pass;

  if (allPassed) {
    console.log('\n🎉 TODOS LOS TESTS PASARON - Fix de seguridad verificado ✅');
  } else {
    console.log('\n⚠️  ALGUNOS TESTS FALLARON - Revisar implementación');
  }

  return allPassed;
}

runProductionTests().catch(console.error);
