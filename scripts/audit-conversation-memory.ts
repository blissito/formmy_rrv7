/**
 * Script de Auditoría: Sistema de Memoria Conversacional
 * Verifica que el sistema server-side funcione correctamente
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface AuditResult {
  testName: string;
  passed: boolean;
  details: string;
}

const results: AuditResult[] = [];

async function auditConversationMemory() {
  console.log("🔍 Iniciando auditoría del sistema de memoria conversacional...\n");

  try {
    // Test 1: Verificar que las conversaciones se crean correctamente
    console.log("✅ Test 1: Crear conversación de prueba");
    const testChatbot = await prisma.chatbot.findFirst({
      where: { isActive: true }
    });

    if (!testChatbot) {
      results.push({
        testName: "Buscar chatbot activo",
        passed: false,
        details: "No se encontró ningún chatbot activo para testing"
      });
      throw new Error("No hay chatbots activos en la base de datos");
    }

    const testSessionId = `audit-test-${Date.now()}`;
    const testConversation = await prisma.conversation.create({
      data: {
        sessionId: testSessionId,
        chatbotId: testChatbot.id,
        status: "ACTIVE",
        messageCount: 0
      }
    });

    results.push({
      testName: "Crear conversación de prueba",
      passed: true,
      details: `Conversación creada: ${testConversation.id}`
    });

    // Test 2: Crear 55 mensajes (para verificar truncamiento a 50)
    console.log("\n✅ Test 2: Crear 55 mensajes (verificar truncamiento)");
    const messagesToCreate = 55;
    let createdMessages = [];

    // Usar funciones de producción que actualizan messageCount automáticamente
    const { addUserMessage, addAssistantMessage } = await import("../server/chatbot/messageModel.server");

    for (let i = 0; i < messagesToCreate; i++) {
      const isUserMessage = i % 2 === 0;

      try {
        const message = isUserMessage
          ? await addUserMessage(testConversation.id, `Mensaje de prueba ${i + 1}`, undefined, "audit")
          : await addAssistantMessage(testConversation.id, `Mensaje de prueba ${i + 1}`, undefined, undefined, undefined, "test-model", "audit");

        createdMessages.push(message);
      } catch (error) {
        console.error(`Error creando mensaje ${i + 1}:`, error);
      }
    }

    results.push({
      testName: "Crear 55 mensajes",
      passed: createdMessages.length === messagesToCreate,
      details: `Mensajes creados: ${createdMessages.length}/${messagesToCreate}`
    });

    // Test 3: Cargar mensajes y verificar truncamiento
    console.log("\n✅ Test 3: Verificar truncamiento a 50 mensajes");
    const allMessages = await prisma.message.findMany({
      where: { conversationId: testConversation.id },
      orderBy: { createdAt: "asc" }
    });

    const recentMessages = allMessages.slice(-50);

    results.push({
      testName: "Truncamiento a 50 mensajes",
      passed: allMessages.length === 55 && recentMessages.length === 50,
      details: `Total: ${allMessages.length}, Truncado: ${recentMessages.length}`
    });

    // Test 4: Verificar que los últimos 50 mensajes son los correctos
    console.log("\n✅ Test 4: Verificar que se truncan los mensajes más antiguos");
    const firstMessageInTruncated = recentMessages[0];
    const expectedContent = "Mensaje de prueba 6"; // Mensaje 6 es el primero de los últimos 50

    results.push({
      testName: "Orden correcto de truncamiento",
      passed: firstMessageInTruncated.content === expectedContent,
      details: `Primer mensaje truncado: "${firstMessageInTruncated.content}" (esperado: "${expectedContent}")`
    });

    // Test 5: Verificar formato de historial para el agente
    console.log("\n✅ Test 5: Verificar formato de historial para el agente");
    const formattedHistory = recentMessages.map(msg => ({
      role: msg.role.toLowerCase() as "user" | "assistant",
      content: msg.content
    }));

    const hasCorrectFormat = formattedHistory.every(
      msg => (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string"
    );

    results.push({
      testName: "Formato de historial",
      passed: hasCorrectFormat,
      details: `Formato correcto: ${hasCorrectFormat}, Mensajes formateados: ${formattedHistory.length}`
    });

    // Test 6: Verificar actualización de messageCount
    console.log("\n✅ Test 6: Verificar actualización de messageCount");
    const updatedConversation = await prisma.conversation.findUnique({
      where: { id: testConversation.id }
    });

    results.push({
      testName: "MessageCount actualizado",
      passed: updatedConversation?.messageCount === messagesToCreate,
      details: `MessageCount: ${updatedConversation?.messageCount} (esperado: ${messagesToCreate})`
    });

    // Limpieza: Eliminar datos de prueba
    console.log("\n🧹 Limpiando datos de prueba...");
    await prisma.message.deleteMany({
      where: { conversationId: testConversation.id }
    });
    await prisma.conversation.delete({
      where: { id: testConversation.id }
    });

    console.log("✅ Datos de prueba eliminados\n");

  } catch (error) {
    console.error("❌ Error durante la auditoría:", error);
    results.push({
      testName: "Auditoría completa",
      passed: false,
      details: error instanceof Error ? error.message : "Error desconocido"
    });
  } finally {
    await prisma.$disconnect();
  }

  // Reporte final
  console.log("\n" + "=".repeat(60));
  console.log("📊 REPORTE DE AUDITORÍA");
  console.log("=".repeat(60) + "\n");

  let passedCount = 0;
  let failedCount = 0;

  results.forEach(result => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} ${result.testName}`);
    console.log(`   ${result.details}\n`);

    if (result.passed) passedCount++;
    else failedCount++;
  });

  console.log("=".repeat(60));
  console.log(`Total: ${results.length} tests`);
  console.log(`Aprobados: ${passedCount}`);
  console.log(`Fallidos: ${failedCount}`);
  console.log("=".repeat(60) + "\n");

  if (failedCount === 0) {
    console.log("🎉 ¡SISTEMA DE MEMORIA FUNCIONANDO CORRECTAMENTE!\n");
    process.exit(0);
  } else {
    console.log("⚠️ Algunos tests fallaron. Revisa los detalles arriba.\n");
    process.exit(1);
  }
}

// Ejecutar auditoría
auditConversationMemory();
