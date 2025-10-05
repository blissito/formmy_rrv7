import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkChatbotIdNull() {
  try {
    console.log("🔍 Verificando tool usages...\n");

    const all = await prisma.toolUsage.findMany({
      select: {
        id: true,
        chatbotId: true,
        toolName: true,
        createdAt: true
      }
    });

    console.log(`📊 Total tool usages: ${all.length}\n`);

    // Verificar si alguno no tiene chatbotId válido
    let withoutChatbot = 0;
    let withChatbot = 0;

    all.forEach(t => {
      if (!t.chatbotId || t.chatbotId === '') {
        withoutChatbot++;
        if (withoutChatbot <= 5) {
          console.log(`  ❌ Sin chatbotId: ${t.toolName} - ${t.createdAt.toISOString()}`);
        }
      } else {
        withChatbot++;
      }
    });

    console.log(`\n📊 Resumen:`);
    console.log(`  ✅ Con chatbotId: ${withChatbot}`);
    console.log(`  ❌ Sin chatbotId: ${withoutChatbot}\n`);

    if (withoutChatbot === 0) {
      console.log("✅ Todos los tool usages tienen chatbotId. El admin debería mostrarlos correctamente.\n");
    } else {
      console.log("⚠️  Hay tool usages sin chatbotId que deben eliminarse.\n");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkChatbotIdNull();
