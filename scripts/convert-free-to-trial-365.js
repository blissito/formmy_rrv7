import { PrismaClient, Plans } from "@prisma/client";

const db = new PrismaClient();

async function convertFreeToTrial365() {
  try {
    console.log("🚀 Convirtiendo usuarios FREE recientes a TRIAL de 365 días...\n");

    // Obtener usuarios FREE creados en los últimos 90 días
    const freeUsers = await db.user.findMany({
      where: {
        plan: Plans.FREE,
        createdAt: {
          // Usuarios creados en los últimos 90 días
          gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        id: true,
        email: true,
        createdAt: true
      }
    });

    console.log(`📊 Encontrados ${freeUsers.length} usuarios FREE recientes\n`);

    if (freeUsers.length === 0) {
      console.log("ℹ️ No hay usuarios FREE recientes para convertir");
      await db.$disconnect();
      return;
    }

    // Convertir cada usuario a TRIAL con 365 días
    let converted = 0;
    for (const user of freeUsers) {
      const today = new Date();
      const trialEndDate = new Date(today);
      trialEndDate.setDate(trialEndDate.getDate() + 365);

      await db.user.update({
        where: { id: user.id },
        data: {
          plan: Plans.TRIAL,
          trialStartedAt: today
        }
      });

      converted++;
      console.log(`✅ ${user.email}:`);
      console.log(`   - Convertido de FREE a TRIAL`);
      console.log(`   - Trial válido hasta: ${trialEndDate.toISOString().split('T')[0]}\n`);
    }

    console.log(`\n🎉 Resumen:`);
    console.log(`   - ${converted} usuarios convertidos de FREE a TRIAL`);
    console.log(`   - Todos con 365 días de trial desde hoy`);
    console.log(`   - Acceso completo a todas las funcionalidades PRO`);

    await db.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await db.$disconnect();
  }
}

convertFreeToTrial365();