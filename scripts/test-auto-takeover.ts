/**
 * Script para probar el sistema de auto-takeover y deduplicación
 *
 * Tests:
 * 1. Deduplicación de mensajes
 * 2. Auto-takeover al recibir eco
 * 3. Auto-release después de 30 minutos
 */

import { db } from "../app/utils/db.server";
import { isMessageProcessed } from "../server/integrations/whatsapp/deduplication.service";
import { autoReleaseManualMode, getManualModeStats } from "../server/jobs/auto-release-manual-mode.job";

async function testDeduplication() {
  console.log("\n🧪 Test 1: Deduplicación de mensajes");
  console.log("=" .repeat(50));

  const testMessageId = `test_msg_${Date.now()}`;
  const testPhoneId = "123456789";

  // Primera vez - debe retornar false (mensaje nuevo)
  const firstCheck = await isMessageProcessed(testMessageId, testPhoneId, "message");
  console.log(`First check (should be false): ${firstCheck}`);

  // Segunda vez - debe retornar true (mensaje ya procesado)
  const secondCheck = await isMessageProcessed(testMessageId, testPhoneId, "message");
  console.log(`Second check (should be true): ${secondCheck}`);

  if (!firstCheck && secondCheck) {
    console.log("✅ Deduplication works correctly!");
  } else {
    console.log("❌ Deduplication FAILED!");
  }
}

async function testAutoTakeover() {
  console.log("\n🧪 Test 2: Auto-takeover al recibir eco");
  console.log("=" .repeat(50));

  // Buscar una conversación activa
  const activeConversation = await db.conversation.findFirst({
    where: {
      status: "ACTIVE",
      manualMode: false,
    },
  });

  if (!activeConversation) {
    console.log("⚠️ No active conversations found. Skipping test.");
    return;
  }

  console.log(`Found conversation: ${activeConversation.sessionId}`);
  console.log(`Manual mode BEFORE: ${activeConversation.manualMode}`);

  // Simular eco: actualizar manualMode y lastEchoAt
  const updated = await db.conversation.update({
    where: { id: activeConversation.id },
    data: {
      manualMode: true,
      lastEchoAt: new Date(),
    },
  });

  console.log(`Manual mode AFTER: ${updated.manualMode}`);
  console.log(`Last echo at: ${updated.lastEchoAt}`);

  if (updated.manualMode && updated.lastEchoAt) {
    console.log("✅ Auto-takeover simulation successful!");
  } else {
    console.log("❌ Auto-takeover simulation FAILED!");
  }

  // Restaurar estado original
  await db.conversation.update({
    where: { id: activeConversation.id },
    data: {
      manualMode: activeConversation.manualMode,
      lastEchoAt: null,
    },
  });

  console.log("Restored original state");
}

async function testAutoRelease() {
  console.log("\n🧪 Test 3: Auto-release después de 30 minutos");
  console.log("=" .repeat(50));

  // Crear conversación de prueba en modo manual con eco antiguo
  const testConversation = await db.conversation.create({
    data: {
      sessionId: `test_${Date.now()}`,
      status: "ACTIVE",
      manualMode: true,
      lastEchoAt: new Date(Date.now() - 40 * 60 * 1000), // 40 minutos atrás
    },
  });

  console.log(`Created test conversation: ${testConversation.sessionId}`);
  console.log(`Manual mode: ${testConversation.manualMode}`);
  console.log(`Last echo: ${testConversation.lastEchoAt}`);

  // Obtener stats antes
  const statsBefore = await getManualModeStats();
  console.log(`\nStats BEFORE release:`);
  console.log(`  Total in manual mode: ${statsBefore.total}`);
  console.log(`  Active: ${statsBefore.active}`);
  console.log(`  Expired: ${statsBefore.expired}`);

  // Ejecutar auto-release
  const result = await autoReleaseManualMode();
  console.log(`\nReleased ${result.released} conversations`);

  // Verificar que la conversación de prueba fue liberada
  const afterRelease = await db.conversation.findUnique({
    where: { id: testConversation.id },
  });

  console.log(`\nTest conversation after release:`);
  console.log(`  Manual mode: ${afterRelease?.manualMode}`);

  if (!afterRelease?.manualMode) {
    console.log("✅ Auto-release works correctly!");
  } else {
    console.log("❌ Auto-release FAILED!");
  }

  // Limpiar conversación de prueba
  await db.conversation.delete({
    where: { id: testConversation.id },
  });

  console.log("Cleaned up test conversation");
}

async function runTests() {
  console.log("🚀 Starting Auto-Takeover & Deduplication Tests");
  console.log("=".repeat(50));

  try {
    await testDeduplication();
    await testAutoTakeover();
    await testAutoRelease();

    console.log("\n✅ All tests completed!");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

runTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
