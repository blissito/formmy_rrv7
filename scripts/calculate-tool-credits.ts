import { PrismaClient } from "@prisma/client";
import { getToolCreditCost } from "../server/tools/toolCosts";
import { calculateToolCostFull } from "../server/tools/toolPricing.server";

const prisma = new PrismaClient();

async function calculateToolCredits() {
  try {
    console.log("🔍 Calculando créditos consumidos...\n");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Agrupar por herramienta (últimos 30 días)
    const toolUsageRaw = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    console.log("📊 Créditos y costos por herramienta:\n");

    let totalCredits = 0;
    let totalCostUSD = 0;
    let totalCostMXN = 0;

    toolUsageRaw.forEach((usage) => {
      const credits = getToolCreditCost(usage.toolName) * usage._count.id;
      const costData = calculateToolCostFull(usage.toolName, usage._count.id, credits);

      totalCredits += credits;
      totalCostUSD += costData.costUSD;
      totalCostMXN += costData.costMXN;

      console.log(`  ${usage.toolName}:`);
      console.log(`    - Usos: ${usage._count.id}`);
      console.log(`    - Credits: ${credits}`);
      console.log(`    - Costo: $${costData.costUSD.toFixed(4)} USD ($${costData.costMXN.toFixed(2)} MXN)`);
      console.log(`    - Costo por uso: $${costData.pricePerUseUSD.toFixed(4)} USD\n`);
    });

    console.log("━".repeat(60));
    console.log(`\n💰 TOTALES (últimos 30 días):\n`);
    console.log(`  Total Credits consumidos: ${totalCredits.toLocaleString()}`);
    console.log(`  Total Costo USD: $${totalCostUSD.toFixed(4)}`);
    console.log(`  Total Costo MXN: $${totalCostMXN.toFixed(2)}\n`);

    // Calcular por usuario
    console.log("👥 Consumo por usuario:\n");

    const chatbots = await prisma.chatbot.findMany({
      select: {
        id: true,
        name: true,
        user: {
          select: {
            email: true,
            plan: true
          }
        }
      }
    });

    for (const chatbot of chatbots) {
      const usageCount = await prisma.toolUsage.count({
        where: {
          chatbotId: chatbot.id,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      if (usageCount > 0) {
        const usages = await prisma.toolUsage.groupBy({
          by: ['toolName'],
          _count: { id: true },
          where: {
            chatbotId: chatbot.id,
            createdAt: { gte: thirtyDaysAgo }
          }
        });

        let userCredits = 0;
        usages.forEach(u => {
          userCredits += getToolCreditCost(u.toolName) * u._count.id;
        });

        console.log(`  ${chatbot.user.email} (${chatbot.user.plan}):`);
        console.log(`    - Chatbot: ${chatbot.name}`);
        console.log(`    - Tool usages: ${usageCount}`);
        console.log(`    - Credits consumidos: ${userCredits}\n`);
      }
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

calculateToolCredits();
