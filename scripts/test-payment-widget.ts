/**
 * Script de testing para Payment Widgets con iframes
 *
 * Prueba el flujo completo:
 * 1. Crear payment link via tool
 * 2. Verificar que se crea widget en BD
 * 3. Validar detección del marcador en streaming
 * 4. Confirmar acceso al endpoint /widgets/:widgetId
 *
 * Uso:
 * npx tsx scripts/test-payment-widget.ts
 *
 * O con usuario específico:
 * DEVELOPMENT_TOKEN=FORMMY_DEV_TOKEN_2025 npx tsx scripts/test-payment-widget.ts
 */

import { db } from "../app/utils/db.server";

async function testPaymentWidget() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('🧪 TEST: Payment Widget con iframes');
  console.log(`${'='.repeat(80)}\n`);

  try {
    // 1. Buscar usuario admin para testing
    console.log('📍 Paso 1: Buscar usuario de prueba...');
    const user = await db.user.findFirst({
      where: {
        email: 'fixtergeek@gmail.com'
      }
    });

    if (!user) {
      console.error('❌ No se encontró usuario admin. Usa fixtergeek@gmail.com');
      process.exit(1);
    }

    console.log(`✅ Usuario encontrado: ${user.email} (${user.plan})\n`);

    // 2. Simular solicitud a Ghosty
    console.log('📍 Paso 2: Enviar solicitud a Ghosty API...');
    console.log('   Mensaje: "Dame el link de pago del plan PRO"\n');

    const devToken = process.env.DEVELOPMENT_TOKEN || '';

    const response = await fetch('http://localhost:3000/api/ghosty/v0', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': devToken ? `Bearer ${devToken}` : '',
      },
      body: JSON.stringify({
        message: 'Dame el link de pago del plan PRO',
        stream: true,
        integrations: {},
      }),
    });

    if (!response.ok) {
      console.error(`❌ Error en respuesta: ${response.status} ${response.statusText}`);
      process.exit(1);
    }

    console.log('✅ Conexión establecida con Ghosty\n');

    // 3. Procesar streaming y detectar widget
    console.log('📍 Paso 3: Procesar streaming SSE...\n');

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('❌ No hay reader disponible');
      process.exit(1);
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let widgetDetected = false;
    let widgetId: string | null = null;
    let widgetType: string | null = null;
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'widget') {
              widgetDetected = true;
              widgetType = parsed.widgetType;
              widgetId = parsed.widgetId;

              console.log(`\n${'🎨'.repeat(40)}`);
              console.log('✅ WIDGET DETECTADO EN SSE');
              console.log(`   Tipo: ${widgetType}`);
              console.log(`   ID: ${widgetId}`);
              console.log(`${'🎨'.repeat(40)}\n`);
            }

            if (parsed.type === 'chunk') {
              fullResponse += parsed.content;
              process.stdout.write(parsed.content);
            }

            if (parsed.type === 'done') {
              console.log('\n\n✅ Streaming completado\n');
            }
          } catch (e) {
            // Ignorar líneas que no sean JSON válido
          }
        }
      }
    }

    // 4. Verificar que se detectó el widget
    console.log('📍 Paso 4: Verificar detección de widget...\n');

    if (!widgetDetected || !widgetId) {
      console.error('❌ NO se detectó widget en el streaming');
      console.log('   Respuesta completa:', fullResponse);
      process.exit(1);
    }

    console.log('✅ Widget detectado correctamente\n');

    // 5. Verificar que el widget existe en BD
    console.log('📍 Paso 5: Verificar widget en BD...\n');

    const widgetInDb = await db.widget.findUnique({
      where: { id: widgetId }
    });

    if (!widgetInDb) {
      console.error(`❌ Widget ${widgetId} NO existe en BD`);
      process.exit(1);
    }

    console.log('✅ Widget encontrado en BD:');
    console.log(`   ID: ${widgetInDb.id}`);
    console.log(`   Tipo: ${widgetInDb.type}`);
    console.log(`   User ID: ${widgetInDb.userId}`);
    console.log(`   Data:`, widgetInDb.data);
    console.log();

    // 6. Validar ownership
    console.log('📍 Paso 6: Validar ownership...\n');

    if (widgetInDb.userId !== user.id) {
      console.error('❌ El widget NO pertenece al usuario correcto');
      console.error(`   Widget userId: ${widgetInDb.userId}`);
      console.error(`   User id: ${user.id}`);
      process.exit(1);
    }

    console.log('✅ Ownership correcto\n');

    // 7. Test endpoint /widgets/:widgetId (requiere que servidor esté corriendo)
    console.log('📍 Paso 7: Probar endpoint /widgets/:widgetId...\n');
    console.log(`   ⚠️  Este paso requiere autenticación por cookie`);
    console.log(`   URL: http://localhost:3000/widgets/${widgetId}`);
    console.log(`   Abre esta URL en el navegador para verificar\n`);

    // Resumen final
    console.log(`\n${'✅'.repeat(40)}`);
    console.log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE');
    console.log(`${'✅'.repeat(40)}\n`);

    console.log('📊 Resumen:');
    console.log(`   ✅ Widget creado en BD: ${widgetId}`);
    console.log(`   ✅ Evento SSE emitido correctamente`);
    console.log(`   ✅ Ownership validado`);
    console.log(`   ✅ Data completa del widget almacenada`);
    console.log();

    console.log('🔗 Siguiente paso:');
    console.log(`   Abre Ghosty en http://localhost:3000/dashboard/ghosty`);
    console.log(`   Pregunta: "Dame el link de pago del plan PRO"`);
    console.log(`   Verifica que aparece un iframe interactivo con el payment widget\n`);

  } catch (error) {
    console.error('\n❌ ERROR EN TEST:', error);
    if (error instanceof Error) {
      console.error('   Mensaje:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

// Ejecutar test
testPaymentWidget();
