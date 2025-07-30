import { PrismaClient } from '@prisma/client';
import { Effect } from 'effect';
import { processReferral } from '../../app/models/referral.server';

// Configuración
const prisma = new PrismaClient();
const CONCURRENT_USERS = 10;

// Función para limpiar datos de prueba
async function cleanupLoadTestData() {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@load-test.com',
      },
    },
  });
  console.log('✅ Datos de prueba de carga limpiados');
}

// Función para crear usuario de prueba con customerId único
async function createTestUser(index: number) {
  const timestamp = Date.now();
  const user = await prisma.user.create({
    data: {
      email: `load-test-user-${index}-${timestamp}@load-test.com`,
      name: `Load Test User ${index}`,
      plan: 'FREE',
      subscriptionIds: [],
      customerId: `load-test-${timestamp}-${index}`,
    },
  });
  return user;
}

// Función principal de prueba de carga
async function runLoadTest() {
  try {
    console.log('🚀 Iniciando prueba de carga de referidos\n');
    
    // 1. Limpiar datos de prueba anteriores
    await cleanupLoadTestData();
    
    // 2. Crear usuario referente
    console.log('\n🔵 Paso 1: Creando usuario referente...');
    const referrer = await prisma.user.create({
      data: {
        email: `load-test-referrer-${Date.now()}@load-test.com`,
        name: 'Load Test Referrer',
        plan: 'FREE',
        subscriptionIds: [],
        customerId: `load-test-referrer-${Date.now()}`,
      },
    });
    
    // 3. Crear código de referido único
    console.log('\n🔵 Paso 2: Creando código de referido...');
    const referral = await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referralCode: `LOADTEST${Date.now().toString(36).toUpperCase()}`,
        referredCount: 0,
        successfulConversions: 0,
      },
    });
    
    console.log(`✅ Código de referido creado: ${referral.referralCode}`);
    
    // 4. Crear usuarios concurrentes
    console.log('\n🔵 Paso 3: Creando usuarios concurrentes...');
    const promises = Array(CONCURRENT_USERS).fill(0).map(async (_, i) => {
      const user = await createTestUser(i);
      
      return Effect.runPromise(
        processReferral(user.id, referral.referralCode)
      ).catch(error => {
        console.error(`❌ Error en usuario ${i}:`, error.message);
        return { success: false, error: error.message };
      });
    });
    
    // 5. Ejecutar pruebas en paralelo
    console.log('\n🔵 Paso 4: Ejecutando pruebas en paralelo...');
    const startTime = Date.now();
    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    const successCount = results.filter(r => r?.success).length;
    const failedCount = results.filter(r => !r?.success).length;
    
    console.log(`\n📊 Resultados de la prueba de carga:`);
    console.log(`- Usuarios creados: ${CONCURRENT_USERS}`);
    console.log(`- Referidos exitosos: ${successCount}`);
    console.log(`- Referidos fallidos: ${failedCount}`);
    console.log(`- Tasa de éxito: ${(successCount / CONCURRENT_USERS * 100).toFixed(2)}%`);
    console.log(`- Tiempo total: ${endTime - startTime}ms`);
    
    // 6. Verificar contador
    console.log('\n🔵 Paso 5: Verificando contador de referidos...');
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id },
    });
    
    console.log(`\n📊 Estado final del código de referido:`);
    console.log(`- Código: ${updatedReferral?.referralCode}`);
    console.log(`- Referidos totales: ${updatedReferral?.referredCount}`);
    console.log(`- Conversiones exitosas: ${updatedReferral?.successfulConversions}`);
    
    if (updatedReferral?.referredCount === CONCURRENT_USERS) {
      console.log('✅ ¡Prueba de carga exitosa! Todos los referidos se procesaron correctamente.');
    } else {
      console.log(`⚠️  Se procesaron ${updatedReferral?.referredCount} de ${CONCURRENT_USERS} referidos esperados.`);
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba de carga:', error);
  } finally {
    // Cerrar la conexión de Prisma
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba de carga
runLoadTest();
