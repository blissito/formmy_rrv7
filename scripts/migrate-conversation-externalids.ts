import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Migración: Normalizar Conversation.externalId a últimos 10 dígitos
 *
 * Problema: Las conversaciones antiguas tienen externalId = número completo (ej: "5217712412825")
 * pero los Contact.phone tienen solo últimos 10 dígitos (ej: "7712412825")
 *
 * Solución: Actualizar externalId de conversaciones existentes a últimos 10 dígitos
 * para que coincidan con el formato de Contact.phone
 */

function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.slice(-10);
}

async function migrateConversationExternalIds() {
  console.log("🔄 Iniciando migración de Conversation.externalId...\n");

  try {
    // 1. Obtener todas las conversaciones de WhatsApp con externalId > 10 dígitos
    const conversations = await prisma.conversation.findMany({
      where: {
        channel: "WHATSAPP",
        externalId: {
          not: null,
        },
      },
      select: {
        id: true,
        externalId: true,
        chatbotId: true,
      },
    });

    console.log(`📊 Total conversaciones WhatsApp: ${conversations.length}`);

    // Filtrar las que necesitan migración (más de 10 dígitos)
    const toMigrate = conversations.filter((c) => {
      const cleaned = c.externalId!.replace(/\D/g, "");
      return cleaned.length > 10;
    });

    console.log(`🎯 Conversaciones a migrar: ${toMigrate.length}\n`);

    if (toMigrate.length === 0) {
      console.log("✅ No hay conversaciones que migrar. Todas ya están normalizadas.");
      return;
    }

    // 2. Actualizar cada conversación
    let updated = 0;
    let errors = 0;

    for (const conversation of toMigrate) {
      const oldExternalId = conversation.externalId!;
      const newExternalId = normalizePhoneNumber(oldExternalId);

      try {
        await prisma.conversation.update({
          where: { id: conversation.id },
          data: { externalId: newExternalId },
        });

        console.log(
          `✅ ${conversation.id}: ${oldExternalId} → ${newExternalId}`
        );
        updated++;
      } catch (error) {
        console.error(
          `❌ Error actualizando ${conversation.id}:`,
          error instanceof Error ? error.message : error
        );
        errors++;
      }
    }

    console.log("\n📊 Resumen de migración:");
    console.log(`✅ Actualizadas: ${updated}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📈 Total procesadas: ${updated + errors}`);

    // 3. Verificar que ahora los nombres aparezcan
    console.log("\n🔍 Verificando nombres de contactos...");

    const sampleConversations = await prisma.conversation.findMany({
      where: {
        channel: "WHATSAPP",
        externalId: { not: null },
      },
      take: 5,
      include: {
        chatbot: {
          include: {
            contacts: {
              where: {
                source: "WHATSAPP",
              },
            },
          },
        },
      },
    });

    for (const conv of sampleConversations) {
      const matchingContact = conv.chatbot.contacts.find(
        (contact) => contact.phone === conv.externalId
      );

      const displayName = matchingContact?.name || conv.externalId;
      console.log(`📱 ${conv.externalId} → "${displayName}"`);
    }

  } catch (error) {
    console.error("💥 Error en migración:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar migración
migrateConversationExternalIds()
  .then(() => {
    console.log("\n✅ Migración completada exitosamente!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Migración falló:", error);
    process.exit(1);
  });
