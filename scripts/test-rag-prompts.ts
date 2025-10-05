/**
 * Test RAG Prompts - Verificar que Ghosty usa search_context correctamente
 *
 * Este script prueba que:
 * 1. Ghosty ejecuta search_context cuando se le pregunta sobre el negocio
 * 2. Hace múltiples búsquedas para preguntas complejas
 * 3. NO redirige al usuario a "buscar en el sitio web"
 */

import { EventSourceParserStream } from 'eventsource-parser/stream';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || 'FORMMY_DEV_TOKEN_2025';

// Casos de prueba
const testCases = [
  {
    name: 'Pregunta simple sobre características',
    message: '¿Qué características nuevas se han añadido a Formmy recientemente?',
    shouldSearchFor: ['características', 'nuevas', 'actualizaciones'],
    shouldNotSay: ['no tengo información', 'busca en el sitio', 'revisa el sitio']
  },
  {
    name: 'Pregunta compleja multi-tema',
    message: '¿Cuánto cuestan los planes y qué formas de pago aceptan?',
    shouldSearchFor: ['precios', 'planes', 'formas de pago'],
    minSearches: 2
  },
  {
    name: 'Comparación de productos',
    message: 'Compara el plan Starter vs Pro',
    shouldSearchFor: ['starter', 'pro'],
    minSearches: 2
  }
];

async function testGhostyRAG(testCase: typeof testCases[0]) {
  console.log('\n' + '='.repeat(80));
  console.log(`🧪 TEST: ${testCase.name}`);
  console.log(`📝 Pregunta: "${testCase.message}"`);
  console.log('='.repeat(80));

  const response = await fetch(`${API_URL}/api/ghosty/v0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEV_TOKEN}`
    },
    body: JSON.stringify({
      message: testCase.message,
      integrations: {}
    })
  });

  if (!response.ok) {
    console.error(`❌ Error HTTP ${response.status}: ${response.statusText}`);
    return false;
  }

  let fullResponse = '';
  let toolCalls: string[] = [];
  let searchQueries: string[] = [];

  const stream = response.body!
    .pipeThrough(new TextDecoderStream())
    .pipeThrough(new EventSourceParserStream());

  for await (const event of stream) {
    if (event.type === 'event' && event.data) {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'tool-start') {
          console.log(`\n🔧 Herramienta ejecutada: ${data.tool}`);
          toolCalls.push(data.tool);

          if (data.tool === 'search_context') {
            // No tenemos acceso directo a los parámetros aquí,
            // pero podemos inferir que se está buscando
            searchQueries.push(data.tool);
          }
        } else if (data.type === 'chunk') {
          fullResponse += data.content;
          process.stdout.write(data.content);
        } else if (data.type === 'done') {
          console.log(`\n\n📊 Metadata: ${JSON.stringify(data.metadata, null, 2)}`);
        }
      } catch (e) {
        // Ignorar errores de parsing
      }
    }
  }

  console.log('\n' + '-'.repeat(80));

  // Validaciones
  let passed = true;

  // 1. Verificar que usó search_context
  const usedSearchContext = toolCalls.includes('search_context');
  if (!usedSearchContext) {
    console.log('❌ FALLO: No ejecutó search_context');
    passed = false;
  } else {
    console.log('✅ ÉXITO: Ejecutó search_context');
  }

  // 2. Verificar número mínimo de búsquedas (si aplica)
  if (testCase.minSearches) {
    const searchCount = toolCalls.filter(t => t === 'search_context').length;
    if (searchCount < testCase.minSearches) {
      console.log(`❌ FALLO: Solo hizo ${searchCount} búsqueda(s), se esperaban al menos ${testCase.minSearches}`);
      passed = false;
    } else {
      console.log(`✅ ÉXITO: Hizo ${searchCount} búsquedas (esperado: mínimo ${testCase.minSearches})`);
    }
  }

  // 3. Verificar que NO dijo frases prohibidas
  if (testCase.shouldNotSay) {
    const lowerResponse = fullResponse.toLowerCase();
    for (const phrase of testCase.shouldNotSay) {
      if (lowerResponse.includes(phrase.toLowerCase())) {
        console.log(`❌ FALLO: Dijo frase prohibida: "${phrase}"`);
        passed = false;
      }
    }
    if (passed || testCase.shouldNotSay.every(p => !lowerResponse.includes(p.toLowerCase()))) {
      console.log('✅ ÉXITO: No usó frases prohibidas');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(passed ? '✅ TEST PASÓ' : '❌ TEST FALLÓ');
  console.log('='.repeat(80));

  return passed;
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log(`\n🚀 Ejecutando tests de RAG prompts contra: ${API_URL}`);
  console.log(`🔑 Usando token de desarrollo\n`);

  const results = [];

  for (const testCase of testCases) {
    const passed = await testGhostyRAG(testCase);
    results.push({ name: testCase.name, passed });

    // Esperar un poco entre tests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n\n' + '='.repeat(80));
  console.log('📋 RESUMEN DE TESTS');
  console.log('='.repeat(80));

  results.forEach(r => {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}`);
  });

  const totalPassed = results.filter(r => r.passed).length;
  const totalTests = results.length;

  console.log('\n' + '='.repeat(80));
  console.log(`${totalPassed}/${totalTests} tests pasaron`);
  console.log('='.repeat(80));

  process.exit(totalPassed === totalTests ? 0 : 1);
}

runAllTests().catch(console.error);
