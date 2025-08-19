import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setTrialDates() {
  try {
    console.log('🔍 Verificando usuarios TRIAL sin trialStartedAt...');
    
    // Obtener usuarios TRIAL sin trialStartedAt definido
    const trialUsers = await prisma.user.findMany({
      where: {
        plan: 'TRIAL',
        trialStartedAt: null,
      },
      select: { id: true, email: true, createdAt: true },
    });
    
    console.log(`📊 Encontrados ${trialUsers.length} usuarios TRIAL sin fecha de inicio`);
    
    if (trialUsers.length === 0) {
      console.log('✅ Todos los usuarios TRIAL ya tienen trialStartedAt configurado');
      return;
    }
    
    // Establecer trialStartedAt como HOY para dar 60 días completos
    const today = new Date();
    
    for (const user of trialUsers) {
      await prisma.user.update({
        where: { id: user.id },
        data: { trialStartedAt: today },
      });
      
      const trialEndDate = new Date(today);
      trialEndDate.setDate(trialEndDate.getDate() + 60);
      
      console.log(`✅ Usuario ${user.email}:`);
      console.log(`   - Trial iniciado: ${today.toISOString().split('T')[0]}`);
      console.log(`   - Trial termina: ${trialEndDate.toISOString().split('T')[0]}`);
    }
    
    console.log(`🎉 Actualización completada: ${trialUsers.length} usuarios con 60 días completos de trial`);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setTrialDates();