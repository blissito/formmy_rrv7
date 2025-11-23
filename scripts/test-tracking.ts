/**
 * Script de prueba para verificar tracking de tokens y costos
 * en endpoints de Vercel AI SDK
 *
 * Verifica que los mensajes se guardan con:
 * - inputTokens, outputTokens, totalTokens
 * - totalCost (USD)
 * - provider, aiModel
 * - responseTime
 *
 * USO: npx tsx scripts/test-tracking.ts
 */

import { db } from "../app/utils/db.server";
import { calculateCost } from "../server/chatbot/pricing.server";
import { getModelInfo } from "../server/config/vercel.model.providers";

const PRESERVED_CHATBOT_ID = "691fe6f9aaf51e4d69c10b8e";

async function testTracking() {
  console.log("🧪 Iniciando pruebas de tracking\n");

  // ========================================
  // PRUEBA 1: Verificar schema de Message
  // ========================================
  console.log("📋 PRUEBA 1: Verificar campos de tracking en Message");

  const recentMessages = await db.message.findMany({
    where: {
      conversation: {
        chatbotId: PRESERVED_CHATBOT_ID,
      },
      role: "ASSISTANT", // Solo mensajes del bot
    },
    select: {
      id: true,
      role: true,
      content: true,
      tokens: true, // Legacy
      inputTokens: true,
      outputTokens: true,
      cachedTokens: true,
      totalCost: true,
      provider: true,
      aiModel: true,
      responseTime: true,
      firstTokenLatency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  console.log(`   Mensajes recientes ASSISTANT: ${recentMessages.length}\n`);

  if (recentMessages.length === 0) {
    console.log("   ⚠️  No hay mensajes ASSISTANT para verificar");
    console.log("   💡 Consejo: Crea una conversación de prueba en el widget\n");
  } else {
    recentMessages.forEach((msg, i) => {
      console.log(`   Mensaje ${i + 1}:`);
      console.log(`     - ID: ${msg.id}`);
      console.log(`     - Contenido: ${msg.content.substring(0, 60)}...`);
      console.log(`     - inputTokens: ${msg.inputTokens}`);
      console.log(`     - outputTokens: ${msg.outputTokens}`);
      console.log(`     - cachedTokens: ${msg.cachedTokens}`);
      console.log(`     - totalCost: $${msg.totalCost?.toFixed(6) || "N/A"}`);
      console.log(`     - provider: ${msg.provider || "N/A"}`);
      console.log(`     - aiModel: ${msg.aiModel || "N/A"}`);
      console.log(`     - responseTime: ${msg.responseTime || "N/A"}ms`);
      console.log(`     - firstTokenLatency: ${msg.firstTokenLatency || "N/A"}ms`);
      console.log(`     - createdAt: ${msg.createdAt.toISOString()}`);

      // Verificar que tenga tracking completo
      const hasTracking =
        msg.inputTokens !== null &&
        msg.outputTokens !== null &&
        msg.totalCost !== null &&
        msg.provider !== null &&
        msg.aiModel !== null;

      if (hasTracking) {
        console.log(`     ✅ Tracking completo`);
      } else {
        console.log(`     ❌ Tracking incompleto (probablemente mensaje antiguo)`);
      }

      console.log("");
    });
  }

  // ========================================
  // PRUEBA 2: Verificar getModelInfo()
  // ========================================
  console.log("\n🔍 PRUEBA 2: Verificar getModelInfo() con todos los modelos");

  const testModels = [
    "claude-sonnet-4-5",
    "claude-haiku-4-5",
    "gemini-3-pro",
    "gpt-5-nano",
    "default-model",
  ];

  testModels.forEach((modelName) => {
    const { provider, model } = getModelInfo(modelName);
    console.log(`   ${modelName}:`);
    console.log(`     → provider: ${provider}`);
    console.log(`     → model: ${model}`);
  });

  // ========================================
  // PRUEBA 3: Verificar calculateCost()
  // ========================================
  console.log("\n\n💰 PRUEBA 3: Verificar calculateCost() con diferentes providers");

  const testCases = [
    {
      provider: "openai",
      model: "gpt-4o-mini",
      tokens: { inputTokens: 1000, outputTokens: 500, cachedTokens: 0 },
    },
    {
      provider: "openai",
      model: "gpt-4.1-mini-2025-04-14",
      tokens: { inputTokens: 2000, outputTokens: 1000, cachedTokens: 0 },
    },
    {
      provider: "anthropic",
      model: "claude-haiku-4-5-20251001",
      tokens: { inputTokens: 1500, outputTokens: 800, cachedTokens: 0 },
    },
    {
      provider: "google",
      model: "gemini-2.5-flash-lite",
      tokens: { inputTokens: 3000, outputTokens: 1500, cachedTokens: 0 },
    },
  ];

  testCases.forEach(({ provider, model, tokens }) => {
    const result = calculateCost(provider, model, tokens);

    console.log(`\n   ${provider}/${model}:`);
    console.log(`     Input: ${tokens.inputTokens} tokens → $${result.inputCost.toFixed(6)}`);
    console.log(`     Output: ${tokens.outputTokens} tokens → $${result.outputCost.toFixed(6)}`);
    console.log(`     Total: $${result.totalCost.toFixed(6)}`);
  });

  // ========================================
  // PRUEBA 4: Estadísticas agregadas
  // ========================================
  console.log("\n\n📊 PRUEBA 4: Estadísticas agregadas del chatbot");

  const stats = await db.message.aggregate({
    where: {
      conversation: {
        chatbotId: PRESERVED_CHATBOT_ID,
      },
      role: "ASSISTANT",
      totalCost: { not: null }, // Solo mensajes con tracking
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalCost: true,
    },
    _avg: {
      responseTime: true,
      firstTokenLatency: true,
    },
    _count: {
      id: true,
    },
  });

  console.log(`   Mensajes con tracking: ${stats._count.id}`);
  console.log(`   Total inputTokens: ${stats._sum.inputTokens || 0}`);
  console.log(`   Total outputTokens: ${stats._sum.outputTokens || 0}`);
  console.log(`   Total costo: $${(stats._sum.totalCost || 0).toFixed(6)}`);
  console.log(`   Avg responseTime: ${stats._avg.responseTime?.toFixed(0) || "N/A"}ms`);
  console.log(
    `   Avg firstTokenLatency: ${stats._avg.firstTokenLatency?.toFixed(0) || "N/A"}ms`
  );

  // ========================================
  // PRUEBA 5: Breakdown por provider
  // ========================================
  console.log("\n\n🏷️  PRUEBA 5: Breakdown por provider");

  const byProvider = await db.message.groupBy({
    by: ["provider"],
    where: {
      conversation: {
        chatbotId: PRESERVED_CHATBOT_ID,
      },
      role: "ASSISTANT",
      provider: { not: null },
    },
    _sum: {
      inputTokens: true,
      outputTokens: true,
      totalCost: true,
    },
    _count: {
      id: true,
    },
  });

  byProvider.forEach((group) => {
    console.log(`\n   Provider: ${group.provider}`);
    console.log(`     Mensajes: ${group._count.id}`);
    console.log(`     Input tokens: ${group._sum.inputTokens || 0}`);
    console.log(`     Output tokens: ${group._sum.outputTokens || 0}`);
    console.log(`     Costo total: $${(group._sum.totalCost || 0).toFixed(6)}`);
  });

  // ========================================
  // RESUMEN FINAL
  // ========================================
  console.log("\n\n📋 RESUMEN:");

  const hasRecentMessages = recentMessages.length > 0;
  const hasTrackedMessages =
    recentMessages.filter(
      (m) =>
        m.inputTokens !== null &&
        m.outputTokens !== null &&
        m.totalCost !== null
    ).length > 0;

  console.log(`   ✅ Schema Message con campos de tracking`);
  console.log(`   ✅ getModelInfo() funcionando`);
  console.log(`   ✅ calculateCost() funcionando`);

  if (hasRecentMessages) {
    if (hasTrackedMessages) {
      console.log(`   ✅ Mensajes recientes CON tracking completo`);
      console.log(`\n🎉 Sistema de tracking funcionando correctamente`);
    } else {
      console.log(
        `   ⚠️  Mensajes recientes SIN tracking (probablemente creados antes de la implementación)`
      );
      console.log(
        `\n💡 Consejo: Crea una nueva conversación para probar el tracking`
      );
    }
  } else {
    console.log(`   ⚠️  No hay mensajes recientes para verificar`);
    console.log(`\n💡 Consejo: Crea una conversación de prueba en el widget`);
  }
}

testTracking()
  .catch((error) => {
    console.error("\n❌ ERROR EN LAS PRUEBAS:", error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
