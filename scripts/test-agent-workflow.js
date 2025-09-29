/**
 * Script de prueba para AgentWorkflow
 * Verifica streaming, personalidad y performance
 */

const TEST_ENDPOINT = 'http://localhost:3002/api/v0/chatbot';

// Test data - usando token de desarrollo
const testData = {
  intent: 'chat',
  chatbotId: 'test-chatbot',
  message: 'Hola! Necesito programar un recordatorio para mañana a las 3pm', // Mensaje que requiere herramientas
  sessionId: 'test-session-' + Date.now(),
  conversationHistory: JSON.stringify([]),
  stream: 'true'
};

// Headers incluyendo token de desarrollo
const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-dev-token': process.env.DEVELOPMENT_TOKEN || 'FORMMY_DEV_TOKEN_2025'
};

async function testAgentWorkflow() {
  console.log('🧪 Iniciando prueba AgentWorkflow...\n');

  const startTime = Date.now();

  try {
    // Preparar form data
    const formData = new URLSearchParams(testData);

    console.log('📡 Enviando request a:', TEST_ENDPOINT);
    console.log('📝 Datos:', testData);
    console.log('');

    const response = await fetch(TEST_ENDPOINT, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }

    console.log('✅ Conexión SSE establecida');
    console.log('⏱️  Tiempo hasta primera respuesta:', Date.now() - startTime, 'ms\n');

    // Leer stream SSE
    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullContent = '';
    let eventCount = 0;
    let toolEvents = [];

    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        console.log('\n🏁 Stream terminado');
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            eventCount++;

            console.log(`📦 Evento #${eventCount}:`, data.type);

            switch (data.type) {
              case 'chunk':
                fullContent += data.content;
                process.stdout.write(data.content);
                break;

              case 'tool-start':
                toolEvents.push(data.tool);
                console.log(`\n🔧 Herramienta: ${data.tool} - ${data.message}`);
                break;

              case 'status':
                console.log(`\n📊 Status: ${data.status} - ${data.message || ''}`);
                break;

              case 'metadata':
                console.log('\n📋 Metadata:', data.metadata);
                break;

              case 'error':
                console.log('\n❌ Error:', data.content);
                break;

              case 'done':
                console.log('\n✅ Completado');
                break;
            }

          } catch (parseError) {
            console.log('⚠️  Error parsing JSON:', line);
          }
        }
      }
    }

    const totalTime = Date.now() - startTime;

    console.log('\n\n📊 RESULTADOS:');
    console.log('⏱️  Tiempo total:', totalTime, 'ms');
    console.log('📦 Eventos recibidos:', eventCount);
    console.log('🔧 Herramientas usadas:', toolEvents.length > 0 ? toolEvents.join(', ') : 'Ninguna');
    console.log('💬 Contenido total:', fullContent.length, 'caracteres');

    // Análisis de performance
    if (totalTime < 3000) {
      console.log('🚀 Performance: EXCELENTE (< 3s)');
    } else if (totalTime < 8000) {
      console.log('✅ Performance: BUENO (< 8s)');
    } else {
      console.log('⚠️  Performance: LENTO (> 8s)');
    }

    // Verificar que hay contenido (personalidad preservada)
    if (fullContent.length > 0) {
      console.log('👤 Personalidad: PRESERVADA (hay respuesta)');
    } else {
      console.log('❌ Personalidad: FALTANTE (no hay respuesta)');
    }

    // Verificar streaming
    if (eventCount > 1) {
      console.log('📡 Streaming: FUNCIONANDO (múltiples eventos)');
    } else {
      console.log('❌ Streaming: FALTA (solo un evento)');
    }

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    console.log('⏱️  Tiempo hasta error:', Date.now() - startTime, 'ms');
  }
}

// Ejecutar prueba
testAgentWorkflow();