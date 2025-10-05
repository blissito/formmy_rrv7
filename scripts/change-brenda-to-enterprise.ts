import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function changeBrendaToEnterprise() {
  try {
    console.log("🔍 Buscando usuario brenda@fixter.org...");

    const user = await prisma.user.findUnique({
      where: {
        email: "brenda@fixter.org"
      },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true
      }
    });

    if (!user) {
      console.log("\n❌ Usuario brenda@fixter.org no encontrado.");
      return;
    }

    console.log(`\n📊 Usuario encontrado:`);
    console.log(`  - ${user.email} (${user.name || 'Sin nombre'})`);
    console.log(`  - Plan actual: ${user.plan}`);

    console.log(`\n🔄 Cambiando a ENTERPRISE...\n`);

    const result = await prisma.user.update({
      where: {
        email: "brenda@fixter.org"
      },
      data: {
        plan: "ENTERPRISE"
      }
    });

    console.log(`✅ Usuario actualizado:`);
    console.log(`  - ${result.email}`);
    console.log(`  - Plan nuevo: ${result.plan}`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

changeBrendaToEnterprise();
