import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function changeEnterpriseToTrial() {
  try {
    console.log("🔍 Buscando usuarios con plan ENTERPRISE...");

    const enterpriseUsers = await prisma.user.findMany({
      where: {
        plan: "ENTERPRISE"
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true
      }
    });

    console.log(`\n📊 Encontrados ${enterpriseUsers.length} usuarios con plan ENTERPRISE:\n`);
    enterpriseUsers.forEach(user => {
      console.log(`  - ${user.email} (${user.name || 'Sin nombre'})`);
    });

    if (enterpriseUsers.length === 0) {
      console.log("\n✅ No hay usuarios con plan ENTERPRISE. Nada que cambiar.");
      return;
    }

    console.log(`\n🔄 Cambiando ${enterpriseUsers.length} usuarios de ENTERPRISE a TRIAL...\n`);

    const result = await prisma.user.updateMany({
      where: {
        plan: "ENTERPRISE"
      },
      data: {
        plan: "TRIAL"
      }
    });

    console.log(`\n✅ Actualización completada: ${result.count} usuarios cambiados de ENTERPRISE a TRIAL`);

    // Verificar el cambio
    const verification = await prisma.user.count({
      where: {
        plan: "ENTERPRISE"
      }
    });

    console.log(`\n🔍 Verificación: ${verification} usuarios con plan ENTERPRISE restantes (debería ser 0)`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

changeEnterpriseToTrial();
