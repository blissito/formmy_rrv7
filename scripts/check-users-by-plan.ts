import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkUsersByPlan() {
  try {
    console.log("🔍 Consultando usuarios por plan...\n");

    const planDistribution = await prisma.user.groupBy({
      by: ['plan'],
      _count: { plan: true },
    });

    const PLAN_RATES: Record<string, number> = {
      STARTER: 149,
      PRO: 499,
      ENTERPRISE: 1499,
      TRIAL: 0, // TRIAL no genera revenue real
      FREE: 0,
    };

    let totalRevenue = 0;

    console.log("📊 Distribución de planes:\n");
    planDistribution.forEach(p => {
      const rate = PLAN_RATES[p.plan] || 0;
      const revenue = rate * p._count.plan;
      totalRevenue += revenue;

      console.log(`  ${p.plan}: ${p._count.plan} usuarios × $${rate} MXN = $${revenue} MXN`);
    });

    console.log(`\n💰 Revenue total estimado: $${totalRevenue} MXN`);
    console.log(`\n⚠️  Nota: TRIAL y FREE no deberían contar como revenue real\n`);

    // Obtener usuarios específicos en TRIAL/STARTER/PRO/ENTERPRISE
    const paidUsers = await prisma.user.findMany({
      where: {
        plan: { in: ['STARTER', 'PRO', 'ENTERPRISE', 'TRIAL'] }
      },
      select: {
        email: true,
        name: true,
        plan: true,
        createdAt: true,
      },
      orderBy: { plan: 'asc' }
    });

    if (paidUsers.length > 0) {
      console.log("👥 Usuarios con plan activo:\n");
      paidUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.name || 'Sin nombre'}) - ${u.plan} - Creado: ${u.createdAt.toISOString().split('T')[0]}`);
      });
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkUsersByPlan();
