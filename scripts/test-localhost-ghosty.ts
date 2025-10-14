/**
 * Test Local: Ghosty en Localhost
 * Se conecta al servidor dev real en localhost:3000
 */

import { config } from 'dotenv';
config();

const LOCALHOST_URL = 'http://localhost:3000/api/ghosty/v0';
const DEV_TOKEN = process.env.DEVELOPMENT_TOKEN || 'FORMMY_DEV_TOKEN_2025';

interface SSEEvent {
  type: string;
  content?: string;
  tool?: string;
  widgetType?: string;
  widgetId?: string;
  metadata?: any;
}

async function testGhostyLocal(message: string) {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  🧪 TEST LOCALHOST: Ghosty Payment Tool                      ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  console.log(`📝 Mensaje: "${message}"`);
  console.log(`🌐 URL: ${LOCALHOST_URL}`);
  console.log(`🔑 Dev Token: ${DEV_TOKEN.substring(0, 10)}...`);

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Iniciando request...\n');

  const startTime = Date.now();
  let toolsExecuted: string[] = [];
  let hasWidget = false;
  let widgetInfo = { type: '', id: '' };
  let fullResponse = '';

  try {
    const response = await fetch(LOCALHOST_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEV_TOKEN}`
      },
      body: JSON.stringify({
        message,
        integrations: {},
        forceNewConversation: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let buffer = '';
    let eventCount = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          eventCount++;
          const data = line.substring(6);

          try {
            const event: SSEEvent = JSON.parse(data);

            // Tool execution
            if (event.type === 'tool-start' && event.tool) {
              toolsExecuted.push(event.tool);
              console.log(`   🔧 Tool ejecutada: ${event.tool}`);
            }

            // Content chunks
            if (event.type === 'chunk' && event.content) {
              fullResponse += event.content;
            }

            // Widget detection
            if (event.type === 'widget') {
              hasWidget = true;
              widgetInfo = {
                type: event.widgetType || '',
                id: event.widgetId || ''
              };
              console.log(`   🎨 Widget detectado: ${widgetInfo.type}:${widgetInfo.id}`);
            }

            // Metadata
            if (event.type === 'done' && event.metadata) {
              const elapsed = Date.now() - startTime;
              console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
              console.log('📊 RESULTADOS:');
              console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

              console.log(`⏱️  Tiempo total: ${elapsed}ms`);
              console.log(`📦 Eventos SSE: ${eventCount}`);
              console.log(`🔧 Tools ejecutadas (${toolsExecuted.length}):`);

              if (toolsExecuted.length === 0) {
                console.log('   ⚠️  NINGUNA tool ejecutada');
              } else {
                toolsExecuted.forEach((tool, i) => {
                  const icon = tool === 'create_formmy_plan_payment' ? '🎯' : '🔧';
                  console.log(`   ${icon} [${i + 1}] ${tool}`);
                });
              }

              console.log(`\n📈 Tokens usados: ${event.metadata.tokensUsed || 0}`);
              console.log(`💰 Créditos usados: ${event.metadata.creditsUsed || 0}`);
            }
          } catch (parseError) {
            // Ignorar eventos que no son JSON
          }
        }
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 VERIFICACIONES:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Verificación 1: Tool correcta ejecutada
    const usedPaymentTool = toolsExecuted.includes('create_formmy_plan_payment');
    if (usedPaymentTool) {
      console.log('✅ create_formmy_plan_payment: EJECUTADA');
    } else {
      console.log('❌ create_formmy_plan_payment: NO EJECUTADA');
      console.log(`   Tools ejecutadas: ${toolsExecuted.join(', ') || 'ninguna'}`);
    }

    // Verificación 2: Tools prohibidas
    const bannedTools = ['save_contact_info', 'get_current_datetime', 'web_search_google'];
    const usedBannedTools = toolsExecuted.filter(tool => bannedTools.includes(tool));
    if (usedBannedTools.length === 0) {
      console.log('✅ Tools prohibidas: NO ejecutadas');
    } else {
      console.log(`❌ Tools prohibidas ejecutadas: ${usedBannedTools.join(', ')}`);
    }

    // Verificación 3: Widget generado
    if (hasWidget) {
      console.log(`✅ Widget generado: ${widgetInfo.type}:${widgetInfo.id}`);
    } else if (usedPaymentTool) {
      console.log('⚠️  Tool ejecutada pero NO se detectó widget');
      console.log('   (Posible falta de configuración de Stripe)');
    } else {
      console.log('❌ Widget: NO generado');
    }

    // Respuesta (primeros 300 chars)
    console.log(`\n💬 Respuesta de Ghosty (primeros 300 chars):`);
    console.log(`   "${fullResponse.substring(0, 300)}..."`);

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 DIAGNÓSTICO:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (usedPaymentTool && !hasWidget) {
      console.log('⚠️  POSIBLE PROBLEMA: Stripe no configurado');
      console.log('   La tool se ejecutó pero falló al generar el widget');
      console.log('   Verificar .env tiene STRIPE_SECRET_KEY');
    } else if (!usedPaymentTool && toolsExecuted.length > 0) {
      console.log('❌ PROBLEMA: Ghosty ejecuta tools incorrectas');
      console.log('   El servidor dev NO tiene los cambios recientes');
      console.log('\n💡 SOLUCIÓN:');
      console.log('   1. Detener el servidor dev (Ctrl+C)');
      console.log('   2. npm run dev');
      console.log('   3. Ejecutar este script de nuevo\n');
    } else if (!usedPaymentTool && toolsExecuted.length === 0) {
      console.log('❌ PROBLEMA: Ghosty NO usa ninguna tool');
      console.log('   El agente está respondiendo sin ejecutar herramientas');
      console.log('\n💡 POSIBLES CAUSAS:');
      console.log('   1. System prompt no se está aplicando');
      console.log('   2. Modelo AI está ignorando las instrucciones');
      console.log('   3. Tools no están disponibles en el contexto\n');
    } else if (usedPaymentTool && hasWidget) {
      console.log('🎉 ¡TODO FUNCIONA CORRECTAMENTE!');
      console.log('   Ghosty ejecutó la tool y generó el widget');
      console.log('   El widget debería aparecer en el frontend\n');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error);
    console.log('\n💡 VERIFICAR:');
    console.log('   1. Servidor dev corriendo en localhost:3000');
    console.log('   2. Variable DEVELOPMENT_TOKEN en .env');
    console.log('   3. Usuario admin existe en base de datos\n');
  }
}

// Test case
const testMessage = process.argv[2] || 'Quiero el plan Pro';
testGhostyLocal(testMessage);
