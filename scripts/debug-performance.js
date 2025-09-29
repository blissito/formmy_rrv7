/**
 * Debug performance - Identificar bottlenecks en AgentWorkflow
 */

const TEST_ENDPOINT = 'http://localhost:3002/api/v0/chatbot';

const testData = {
  intent: 'chat',
  chatbotId: 'test-chatbot',
  message: 'Hola rápido', // Mensaje más corto
  sessionId: 'perf-test-' + Date.now(),
  conversationHistory: JSON.stringify([]),
  stream: 'true'
};

const headers = {
  'Content-Type': 'application/x-www-form-urlencoded',
  'x-dev-token': process.env.DEVELOPMENT_TOKEN || 'FORMMY_DEV_TOKEN_2025'
};

async function debugPerformance() {
  console.log('🐛 DEBUGGING PERFORMANCE BOTTLENECKS\n');

  const timestamps = {
    requestStart: Date.now(),
    connectionEstablished: null,
    firstByte: null,
    firstEvent: null,
    firstChunk: null,
    completed: null
  };

  try {
    const formData = new URLSearchParams(testData);

    console.log('📡 Enviando request...');
    timestamps.requestStart = Date.now();

    const response = await fetch(TEST_ENDPOINT, {
      method: 'POST',
      headers,
      body: formData
    });

    timestamps.connectionEstablished = Date.now();
    console.log(`⚡ Conexión establecida: ${timestamps.connectionEstablished - timestamps.requestStart}ms`);

    if (!response.ok) {
      console.error('❌ Error HTTP:', response.status);
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let eventCount = 0;
    let chunkCount = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      if (!timestamps.firstByte) {
        timestamps.firstByte = Date.now();
        console.log(`📦 Primer byte: ${timestamps.firstByte - timestamps.requestStart}ms`);
      }

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          eventCount++;

          if (!timestamps.firstEvent) {
            timestamps.firstEvent = Date.now();
            console.log(`🎯 Primer evento: ${timestamps.firstEvent - timestamps.requestStart}ms`);
          }

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'chunk' && !timestamps.firstChunk) {
              timestamps.firstChunk = Date.now();
              console.log(`💬 Primer chunk de contenido: ${timestamps.firstChunk - timestamps.requestStart}ms`);
              console.log(`📝 Contenido: "${data.content}"`);
            }

            if (data.type === 'done') {
              timestamps.completed = Date.now();
              console.log(`✅ Completado: ${timestamps.completed - timestamps.requestStart}ms`);
              break;
            }

            // Log específico para tool events
            if (data.type === 'tool-start') {
              const toolTime = Date.now() - timestamps.requestStart;
              console.log(`🔧 Tool iniciada a los ${toolTime}ms: ${data.tool}`);
            }

          } catch (e) {
            // Ignorar errores de parsing
          }
        }
      }
    }

    // Análisis de bottlenecks
    console.log('\n📊 ANÁLISIS DE BOTTLENECKS:');

    const connectionTime = timestamps.connectionEstablished - timestamps.requestStart;
    const firstByteTime = timestamps.firstByte - timestamps.requestStart;
    const firstEventTime = timestamps.firstEvent - timestamps.requestStart;
    const firstChunkTime = timestamps.firstChunk - timestamps.requestStart;
    const totalTime = timestamps.completed - timestamps.requestStart;

    console.log(`🔗 Conexión HTTP: ${connectionTime}ms`);
    console.log(`📦 Tiempo hasta primer byte: ${firstByteTime}ms`);
    console.log(`🎯 Tiempo hasta primer evento SSE: ${firstEventTime}ms`);
    console.log(`💬 Tiempo hasta primer chunk de contenido: ${firstChunkTime}ms`);
    console.log(`⏱️  Tiempo total: ${totalTime}ms`);

    // Identificar el mayor bottleneck
    console.log('\n🚨 MAYOR BOTTLENECK:');
    if (firstByteTime > 8000) {
      console.log('❌ SERVIDOR LENTO: El servidor tarda >8s en responder');
      console.log('   Posibles causas:');
      console.log('   - Inicialización de LlamaIndex agentes');
      console.log('   - Carga de herramientas');
      console.log('   - Consulta de base de datos');
      console.log('   - Configuración de OpenAI client');
    } else if (firstChunkTime - firstEventTime > 3000) {
      console.log('❌ AGENTE LENTO: El agente tarda >3s en generar contenido');
      console.log('   Posibles causas:');
      console.log('   - Model loading (GPT-5 nano)');
      console.log('   - System prompt muy largo');
      console.log('   - Handoff entre agentes');
    } else if (connectionTime > 1000) {
      console.log('❌ RED LENTA: Conexión tarda >1s');
    } else {
      console.log('✅ BOTTLENECK DISTRIBUIDO: No hay un bottleneck claro');
    }

  } catch (error) {
    console.error('❌ Error en debug:', error.message);
  }
}

debugPerformance();