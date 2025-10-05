import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function changeTrialToEnterprise() {
  try {
    console.log("🔍 Buscando usuarios con plan TRIAL...");

    const trialUsers = await prisma.user.findMany({
      where: {
        plan: "TRIAL"
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true
      }
    });

    console.log(`\n📊 Encontrados ${trialUsers.length} usuarios con plan TRIAL:\n`);
    trialUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name || 'Sin nombre'})`);
    });

    if (trialUsers.length === 0) {
      console.log("\n✅ No hay usuarios con plan TRIAL. Nada que cambiar.");
      return;
    }

    console.log(`\n🔄 Cambiando ${trialUsers.length} usuarios de TRIAL a ENTERPRISE...\n`);

    const result = await prisma.user.updateMany({
      where: {
        plan: "TRIAL"
      },
      data: {
        plan: "ENTERPRISE"
      }
    });

    console.log(`\n✅ Actualización completada: ${result.count} usuarios cambiados de TRIAL a ENTERPRISE`);

    // Verificar el cambio
    const verification = await prisma.user.count({
      where: {
        plan: "TRIAL"
      }
    });

    console.log(`\n🔍 Verificación: ${verification} usuarios con plan TRIAL restantes (debería ser 0)`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

changeTrialToEnterprise();
