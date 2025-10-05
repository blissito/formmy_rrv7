import { PrismaClient } from "@prisma/client";
import { getToolCreditCost } from "../server/tools/toolCosts";
import { calculateToolCostFull } from "../server/tools/toolPricing.server";

const prisma = new PrismaClient();

async function debugAdminLoader() {
  try {
    console.log("🔍 Debuggeando loader del admin...\n");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log(`📅 Rango de fechas:`);
    console.log(`  Desde: ${thirtyDaysAgo.toISOString()}`);
    console.log(`  Hasta: ${now.toISOString()}\n`);

    // Paso 1: Agrupar tool usages
    console.log("📊 PASO 1: Agrupando tool usages...");
    const toolUsageRaw = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    console.log(`  Resultado: ${toolUsageRaw.length} grupos de herramientas\n`);
    toolUsageRaw.forEach(u => {
      console.log(`  - ${u.toolName}: ${u._count.id} usos`);
    });

    if (toolUsageRaw.length === 0) {
      console.log("\n❌ No hay tool usages en los últimos 30 días!");
      console.log("   Verificando todos los registros...\n");

      const allUsages = await prisma.toolUsage.findMany({
        select: { createdAt: true, toolName: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      });

      console.log("  Últimos 5 registros:");
      allUsages.forEach((u, i) => {
        console.log(`    ${i + 1}. ${u.toolName} - ${u.createdAt.toISOString()}`);
      });

      return;
    }

    // Paso 2: Calcular créditos y costos
    console.log("\n📊 PASO 2: Calculando créditos y costos...\n");

    const toolUsage = await Promise.all(
      toolUsageRaw.map(async (usage) => {
        const credits = getToolCreditCost(usage.toolName) * usage._count.id;
        const costData = calculateToolCostFull(usage.toolName, usage._count.id, credits);

        console.log(`  ${usage.toolName}:`);
        console.log(`    Usos: ${usage._count.id}`);
        console.log(`    Credits: ${credits}`);
        console.log(`    Costo USD: $${costData.costUSD.toFixed(4)}`);
        console.log(`    Costo MXN: $${costData.costMXN.toFixed(2)}`);

        // Obtener chatbots que usan esta tool
        const chatbotsUsingTool = await prisma.toolUsage.findMany({
          where: {
            toolName: usage.toolName,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: {
            chatbot: {
              select: {
                user: { select: { plan: true } },
              },
            },
          },
          take: 100,
        });

        console.log(`    Chatbots encontrados: ${chatbotsUsingTool.length}`);

        const planCounts = chatbotsUsingTool
          .filter(t => t.chatbot?.user?.plan)
          .reduce((acc: any, t) => {
            const plan = t.chatbot?.user?.plan || 'FREE';
            acc[plan] = (acc[plan] || 0) + 1;
            return acc;
          }, {});

        console.log(`    Planes: ${JSON.stringify(planCounts)}`);

        const topPlan = Object.entries(planCounts).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'TRIAL';

        console.log(`    Top plan: ${topPlan}\n`);

        return {
          toolName: usage.toolName,
          count: usage._count.id,
          credits,
          costUSD: costData.costUSD,
          costMXN: costData.costMXN,
          pricePerUseUSD: costData.pricePerUseUSD,
          topPlan,
        };
      })
    );

    const totalCredits = toolUsage.reduce((sum, u) => sum + u.credits, 0);
    const totalCostUSD = toolUsage.reduce((sum, u) => sum + u.costUSD, 0);
    const totalCostMXN = toolUsage.reduce((sum, u) => sum + u.costMXN, 0);

    console.log("━".repeat(60));
    console.log("\n✅ RESULTADO FINAL:\n");
    console.log(`  Total herramientas: ${toolUsage.length}`);
    console.log(`  Total credits: ${totalCredits}`);
    console.log(`  Total costo USD: $${totalCostUSD.toFixed(4)}`);
    console.log(`  Total costo MXN: $${totalCostMXN.toFixed(2)}\n`);

    console.log("📋 Datos que retornaría el loader:\n");
    console.log(JSON.stringify({
      toolUsage: toolUsage.map(t => ({
        toolName: t.toolName,
        count: t.count,
        credits: t.credits,
        costUSD: t.costUSD,
        costMXN: t.costMXN,
        topPlan: t.topPlan
      })),
      totalCredits,
      totalCostUSD,
      totalCostMXN,
    }, null, 2));

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

debugAdminLoader();
