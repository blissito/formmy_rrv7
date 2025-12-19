import { db } from "../app/utils/db.server.ts";

async function checkRecentMessages() {
  const conversationId = "6944c287b6b8a15e9404457f"; // Conversación más reciente

  console.log(`\n🔍 Verificando mensajes de la conversación...\n`);

  const conversation = await db.conversation.findUnique({
    where: { id: conversationId },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!conversation) {
    console.log("❌ Conversación no encontrada");
    return;
  }

  console.log(`${"=".repeat(80)}`);
  console.log(`Conversation ID: ${conversation.id}`);
  console.log(`Chatbot: ${conversation.chatbot?.name || "N/A"}`);
  console.log(`Session ID: ${conversation.sessionId}`);
  console.log(`Status: ${conversation.status}`);
  console.log(`Manual Mode: ${conversation.manualMode}`);
  console.log(`Created: ${conversation.createdAt}`);
  console.log(`Updated: ${conversation.updatedAt}`);
  console.log(`\nTotal Messages: ${conversation.messages.length}`);
  console.log(`${"=".repeat(80)}\n`);

  console.log("📝 Últimos mensajes (más reciente primero):\n");

  for (const msg of conversation.messages) {
    const roleIcon = msg.role === "USER" ? "👤" : msg.role === "ASSISTANT" ? "🤖" : "⚙️";
    console.log(`${roleIcon} ${msg.role} - ${msg.createdAt.toISOString()}`);
    console.log(`   ID: ${msg.id}`);
    console.log(`   External ID: ${msg.externalMessageId || "N/A"}`);
    console.log(`   Channel: ${msg.channel || "N/A"}`);
    console.log(`   Content: ${msg.content.substring(0, 150)}${msg.content.length > 150 ? "..." : ""}`);
    if (msg.role === "ASSISTANT") {
      console.log(`   AI Model: ${msg.aiModel || "N/A"}`);
      console.log(`   Input Tokens: ${msg.inputTokens || 0}`);
      console.log(`   Output Tokens: ${msg.outputTokens || 0}`);
      console.log(`   Total Cost: $${msg.totalCost || 0}`);
    }
    console.log("");
  }

  // Análisis
  console.log(`${"=".repeat(80)}`);
  console.log("\n📊 Análisis:");

  const userMessages = conversation.messages.filter((m) => m.role === "USER");
  const assistantMessages = conversation.messages.filter((m) => m.role === "ASSISTANT");

  console.log(`   Mensajes de usuario: ${userMessages.length}`);
  console.log(`   Mensajes del asistente: ${assistantMessages.length}`);

  if (userMessages.length > 0) {
    const lastUserMessage = userMessages[0];
    console.log(`\n   Último mensaje del usuario:`);
    console.log(`      Fecha: ${lastUserMessage.createdAt.toISOString()}`);
    console.log(`      Contenido: ${lastUserMessage.content}`);

    // Ver si hay respuesta del asistente después
    const assistantAfter = assistantMessages.find(
      (m) => m.createdAt > lastUserMessage.createdAt
    );

    if (assistantAfter) {
      console.log(`\n   ✅ SÍ hay respuesta del asistente después:`);
      console.log(`      Fecha: ${assistantAfter.createdAt.toISOString()}`);
      console.log(`      Contenido: ${assistantAfter.content.substring(0, 100)}...`);
    } else {
      console.log(`\n   ❌ NO hay respuesta del asistente después del último mensaje del usuario`);
      console.log(`\n   🚨 PROBLEMA CONFIRMADO: El bot NO está generando respuestas`);
    }
  }

  console.log("");
}

checkRecentMessages()
  .catch(console.error)
  .finally(() => process.exit());
