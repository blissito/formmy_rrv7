import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixLifetimeCredits() {
  try {
    const userId = '68f456dba443330f35f8c81c';

    console.log(`Verificando usuario ${userId}...`);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        toolCreditsUsed: true,
        purchasedCredits: true,
        lifetimeCreditsUsed: true,
      }
    });

    console.log('Usuario actual:', user);

    // Si lifetimeCreditsUsed es null o undefined, inicializarlo
    if (user && (user.lifetimeCreditsUsed === null || user.lifetimeCreditsUsed === undefined)) {
      console.log('\n⚠️  lifetimeCreditsUsed es NULL, inicializando a toolCreditsUsed...');

      const updated = await prisma.user.update({
        where: { id: userId },
        data: {
          lifetimeCreditsUsed: user.toolCreditsUsed || 0
        },
        select: {
          email: true,
          toolCreditsUsed: true,
          lifetimeCreditsUsed: true,
        }
      });

      console.log('✅ Usuario actualizado:', updated);
    } else {
      console.log('✅ lifetimeCreditsUsed ya tiene valor:', user?.lifetimeCreditsUsed);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixLifetimeCredits();
