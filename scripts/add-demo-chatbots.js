import { PrismaClient, Plans } from "@prisma/client";
import { createDemoChatbot } from "../server/chatbot/createDemoChatbot.server.js";

const db = new PrismaClient();

async function addDemoChatbotsToExistingUsers() {
  try {
    console.log("🚀 Agregando chatbots demo a usuarios existentes...\n");

    // 1. Obtener usuarios TRIAL sin chatbots
    const trialUsersWithoutChatbots = await db.user.findMany({
      where: {
        plan: Plans.TRIAL,
      },
      select: {
        id: true,
        email: true,
        plan: true,
        _count: {
          select: { chatbots: true }
        }
      }
    });

    // Filtrar solo los que no tienen chatbots
    const usersNeedingDemo = trialUsersWithoutChatbots.filter(
      user => user._count.chatbots === 0
    );

    console.log(`📊 Encontrados ${usersNeedingDemo.length} usuarios TRIAL sin chatbots\n`);

    if (usersNeedingDemo.length === 0) {
      console.log("✅ Todos los usuarios TRIAL ya tienen chatbots");
      await db.$disconnect();
      return;
    }

    // 2. Crear chatbot demo para cada usuario
    let created = 0;
    let failed = 0;

    for (const user of usersNeedingDemo) {
      try {
        const chatbot = await createDemoChatbot(user.id, user.email, user.plan);
        if (chatbot) {
          created++;
          console.log(`✅ Chatbot demo creado para: ${user.email}`);
        } else {
          failed++;
          console.log(`⚠️ No se pudo crear chatbot para: ${user.email}`);
        }
      } catch (error) {
        failed++;
        console.error(`❌ Error creando chatbot para ${user.email}:`, error.message);
      }
    }

    // 3. Resumen
    console.log("\n🎉 Resumen de creación de chatbots demo:");
    console.log(`   ✅ ${created} chatbots demo creados exitosamente`);
    if (failed > 0) {
      console.log(`   ⚠️ ${failed} chatbots no pudieron ser creados`);
    }
    console.log("\n📝 Características de los chatbots demo:");
    console.log("   - Estado: PUBLICADO y ACTIVO");
    console.log("   - 6 contextos de ejemplo pre-cargados");
    console.log("   - Personalidad profesional y amigable");
    console.log("   - Listo para usar sin configuración adicional");

    await db.$disconnect();
  } catch (error) {
    console.error("❌ Error general:", error);
    await db.$disconnect();
  }
}

addDemoChatbotsToExistingUsers();