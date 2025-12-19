import { db } from "../app/utils/db.server.ts";

async function checkManualMode() {
  const phoneNumber = "5217757609276";

  console.log(`\n🔍 Buscando conversaciones del número: ${phoneNumber}\n`);

  const conversations = await db.conversation.findMany({
    where: {
      sessionId: { contains: phoneNumber },
    },
    include: {
      chatbot: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  console.log(`📬 Conversaciones encontradas: ${conversations.length}\n`);

  for (const conv of conversations) {
    console.log(`${"=".repeat(80)}`);
    console.log(`Conversation ID: ${conv.id}`);
    console.log(`Chatbot: ${conv.chatbot?.name || "N/A"} (${conv.chatbot?.id || "N/A"})`);
    console.log(`Session ID: ${conv.sessionId}`);
    console.log(`Status: ${conv.status}`);
    console.log(`🔴 Manual Mode: ${conv.manualMode ? "✅ ACTIVADO (bot NO responde)" : "❌ Desactivado (bot responde)"}`);
    console.log(`Last Echo At: ${conv.lastEchoAt || "N/A"}`);
    console.log(`Updated: ${conv.updatedAt}`);
    console.log(`Created: ${conv.createdAt}`);
    console.log("");

    if (conv.manualMode) {
      console.log("⚠️ PROBLEMA IDENTIFICADO:");
      console.log("   Esta conversación está en MODO MANUAL");
      console.log("   El bot NO responderá automáticamente");
      console.log("");
      console.log("📋 SOLUCIÓN:");
      console.log("   Opción 1: Desactivar modo manual desde el dashboard");
      console.log("   Opción 2: Ejecutar este comando para desactivarlo:");
      console.log(`
   await db.conversation.update({
     where: { id: "${conv.id}" },
     data: { manualMode: false }
   });
      `);
      console.log("");
      console.log("📖 EXPLICACIÓN:");
      console.log("   - El modo manual se activa automáticamente cuando el negocio");
      console.log("     responde desde su teléfono WhatsApp (echo message)");
      console.log("   - Cuando está activo, el bot deja de responder para evitar");
      console.log("     interferir con la conversación manual");
      console.log("");
    }
  }
}

checkManualMode()
  .catch(console.error)
  .finally(() => process.exit());
