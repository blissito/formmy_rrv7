import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Verificar contactos y matching con número específico
 */

async function checkContacts() {
  console.log("🔍 Verificando contactos...\n");

  try {
    // Número que apareció en la conversación
    const phoneNumber = "7757609276"; // Últimos 10 dígitos de +521 775 760 9276

    // 1. Obtener todos los contactos de WhatsApp
    const allContacts = await prisma.contact.findMany({
      where: {
        source: "WHATSAPP"
      },
      select: {
        id: true,
        name: true,
        phone: true,
        chatbotId: true,
        chatbot: {
          select: {
            name: true,
            slug: true
          }
        }
      }
    });

    console.log(`📊 Total contactos de WhatsApp: ${allContacts.length}\n`);

    if (allContacts.length > 0) {
      console.log("📋 Contactos existentes:");
      allContacts.forEach(contact => {
        console.log(`  ✓ ${contact.name || "(sin nombre)"} - ${contact.phone} - Bot: ${contact.chatbot?.name}`);
      });
      console.log("");
    }

    // 2. Buscar el contacto específico
    console.log(`🔍 Buscando contacto con número: ${phoneNumber}`);

    const exactMatch = await prisma.contact.findFirst({
      where: {
        phone: phoneNumber,
        source: "WHATSAPP"
      },
      select: {
        id: true,
        name: true,
        phone: true,
        chatbot: {
          select: {
            name: true
          }
        }
      }
    });

    if (exactMatch) {
      console.log(`✅ ¡Contacto encontrado!`);
      console.log(`   Nombre: ${exactMatch.name}`);
      console.log(`   Teléfono: ${exactMatch.phone}`);
      console.log(`   Bot: ${exactMatch.chatbot?.name}\n`);
    } else {
      console.log(`❌ No se encontró contacto con ese número\n`);
    }

    // 3. Buscar variaciones del número
    console.log("🔍 Buscando variaciones del número:");
    const variations = [
      phoneNumber,                          // 7757609276
      `521${phoneNumber}`,                  // 5217757609276
      `52${phoneNumber}`,                   // 527757609276
      `+521${phoneNumber}`,                 // +5217757609276
      `+52 1 ${phoneNumber}`,              // +52 1 7757609276
    ];

    for (const variation of variations) {
      const match = await prisma.contact.findFirst({
        where: {
          phone: {
            contains: variation
          },
          source: "WHATSAPP"
        }
      });

      if (match) {
        console.log(`  ✓ Encontrado con variación: ${variation}`);
        console.log(`    Nombre: ${match.name}`);
        console.log(`    Teléfono guardado: ${match.phone}\n`);
      }
    }

    // 4. Verificar la última conversación creada
    console.log("📱 Última conversación de WhatsApp:");
    const lastConversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { sessionId: { startsWith: "whatsapp_" } },
          { visitorId: { contains: "521" } }
        ]
      },
      orderBy: {
        createdAt: "desc"
      },
      select: {
        id: true,
        sessionId: true,
        visitorId: true,
        chatbotId: true,
        createdAt: true
      }
    });

    if (lastConversation) {
      console.log(`  ID: ${lastConversation.id}`);
      console.log(`  SessionId: ${lastConversation.sessionId}`);
      console.log(`  VisitorId: ${lastConversation.visitorId}`);
      console.log(`  ChatbotId: ${lastConversation.chatbotId}`);
      console.log(`  Creada: ${lastConversation.createdAt}\n`);

      // Extraer el número de teléfono de la conversación
      const phoneFromConv = lastConversation.visitorId?.replace(/\D/g, "") ||
                           lastConversation.sessionId?.replace("whatsapp_", "").replace(/\D/g, "");

      if (phoneFromConv) {
        const normalized = phoneFromConv.slice(-10);
        console.log(`  📞 Número normalizado: ${normalized}`);
        console.log(`  ❓ ¿Coincide con ${phoneNumber}? ${normalized === phoneNumber ? "✅ SÍ" : "❌ NO"}\n`);
      }
    }

  } catch (error) {
    console.error("💥 Error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkContacts()
  .then(() => {
    console.log("✅ Verificación completada");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Error:", error);
    process.exit(1);
  });
