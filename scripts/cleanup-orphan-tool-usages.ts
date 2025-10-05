import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupOrphanToolUsages() {
  try {
    console.log("🔍 Buscando tool usages con chatbots eliminados...\n");

    // Obtener todos los IDs de chatbots existentes
    const existingChatbots = await prisma.chatbot.findMany({
      select: { id: true }
    });

    const existingChatbotIds = new Set(existingChatbots.map(c => c.id));
    console.log(`📊 Chatbots existentes: ${existingChatbotIds.size}\n`);

    // Obtener todos los tool usages
    const allToolUsages = await prisma.toolUsage.findMany({
      select: {
        id: true,
        chatbotId: true,
        toolName: true,
        createdAt: true
      }
    });

    console.log(`📊 Total tool usages: ${allToolUsages.length}\n`);

    // Identificar huérfanos (chatbotId que no existe en la tabla chatbot)
    const orphans = allToolUsages.filter(tu => !existingChatbotIds.has(tu.chatbotId));

    console.log(`❌ Tool usages huérfanos encontrados: ${orphans.length}\n`);

    if (orphans.length === 0) {
      console.log("✅ No hay tool usages huérfanos. Todo está limpio.\n");
      return;
    }

    // Mostrar algunos ejemplos
    console.log("📋 Ejemplos de registros huérfanos:\n");
    orphans.slice(0, 10).forEach((usage, i) => {
      console.log(`  ${i + 1}. ${usage.toolName} - ${usage.createdAt.toISOString()}`);
      console.log(`     ChatbotID: ${usage.chatbotId} (NO EXISTE)\n`);
    });

    // Obtener IDs a eliminar
    const orphanIds = orphans.map(o => o.id);

    console.log(`⚠️  Eliminando ${orphanIds.length} tool usages huérfanos...\n`);

    // Eliminar en lotes de 100
    let deleted = 0;
    for (let i = 0; i < orphanIds.length; i += 100) {
      const batch = orphanIds.slice(i, i + 100);
      const result = await prisma.toolUsage.deleteMany({
        where: {
          id: { in: batch }
        }
      });
      deleted += result.count;
      console.log(`  Eliminados ${deleted}/${orphanIds.length}...`);
    }

    console.log(`\n✅ Eliminados ${deleted} tool usages huérfanos\n`);

    // Verificar resultado
    const remainingUsages = await prisma.toolUsage.count();
    console.log(`📊 Tool usages restantes: ${remainingUsages}\n`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupOrphanToolUsages();
