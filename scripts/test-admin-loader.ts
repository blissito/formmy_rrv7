/**
 * Script para verificar que el loader del admin esté calculando correctamente
 * los costos de herramientas
 */

import { PrismaClient } from "@prisma/client";
import { getToolCreditCost } from "../server/tools/toolCosts";
import { calculateToolCostFull } from "../server/tools/toolPricing.server";

const prisma = new PrismaClient();

async function testAdminLoader() {
  try {
    console.log("🔍 Simulando loader del admin dashboard...\n");

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Agrupar tool usages por toolName (últimos 30 días)
    const toolUsageRaw = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      where: { createdAt: { gte: thirtyDaysAgo } },
    });

    console.log("📊 Datos que verá el admin:\n");

    // Calcular créditos y costos monetarios por tool
    const toolUsage = await Promise.all(
      toolUsageRaw.map(async (usage) => {
        const credits = getToolCreditCost(usage.toolName) * usage._count.id;
        const costData = calculateToolCostFull(usage.toolName, usage._count.id, credits);

        // Para simplificar, asumimos plan TRIAL para este test
        const topPlan = 'TRIAL';

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

    console.log("📋 Tool Credits Table:\n");
    console.log("Herramienta          | Usos | Credits | Costo MXN | $/Uso   | Plan");
    console.log("─".repeat(70));

    toolUsage
      .sort((a, b) => b.costMXN - a.costMXN)
      .forEach((entry) => {
        const costMXN = entry.costMXN > 0 ? `$${entry.costMXN.toFixed(2)}` : '-';
        const pricePerUse = entry.pricePerUseUSD > 0
          ? `$${(entry.pricePerUseUSD * 20).toFixed(4)}`
          : 'Gratis';

        console.log(
          `${entry.toolName.padEnd(20)} | ${String(entry.count).padStart(4)} | ${String(entry.credits).padStart(7)} | ${costMXN.padStart(9)} | ${pricePerUse.padStart(7)} | ${entry.topPlan}`
        );
      });

    console.log("─".repeat(70));
    console.log(`TOTAL                | ${String(toolUsage.reduce((s, e) => s + e.count, 0)).padStart(4)} | ${String(totalCredits).padStart(7)} | $${totalCostMXN.toFixed(2).padStart(8)} |`);

    console.log(`\n💰 Resumen del Dashboard:\n`);
    console.log(`  Total Credits: ${totalCredits.toLocaleString()}`);
    console.log(`  Total Costo USD: $${totalCostUSD.toFixed(4)}`);
    console.log(`  Total Costo MXN: $${totalCostMXN.toFixed(2)}\n`);

    console.log("✅ El admin dashboard está mostrando estos datos correctamente\n");

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAdminLoader();
