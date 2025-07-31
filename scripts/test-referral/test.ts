import { PrismaClient } from '@prisma/client';
import { Effect } from 'effect';
import { processReferral } from '../../app/models/referral.server';

// Configuración
const prisma = new PrismaClient();

// Función para limpiar datos de prueba
async function cleanupTestData() {
  await prisma.user.deleteMany({
    where: {
      email: {
        contains: '@test-referral.com',
      },
    },
  });
  console.log('✅ Datos de prueba limpiados');
}

// Función para crear un usuario de prueba
async function createTestUser(emailSuffix: string) {
  const email = `test-${emailSuffix}@test-referral.com`;
  
  // Verificar si el usuario ya existe
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Generar un customerId único basado en el timestamp
  const timestamp = Date.now();
  user = await prisma.user.create({
    data: {
      email,
      name: `Test User ${emailSuffix}`,
      plan: 'FREE',
      subscriptionIds: [],
      // Usar un customerId único basado en el timestamp
      customerId: `test-customer-${timestamp}-${Math.floor(Math.random() * 1000)}`,
    },
  });
    console.log(`✅ Usuario de prueba creado: ${user.email}`);
  } else {
    console.log(`ℹ️ Usuario ya existente: ${user.email}`);
  }

  return user;
}

// Función para crear un código de referido
async function createReferralCode(userId: string) {
  // Verificar si ya existe un código para este usuario
  let referral = await prisma.referral.findFirst({
    where: { referrerId: userId },
  });

  if (!referral) {
    // Crear un código de referencia único
    let isUnique = false;
    let referralCode: string;
    
    while (!isUnique) {
      // Generar un código de 8 caracteres
      referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      // Verificar si el código ya existe
      const existing = await prisma.referral.findUnique({
        where: { referralCode },
      });
      
      if (!existing) {
        isUnique = true;
        
        // Crear el registro de referencia
        referral = await prisma.referral.create({
          data: {
            referrerId: userId,
            referralCode,
            referredCount: 0,
            successfulConversions: 0,
          },
        });
        
        console.log(`✅ Código de referido creado: ${referral.referralCode} para el usuario ${userId}`);
      }
    }
  } else {
    console.log(`ℹ️ Usuario ya tiene código de referido: ${referral.referralCode}`);
  }

  return referral;
}

// Función principal de prueba
async function runTest() {
  try {
    console.log('🚀 Iniciando prueba de sistema de referidos\n');
    
    // 1. Limpiar datos de prueba anteriores
    await cleanupTestData();
    
    // 2. Crear usuario referente
    console.log('\n🔵 Paso 1: Creando usuario referente...');
    const referrer = await createTestUser('referrer');
    
    // 3. Crear código de referido para el usuario referente
    console.log('\n🔵 Paso 2: Creando código de referido...');
    const referral = await createReferralCode(referrer.id);
    
    // 4. Crear usuario referido
    console.log('\n🔵 Paso 3: Creando usuario referido...');
    const referredUser = await createTestUser('referred');
    
    // 5. Procesar referido (verificar que referral no sea null)
    if (!referral) {
      throw new Error('No se pudo crear el código de referido');
    }
    
    console.log(`\n🔵 Paso 4: Procesando referido con código ${referral.referralCode}...`);
    const result = await Effect.runPromise(
      processReferral(referredUser.id, referral.referralCode)
    );
    
    console.log('✅ Resultado del procesamiento de referido:', result);
    
    // 6. Verificar que el contador se incrementó
    console.log('\n🔵 Paso 5: Verificando contador de referidos...');
    const updatedReferral = await prisma.referral.findUnique({
      where: { id: referral.id },
    });
    
    console.log(`📊 Estado del código de referido:`);
    console.log(`- Código: ${updatedReferral?.referralCode}`);
    console.log(`- Referidos totales: ${updatedReferral?.referredCount}`);
    console.log(`- Conversiones exitosas: ${updatedReferral?.successfulConversions}`);
    
    if (updatedReferral?.referredCount === 1) {
      console.log('✅ ¡Prueba exitosa! El contador de referidos se incrementó correctamente.');
    } else {
      console.error('❌ Error: El contador de referidos no se incrementó como se esperaba.');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  } finally {
    // Cerrar la conexión de Prisma
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
runTest();
