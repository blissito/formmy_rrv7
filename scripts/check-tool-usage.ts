import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkToolUsage() {
  try {
    console.log("🔍 Verificando tool usage en la BD...\n");

    // Contar total de tool usages
    const totalUsages = await prisma.toolUsage.count();
    console.log(`📊 Total de tool usages registrados: ${totalUsages}\n`);

    if (totalUsages === 0) {
      console.log("❌ No hay tool usages registrados en la BD\n");
      console.log("💡 Posibles causas:");
      console.log("  1. No se han ejecutado herramientas aún");
      console.log("  2. El tracking no está funcionando");
      console.log("  3. Los registros fueron eliminados\n");
      return;
    }

    // Ver últimos 10 registros
    const recentUsages = await prisma.toolUsage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        chatbot: {
          select: {
            name: true,
            user: {
              select: { email: true, plan: true }
            }
          }
        }
      }
    });

    console.log("📋 Últimos 10 tool usages:\n");
    recentUsages.forEach((usage, i) => {
      console.log(`${i + 1}. ${usage.toolName}`);
      console.log(`   Chatbot: ${usage.chatbot?.name || 'Unknown'}`);
      console.log(`   Usuario: ${usage.chatbot?.user?.email || 'Unknown'} (${usage.chatbot?.user?.plan || 'Unknown'})`);
      console.log(`   Success: ${usage.success}`);
      console.log(`   ConversationID: ${usage.conversationId || 'N/A'}`);
      console.log(`   Fecha: ${usage.createdAt.toISOString()}`);
      if (usage.errorMessage) console.log(`   Error: ${usage.errorMessage}`);
      console.log('');
    });

    // Agrupar por herramienta
    const byTool = await prisma.toolUsage.groupBy({
      by: ['toolName'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } }
    });

    console.log("📊 Uso por herramienta:\n");
    byTool.forEach(tool => {
      console.log(`  ${tool.toolName}: ${tool._count.id} usos`);
    });
    console.log('');

    // Verificar últimos 30 días
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCount = await prisma.toolUsage.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    console.log(`📅 Tool usages en los últimos 30 días: ${recentCount}\n`);

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkToolUsage();
