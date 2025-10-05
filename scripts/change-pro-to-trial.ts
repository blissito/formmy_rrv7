import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function changeProToTrial() {
  try {
    console.log("🔍 Buscando usuarios con plan PRO...");

    const proUsers = await prisma.user.findMany({
      where: {
        plan: "PRO"
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true
      }
    });

    console.log(`\n📊 Encontrados ${proUsers.length} usuarios con plan PRO:\n`);
    proUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name || 'Sin nombre'})`);
    });

    if (proUsers.length === 0) {
      console.log("\n✅ No hay usuarios con plan PRO. Nada que cambiar.");
      return;
    }

    console.log(`\n🔄 Cambiando ${proUsers.length} usuarios de PRO a TRIAL...\n`);

    const result = await prisma.user.updateMany({
      where: {
        plan: "PRO"
      },
      data: {
        plan: "TRIAL"
      }
    });

    console.log(`\n✅ Actualización completada: ${result.count} usuarios cambiados de PRO a TRIAL`);

    // Verificar el cambio
    const verification = await prisma.user.count({
      where: {
        plan: "PRO"
      }
    });

    console.log(`\n🔍 Verificación: ${verification} usuarios con plan PRO restantes (debería ser 0)`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

changeProToTrial();
