import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Script para borrar TODAS las conversaciones de WhatsApp
 *
 * ADVERTENCIA: Esta operación es IRREVERSIBLE
 */

async function deleteAllWhatsAppConversations() {
  console.log("🗑️  Iniciando eliminación de conversaciones de WhatsApp...\n");

  try {
    // 1. Obtener todas las conversaciones que parecen ser de WhatsApp
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          {
            sessionId: {
              startsWith: "whatsapp_"
            }
          },
          {
            visitorId: {
              contains: "521" // Números mexicanos
            }
          }
        ]
      },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        _count: {
          select: {
            messages: true
          }
        }
      }
    });

    console.log(`📊 Total conversaciones de WhatsApp encontradas: ${conversations.length}\n`);

    if (conversations.length === 0) {
      console.log("✅ No hay conversaciones de WhatsApp para borrar.");
      return;
    }

    // Mostrar algunas conversaciones de ejemplo
    console.log("📋 Ejemplos de conversaciones a borrar:");
    conversations.slice(0, 5).forEach(conv => {
      console.log(`  - ${conv.sessionId || conv.visitorId} (${conv._count.messages} mensajes)`);
    });
    if (conversations.length > 5) {
      console.log(`  ... y ${conversations.length - 5} más\n`);
    }

    // 2. Borrar todos los mensajes de estas conversaciones primero
    console.log("🗑️  Borrando mensajes...");
    const deleteMessagesResult = await prisma.message.deleteMany({
      where: {
        conversationId: {
          in: conversations.map(c => c.id)
        }
      }
    });
    console.log(`✅ ${deleteMessagesResult.count} mensajes eliminados\n`);

    // 3. Borrar las conversaciones
    console.log("🗑️  Borrando conversaciones...");
    const deleteConversationsResult = await prisma.conversation.deleteMany({
      where: {
        id: {
          in: conversations.map(c => c.id)
        }
      }
    });
    console.log(`✅ ${deleteConversationsResult.count} conversaciones eliminadas\n`);

    console.log("✅ Eliminación completada exitosamente!");
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Envía un mensaje desde WhatsApp o haz un eco");
    console.log("   2. La nueva conversación debería mostrar el nombre del contacto correctamente");

  } catch (error) {
    console.error("💥 Error durante la eliminación:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
deleteAllWhatsAppConversations()
  .then(() => {
    console.log("\n✅ Script completado!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script falló:", error);
    process.exit(1);
  });
