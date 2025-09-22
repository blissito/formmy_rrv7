import { PrismaClient, Plans } from "@prisma/client";

const db = new PrismaClient();

async function extendAllTrialsTo365Days() {
  try {
    console.log("🚀 Iniciando extensión de trials a 365 días para revisión de Meta App...\n");

    // 1. Obtener todos los usuarios con plan TRIAL
    const trialUsers = await db.user.findMany({
      where: { plan: Plans.TRIAL },
      select: {
        id: true,
        email: true,
        trialStartedAt: true,
        createdAt: true
      }
    });

    console.log(`📊 Encontrados ${trialUsers.length} usuarios en TRIAL\n`);

    if (trialUsers.length === 0) {
      console.log("ℹ️ No hay usuarios en TRIAL para actualizar");
    } else {
      // 2. Actualizar cada usuario para reiniciar su trial con 365 días
      for (const user of trialUsers) {
        const today = new Date();
        const trialEndDate = new Date(today);
        trialEndDate.setDate(trialEndDate.getDate() + 365);

        await db.user.update({
          where: { id: user.id },
          data: {
            trialStartedAt: today // Reiniciar desde hoy con 365 días
          }
        });

        console.log(`✅ ${user.email}:`);
        console.log(`   - Trial reiniciado: ${today.toISOString().split('T')[0]}`);
        console.log(`   - Trial expira: ${trialEndDate.toISOString().split('T')[0]} (365 días)\n`);
      }
    }

    // 3. Obtener usuarios FREE que podrían beneficiarse del trial extendido
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

    console.log(`\n📊 Encontrados ${freeUsers.length} usuarios FREE recientes (últimos 90 días)`);

    if (freeUsers.length > 0) {
      console.log("¿Deseas convertir estos usuarios FREE a TRIAL de 365 días?");
      console.log("Para hacerlo, ejecuta: node scripts/convert-free-to-trial-365.js\n");
    }

    // 4. Resumen final
    console.log("\n🎉 Resumen de cambios:");
    console.log(`   - ${trialUsers.length} usuarios TRIAL extendidos a 365 días`);
    console.log(`   - Plan TRIAL configurado para 365 días en planLimits.server.ts`);
    console.log(`   - Nuevos registros entrarán automáticamente con 365 días de trial`);
    console.log("\n⚠️ IMPORTANTE: Recuerda revertir a 60 días después de la revisión de Meta (Nov 2025)");

    await db.$disconnect();
  } catch (error) {
    console.error("❌ Error:", error);
    await db.$disconnect();
  }
}

extendAllTrialsTo365Days();