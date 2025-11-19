import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function findConversation() {
  console.log("🔍 Buscando conversación de 7757609276...\n");

  const phoneNumber = "7757609276";
  const sessionId = "whatsapp_" + phoneNumber;

  // 1. Buscar conversaciones exactas
  const exactConversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { sessionId: sessionId },
        { visitorId: phoneNumber },
        { sessionId: { contains: phoneNumber } },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  console.log("📌 Conversaciones encontradas:" + exactConversations.length + "\n");

  for (const conv of exactConversations) {
    console.log("ID: " + conv.id);
    console.log("SessionId: " + conv.sessionId);
    console.log("VisitorId: " + (conv.visitorId || "null"));
    console.log("Status: " + conv.status);
    console.log("ChatbotId: " + conv.chatbotId);
    console.log("ManualMode: " + conv.manualMode);
    console.log("CreatedAt: " + conv.createdAt.toISOString());
    console.log("UpdatedAt: " + conv.updatedAt.toISOString());
    console.log("Mensajes: " + conv.messages.length);
    
    if (conv.messages.length > 0) {
      console.log("\nÚltimos mensajes:");
      for (const msg of conv.messages.slice(0, 3)) {
        const preview = msg.content.substring(0, 60);
        console.log("  [" + msg.role + "] " + preview + "...");
      }
    }
    console.log("\n---\n");
  }

  // 2. Obtener chatbot info
  if (exactConversations.length > 0) {
    const chatbotId = exactConversations[0].chatbotId;
    const chatbot = await prisma.chatbot.findUnique({
      where: { id: chatbotId },
      select: { name: true, slug: true, id: true },
    });
    
    console.log("🤖 Chatbot Info:");
    if (chatbot) {
      console.log("   Name: " + chatbot.name);
      console.log("   Slug: " + chatbot.slug);
      console.log("   ID: " + chatbot.id);
    }
    console.log("");

    // 3. Simular query del loader
    const loaderConversations = await prisma.conversation.findMany({
      where: {
        chatbotId: chatbotId,
        status: { not: "DELETED" },
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          where: { deleted: { not: true } },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    console.log("📊 Query del loader:");
    console.log("   Total: " + loaderConversations.length);
    
    const foundIndex = loaderConversations.findIndex(c => c.id === exactConversations[0].id);
    if (foundIndex >= 0) {
      console.log("   ✅ Conversación encontrada en posición: " + (foundIndex + 1));
    } else {
      console.log("   ❌ Conversación NO encontrada en top 200");
    }
  }

  await prisma.$disconnect();
}

findConversation().catch(console.error);
