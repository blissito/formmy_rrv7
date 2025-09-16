#!/usr/bin/env npx tsx

/**
 * Script de testing para LlamaIndex V2 API
 * Prueba el nuevo endpoint modularizado /api/llamaindex/v2
 */

const API_BASE_URL = 'http://localhost:3001';
const API_KEY = 'formmy-test-2024';
const TEST_CHATBOT_ID = '507f1f77bcf86cd799439011'; // ObjectID válido

interface TestResult {
  name: string;
  success: boolean;
  response?: any;
  error?: string;
  duration: number;
}

async function makeRequest(endpoint: string, data: Record<string, any>, expectStream = false): Promise<TestResult> {
  const startTime = Date.now();

  try {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-API-Key': API_KEY
      },
      body: formData
    });

    const duration = Date.now() - startTime;

    if (expectStream) {
      // Para streaming, verificar headers
      const contentType = response.headers.get('content-type');
      const isStreaming = contentType?.includes('text/event-stream');

      return {
        name: data.testName || 'Test',
        success: response.ok && isStreaming,
        response: {
          status: response.status,
          contentType,
          isStreaming,
          headers: Object.fromEntries(response.headers.entries())
        },
        duration
      };
    } else {
      // Para respuestas regulares
      const responseData = await response.json();

      return {
        name: data.testName || 'Test',
        success: response.ok,
        response: responseData,
        duration
      };
    }

  } catch (error) {
    return {
      name: data.testName || 'Test',
      success: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    };
  }
}

async function runTests() {
  console.log('🚀 Testing LlamaIndex V2 API...\n');

  const tests: TestResult[] = [];

  // Test 1: Chat básico sin streaming
  console.log('1️⃣ Testing basic chat (non-streaming)...');
  const test1 = await makeRequest('/api/llamaindex/v2', {
    testName: 'Basic Chat',
    intent: 'chat',
    chatbotId: TEST_CHATBOT_ID,
    message: 'Hola, ¿cómo estás?',
    sessionId: 'test-session-1',
    stream: 'false'
  });
  tests.push(test1);

  // Test 2: Chat con streaming
  console.log('2️⃣ Testing streaming chat...');
  const test2 = await makeRequest('/api/llamaindex/v2', {
    testName: 'Streaming Chat',
    intent: 'chat',
    chatbotId: TEST_CHATBOT_ID,
    message: 'Cuéntame un cuento corto sobre inteligencia artificial',
    sessionId: 'test-session-2',
    stream: 'true'
  }, true);
  tests.push(test2);

  // Test 3: Chat con historial
  console.log('3️⃣ Testing chat with conversation history...');
  const test3 = await makeRequest('/api/llamaindex/v2', {
    testName: 'Chat with History',
    intent: 'chat',
    chatbotId: TEST_CHATBOT_ID,
    message: '¿Podrías continuar esa historia?',
    sessionId: 'test-session-3',
    conversationHistory: JSON.stringify([
      { role: 'user', content: 'Cuéntame sobre robots' },
      { role: 'assistant', content: 'Los robots son máquinas programables...' }
    ]),
    stream: 'false'
  });
  tests.push(test3);

  // Test 4: Error - Intent no soportado
  console.log('4️⃣ Testing unsupported intent...');
  const test4 = await makeRequest('/api/llamaindex/v2', {
    testName: 'Unsupported Intent',
    intent: 'invalid_intent',
    chatbotId: TEST_CHATBOT_ID,
    message: 'Test message'
  });
  tests.push(test4);

  // Test 5: Error - Parámetros faltantes
  console.log('5️⃣ Testing missing parameters...');
  const test5 = await makeRequest('/api/llamaindex/v2', {
    testName: 'Missing Parameters',
    intent: 'chat',
    message: 'Test without chatbotId'
  });
  tests.push(test5);

  // Test 6: Error - Sin autenticación
  console.log('6️⃣ Testing without authentication...');
  const test6 = await (async () => {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/api/llamaindex/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'intent=chat&chatbotId=test&message=hello'
      });

      const responseData = await response.json();

      return {
        name: 'No Authentication',
        success: response.status === 401,
        response: responseData,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        name: 'No Authentication',
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime
      };
    }
  })();
  tests.push(test6);

  // Mostrar resultados
  console.log('\n📊 Test Results:');
  console.log('='.repeat(60));

  let successCount = 0;
  tests.forEach((test, index) => {
    const status = test.success ? '✅' : '❌';
    const duration = `${test.duration}ms`;

    console.log(`${status} ${index + 1}. ${test.name} (${duration})`);

    if (test.success) {
      successCount++;
      if (test.response) {
        if (test.response.response) {
          // Respuesta normal
          const preview = test.response.response.substring(0, 80);
          console.log(`   Response: "${preview}${test.response.response.length > 80 ? '...' : ''}"`);
        } else if (test.response.isStreaming) {
          // Respuesta streaming
          console.log(`   Streaming: ${test.response.isStreaming} (${test.response.contentType})`);
        } else if (test.response.error) {
          // Error esperado
          console.log(`   Expected error: ${test.response.error}`);
        }
      }
    } else {
      console.log(`   Error: ${test.error || test.response?.error || 'Unknown error'}`);
    }
    console.log();
  });

  console.log('='.repeat(60));
  console.log(`Summary: ${successCount}/${tests.length} tests passed`);

  if (successCount === tests.length) {
    console.log('🎉 All tests passed! LlamaIndex V2 API is working correctly.');
  } else {
    console.log('⚠️ Some tests failed. Check the logs above.');
    process.exit(1);
  }
}

// Ejecutar tests
runTests().catch(console.error);