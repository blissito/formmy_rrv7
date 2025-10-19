import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setLifetimeCredits() {
  try {
    const userId = '68f456dba443330f35f8c81c';

    console.log(`Actualizando lifetimeCreditsUsed para usuario ${userId}...`);

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        lifetimeCreditsUsed: 3 // Los 3 créditos que ya usaste
      },
      select: {
        email: true,
        toolCreditsUsed: true,
        lifetimeCreditsUsed: true,
      }
    });

    console.log('✅ Usuario actualizado:', updated);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setLifetimeCredits();
