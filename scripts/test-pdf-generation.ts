/**
 * Test script para verificar generación de PDF de reportes
 * Usage: DEVELOPMENT_TOKEN=FORMMY_DEV_TOKEN_2025 npx tsx scripts/test-pdf-generation.ts
 */

import { handleGenerateChatbotReport } from "../server/tools/handlers/generate-chatbot-report";
import type { ToolContext } from "../server/tools/types";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testPDFGeneration() {
  console.log("🧪 Iniciando test de generación de PDF...\n");

  try {
    // 1. Obtener usuario real de desarrollo
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: "fixtergeek@gmail.com" },
          { email: { contains: "fixter" } },
        ],
      },
    });

    if (!user) {
      console.error("❌ No se encontró usuario de desarrollo");
      return;
    }

    console.log(`✅ Usuario encontrado: ${user.email} (${user.plan})\n`);

    // 2. Verificar que tenga chatbots
    const chatbotsCount = await prisma.chatbot.count({
      where: { userId: user.id },
    });

    console.log(`📊 Chatbots del usuario: ${chatbotsCount}\n`);

    if (chatbotsCount === 0) {
      console.warn(
        "⚠️  Usuario no tiene chatbots, el reporte estará vacío\n"
      );
    }

    // 3. Crear context simulado
    const context: ToolContext = {
      userId: user.id,
      userPlan: user.plan,
      chatbotId: "ghosty-main",
      message: "genera un reporte PDF de mis chatbots",
      integrations: {},
      isGhosty: true,
    };

    console.log("⚙️  Ejecutando handler...\n");

    // 4. Ejecutar handler
    const result = await handleGenerateChatbotReport(
      {
        format: "pdf",
        includeMetrics: true,
      },
      context
    );

    // 5. Mostrar resultado
    console.log("📄 Resultado del handler:");
    console.log(JSON.stringify(result, null, 2));

    if (result.success && result.data) {
      console.log("\n✅ PDF generado exitosamente!");
      console.log(`📥 URL de descarga: ${result.data.downloadUrl}`);
      console.log(`📊 Chatbots incluidos: ${result.data.chatbotsCount}`);
      console.log(`💬 Conversaciones: ${result.data.totalConversations}`);
      console.log(`💬 Mensajes: ${result.data.totalMessages}`);
      console.log(`📦 Tamaño: ${result.data.size}`);
      console.log(`⏱️  Expira en: ${result.data.expiresIn}`);

      console.log("\n✅ Test completado - PDF generado correctamente");
      console.log(
        `🔗 Prueba descargándolo desde: http://localhost:3001${result.data.downloadUrl}`
      );
    } else {
      console.error(`\n❌ Error generando PDF: ${result.message}`);
    }
  } catch (error) {
    console.error("\n❌ Error en el test:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

testPDFGeneration();
