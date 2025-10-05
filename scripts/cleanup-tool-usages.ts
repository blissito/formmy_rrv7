import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupToolUsages() {
  try {
    console.log("🔍 Buscando tool usages sin chatbotId...\n");

    // Contar cuántos no tienen chatbotId
    const withoutChatbot = await prisma.toolUsage.count({
      where: {
        OR: [
          { chatbotId: null },
          { chatbotId: "" }
        ]
      }
    });

    console.log(`📊 Tool usages sin chatbotId: ${withoutChatbot}\n`);

    if (withoutChatbot === 0) {
      console.log("✅ No hay tool usages sin chatbotId. Todo está limpio.\n");
      return;
    }

    // Mostrar algunos ejemplos
    const examples = await prisma.toolUsage.findMany({
      where: {
        OR: [
          { chatbotId: null },
          { chatbotId: "" }
        ]
      },
      take: 5,
      select: {
        id: true,
        toolName: true,
        createdAt: true,
        chatbotId: true
      }
    });

    console.log("📋 Ejemplos de registros a eliminar:\n");
    examples.forEach((usage, i) => {
      console.log(`  ${i + 1}. ${usage.toolName} - ${usage.createdAt.toISOString()} - chatbotId: ${usage.chatbotId || 'NULL'}`);
    });

    console.log(`\n⚠️  Se eliminarán ${withoutChatbot} registros...\n`);

    // Eliminar
    const deleted = await prisma.toolUsage.deleteMany({
      where: {
        OR: [
          { chatbotId: null },
          { chatbotId: "" }
        ]
      }
    });

    console.log(`✅ Eliminados ${deleted.count} tool usages sin chatbotId\n`);

    // Verificar resultado final
    const remaining = await prisma.toolUsage.count();
    console.log(`📊 Tool usages restantes en BD: ${remaining}\n`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupToolUsages();
